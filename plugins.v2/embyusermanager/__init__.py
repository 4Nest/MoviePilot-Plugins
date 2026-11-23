import inspect
import secrets
import threading
import time
from typing import Any, Dict, List, Optional, Tuple

from fastapi import Body, Depends

from app import schemas
from app.chain.subscribe import SubscribeChain
from app.core.config import settings
from app.core.event import Event, eventmanager
from app.core.security import get_password_hash
from app.db.models.subscribe import Subscribe
from app.db.models.subscribehistory import SubscribeHistory
from app.db.models.user import User
from app.db.models.userconfig import UserConfig
from app.db.subscribe_oper import SubscribeOper
from app.db.systemconfig_oper import SystemConfigOper
from app.db.user_oper import UserOper, get_current_admin
from app.helper.mediaserver import MediaServerHelper
from app.log import logger
from app.plugins import _PluginBase
from app.schemas.types import (
    ChainEventType,
    EventType,
    MediaType,
    MessageChannel,
    NotificationType,
    SystemConfigKey,
)

APPROVAL_DATA_KEY = "approval_requests"
MAX_APPROVAL_HISTORY = 200

DEFAULT_CONFIG: Dict[str, Any] = {
    "enabled": True,
    "allow_mode": "all",
    "whitelist": [],
    "blacklist": [],
    "allowed_servers": [],
    "allow_emby_admin": True,
    "subscribe_approval_enabled": False,
    "approval_bypass_users": [],
    "approval_notify_telegram": True,
    "approval_tg_chat_id": "",
}

_SUBSCRIBE_INTERCEPT_EVENT = getattr(ChainEventType, "SubscribeIntercept", None)


def _optional_chain_register(event_type: Any):
    """兼容旧版宿主缺少新增枚举值时的安全事件注册装饰器。"""
    if event_type is None:
        return lambda fn: fn
    return eventmanager.register(event_type)


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


def _now_str() -> str:
    """生成标准本地时间字符串。"""
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())


def _safe_int(value: Any) -> Optional[int]:
    """安全转换为整型，失败返回 None。"""
    if value in (None, "", False):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _safe_float(value: Any) -> Optional[float]:
    """安全转换为浮点型，失败返回 None。"""
    if value in (None, "", False):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _normalize_media_type_value(raw_type: Any) -> str:
    """将不同形态的媒体类型归一化为 MoviePilot 标准枚举值（'电影' / '电视剧'）。"""
    if isinstance(raw_type, MediaType):
        return raw_type.value
    text = str(raw_type or "").strip()
    if text in {MediaType.MOVIE.value, "movie", "Movie", "MOVIE"}:
        return MediaType.MOVIE.value
    return MediaType.TV.value


def _build_approval_dedup_key(record: Dict[str, Any]) -> str:
    """构造订阅审批单去重键（按媒体权威身份 + 季号归一）。"""
    mtype = _normalize_media_type_value(record.get("type"))
    season_part = (
        f"S{record.get('season')}"
        if mtype == MediaType.TV.value and record.get("season") is not None
        else "M"
    )
    if record.get("tmdbid"):
        return f"tmdb:{record['tmdbid']}:{season_part}"
    if record.get("doubanid"):
        return f"douban:{record['doubanid']}:{season_part}"
    if record.get("bangumiid"):
        return f"bangumi:{record['bangumiid']}:{season_part}"
    if record.get("anilistid"):
        return f"anilist:{record['anilistid']}:{season_part}"
    if record.get("media_source") and record.get("media_id"):
        return f"{record['media_source']}:{record['media_id']}:{season_part}"
    if record.get("mediaid"):
        return f"raw:{record['mediaid']}:{season_part}"
    return f"title:{str(record.get('title') or '').strip().lower()}:{record.get('year') or ''}:{season_part}"


def _format_approval_message(record: Dict[str, Any]) -> Tuple[str, str]:
    """按参考卡片排版生成 Telegram 审批通知标题与正文（控制简介长度确保单条图文带按钮发送）。"""
    status = str(record.get("status") or "pending")
    username = str(record.get("username") or "-").strip()
    title = str(record.get("title") or "未知媒体").strip()
    year = str(record.get("year") or "").strip()
    content_line = f"{title} ({year})" if year else title
    mtype_val = _normalize_media_type_value(record.get("type"))
    type_display = "剧集" if mtype_val == MediaType.TV.value else "电影"
    season = _safe_int(record.get("season"))
    vote = _safe_float(record.get("vote"))
    overview = str(record.get("overview") or "").strip()
    actor = str(record.get("handled_by") or "").strip()
    actor_suffix = f"（操作人：{actor}）" if actor else ""

    lines: List[str] = [
        "",
        f"👤 申请人：{username}",
        f"📌 内容：{content_line}",
        f"📦 类型：{type_display}",
    ]
    if mtype_val == MediaType.TV.value and season is not None:
        lines.append(f"🧩 季度：第 {season} 季")
    if vote is not None and vote > 0:
        lines.append(f"⭐ 评分：{round(vote, 1)}")

    if overview:
        trimmed = overview if len(overview) <= 340 else overview[:339].rstrip() + "…"
        lines.extend(["", "📝 简介：", trimmed])

    if status == "approved":
        sub_id = record.get("subscribe_id")
        sub_part = f" #{sub_id}" if sub_id else ""
        footer = f"✅ 已通过并提交 MoviePilot{sub_part}{actor_suffix}"
    elif status == "manual":
        footer = f"📦 已标记手动入库{actor_suffix}"
    elif status == "rejected":
        footer = f"❌ 已拒绝申请{actor_suffix}"
    else:
        footer = "⚠️ 通过后将立即提交到 MoviePilot。"

    lines.extend(["", footer])
    return "🔔 新订阅审批", "\n".join(lines)


