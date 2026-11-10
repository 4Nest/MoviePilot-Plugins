import inspect
import secrets
from typing import Any, Dict, List, Optional, Tuple

from fastapi import Body, Depends

from app import schemas
from app.core.config import settings
from app.core.event import Event, eventmanager
from app.core.security import get_password_hash
from app.db.models.subscribe import Subscribe
from app.db.models.subscribehistory import SubscribeHistory
from app.db.models.user import User
from app.db.models.userconfig import UserConfig
from app.db.subscribe_oper import SubscribeOper
from app.db.user_oper import UserOper, get_current_admin
from app.helper.mediaserver import MediaServerHelper
from app.log import logger
from app.plugins import _PluginBase
from app.schemas.types import ChainEventType, EventType, MediaType


DEFAULT_CONFIG: Dict[str, Any] = {
    "enabled": True,
    "allow_mode": "all",
    "whitelist": [],
    "blacklist": [],
    "allowed_servers": [],
    "allow_emby_admin": True,
}


def _normalize_string_list(values: Any) -> List[str]:
    """将输入归一化为去重非空字符串列表。"""
    if isinstance(values, str):
        raw_items = [part.strip() for part in values.replace("\n", ",").split(",")]
    elif isinstance(values, (list, tuple, set)):
        raw_items = [str(item).strip() for item in values if item is not None]
    else:
        return []
    result: List[str] = []
    for item in raw_items:
        if item and item not in result:
            result.append(item)
    return result


def _call_get_users(instance: Any, detailed: bool = True) -> List[dict]:
    """安全调用 Emby 实例的 get_users 方法，兼容无参替身。"""
    get_users_fn = getattr(instance, "get_users", None)
    if not callable(get_users_fn):
        return []
    try:
        sig = inspect.signature(get_users_fn)
        if "detailed" in sig.parameters:
            return get_users_fn(detailed=detailed) or []
        return get_users_fn() or []
    except Exception:
        return get_users_fn() or []


def _extract_server_folders(instance: Any) -> List[Dict[str, str]]:
    """提取 Emby 实例的可选媒体库文件夹列表（用于配置用户媒体库访问权限）。"""
    get_folders_fn = getattr(instance, "get_emby_folders", None)
    if not callable(get_folders_fn):
        return []
    try:
        raw_folders = get_folders_fn() or []
    except Exception:
        return []
    folders: List[Dict[str, str]] = []
    for folder in raw_folders:
        if not isinstance(folder, dict):
            continue
        name = str(folder.get("Name") or "").strip()
        folder_id = str(folder.get("Guid") or folder.get("Id") or "").strip()
        if not name or not folder_id:
            continue
        folders.append(
            {
                "id": folder_id,
                "raw_id": str(folder.get("Id") or ""),
                "name": name,
            }
        )
    return folders


def _build_policy_updates_from_payload(payload: dict) -> Dict[str, Any]:
    """从前端提交的字典中提取需要写入 Emby Policy 的标准字段。"""
    policy: Dict[str, Any] = {}
    raw_policy = payload.get("policy") if isinstance(payload.get("policy"), dict) else payload

    field_mapping = (
        ("is_admin", "IsAdministrator", bool),
        ("IsAdministrator", "IsAdministrator", bool),
        ("is_disabled", "IsDisabled", bool),
        ("IsDisabled", "IsDisabled", bool),
        ("is_hidden", "IsHidden", bool),
        ("IsHidden", "IsHidden", bool),
        ("enable_all_folders", "EnableAllFolders", bool),
        ("EnableAllFolders", "EnableAllFolders", bool),
        ("enable_remote_access", "EnableRemoteAccess", bool),
        ("EnableRemoteAccess", "EnableRemoteAccess", bool),
        ("enable_downloading", "EnableContentDownloading", bool),
        ("EnableContentDownloading", "EnableContentDownloading", bool),
        ("enable_video_transcoding", "EnableVideoPlaybackTranscoding", bool),
        ("EnableVideoPlaybackTranscoding", "EnableVideoPlaybackTranscoding", bool),
        ("enable_audio_transcoding", "EnableAudioPlaybackTranscoding", bool),
        ("EnableAudioPlaybackTranscoding", "EnableAudioPlaybackTranscoding", bool),
    )
    for src_key, target_key, caster in field_mapping:
        if src_key in raw_policy and raw_policy[src_key] is not None:
            policy[target_key] = caster(raw_policy[src_key])

    for folders_key in ("enabled_folders", "EnabledFolders"):
        if folders_key in raw_policy and raw_policy[folders_key] is not None:
            policy["EnabledFolders"] = _normalize_string_list(raw_policy[folders_key])

    for limit_key in ("simultaneous_stream_limit", "SimultaneousStreamLimit"):
        if limit_key in raw_policy and raw_policy[limit_key] is not None:
            try:
                policy["SimultaneousStreamLimit"] = max(0, int(raw_policy[limit_key]))
            except (TypeError, ValueError):
                pass
    return policy


