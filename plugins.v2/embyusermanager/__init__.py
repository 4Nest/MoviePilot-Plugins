import secrets
from typing import Any, Dict, List, Optional, Tuple

from fastapi import Body, Depends

from app import schemas
from app.core.config import settings
from app.core.event import Event, eventmanager
from app.core.security import get_password_hash
from app.db.models.subscribe import Subscribe
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


class EmbyUserManager(_PluginBase):
    """Emby 用户管理插件：统一管控 Emby 辅助登录准入、黑白名单及用户订阅。"""

    plugin_name = "Emby用户管理"
    plugin_desc = "管理Emby媒体服务器用户的MoviePilot登录准入、黑白名单及订阅数据。"
    plugin_icon = "emby.png"
    plugin_version = "1.0.0"
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
        """注册管理员专用的插件 REST 接口。"""
        return [
            {
                "path": "/overview",
                "endpoint": self.api_overview,
                "methods": ["GET"],
                "auth": "bear",
                "summary": "获取Emby用户与本地订阅概览",
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
                "summary": "删除本地Emby用户账号及可选连带清理其订阅",
            },
        ]

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
            get_users_fn = getattr(service_info.instance, "get_users", None)
            if not callable(get_users_fn):
                continue
            for item in get_users_fn() or []:
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
        """聚合 Emby 实例用户、本地 MP 用户与订阅统计信息。"""
        services = MediaServerHelper().get_services(type_filter="emby") or {}
        server_list: List[Dict[str, Any]] = []
        emby_user_map: Dict[str, Dict[str, Any]] = {}

        for server_name, service_info in services.items():
            instance = getattr(service_info, "instance", None)
            get_users_fn = getattr(instance, "get_users", None)
            raw_users = get_users_fn() if callable(get_users_fn) else []
            server_list.append(
                {
                    "name": server_name,
                    "user_count": len(raw_users or []),
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
                        "last_login_date": None,
                        "last_activity_date": None,
                    },
                )
                if server_name not in entry["emby_servers"]:
                    entry["emby_servers"].append(server_name)
                entry["emby_is_admin"] = bool(entry["emby_is_admin"] or item.get("is_admin"))
                entry["emby_is_disabled"] = bool(
                    entry["emby_is_disabled"] or item.get("is_disabled")
                )
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

        all_usernames = sorted(set(emby_user_map.keys()) | set(mp_users.keys()) | set(sub_counts.keys()))
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
        """删除本地 Emby 用户记录，并可选择连带删除其全部订阅。"""
        username = str((payload or {}).get("username") or "").strip()
        delete_subscribes = bool((payload or {}).get("delete_subscribes", False))
        if not username or username == settings.SUPERUSER:
            return schemas.Response(success=False, message="不允许删除管理员或空用户名")

        user_oper = UserOper()
        user = user_oper.get_by_name(username)
        if user and user.is_superuser:
            return schemas.Response(success=False, message="不允许删除管理员账号")

        deleted_sub_count = 0
        if delete_subscribes:
            sub_oper = SubscribeOper()
            subscribes = sub_oper.list_by_username(username) or []
            for sub in subscribes:
                sub_info = sub.to_dict() if hasattr(sub, "to_dict") else {"id": sub.id, "name": sub.name}
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

        # 清理该用户的个性化配置记录
        try:
            for item in UserConfig.list(user_oper._db) or []:
                if getattr(item, "username", None) == username:
                    item.delete(user_oper._db, item.id)
        except Exception as err:
            logger.warning(f"清理用户 {username} 配置记录失败：{err}")

        if user:
            User().delete_by_name(user_oper._db, username)

        # 同时从黑白名单中清理或保留：保持黑白名单配置不变，仅移除本地账号与订阅
        return schemas.Response(
            success=True,
            message=f"已删除用户 {username}"
            + (f" 并清理 {deleted_sub_count} 条订阅" if delete_subscribes else ""),
            data={"deleted_subscribes": deleted_sub_count},
        )