def _build_approval_buttons(req_id: str) -> List[List[Dict[str, str]]]:
    """构造 Telegram 审批内联按钮（callback_data 严格控制在 64 字节上限以内）。"""
    return [
        [
            {
                "text": "通过并提交 MP",
                "callback_data": f"[PLUGIN]EmbyUserManager|sub_approve:{req_id}",
            },
            {
                "text": "标记手动入库",
                "callback_data": f"[PLUGIN]EmbyUserManager|sub_manual:{req_id}",
            },
        ],
        [
            {
                "text": "拒绝申请",
                "callback_data": f"[PLUGIN]EmbyUserManager|sub_reject:{req_id}",
            },
        ],
    ]


def _call_get_users(instance: Any, detailed: bool = True) -> List[dict]:
    """安全调用 Emby 实例的 get_users 方法，兼容旧版无参签名并隔离运行时异常。"""
    get_users_fn = getattr(instance, "get_users", None)
    if not callable(get_users_fn):
        return []
    supports_detailed = True
    sig = None
    try:
        sig = inspect.signature(get_users_fn)
        params = sig.parameters
        supports_detailed = "detailed" in params or any(
            param.kind == inspect.Parameter.VAR_KEYWORD for param in params.values()
        )
    except (TypeError, ValueError):
        supports_detailed = True

    try:
        if supports_detailed:
            try:
                return get_users_fn(detailed=detailed) or []
            except TypeError as err:
                if sig is not None:
                    try:
                        sig.bind(detailed=detailed)
                    except TypeError:
                        return get_users_fn() or []
                    logger.warning(f"获取 Emby 用户列表失败：{err}")
                    return []
                return get_users_fn() or []
        return get_users_fn() or []
    except Exception as err:
        logger.warning(f"获取 Emby 用户列表失败：{err}")
        return []