class EmbyUserManager(_PluginBase):
    """Emby 用户管理插件：支持 Emby 账号增删改查、登录准入黑白名单及用户订阅管控。"""

    plugin_name = "Emby用户管理"
    plugin_desc = "管理Emby媒体服务器账号增删改查、MoviePilot登录准入、黑白名单及订阅数据。"
    plugin_icon = "emby.png"
    plugin_version = "1.2.0"
    plugin_author = "4Nest"
    author_url = "https://github.com/4Nest"
    plugin_config_prefix = "embyusermanager_"
    plugin_order = 10
    auth_level = 1

    _enabled: bool = True
    _allow_mode: str = "all"
    _whitelist: List[str] = []
    _blacklist: List[str] = []
    _allowed_servers: List[str] = []
    _allow_emby_admin: bool = True

    def init_plugin(self, config: dict = None):
        """初始化并规范化插件配置。"""
        merged = dict(DEFAULT_CONFIG)
        if isinstance(config, dict):
            merged.update(config)
        self._enabled = bool(merged.get("enabled", True))
        allow_mode = str(merged.get("allow_mode") or "all").strip().lower()
        self._allow_mode = (
            allow_mode if allow_mode in {"all", "whitelist", "blacklist"} else "all"
        )
        self._whitelist = _normalize_string_list(merged.get("whitelist"))
        self._blacklist = _normalize_string_list(merged.get("blacklist"))
        self._allowed_servers = _normalize_string_list(merged.get("allowed_servers"))
        self._allow_emby_admin = bool(merged.get("allow_emby_admin", True))

        normalized_config = {
            "enabled": self._enabled,
            "allow_mode": self._allow_mode,
            "whitelist": self._whitelist,
            "blacklist": self._blacklist,
            "allowed_servers": self._allowed_servers,
            "allow_emby_admin": self._allow_emby_admin,
        }
        if config != normalized_config:
            self.update_config(normalized_config)

    def get_state(self) -> bool:
        """获取插件启用状态。"""
        return self._enabled

    @staticmethod
    def get_render_mode() -> Tuple[str, Optional[str]]:
        """使用 Vue 模块联邦渲染模式。"""
        return "vue", "dist/assets"

    def get_sidebar_nav(self) -> List[Dict[str, Any]]:
        """向主界面左侧栏「系统」分组注册用户管理入口（仅管理员可见）。"""
        if not self._enabled:
            return []
        return [
            {
                "nav_key": "main",
                "title": "用户管理",
                "icon": "mdi-account-group-outline",
                "section": "system",
                "permission": "admin",
                "order": 10,
            }
        ]

    @staticmethod
    def get_command() -> List[Dict[str, Any]]:
        """无需远程命令。"""
        return []

    def get_form(self) -> Tuple[Optional[List[dict]], Dict[str, Any]]:
        """返回 Vue 模式下的默认配置字典。"""
        return None, dict(DEFAULT_CONFIG)

    def get_page(self) -> Optional[List[dict]]:
        """Vue 模式详情页返回 None。"""
        return None

    def stop_service(self):
        """插件无后台定时任务。"""
        return None

    def get_api(self) -> List[Dict[str, Any]]:
        """注册管理员专用的插件 REST 接口（含 Emby 账号增删改查）。"""
        return [
            {
                "path": "/overview",
                "endpoint": self.api_overview,
                "methods": ["GET"],
                "auth": "bear",
                "summary": "获取Emby用户与本地订阅概览",
            },
            {
                "path": "/emby/user",
                "endpoint": self.api_get_emby_user,
                "methods": ["GET"],
                "auth": "bear",
                "summary": "查询单个Emby账号完整详情与权限策略",
            },
            {
                "path": "/emby/user/create",
                "endpoint": self.api_create_emby_user,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "在Emby服务器新建用户账号",
            },
            {
                "path": "/emby/user/update",
                "endpoint": self.api_update_emby_user,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "更新Emby用户账号（改名、改密、权限策略、媒体库访问）",
            },
            {
                "path": "/user/status",
                "endpoint": self.api_update_user_status,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "启用或禁用指定Emby用户的MoviePilot登录权限",
            },
            {
                "path": "/user/access-list",
                "endpoint": self.api_update_access_list,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "将用户加入或移出登录黑白名单",
            },
            {
                "path": "/config",
                "endpoint": self.api_save_config,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "保存Emby用户管理准入配置",
            },
            {
                "path": "/user/subscribes",
                "endpoint": self.api_user_subscribes,
                "methods": ["GET"],
                "auth": "bear",
                "summary": "查询指定用户的全部订阅记录",
            },
            {
                "path": "/user/delete",
                "endpoint": self.api_delete_user,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "删除Emby服务器账号、本地用户账号及可选连带清理订阅",
            },
        ]

    @staticmethod
    def _resolve_emby_service(server_name: Optional[str] = None):
        """按名称或默认第一个已启用实例解析 Emby 服务。"""
        helper = MediaServerHelper()
        if server_name:
            service = helper.get_service(name=server_name, type_filter="emby")
            return (server_name, service) if service and service.instance else (server_name, None)
        services = helper.get_services(type_filter="emby") or {}
        for name, service in services.items():
            if service and service.instance:
                return name, service
        return "", None

    def _is_emby_user_admin(self, service_name: Optional[str], username: str) -> bool:
        """检查指定用户在 Emby 实例中是否具有管理员身份。"""
        helper = MediaServerHelper()
        if service_name:
            service = helper.get_service(name=service_name, type_filter="emby")
            services = {service_name: service} if service else {}
        else:
            services = helper.get_services(type_filter="emby") or {}
        for service_info in services.values():
            if not service_info or not service_info.instance:
                continue
            for item in _call_get_users(service_info.instance, detailed=False):
                if isinstance(item, dict) and item.get("name") == username and item.get("is_admin"):
                    return True
        return False

    def _compute_access_status(
        self,
        username: str,
        is_active: bool,
        emby_is_admin: bool,
        emby_is_disabled: bool,
        emby_servers: List[str],
    ) -> Tuple[str, str]:
        """计算某个用户的综合登录准入状态与原因说明。"""
        if not is_active:
            return "disabled", "已在 MoviePilot 中禁用"
        if emby_is_disabled:
            return "disabled", "在 Emby 媒体服务器中已被禁用"
        if not self._enabled:
            return "allowed", "准入管控未开启（默认允许）"
        if self._allowed_servers and emby_servers:
            if not any(server in self._allowed_servers for server in emby_servers):
                return "blocked", "所属 Emby 服务器未开放登录"
        if not self._allow_emby_admin and emby_is_admin:
            return "blocked", "已禁止 Emby 管理员账号登录"
        if self._allow_mode == "whitelist":
            if username in self._whitelist:
                return "allowed", "白名单允许登录"
            return "blocked", "不在登录白名单中"
        if self._allow_mode == "blacklist":
            if username in self._blacklist:
                return "blocked", "已在登录黑名单中"
            return "allowed", "允许登录"
        return "allowed", "允许登录"

    def _migrate_local_username(self, old_username: str, new_username: str):
        """当 Emby 账号改名时，同步迁移本地 MP 用户、订阅、历史、个人配置与黑白名单中的用户名。"""
        old_name = (old_username or "").strip()
        new_name = (new_username or "").strip()
        if not old_name or not new_name or old_name == new_name:
            return
        if old_name == settings.SUPERUSER or new_name == settings.SUPERUSER:
            return

        user_oper = UserOper()
        db = user_oper._db
        existing_new = user_oper.get_by_name(new_name)
        old_user = user_oper.get_by_name(old_name)
        if old_user and not old_user.is_superuser and not existing_new:
            old_user.update(db, {"name": new_name})

        sub_oper = SubscribeOper()
        for sub in sub_oper.list_by_username(old_name) or []:
            sub.update(sub_oper._db, {"username": new_name})

        try:
            for hist in SubscribeHistory.list(db) or []:
                if getattr(hist, "username", None) == old_name:
                    hist.update(db, {"username": new_name})
        except Exception as err:
            logger.warning(f"迁移用户订阅历史名称失败 ({old_name} -> {new_name})：{err}")

        try:
            for conf in UserConfig.list(db) or []:
                if getattr(conf, "username", None) == old_name:
                    conf.update(db, {"username": new_name})
        except Exception as err:
            logger.warning(f"迁移用户配置名称失败 ({old_name} -> {new_name})：{err}")

        changed = False
        if old_name in self._whitelist:
            self._whitelist = [new_name if x == old_name else x for x in self._whitelist]
            changed = True
        if old_name in self._blacklist:
            self._blacklist = [new_name if x == old_name else x for x in self._blacklist]
            changed = True
        if changed:
            self.init_plugin(
                {
                    "enabled": self._enabled,
                    "allow_mode": self._allow_mode,
                    "whitelist": self._whitelist,
                    "blacklist": self._blacklist,
                    "allowed_servers": self._allowed_servers,
                    "allow_emby_admin": self._allow_emby_admin,
                }
            )

    @eventmanager.register(ChainEventType.AuthIntercept)
    def handle_auth_intercept(self, event: Event):
        """监听 Emby 辅助登录链式事件，按准入策略拦截不合规登录请求。"""
        if not self._enabled or not event or not event.event_data:
            return
        event_data = event.event_data
        if getattr(event_data, "channel", None) != "Emby":
            return
        username = (getattr(event_data, "username", "") or "").strip()
        service = (getattr(event_data, "service", "") or "").strip()
        if not username:
            return

        if self._allowed_servers and service and service not in self._allowed_servers:
            event_data.cancel = True
            event_data.source = self.plugin_name
            event_data.reason = f"Emby 服务器 {service} 未开放登录"
            return

        if self._allow_mode == "whitelist" and username not in self._whitelist:
            event_data.cancel = True
            event_data.source = self.plugin_name
            event_data.reason = "用户不在允许登录白名单中"
            return

        if self._allow_mode == "blacklist" and username in self._blacklist:
            event_data.cancel = True
            event_data.source = self.plugin_name
            event_data.reason = "用户已被列入禁止登录黑名单"
            return

        if not self._allow_emby_admin and self._is_emby_user_admin(service, username):
            event_data.cancel = True
            event_data.source = self.plugin_name
            event_data.reason = "已禁止 Emby 管理员账号作为普通用户登录"

    def api_overview(
        self,
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """聚合 Emby 实例用户、媒体库列表、本地 MP 用户与订阅统计信息。"""
        services = MediaServerHelper().get_services(type_filter="emby") or {}
        server_list: List[Dict[str, Any]] = []
        emby_user_map: Dict[str, Dict[str, Any]] = {}

        for server_name, service_info in services.items():
            instance = getattr(service_info, "instance", None)
            raw_users = _call_get_users(instance, detailed=True)
            folders = _extract_server_folders(instance)
            template_users = [
                {"id": str(u.get("id") or ""), "name": str(u.get("name") or "")}
                for u in raw_users
                if isinstance(u, dict) and u.get("id") and u.get("name")
            ]
            server_list.append(
                {
                    "name": server_name,
                    "user_count": len(raw_users or []),
                    "folders": folders,
                    "users": template_users,
                }
            )
            for item in raw_users or []:
                if not isinstance(item, dict):
                    continue
                uname = (item.get("name") or "").strip()
                if not uname or uname == settings.SUPERUSER:
                    continue
                entry = emby_user_map.setdefault(
                    uname,
                    {
                        "username": uname,
                        "emby_id": item.get("id") or "",
                        "emby_servers": [],
                        "emby_is_admin": False,
                        "emby_is_disabled": False,
                        "has_password": False,
                        "last_login_date": None,
                        "last_activity_date": None,
                        "server_accounts": {},
                    },
                )
                if server_name not in entry["emby_servers"]:
                    entry["emby_servers"].append(server_name)
                if not entry["emby_id"] and item.get("id"):
                    entry["emby_id"] = str(item.get("id"))
                entry["emby_is_admin"] = bool(entry["emby_is_admin"] or item.get("is_admin"))
                entry["emby_is_disabled"] = bool(
                    entry["emby_is_disabled"] and item.get("is_disabled")
                    if len(entry["emby_servers"]) > 1
                    else item.get("is_disabled")
                )
                entry["has_password"] = bool(entry["has_password"] or item.get("has_password"))
                entry["server_accounts"][server_name] = {
                    "server": server_name,
                    "user_id": str(item.get("id") or ""),
                    "name": uname,
                    "has_password": bool(item.get("has_password", False)),
                    "is_admin": bool(item.get("is_admin", False)),
                    "is_disabled": bool(item.get("is_disabled", False)),
                    "is_hidden": bool(item.get("is_hidden", True)),
                    "enable_all_folders": bool(item.get("enable_all_folders", True)),
                    "enabled_folders": list(item.get("enabled_folders") or []),
                    "enable_remote_access": bool(item.get("enable_remote_access", True)),
                    "enable_downloading": bool(item.get("enable_downloading", True)),
                    "enable_video_transcoding": bool(item.get("enable_video_transcoding", True)),
                    "enable_audio_transcoding": bool(item.get("enable_audio_transcoding", True)),
                    "simultaneous_stream_limit": int(item.get("simultaneous_stream_limit") or 0),
                }
                last_login = item.get("last_login_date")
                if last_login and (
                    not entry["last_login_date"] or str(last_login) > str(entry["last_login_date"])
                ):
                    entry["last_login_date"] = last_login
                last_activity = item.get("last_activity_date")
                if last_activity and (
                    not entry["last_activity_date"]
                    or str(last_activity) > str(entry["last_activity_date"])
                ):
                    entry["last_activity_date"] = last_activity

        mp_users = {
            user.name: user
            for user in (UserOper().list() or [])
            if user and user.name and user.name != settings.SUPERUSER and not user.is_superuser
        }

        sub_counts: Dict[str, Dict[str, int]] = {}
        for sub in SubscribeOper().list() or []:
            owner = (getattr(sub, "username", None) or "").strip()
            if not owner or owner == settings.SUPERUSER:
                continue
            counts = sub_counts.setdefault(owner, {"movie": 0, "tv": 0, "total": 0})
            if getattr(sub, "type", None) == MediaType.MOVIE.value:
                counts["movie"] += 1
            else:
                counts["tv"] += 1
            counts["total"] += 1

        all_usernames = sorted(
            set(emby_user_map.keys()) | set(mp_users.keys()) | set(sub_counts.keys())
        )
        users_payload: List[Dict[str, Any]] = []
        allowed_count = 0
        total_sub_count = 0

        for uname in all_usernames:
            emby_info = emby_user_map.get(uname, {})
            mp_user = mp_users.get(uname)
            counts = sub_counts.get(uname, {"movie": 0, "tv": 0, "total": 0})
            is_active = bool(mp_user.is_active) if mp_user is not None else True
            emby_is_admin = bool(emby_info.get("emby_is_admin", False))
            emby_is_disabled = bool(emby_info.get("emby_is_disabled", False))
            emby_servers = list(emby_info.get("emby_servers") or [])
            access_status, access_reason = self._compute_access_status(
                username=uname,
                is_active=is_active,
                emby_is_admin=emby_is_admin,
                emby_is_disabled=emby_is_disabled,
                emby_servers=emby_servers,
            )
            if access_status == "allowed":
                allowed_count += 1
            total_sub_count += counts["total"]

            users_payload.append(
                {
                    "username": uname,
                    "user_id": mp_user.id if mp_user else None,
                    "registered_in_mp": mp_user is not None,
                    "is_active": is_active,
                    "emby_id": emby_info.get("emby_id") or "",
                    "emby_servers": emby_servers,
                    "emby_is_admin": emby_is_admin,
                    "emby_is_disabled": emby_is_disabled,
                    "has_password": bool(emby_info.get("has_password", False)),
                    "server_accounts": emby_info.get("server_accounts") or {},
                    "last_login_date": emby_info.get("last_login_date"),
                    "last_activity_date": emby_info.get("last_activity_date"),
                    "movie_sub_count": counts["movie"],
                    "tv_sub_count": counts["tv"],
                    "total_sub_count": counts["total"],
                    "in_whitelist": uname in self._whitelist,
                    "in_blacklist": uname in self._blacklist,
                    "access_status": access_status,
                    "access_reason": access_reason,
                }
            )

        return schemas.Response(
            success=True,
            data={
                "config": {
                    "enabled": self._enabled,
                    "allow_mode": self._allow_mode,
                    "whitelist": self._whitelist,
                    "blacklist": self._blacklist,
                    "allowed_servers": self._allowed_servers,
                    "allow_emby_admin": self._allow_emby_admin,
                },
                "servers": server_list,
                "stats": {
                    "emby_user_count": len(emby_user_map),
                    "mp_registered_count": len(mp_users),
                    "allowed_user_count": allowed_count,
                    "total_subscribe_count": total_sub_count,
                },
                "users": users_payload,
            },
        )

    def api_get_emby_user(
        self,
        user_id: str,
        server: Optional[str] = None,
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """查询单个 Emby 用户账号的完整详情与策略信息。"""
        resolved_server, service_info = self._resolve_emby_service(server)
        if not service_info or not service_info.instance:
            return schemas.Response(success=False, message="未找到可用的 Emby 媒体服务器实例")
        get_detail_fn = getattr(service_info.instance, "get_user_detail", None)
        if not callable(get_detail_fn):
            return schemas.Response(success=False, message="当前 Emby 模块不支持查询用户详情")
        detail = get_detail_fn(user_id)
        if not detail:
            return schemas.Response(success=False, message="未查询到指定的 Emby 用户")
        policy = detail.get("Policy") or {}
        return schemas.Response(
            success=True,
            data={
                "server": resolved_server,
                "user_id": str(detail.get("Id") or user_id),
                "username": str(detail.get("Name") or ""),
                "has_password": bool(detail.get("HasPassword")),
                "last_login_date": detail.get("LastLoginDate"),
                "last_activity_date": detail.get("LastActivityDate"),
                "policy": {
                    "is_admin": bool(policy.get("IsAdministrator", False)),
                    "is_disabled": bool(policy.get("IsDisabled", False)),
                    "is_hidden": bool(policy.get("IsHidden", True)),
                    "enable_all_folders": bool(policy.get("EnableAllFolders", True)),
                    "enabled_folders": [
                        str(fid)
                        for fid in (policy.get("EnabledFolders") or [])
                        if fid is not None
                    ],
                    "enable_remote_access": bool(policy.get("EnableRemoteAccess", True)),
                    "enable_downloading": bool(policy.get("EnableContentDownloading", True)),
                    "enable_video_transcoding": bool(
                        policy.get("EnableVideoPlaybackTranscoding", True)
                    ),
                    "enable_audio_transcoding": bool(
                        policy.get("EnableAudioPlaybackTranscoding", True)
                    ),
                    "simultaneous_stream_limit": int(
                        policy.get("SimultaneousStreamLimit") or 0
                    ),
                },
                "folders": _extract_server_folders(service_info.instance),
            },
        )

    def api_create_emby_user(
        self,
        payload: dict = Body(...),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """在指定 Emby 服务器新建账号，支持初始密码、权限策略及自动加入登录白名单。"""
        data = payload or {}
        username = str(data.get("username") or "").strip()
        if not username:
            return schemas.Response(success=False, message="用户名不能为空")
        if username == settings.SUPERUSER:
            return schemas.Response(
                success=False,
                message=f"不允许创建与 MoviePilot 超级管理员 ({settings.SUPERUSER}) 同名的账号",
            )

        server_name = str(data.get("server") or "").strip() or None
        resolved_server, service_info = self._resolve_emby_service(server_name)
        if not service_info or not service_info.instance:
            return schemas.Response(success=False, message="未找到可用的 Emby 媒体服务器实例")

        create_fn = getattr(service_info.instance, "create_emby_user", None)
        if not callable(create_fn):
            return schemas.Response(success=False, message="当前 Emby 模块不支持创建用户")

        password = data.get("password")
        generated_password = not str(password or "").strip()
        password_str = (
            str(password).strip()
            if not generated_password
            else secrets.token_urlsafe(12)
        )
        copy_from_user_id = str(data.get("copy_from_user_id") or "").strip() or None
        policy_updates = _build_policy_updates_from_payload(data)

        ok, msg, created_user = create_fn(
            name=username,
            password=password_str,
            copy_from_user_id=copy_from_user_id,
            policy_updates=policy_updates or None,
        )
        if not ok:
            return schemas.Response(success=False, message=msg or "创建 Emby 用户失败")

        if bool(data.get("add_to_whitelist")) and username not in self._whitelist:
            next_whitelist = [*self._whitelist, username]
            self.init_plugin(
                {
                    "enabled": self._enabled,
                    "allow_mode": self._allow_mode,
                    "whitelist": next_whitelist,
                    "blacklist": self._blacklist,
                    "allowed_servers": self._allowed_servers,
                    "allow_emby_admin": self._allow_emby_admin,
                }
            )

        return schemas.Response(
            success=True,
            message=f"已在 {resolved_server} 创建 Emby 用户 {username}",
            data={
                "server": resolved_server,
                "user_id": str((created_user or {}).get("Id") or ""),
                "username": username,
                "password": password_str,
                "generated_password": generated_password,
            },
        )

    def api_update_emby_user(
        self,
        payload: dict = Body(...),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """修改 Emby 账号（用户名、登录密码、权限策略、媒体库授权及 MP 本地启用状态）。"""
        data = payload or {}
        server_name = str(data.get("server") or "").strip() or None
        user_id = str(data.get("user_id") or "").strip()
        old_username = str(data.get("username") or "").strip()
        new_username = str(data.get("new_username") or old_username).strip()

        if not user_id:
            return schemas.Response(success=False, message="缺少 Emby 用户 ID")
        if new_username == settings.SUPERUSER:
            return schemas.Response(
                success=False,
                message=f"不允许将用户名修改为 MoviePilot 超级管理员 ({settings.SUPERUSER})",
            )

        resolved_server, service_info = self._resolve_emby_service(server_name)
        if not service_info or not service_info.instance:
            return schemas.Response(success=False, message="未找到可用的 Emby 媒体服务器实例")

        instance = service_info.instance

        # 1. 修改 Emby 用户名（如有变更）
        effective_username = old_username
        if new_username and old_username and new_username != old_username:
            rename_fn = getattr(instance, "update_user_name", None)
            if not callable(rename_fn):
                return schemas.Response(success=False, message="当前 Emby 模块不支持修改用户名")
            ok, msg = rename_fn(user_id, new_username)
            if not ok:
                return schemas.Response(success=False, message=msg or "修改 Emby 用户名失败")
            self._migrate_local_username(old_username, new_username)
            effective_username = new_username

        # 2. 重置或修改 Emby 登录密码（如有请求）
        if bool(data.get("change_password")):
            set_pw_fn = getattr(instance, "set_user_password", None)
            if not callable(set_pw_fn):
                return schemas.Response(success=False, message="当前 Emby 模块不支持修改密码")
            new_pw = str(data.get("new_password") or "")
            ok, msg = set_pw_fn(user_id, new_pw)
            if not ok:
                return schemas.Response(success=False, message=msg or "修改 Emby 密码失败")

        # 3. 更新 Emby 权限策略与媒体库范围
        policy_updates = _build_policy_updates_from_payload(data)
        if policy_updates:
            update_policy_fn = getattr(instance, "update_user_policy", None)
            if not callable(update_policy_fn):
                return schemas.Response(success=False, message="当前 Emby 模块不支持更新用户策略")
            ok, msg = update_policy_fn(user_id, policy_updates)
            if not ok:
                return schemas.Response(success=False, message=msg or "更新 Emby 用户策略失败")

        # 4. 同步更新 MoviePilot 本地登录启用状态（如传入 mp_is_active）
        if "mp_is_active" in data and data["mp_is_active"] is not None and effective_username:
            mp_active = bool(data["mp_is_active"])
            user_oper = UserOper()
            mp_user = user_oper.get_by_name(effective_username)
            if mp_user and not mp_user.is_superuser:
                mp_user.update(user_oper._db, {"is_active": mp_active})
            elif not mp_user and not mp_active:
                user_oper.add(
                    name=effective_username,
                    is_active=False,
                    is_superuser=False,
                    hashed_password=get_password_hash(secrets.token_urlsafe(16)),
                )

        return schemas.Response(
            success=True,
            message=f"已更新 Emby 用户 {effective_username or user_id}",
            data={"server": resolved_server, "username": effective_username},
        )

    def api_update_user_status(
        self,
        payload: dict = Body(...),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """启用或禁用指定 Emby 用户的 MoviePilot 登录状态。"""
        username = str((payload or {}).get("username") or "").strip()
        if not username or username == settings.SUPERUSER:
            return schemas.Response(success=False, message="非法的用户名")
        is_active = bool((payload or {}).get("is_active", True))

        user_oper = UserOper()
        user = user_oper.get_by_name(username)
        if user:
            if user.is_superuser:
                return schemas.Response(success=False, message="不允许修改管理员状态")
            user.update(user_oper._db, {"is_active": is_active})
        elif not is_active:
            user_oper.add(
                name=username,
                is_active=False,
                is_superuser=False,
                hashed_password=get_password_hash(secrets.token_urlsafe(16)),
            )

        action_label = "已启用" if is_active else "已禁用"
        return schemas.Response(success=True, message=f"用户 {username} {action_label}")

    def api_update_access_list(
        self,
        payload: dict = Body(...),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """将指定用户加入或移出白名单/黑名单。"""
        username = str((payload or {}).get("username") or "").strip()
        list_type = str((payload or {}).get("list_type") or "").strip().lower()
        action = str((payload or {}).get("action") or "add").strip().lower()
        if not username or username == settings.SUPERUSER:
            return schemas.Response(success=False, message="非法的用户名")
        if list_type not in {"whitelist", "blacklist"}:
            return schemas.Response(success=False, message="无效的名单类型")
        if action not in {"add", "remove"}:
            return schemas.Response(success=False, message="无效的操作类型")

        target_list = list(self._whitelist if list_type == "whitelist" else self._blacklist)
        if action == "add":
            if username not in target_list:
                target_list.append(username)
        else:
            target_list = [item for item in target_list if item != username]

        new_config = {
            "enabled": self._enabled,
            "allow_mode": self._allow_mode,
            "whitelist": target_list if list_type == "whitelist" else self._whitelist,
            "blacklist": target_list if list_type == "blacklist" else self._blacklist,
            "allowed_servers": self._allowed_servers,
            "allow_emby_admin": self._allow_emby_admin,
        }
        self.init_plugin(new_config)
        self.update_config(new_config)
        return schemas.Response(
            success=True,
            message="名单已更新",
            data={
                "whitelist": self._whitelist,
                "blacklist": self._blacklist,
            },
        )

    def api_save_config(
        self,
        payload: dict = Body(...),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """保存并立即生效插件准入配置。"""
        self.init_plugin(payload or {})
        return schemas.Response(
            success=True,
            message="准入配置已保存",
            data={
                "enabled": self._enabled,
                "allow_mode": self._allow_mode,
                "whitelist": self._whitelist,
                "blacklist": self._blacklist,
                "allowed_servers": self._allowed_servers,
                "allow_emby_admin": self._allow_emby_admin,
            },
        )

    def api_user_subscribes(
        self,
        username: str,
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """查询指定用户创建的全部订阅明细。"""
        uname = (username or "").strip()
        if not uname:
            return schemas.Response(success=True, data=[])
        subscribes = SubscribeOper().list_by_username(uname) or []
        items = [
            {
                "id": sub.id,
                "name": sub.name,
                "year": sub.year,
                "type": sub.type,
                "season": sub.season,
                "poster": sub.poster,
                "state": sub.state,
                "total_episode": sub.total_episode,
                "lack_episode": sub.lack_episode,
                "date": sub.date,
                "last_update": sub.last_update,
                "username": sub.username,
            }
            for sub in subscribes
        ]
        return schemas.Response(success=True, data=items)

    def api_delete_user(
        self,
        payload: dict = Body(...),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """支持删除 Emby 服务器账号、删除本地 MP 用户记录，并可连带清理其全部订阅。"""
        data = payload or {}
        username = str(data.get("username") or "").strip()
        delete_from_emby = bool(data.get("delete_from_emby", False))
        delete_mp_user = bool(data.get("delete_mp_user", True))
        delete_subscribes = bool(data.get("delete_subscribes", False))
        target_servers = _normalize_string_list(data.get("emby_servers"))

        if not username or username == settings.SUPERUSER:
            return schemas.Response(success=False, message="不允许删除管理员或空用户名")

        user_oper = UserOper()
        user = user_oper.get_by_name(username)
        if user and user.is_superuser:
            return schemas.Response(success=False, message="不允许删除管理员账号")

        deleted_emby_servers: List[str] = []
        emby_errors: List[str] = []
        if delete_from_emby:
            services = MediaServerHelper().get_services(type_filter="emby") or {}
            for srv_name, srv_info in services.items():
                if target_servers and srv_name not in target_servers:
                    continue
                inst = getattr(srv_info, "instance", None)
                if not inst:
                    continue
                delete_fn = getattr(inst, "delete_emby_user", None)
                if not callable(delete_fn):
                    continue
                for u_item in _call_get_users(inst, detailed=False):
                    if isinstance(u_item, dict) and u_item.get("name") == username and u_item.get("id"):
                        ok, err_msg = delete_fn(str(u_item["id"]))
                        if ok:
                            deleted_emby_servers.append(srv_name)
                        else:
                            emby_errors.append(f"{srv_name}: {err_msg}")
            if emby_errors and not deleted_emby_servers:
                return schemas.Response(
                    success=False,
                    message="删除 Emby 账号失败：" + "；".join(emby_errors),
                )

        deleted_sub_count = 0
        if delete_subscribes:
            sub_oper = SubscribeOper()
            subscribes = sub_oper.list_by_username(username) or []
            for sub in subscribes:
                sub_info = (
                    sub.to_dict()
                    if hasattr(sub, "to_dict")
                    else {"id": sub.id, "name": sub.name}
                )
                sub_id = sub.id
                Subscribe.delete(sub_oper._db, rid=sub_id)
                deleted_sub_count += 1
                try:
                    eventmanager.send_event(
                        EventType.SubscribeDeleted,
                        {"subscribe_id": sub_id, "subscribe_info": sub_info},
                    )
                except Exception as err:
                    logger.warning(f"发送订阅删除事件失败：{sub_id} - {err}")

        if delete_mp_user or delete_from_emby:
            try:
                for item in UserConfig.list(user_oper._db) or []:
                    if getattr(item, "username", None) == username:
                        item.delete(user_oper._db, item.id)
            except Exception as err:
                logger.warning(f"清理用户 {username} 配置记录失败：{err}")

            if user:
                User().delete_by_name(user_oper._db, username)

        summary_parts = []
        if deleted_emby_servers:
            summary_parts.append(f"已从 Emby ({'、'.join(deleted_emby_servers)}) 删除账号")
        if user and (delete_mp_user or delete_from_emby):
            summary_parts.append("已移除本地 MP 记录")
        if delete_subscribes:
            summary_parts.append(f"清理 {deleted_sub_count} 条订阅")
        if not summary_parts:
            summary_parts.append(f"已处理用户 {username}")

        return schemas.Response(
            success=True,
            message=f"用户 {username}：" + "，".join(summary_parts),
            data={
                "deleted_emby_servers": deleted_emby_servers,
                "deleted_subscribes": deleted_sub_count,
            },
        )