def _query_by_username(model_cls: Any, db: Any, username: str) -> List[Any]:
    """优先按 username 条件过滤查询 ORM 模型，兼容自定义查询方法与测试替身。"""
    list_by_user_fn = getattr(model_cls, "list_by_username", None)
    if callable(list_by_user_fn):
        return list_by_user_fn(db, username) or []

    username_col = getattr(model_cls, "username", None)
    if username_col is not None and (hasattr(model_cls, "__table__") or hasattr(db, "query")):
        close_session = False
        session = db
        if session is None or not hasattr(session, "query"):
            from app.db import ScopedSession

            session = ScopedSession()
            close_session = True
        try:
            return session.query(model_cls).filter(username_col == username).all() or []
        finally:
            if close_session:
                session.close()

    return [
        item
        for item in (model_cls.list(db) or [])
        if getattr(item, "username", None) == username
    ]


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
    """Emby 用户管理插件：支持 Emby 账号增删改查、登录准入黑白名单及订阅审批闭环。"""

    plugin_name = "Emby用户管理"
    plugin_desc = "管理Emby媒体服务器账号增删改查、MoviePilot登录准入、黑白名单及订阅审批。"
    plugin_icon = "emby.png"
    plugin_version = "1.3.0"
    plugin_author = "4Nest"
    author_url = "https://github.com/4Nest"
    plugin_config_prefix = "embyusermanager_"
    plugin_order = 10
    auth_level = 1

    _approval_lock = threading.RLock()

    _enabled: bool = True
    _allow_mode: str = "all"
    _whitelist: List[str] = []
    _blacklist: List[str] = []
    _allowed_servers: List[str] = []
    _allow_emby_admin: bool = True
    _subscribe_approval_enabled: bool = False
    _approval_bypass_users: List[str] = []
    _approval_notify_telegram: bool = True
    _approval_tg_chat_id: str = ""

    def _export_config(self) -> Dict[str, Any]:
        """导出当前内存中的规范化配置字典副本。"""
        return {
            "enabled": self._enabled,
            "allow_mode": self._allow_mode,
            "whitelist": list(self._whitelist),
            "blacklist": list(self._blacklist),
            "allowed_servers": list(self._allowed_servers),
            "allow_emby_admin": self._allow_emby_admin,
            "subscribe_approval_enabled": self._subscribe_approval_enabled,
            "approval_bypass_users": list(self._approval_bypass_users),
            "approval_notify_telegram": self._approval_notify_telegram,
            "approval_tg_chat_id": self._approval_tg_chat_id,
        }

    def init_plugin(self, config: dict = None, *, persist: bool = False):
        """初始化并规范化插件配置，确保内存与已持久化的系统配置保持一致。"""
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
        self._subscribe_approval_enabled = bool(
            merged.get("subscribe_approval_enabled", False)
        )
        self._approval_bypass_users = _normalize_string_list(
            merged.get("approval_bypass_users")
        )
        self._approval_notify_telegram = bool(
            merged.get("approval_notify_telegram", True)
        )
        self._approval_tg_chat_id = str(merged.get("approval_tg_chat_id") or "").strip()

        normalized_config = self._export_config()
        should_persist = persist or (config != normalized_config)
        if not should_persist:
            try:
                should_persist = self.get_config() != normalized_config
            except Exception:
                should_persist = True
        if should_persist:
            self.update_config(normalized_config)

    def get_state(self) -> bool:
        """只要登录准入或订阅审批任一功能开启，插件即处于激活状态。"""
        return bool(self._enabled or self._subscribe_approval_enabled)

    @staticmethod
    def get_render_mode() -> Tuple[str, Optional[str]]:
        """使用 Vue 模块联邦渲染模式。"""
        return "vue", "dist/assets"

    def get_sidebar_nav(self) -> List[Dict[str, Any]]:
        """向主界面左侧栏「系统」分组注册用户管理入口（仅管理员可见）。"""
        if not self.get_state():
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
        """注册管理员专用的插件 REST 接口（含 Emby 账号增删改查与订阅审批）。"""
        return [
            {
                "path": "/overview",
                "endpoint": self.api_overview,
                "methods": ["GET"],
                "auth": "bear",
                "summary": "获取Emby用户、订阅审批队列与统计概览",
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
                "summary": "将用户加入或移出登录黑白名单/免审名单",
            },
            {
                "path": "/config",
                "endpoint": self.api_save_config,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "保存Emby用户管理准入与订阅审批配置",
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
            {
                "path": "/approvals",
                "endpoint": self.api_list_approvals,
                "methods": ["GET"],
                "auth": "bear",
                "summary": "查询订阅审批列表",
            },
            {
                "path": "/approval/action",
                "endpoint": self.api_approval_action,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "审批处理订阅申请（通过并提交MP / 标记手动入库 / 拒绝 / 删除）",
            },
            {
                "path": "/approval/clear",
                "endpoint": self.api_clear_approvals,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "清理已处理的订阅审批历史记录",
            },
        ]

    # ------------------------- 订阅审批存储与辅助方法 -------------------------

    def _load_approvals(self) -> List[Dict[str, Any]]:
        """读取全部订阅审批单列表（按创建时间倒序排列）。"""
        raw = self.get_data(APPROVAL_DATA_KEY)
        if not isinstance(raw, list):
            return []
        items = [dict(item) for item in raw if isinstance(item, dict) and item.get("id")]
        items.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        return items

    def _save_approvals(self, items: List[Dict[str, Any]]) -> None:
        """持久化订阅审批单列表（待审项全量保留，历史已处理项最多保留 MAX_APPROVAL_HISTORY 条）。"""
        pending = [item for item in items if item.get("status") == "pending"]
        handled = [item for item in items if item.get("status") != "pending"]
        pending.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        handled.sort(
            key=lambda x: str(x.get("handled_at") or x.get("created_at") or ""),
            reverse=True,
        )
        merged = pending + handled[:MAX_APPROVAL_HISTORY]
        merged.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        self.save_data(APPROVAL_DATA_KEY, merged)

    def _is_mp_superuser(self, username: str) -> bool:
        """判断给定用户名是否为 MoviePilot 超级管理员。"""
        if not username:
            return False
        if username == settings.SUPERUSER:
            return True
        try:
            mp_user = UserOper().get_by_name(username)
            return bool(mp_user and mp_user.is_superuser)
        except Exception:
            return False

    def _user_already_subscribed(self, username: str, record: Dict[str, Any]) -> bool:
        """判断申请人在正式订阅表中是否已拥有同一媒体同季的活跃订阅。"""
        try:
            sub_oper = SubscribeOper()
            return bool(
                Subscribe.exists_by_username(
                    sub_oper._db,
                    username=username,
                    tmdbid=_safe_int(record.get("tmdbid")),
                    doubanid=record.get("doubanid") or None,
                    bangumiid=_safe_int(record.get("bangumiid")),
                    anilistid=_safe_int(record.get("anilistid")),
                    media_source=record.get("media_source") or None,
                    media_id=str(record.get("media_id")) if record.get("media_id") else None,
                    season=_safe_int(record.get("season")),
                    episode_group=record.get("episode_group") or None,
                )
            )
        except Exception:
            return False

    def _send_approval_telegram_card(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """向管理员发送 Telegram 订阅审批卡片并记录 message_id 以供后续状态同步。"""
        if not self._approval_notify_telegram:
            return {}
        title, text = _format_approval_message(record)
        buttons = _build_approval_buttons(str(record["id"]))
        poster = record.get("poster") or record.get("backdrop") or None
        target_userid = self._approval_tg_chat_id or None

        # 1. 优先通过已加载的 Telegram 通知模块客户端直接发送（同时支持 buttons 与返回 message_id）
        try:
            from app.core.module import ModuleManager
            from app.schemas.types import ModuleType

            for mod in ModuleManager().get_running_type_modules(ModuleType.Notification) or []:
                if getattr(mod, "get_subtype", lambda: None)() != MessageChannel.Telegram:
                    continue
                get_instances = getattr(mod, "get_instances", None)
                instances = get_instances() if callable(get_instances) else {}
                for src_name, client in (instances or {}).items():
                    send_msg_fn = getattr(client, "send_msg", None)
                    if not callable(send_msg_fn):
                        continue
                    sent = send_msg_fn(
                        title=title,
                        text=text,
                        image=poster,
                        userid=target_userid,
                        buttons=buttons,
                    )
                    if isinstance(sent, dict) and sent.get("success"):
                        return {
                            "tg_source": str(src_name),
                            "tg_chat_id": str(sent.get("chat_id") or ""),
                            "tg_message_id": sent.get("message_id"),
                        }
        except Exception as err:
            logger.debug(f"通过 Telegram 模块实例直发审批卡片未命中，回退消息链：{err}")

        # 2. 兼容测试替身或自定义消息模块回退
        notification = schemas.Notification(
            channel=MessageChannel.Telegram,
            mtype=NotificationType.Subscribe,
            title=title,
            text=text,
            image=poster,
            userid=target_userid,
            buttons=buttons,
        )
        try:
            send_direct = getattr(self.chain, "send_direct_message", None)
            if callable(send_direct) and not inspect.ismethod(send_direct):
                resp = send_direct(notification)
                if resp and getattr(resp, "success", False):
                    return {
                        "tg_source": getattr(resp, "source", None),
                        "tg_chat_id": str(getattr(resp, "chat_id", "") or ""),
                        "tg_message_id": getattr(resp, "message_id", None),
                    }
        except Exception as err:
            logger.debug(f"测试直发通道回退：{err}")

        try:
            self.post_message(
                channel=MessageChannel.Telegram,
                mtype=NotificationType.Subscribe,
                title=title,
                text=text,
                image=poster,
                userid=target_userid,
                buttons=buttons,
            )
        except Exception as err:
            logger.error(f"回退发送 Telegram 订阅审批卡片失败：{err}")
        return {}

    def _sync_approval_telegram_card(
        self,
        record: Dict[str, Any],
        *,
        callback_source: Optional[str] = None,
        callback_chat_id: Optional[Any] = None,
        callback_message_id: Optional[Any] = None,
    ) -> None:
        """当审批状态在 TG 或 Web 端变更后，原地更新原 Telegram 卡片文案并移除操作按钮。"""
        source = callback_source or record.get("tg_source")
        chat_id = callback_chat_id or record.get("tg_chat_id")
        message_id = callback_message_id or record.get("tg_message_id")
        if not chat_id or not message_id:
            return

        title, text = _format_approval_message(record)
        edit_fn = getattr(self.chain, "edit_message", None)
        if not callable(edit_fn):
            return

        sources_to_try: List[str] = []
        if source:
            sources_to_try.append(str(source))
        else:
            try:
                confs = SystemConfigOper().get(SystemConfigKey.Notifications) or []
                for conf in confs:
                    if isinstance(conf, dict) and conf.get("type") == "telegram" and conf.get("name"):
                        sources_to_try.append(str(conf["name"]))
            except Exception:
                pass

        for src in sources_to_try or ["Telegram"]:
            try:
                ok = edit_fn(
                    channel=MessageChannel.Telegram,
                    source=src,
                    message_id=message_id,
                    chat_id=chat_id,
                    title=title,
                    text=text,
                    buttons=None,
                )
                if ok:
                    break
            except Exception as err:
                logger.debug(f"编辑 Telegram 审批消息状态失败 ({src})：{err}")

    def _is_authorized_tg_approver(
        self,
        userid: Any,
        username: Optional[str],
        source: Optional[str],
    ) -> bool:
        """校验点击 Telegram 审批按钮的操作人是否具备管理员权限。"""
        candidates = set()
        if userid is not None and str(userid).strip():
            candidates.add(str(userid).strip())
        if username and str(username).strip():
            clean_uname = str(username).strip().lstrip("@")
            if clean_uname:
                candidates.add(clean_uname)
                candidates.add(f"@{clean_uname}")
        if not candidates:
            return False

        configured_admins: set[str] = set()
        configured_chats: set[str] = set()
        if self._approval_tg_chat_id:
            configured_chats.add(self._approval_tg_chat_id.strip())

        try:
            confs = SystemConfigOper().get(SystemConfigKey.Notifications) or []
            for conf in confs:
                if not isinstance(conf, dict) or conf.get("type") != "telegram":
                    continue
                if source and conf.get("name") and str(conf.get("name")) != str(source):
                    continue
                cfg = conf.get("config") or {}
                raw_admins = str(cfg.get("TELEGRAM_ADMINS") or "")
                for item in raw_admins.split(","):
                    token = item.strip()
                    if token:
                        configured_admins.add(token)
                        configured_admins.add(token.lstrip("@"))
                chat_id = str(cfg.get("TELEGRAM_CHAT_ID") or "").strip()
                if chat_id and not chat_id.startswith("-"):
                    configured_chats.add(chat_id)
        except Exception as err:
            logger.warning(f"读取 Telegram 管理员配置失败：{err}")

        if configured_admins:
            return bool(candidates & configured_admins)
        if configured_chats:
            return bool(candidates & configured_chats)
        return True

    def _record_manual_history(self, record: Dict[str, Any]) -> None:
        """将标记手动入库的申请归档至订阅历史，方便申请人在个人历史中查看。"""
        try:
            sub_oper = SubscribeOper()
            sub_oper.add_history(
                name=record.get("title") or "",
                year=record.get("year"),
                type=_normalize_media_type_value(record.get("type")),
                tmdbid=_safe_int(record.get("tmdbid")),
                imdbid=record.get("imdbid"),
                tvdbid=_safe_int(record.get("tvdbid")),
                doubanid=record.get("doubanid"),
                bangumiid=_safe_int(record.get("bangumiid")),
                anilistid=_safe_int(record.get("anilistid")),
                mediaid=record.get("mediaid"),
                media_source=record.get("media_source"),
                media_id=str(record.get("media_id")) if record.get("media_id") else None,
                season=_safe_int(record.get("season")),
                poster=record.get("poster"),
                backdrop=record.get("backdrop"),
                vote=_safe_float(record.get("vote")),
                description=record.get("overview"),
                total_episode=_safe_int(record.get("total_episode")),
                username=record.get("username"),
                best_version=int(record.get("best_version") or 0),
                episode_group=record.get("episode_group"),
            )
        except Exception as err:
            logger.warning(f"写入手动入库订阅历史失败 ({record.get('title')})：{err}")

    def _execute_approval_action(
        self,
        req_id: str,
        action: str,
        *,
        actor: str = "admin",
        callback_source: Optional[str] = None,
        callback_chat_id: Optional[Any] = None,
        callback_message_id: Optional[Any] = None,
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """执行单条订阅审批动作（幂等加锁、驱动 MP 订阅入库并双向同步 TG 卡片）。"""
        normalized_action = str(action or "").strip().lower()
        if normalized_action not in {"approve", "manual", "reject", "delete"}:
            return False, "不支持的审批动作", None

        with self._approval_lock:
            items = self._load_approvals()
            target_idx = next(
                (idx for idx, item in enumerate(items) if str(item.get("id")) == str(req_id)),
                None,
            )
            if target_idx is None:
                return False, "未找到对应的订阅审批记录", None

            record = dict(items[target_idx])
            if normalized_action == "delete":
                items.pop(target_idx)
                self._save_approvals(items)
                return True, f"已移除审批记录《{record.get('title')}》", record

            if record.get("status") != "pending":
                self._sync_approval_telegram_card(
                    record,
                    callback_source=callback_source,
                    callback_chat_id=callback_chat_id,
                    callback_message_id=callback_message_id,
                )
                return True, f"该申请已处理（当前状态：{record.get('status')}）", record

            if normalized_action == "approve":
                mtype_enum = MediaType(_normalize_media_type_value(record.get("type")))
                extra_kwargs: Dict[str, Any] = {
                    "exist_ok": True,
                    "owner_scope": True,
                    "_skip_subscribe_intercept": True,
                }
                if record.get("best_version"):
                    extra_kwargs["best_version"] = int(record["best_version"])
                if record.get("total_episode"):
                    extra_kwargs["total_episode"] = int(record["total_episode"])

                sid, err_msg = SubscribeChain().add(
                    title=str(record.get("title") or ""),
                    year=str(record.get("year") or ""),
                    mtype=mtype_enum,
                    tmdbid=_safe_int(record.get("tmdbid")),
                    doubanid=str(record.get("doubanid")) if record.get("doubanid") else None,
                    bangumiid=_safe_int(record.get("bangumiid")),
                    anilistid=_safe_int(record.get("anilistid")),
                    mediaid=record.get("mediaid") or None,
                    media_source=record.get("media_source") or None,
                    media_id=str(record.get("media_id")) if record.get("media_id") else None,
                    episode_group=record.get("episode_group") or None,
                    season=_safe_int(record.get("season")) if mtype_enum == MediaType.TV else None,
                    username=str(record.get("username") or ""),
                    **extra_kwargs,
                )
                if not sid:
                    fail_reason = err_msg or "提交 MoviePilot 订阅失败"
                    return False, f"提交订阅失败：{fail_reason}", record

                record["status"] = "approved"
                record["subscribe_id"] = sid
                record["handled_at"] = _now_str()
                record["handled_by"] = actor
                action_msg = f"已通过并提交 MoviePilot：《{record.get('title')}》"

            elif normalized_action == "manual":
                self._record_manual_history(record)
                record["status"] = "manual"
                record["handled_at"] = _now_str()
                record["handled_by"] = actor
                action_msg = f"已标记手动入库：《{record.get('title')}》"

            else:
                record["status"] = "rejected"
                record["handled_at"] = _now_str()
                record["handled_by"] = actor
                action_msg = f"已拒绝申请：《{record.get('title')}》"

            items[target_idx] = record
            self._save_approvals(items)

        self._sync_approval_telegram_card(
            record,
            callback_source=callback_source,
            callback_chat_id=callback_chat_id,
            callback_message_id=callback_message_id,
        )
        return True, action_msg, record

    # ------------------------- Emby 服务与账号辅助方法 -------------------------

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
        """当 Emby 账号改名时，同步迁移本地 MP 用户、订阅、历史、个人配置、名单及审批单。"""
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
            for hist in _query_by_username(SubscribeHistory, db, old_name):
                hist.update(db, {"username": new_name})
        except Exception as err:
            logger.warning(f"迁移用户订阅历史名称失败 ({old_name} -> {new_name})：{err}")

        try:
            existing_keys = {
                getattr(conf, "key", None)
                for conf in _query_by_username(UserConfig, db, new_name)
            }
            for conf in _query_by_username(UserConfig, db, old_name):
                if getattr(conf, "key", None) in existing_keys:
                    conf.delete(db, conf.id)
                else:
                    conf.update(db, {"username": new_name})
        except Exception as err:
            logger.warning(f"迁移用户配置名称失败 ({old_name} -> {new_name})：{err}")

        with self._approval_lock:
            approvals = self._load_approvals()
            approval_changed = False
            for item in approvals:
                if item.get("username") == old_name:
                    item["username"] = new_name
                    approval_changed = True
            if approval_changed:
                self._save_approvals(approvals)

        changed = False
        if old_name in self._whitelist:
            self._whitelist = [new_name if x == old_name else x for x in self._whitelist]
            changed = True
        if old_name in self._blacklist:
            self._blacklist = [new_name if x == old_name else x for x in self._blacklist]
            changed = True
        if old_name in self._approval_bypass_users:
            self._approval_bypass_users = [
                new_name if x == old_name else x for x in self._approval_bypass_users
            ]
            changed = True
        if changed:
            self.init_plugin(self._export_config(), persist=True)

    # ------------------------- 事件处理器 -------------------------

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

    @_optional_chain_register(_SUBSCRIBE_INTERCEPT_EVENT)
    def handle_subscribe_intercept(self, event: Event):
        """监听新增订阅拦截事件：非免审普通用户的订阅转入审批队列并推送 Telegram 审批卡片。"""
        if not self._subscribe_approval_enabled or not event or not event.event_data:
            return
        event_data = event.event_data
        username = str(getattr(event_data, "username", "") or "").strip()
        if not username or self._is_mp_superuser(username):
            return
        if username in self._approval_bypass_users:
            return

        mediainfo = getattr(event_data, "mediainfo", None) or {}
        if not isinstance(mediainfo, dict):
            return
        payload = getattr(event_data, "payload", None) or {}
        season = _safe_int(getattr(event_data, "season", None))
        episode_group = getattr(event_data, "episode_group", None) or payload.get("episode_group")
        mtype_val = _normalize_media_type_value(mediainfo.get("type") or payload.get("type"))
        if mtype_val != MediaType.TV.value:
            season = None

        candidate: Dict[str, Any] = {
            "id": secrets.token_hex(6),
            "status": "pending",
            "username": username,
            "title": str(mediainfo.get("title") or payload.get("name") or "").strip(),
            "year": str(mediainfo.get("year") or payload.get("year") or "").strip(),
            "type": mtype_val,
            "season": season,
            "vote": _safe_float(mediainfo.get("vote_average") or mediainfo.get("vote")),
            "overview": str(mediainfo.get("overview") or "").strip(),
            "poster": mediainfo.get("poster_path") or payload.get("poster") or "",
            "backdrop": mediainfo.get("backdrop_path") or payload.get("backdrop") or "",
            "tmdbid": _safe_int(mediainfo.get("tmdb_id") or payload.get("tmdbid")),
            "doubanid": str(mediainfo.get("douban_id") or payload.get("doubanid") or "").strip() or None,
            "bangumiid": _safe_int(mediainfo.get("bangumi_id") or payload.get("bangumiid")),
            "anilistid": _safe_int(mediainfo.get("anilist_id") or payload.get("anilistid")),
            "imdbid": str(mediainfo.get("imdb_id") or payload.get("imdbid") or "").strip() or None,
            "tvdbid": _safe_int(mediainfo.get("tvdb_id") or payload.get("tvdbid")),
            "media_source": mediainfo.get("source") or payload.get("media_source") or None,
            "media_id": str(mediainfo.get("media_id") or payload.get("media_id") or "").strip() or None,
            "mediaid": str(payload.get("mediaid") or "").strip() or None,
            "episode_group": str(episode_group).strip() if episode_group else None,
            "total_episode": _safe_int(payload.get("total_episode")),
            "best_version": int(payload.get("best_version") or 0),
            "created_at": _now_str(),
            "handled_at": None,
            "handled_by": None,
            "subscribe_id": None,
            "tg_source": None,
            "tg_chat_id": None,
            "tg_message_id": None,
        }

        if self._user_already_subscribed(username, candidate):
            return

        dedup_key = _build_approval_dedup_key(candidate)
        created_new = False
        with self._approval_lock:
            approvals = self._load_approvals()
            existing = next(
                (
                    item
                    for item in approvals
                    if item.get("status") == "pending"
                    and item.get("username") == username
                    and _build_approval_dedup_key(item) == dedup_key
                ),
                None,
            )
            if existing is not None:
                event_data.cancel = True
                event_data.pending_approval = True
                event_data.source_plugin = self.plugin_name
                event_data.request_id = str(existing["id"])
                event_data.reason = "该订阅申请已在审批队列中，等待管理员审核"
                return

            approvals.insert(0, candidate)
            self._save_approvals(approvals)
            created_new = True

        if created_new:
            tg_meta = self._send_approval_telegram_card(candidate)
            if tg_meta:
                with self._approval_lock:
                    approvals = self._load_approvals()
                    for item in approvals:
                        if item.get("id") == candidate["id"]:
                            item.update(tg_meta)
                            break
                    self._save_approvals(approvals)

        event_data.cancel = True
        event_data.pending_approval = True
        event_data.source_plugin = self.plugin_name
        event_data.request_id = candidate["id"]
        event_data.reason = "已提交订阅审批，等待管理员审核"

    @eventmanager.register(EventType.MessageAction)
    def handle_message_action(self, event: Event):
        """响应 Telegram 审批卡片按钮回调（通过并提交 MP / 标记手动入库 / 拒绝申请）。"""
        if not event or not isinstance(event.event_data, dict):
            return
        data = event.event_data
        plugin_id = str(data.get("plugin_id") or "").strip()
        if plugin_id != self.__class__.__name__:
            return

        raw_text = str(data.get("text") or "").strip()
        action_map = {
            "sub_approve:": "approve",
            "sub_manual:": "manual",
            "sub_reject:": "reject",
        }
        matched_action: Optional[str] = None
        req_id = ""
        for prefix, mapped in action_map.items():
            if raw_text.startswith(prefix):
                matched_action = mapped
                req_id = raw_text[len(prefix):].strip()
                break
        if not matched_action or not req_id:
            return

        userid = data.get("userid")
        tg_username = data.get("username")
        source = data.get("source")
        chat_id = data.get("original_chat_id") or data.get("chat_id")
        message_id = data.get("original_message_id")

        if not self._is_authorized_tg_approver(userid, tg_username, source):
            logger.warning(
                f"拦截非授权 Telegram 用户的订阅审批点击：userid={userid}, username={tg_username}, req_id={req_id}"
            )
            return

        actor_label = str(tg_username or userid or "Telegram管理员").strip()
        ok, msg, _ = self._execute_approval_action(
            req_id=req_id,
            action=matched_action,
            actor=actor_label,
            callback_source=str(source) if source else None,
            callback_chat_id=chat_id,
            callback_message_id=message_id,
        )
        if not ok:
            try:
                self.post_message(
                    channel=data.get("channel") or MessageChannel.Telegram,
                    title="⚠️ 订阅审批操作未完成",
                    text=msg,
                    userid=str(chat_id or userid or ""),
                )
            except Exception as err:
                logger.warning(f"回发审批失败提示异常：{err}")

    # ------------------------- 管理端 REST 接口 -------------------------

    def api_overview(
        self,
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """聚合 Emby 实例用户、媒体库列表、本地 MP 用户、订阅统计与审批队列。"""
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

        approvals = self._load_approvals()
        pending_by_user: Dict[str, int] = {}
        pending_approval_count = 0
        for req in approvals:
            if req.get("status") == "pending":
                pending_approval_count += 1
                req_owner = str(req.get("username") or "").strip()
                if req_owner and req_owner != settings.SUPERUSER:
                    pending_by_user[req_owner] = pending_by_user.get(req_owner, 0) + 1

        all_usernames = sorted(
            set(emby_user_map.keys())
            | set(mp_users.keys())
            | set(sub_counts.keys())
            | set(pending_by_user.keys())
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
                    "pending_sub_count": pending_by_user.get(uname, 0),
                    "in_whitelist": uname in self._whitelist,
                    "in_blacklist": uname in self._blacklist,
                    "in_approval_bypass": uname in self._approval_bypass_users,
                    "access_status": access_status,
                    "access_reason": access_reason,
                }
            )

        return schemas.Response(
            success=True,
            data={
                "config": self._export_config(),
                "servers": server_list,
                "stats": {
                    "emby_user_count": len(emby_user_map),
                    "mp_registered_count": len(mp_users),
                    "allowed_user_count": allowed_count,
                    "total_subscribe_count": total_sub_count,
                    "pending_approval_count": pending_approval_count,
                },
                "users": users_payload,
                "approvals": approvals,
            },
        )

    def api_list_approvals(
        self,
        status: Optional[str] = None,
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """按状态过滤查询订阅审批列表。"""
        items = self._load_approvals()
        if status and status != "all":
            items = [item for item in items if item.get("status") == status]
        return schemas.Response(success=True, data=items)

    def api_approval_action(
        self,
        payload: dict = Body(...),
        current_admin: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """管理员通过 Web 页面审批单条或批量订阅申请。"""
        data = payload or {}
        action = str(data.get("action") or "").strip().lower()
        actor = getattr(current_admin, "name", None) or settings.SUPERUSER
        raw_ids = data.get("request_ids")
        if isinstance(raw_ids, list) and raw_ids:
            req_ids = [str(rid).strip() for rid in raw_ids if str(rid).strip()]
        else:
            single_id = str(data.get("request_id") or "").strip()
            req_ids = [single_id] if single_id else []

        if not req_ids:
            return schemas.Response(success=False, message="缺少审批单 ID")

        succeeded = 0
        last_msg = ""
        errors: List[str] = []
        for rid in req_ids:
            ok, msg, _ = self._execute_approval_action(rid, action, actor=actor)
            if ok:
                succeeded += 1
                last_msg = msg
            else:
                errors.append(msg)

        if succeeded == 0:
            return schemas.Response(
                success=False,
                message="；".join(errors) or "审批操作失败",
            )
        summary_msg = (
            last_msg
            if len(req_ids) == 1 and not errors
            else f"已处理 {succeeded}/{len(req_ids)} 条申请"
            + (f"（失败：{'；'.join(errors)}）" if errors else "")
        )
        return schemas.Response(
            success=True,
            message=summary_msg,
            data={"approvals": self._load_approvals()},
        )

    def api_clear_approvals(
        self,
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """清理所有已处理（非 pending）的审批历史记录。"""
        with self._approval_lock:
            items = self._load_approvals()
            pending_only = [item for item in items if item.get("status") == "pending"]
            removed = len(items) - len(pending_only)
            self._save_approvals(pending_only)
        return schemas.Response(
            success=True,
            message=f"已清理 {removed} 条历史审批记录",
            data={"approvals": pending_only},
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

        next_config = self._export_config()
        config_changed = False
        if bool(data.get("add_to_whitelist")) and username not in self._whitelist:
            next_config["whitelist"] = [*self._whitelist, username]
            config_changed = True
        if bool(data.get("add_to_approval_bypass")) and username not in self._approval_bypass_users:
            next_config["approval_bypass_users"] = [*self._approval_bypass_users, username]
            config_changed = True
        if config_changed:
            self.init_plugin(next_config, persist=True)

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

        if bool(data.get("change_password")):
            set_pw_fn = getattr(instance, "set_user_password", None)
            if not callable(set_pw_fn):
                return schemas.Response(success=False, message="当前 Emby 模块不支持修改密码")
            new_pw = str(data.get("new_password") or "")
            ok, msg = set_pw_fn(user_id, new_pw)
            if not ok:
                return schemas.Response(success=False, message=msg or "修改 Emby 密码失败")

        policy_updates = _build_policy_updates_from_payload(data)
        if policy_updates:
            update_policy_fn = getattr(instance, "update_user_policy", None)
            if not callable(update_policy_fn):
                return schemas.Response(success=False, message="当前 Emby 模块不支持更新用户策略")
            ok, msg = update_policy_fn(user_id, policy_updates)
            if not ok:
                return schemas.Response(success=False, message=msg or "更新 Emby 用户策略失败")

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
        """将指定用户加入或移出白名单/黑名单/免审名单。"""
        username = str((payload or {}).get("username") or "").strip()
        list_type = str((payload or {}).get("list_type") or "").strip().lower()
        action = str((payload or {}).get("action") or "add").strip().lower()
        if not username or username == settings.SUPERUSER:
            return schemas.Response(success=False, message="非法的用户名")
        if list_type not in {"whitelist", "blacklist", "approval_bypass"}:
            return schemas.Response(success=False, message="无效的名单类型")
        if action not in {"add", "remove"}:
            return schemas.Response(success=False, message="无效的操作类型")

        list_attr_map = {
            "whitelist": ("whitelist", self._whitelist),
            "blacklist": ("blacklist", self._blacklist),
            "approval_bypass": ("approval_bypass_users", self._approval_bypass_users),
        }
        config_key, source_list = list_attr_map[list_type]
        target_list = list(source_list)
        if action == "add":
            if username not in target_list:
                target_list.append(username)
        else:
            target_list = [item for item in target_list if item != username]

        new_config = self._export_config()
        new_config[config_key] = target_list
        self.init_plugin(new_config, persist=True)
        return schemas.Response(
            success=True,
            message="名单已更新",
            data={
                "whitelist": list(self._whitelist),
                "blacklist": list(self._blacklist),
                "approval_bypass_users": list(self._approval_bypass_users),
            },
        )

    def api_save_config(
        self,
        payload: dict = Body(...),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """保存并立即生效插件准入与订阅审批配置。"""
        merged = self._export_config()
        if isinstance(payload, dict):
            merged.update(payload)
        self.init_plugin(merged, persist=True)
        return schemas.Response(
            success=True,
            message="策略配置已保存",
            data=self._export_config(),
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
        """支持删除 Emby 服务器账号、删除本地 MP 用户记录，并可连带清理其全部订阅与待审申请。"""
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

            with self._approval_lock:
                approvals = self._load_approvals()
                filtered = [item for item in approvals if item.get("username") != username]
                if len(filtered) != len(approvals):
                    self._save_approvals(filtered)

        if delete_mp_user or delete_from_emby:
            try:
                for item in _query_by_username(UserConfig, user_oper._db, username):
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
