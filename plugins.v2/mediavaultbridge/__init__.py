"""MoviePilot V2 MediaVault (Muvyo) 联动管家插件。"""
from __future__ import annotations

import copy
import threading
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from apscheduler.triggers.cron import CronTrigger
from fastapi import Body, Depends

from app import schemas
from app.core.event import Event, eventmanager
from app.db.models.user import User
from app.db.user_oper import get_current_admin
from app.log import logger
from app.plugins import _PluginBase
from app.plugins.mediavaultbridge.client import MediaVaultClient, MediaVaultError
from app.plugins.mediavaultbridge.engine import (
    DEFAULT_SKIP_RETRY_KEYWORDS,
    PathMappingRule,
    classify_failed_event,
    evaluate_retry_candidates,
    extract_115_share_urls,
    map_mp_path_to_mv,
)
from app.schemas.types import EventType, NotificationType

MAX_LOG_ENTRIES = 200
MAX_TRACKER_ENTRIES = 500


DEFAULT_CONFIG: Dict[str, Any] = {
    "enabled": False,
    "mv_url": "http://192.168.2.110:7811",
    "mv_api_key": "",
    "timeout": 20,
    "notify": True,
    "default_storage": "115-default",
    "default_emby_slug": "emby-default",
    "debounce_seconds": 30,
    "path_mappings": [
        {
            "mp_prefix": "/media/link",
            "mv_cloud_prefix": "/media",
            "mv_strm_prefix": "/media/strm",
            "storage": "115-default",
            "enabled": True,
        }
    ],
    "quick_path_pairs": [],
    "upload_retry": {
        "enabled": True,
        "cron": "*/15 * * * *",
        "max_retries": 3,
        "cooldown_minutes": 15,
        "force_retry": False,
        "clear_attempts_before_retry": True,
        "attempts_dir": "/opt/config/offline115-attempts",
        "skip_keywords_regex": DEFAULT_SKIP_RETRY_KEYWORDS,
        "notify_on_retry": True,
        "notify_on_manual_required": True,
    },
    "transfer_hooks": {
        "enabled": True,
        "trigger_monitor_sync": True,
        "trigger_strm_generate": False,
        "strm_overwrite": False,
        "trigger_scrape": False,
    },
    "delete_hooks": {
        "enabled": True,
        "trigger_cleanup_scan": True,
        "trigger_orphan_scan": False,
    },
    "emby_hooks": {
        "enabled": False,
        "run_mediainfo": True,
        "run_thumbnail": False,
        "run_intro_skip": False,
    },
    "share_transfer": {
        "enabled": True,
        "listen_user_message": True,
        "default_target_path": "",
        "trigger_strm_after": False,
    },
}


def _now_str() -> str:
    """返回当前本地时间字符串。"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _extract_transfer_dest_path(event_data: Dict[str, Any]) -> str:
    """从 TransferComplete / HistoryDeleted 事件载荷中提取目标媒体路径。"""
    if not isinstance(event_data, dict):
        return ""
    transferinfo = event_data.get("transferinfo")
    if transferinfo is not None:
        target_item = getattr(transferinfo, "target_item", None)
        if target_item is not None:
            path = getattr(target_item, "path", None)
            if path:
                return str(path)
        target_diritem = getattr(transferinfo, "target_diritem", None)
        if target_diritem is not None:
            path = getattr(target_diritem, "path", None)
            if path:
                return str(path)
        if isinstance(transferinfo, dict):
            for key in ("target_path", "dest", "path"):
                if transferinfo.get(key):
                    return str(transferinfo[key])
    for key in ("dest", "target_path", "path", "src"):
        val = event_data.get(key)
        if val:
            return str(val)
    return ""


class MediaVaultBridge(_PluginBase):
    """联动 MediaVault (Muvyo) 的综合管家插件。"""

    plugin_name = "MediaVault 联动管家"
    plugin_desc = (
        "联动 MediaVault (Muvyo)：115 上传失败自动/手动重试、入库触发增量 STRM 与刮削、"
        "删片联动清理、Emby 后处理、115 分享链转存与运维面板。"
    )
    plugin_icon = "cloud.png"
    plugin_version = "1.2.0"
    plugin_author = "4Nest"
    author_url = "https://github.com/4Nest"
    plugin_label = "网盘,STRM,115,联动"
    plugin_config_prefix = "mediavaultbridge_"
    plugin_order = 25
    auth_level = 1

    def __init__(self) -> None:
        """初始化插件运行态、防抖定时器与并发锁。"""
        super().__init__()
        self._enabled = False
        self._config: Dict[str, Any] = copy.deepcopy(DEFAULT_CONFIG)
        self._lock = threading.Lock()
        self._retry_lock = threading.Lock()
        self._debounce_timer: Optional[threading.Timer] = None
        self._pending_paths: List[str] = []

    def init_plugin(self, config: dict = None) -> None:
        """合并并规范化插件配置，重建运行状态。"""
        self.stop_service()
        merged = self._merge_config(config)
        self._config = merged
        self._enabled = bool(merged.get("enabled", False))

    def _merge_config(self, config: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """将外部配置与默认配置深度合并并清洗字段类型。"""
        merged = copy.deepcopy(DEFAULT_CONFIG)
        if isinstance(config, dict):
            for key, value in config.items():
                if key in ("upload_retry", "transfer_hooks", "delete_hooks", "emby_hooks", "share_transfer"):
                    if isinstance(value, dict):
                        merged[key].update(value)
                else:
                    merged[key] = value

        merged["enabled"] = bool(merged.get("enabled", False))
        merged["mv_url"] = str(merged.get("mv_url") or "").strip().rstrip("/")
        merged["mv_api_key"] = str(merged.get("mv_api_key") or "").strip()
        merged["timeout"] = max(5, min(120, int(merged.get("timeout") or 20)))
        merged["notify"] = bool(merged.get("notify", True))
        merged["default_storage"] = str(merged.get("default_storage") or "115-default").strip() or "115-default"
        merged["default_emby_slug"] = str(merged.get("default_emby_slug") or "emby-default").strip() or "emby-default"
        merged["debounce_seconds"] = max(5, min(600, int(merged.get("debounce_seconds") or 30)))

        raw_mappings = merged.get("path_mappings")
        mappings: List[Dict[str, Any]] = []
        if isinstance(raw_mappings, list):
            for item in raw_mappings:
                if isinstance(item, dict):
                    rule = PathMappingRule.from_dict(item)
                    if rule.mp_prefix or rule.mv_cloud_prefix:
                        mappings.append(rule.to_dict())
        merged["path_mappings"] = mappings

        raw_pairs = merged.get("quick_path_pairs")
        quick_pairs: List[Dict[str, Any]] = []
        if isinstance(raw_pairs, list):
            for idx, item in enumerate(raw_pairs):
                if not isinstance(item, dict):
                    continue
                src = str(item.get("source_dir") or "").strip()
                dst = str(item.get("target_dir") or "").strip()
                if not src and not dst:
                    continue
                quick_pairs.append(
                    {
                        "id": str(item.get("id") or f"pair_{idx + 1}"),
                        "name": str(item.get("name") or src or dst).strip(),
                        "source_dir": src,
                        "target_dir": dst,
                        "storage": str(item.get("storage") or merged["default_storage"]).strip()
                        or merged["default_storage"],
                    }
                )
        merged["quick_path_pairs"] = quick_pairs

        ur = merged["upload_retry"]
        ur["enabled"] = bool(ur.get("enabled", True))
        ur["cron"] = str(ur.get("cron") or "*/15 * * * *").strip() or "*/15 * * * *"
        ur["max_retries"] = max(1, min(20, int(ur.get("max_retries") or 3)))
        ur["cooldown_minutes"] = max(1, min(1440, int(ur.get("cooldown_minutes") or 15)))
        ur["force_retry"] = bool(ur.get("force_retry", False))
        ur["clear_attempts_before_retry"] = bool(ur.get("clear_attempts_before_retry", True))
        ur["attempts_dir"] = (
            str(ur.get("attempts_dir") or "/opt/config/offline115-attempts").strip()
            or "/opt/config/offline115-attempts"
        )
        ur["skip_keywords_regex"] = str(ur.get("skip_keywords_regex") or "").strip()
        ur["notify_on_retry"] = bool(ur.get("notify_on_retry", True))
        ur["notify_on_manual_required"] = bool(ur.get("notify_on_manual_required", True))
        return merged

    def _build_client(
        self,
        mv_url: Optional[str] = None,
        mv_api_key: Optional[str] = None,
        timeout: Optional[int] = None,
    ) -> MediaVaultClient:
        """基于当前配置或临时参数创建 MediaVault 客户端。"""
        return MediaVaultClient(
            base_url=mv_url if mv_url is not None else self._config.get("mv_url", ""),
            api_key=mv_api_key if mv_api_key is not None else self._config.get("mv_api_key", ""),
            timeout=timeout if timeout is not None else int(self._config.get("timeout", 20)),
        )

    def _mapping_rules(self) -> List[PathMappingRule]:
        """返回结构化的路径映射规则列表。"""
        return [
            PathMappingRule.from_dict(item)
            for item in (self._config.get("path_mappings") or [])
            if isinstance(item, dict)
        ]

    def get_state(self) -> bool:
        """获取插件启用状态。"""
        return self._enabled

    @staticmethod
    def get_render_mode() -> Tuple[str, Optional[str]]:
        """声明插件使用 Vue 模块联邦渲染。"""
        return "vue", "dist/assets"

    def get_sidebar_nav(self) -> List[Dict[str, Any]]:
        """启用时在整理分组注册 MediaVault 全页导航入口。"""
        if not self._enabled:
            return []
        return [
            {
                "nav_key": "main",
                "title": "MediaVault",
                "icon": "mdi-cloud-upload",
                "section": "organize",
                "permission": "manage",
                "order": 25,
            }
        ]

    @staticmethod
    def get_command() -> List[Dict[str, Any]]:
        """注册远程交互命令（一键重试失败上传、115 分享转存）。"""
        return [
            {
                "cmd": "/mv_retry",
                "event": EventType.PluginAction,
                "desc": "重试 MediaVault 115 上传失败任务",
                "category": "网盘",
                "data": {"action": "mv_retry_uploads"},
            },
            {
                "cmd": "/mv_sync",
                "event": EventType.PluginAction,
                "desc": "触发 MediaVault 目录监控同步",
                "category": "网盘",
                "data": {"action": "mv_trigger_sync"},
            },
        ]

    def get_service(self) -> List[Dict[str, Any]]:
        """注册 115 上传失败巡检与自动重试定时任务。"""
        ur = self._config.get("upload_retry") or {}
        if not self._enabled or not ur.get("enabled"):
            return []
        cron = str(ur.get("cron") or "*/15 * * * *").strip()
        try:
            trigger = CronTrigger.from_crontab(cron)
        except Exception as err:
            logger.warning(f"[MediaVaultBridge] 无效的定时表达式 {cron!r}，回退默认每 15 分钟: {err}")
            trigger = CronTrigger.from_crontab("*/15 * * * *")
        return [
            {
                "id": "mediavault_upload_retry",
                "name": "MediaVault 115 上传失败巡检与重试",
                "trigger": trigger,
                "func": self.run_upload_retry_cycle,
                "kwargs": {"source": "schedule"},
            }
        ]

    def get_form(self) -> Tuple[List[dict], Dict[str, Any]]:
        """Vue 模式下返回当前默认配置模型。"""
        return [], copy.deepcopy(self._config)

    def get_page(self) -> List[dict]:
        """Vue 模式下详情页由联邦 Page 组件渲染。"""
        return []

    def stop_service(self) -> None:
        """取消未执行的防抖定时器并清理待处理队列。"""
        with self._lock:
            if self._debounce_timer is not None:
                self._debounce_timer.cancel()
                self._debounce_timer = None
            self._pending_paths.clear()

    # ── 日志与持久化状态 ───────────────────────────────────────────────────────

    def _append_log(
        self,
        category: str,
        status: str,
        summary: str,
        detail: str = "",
    ) -> None:
        """追加一条结构化联动日志并裁剪保留上限。"""
        logs = self.get_data("logs") or []
        if not isinstance(logs, list):
            logs = []
        logs.insert(
            0,
            {
                "id": f"log_{int(time.time() * 1000)}_{len(logs)}",
                "time": _now_str(),
                "category": category,
                "status": status,
                "summary": summary,
                "detail": detail[:600],
            },
        )
        self.save_data("logs", logs[:MAX_LOG_ENTRIES])

    def _get_retry_tracker(self) -> Dict[str, Dict[str, Any]]:
        """读取失败上传事件的自动重试计数与冷却状态。"""
        data = self.get_data("retry_tracker")
        return data if isinstance(data, dict) else {}

    def _save_retry_tracker(self, tracker: Dict[str, Dict[str, Any]]) -> None:
        """持久化失败上传重试追踪表并限制记录数量。"""
        if len(tracker) > MAX_TRACKER_ENTRIES:
            ordered = sorted(
                tracker.items(),
                key=lambda kv: float((kv[1] or {}).get("last_ts") or 0.0),
                reverse=True,
            )
            tracker = dict(ordered[:MAX_TRACKER_ENTRIES])
        self.save_data("retry_tracker", tracker)

    def _send_notice(self, title: str, text: str) -> None:
        """按全局通知开关发送 MoviePilot 系统消息。"""
        if not self._config.get("notify", True):
            return
        try:
            self.post_message(
                mtype=NotificationType.Plugin,
                title=title,
                text=text,
            )
        except Exception as err:
            logger.warning(f"[MediaVaultBridge] 发送通知失败: {err}")

    # ── 核心业务：115 上传失败巡检与自动重试 ───────────────────────────────────

    def run_upload_retry_cycle(self, source: str = "schedule") -> Dict[str, Any]:
        """巡检 MediaVault 115 上传失败事件，自动重试可恢复项并对需核对项告警。"""
        client = self._build_client()
        if not client.is_configured():
            return {"success": False, "message": "未配置 MediaVault 地址或 API Key"}

        if not self._retry_lock.acquire(blocking=False):
            return {"success": False, "message": "上一次上传失败巡检尚未结束"}

        try:
            ur = self._config.get("upload_retry") or {}
            res = client.monitor_events(status="failed", page=1, page_size=100)
            items = res.get("items") if isinstance(res, dict) else []
            if not isinstance(items, list):
                items = []

            tracker = self._get_retry_tracker()
            clear_attempts = bool(ur.get("clear_attempts_before_retry", True))
            attempts_dir = str(ur.get("attempts_dir") or "/opt/config/offline115-attempts")
            evaluated = evaluate_retry_candidates(
                failed_events=items,
                retry_tracker=tracker,
                max_retries=int(ur.get("max_retries") or 3),
                cooldown_minutes=int(ur.get("cooldown_minutes") or 15),
                skip_regex=str(ur.get("skip_keywords_regex") or ""),
                clear_attempts_before_retry=clear_attempts,
            )

            to_retry = evaluated["to_retry"]
            to_clear_and_retry = evaluated["to_clear_and_retry"]
            manual_items = evaluated["manual_confirm"]
            retried_ids: List[int] = []
            attempts_deleted = 0
            now_ts = time.time()

            if to_clear_and_retry:
                clear_res = client.clear_offline115_attempts(attempts_dir=attempts_dir)
                attempts_deleted = int(clear_res.get("deleted") or 0)
                lock_ids = [int(ev["id"]) for ev in to_clear_and_retry]
                client.batch_retry_monitor_events(event_ids=lock_ids, force=True)
                retried_ids.extend(lock_ids)

            if to_retry:
                event_ids = [int(ev["id"]) for ev in to_retry]
                force = bool(ur.get("force_retry", False))
                client.batch_retry_monitor_events(event_ids=event_ids, force=force)
                retried_ids.extend(event_ids)

            all_retried_events = [*to_clear_and_retry, *to_retry]
            if retried_ids:
                for eid in retried_ids:
                    key = str(eid)
                    prev = tracker.get(key) or {}
                    tracker[key] = {
                        "attempts": int(prev.get("attempts") or 0) + 1,
                        "last_ts": now_ts,
                    }
                self._save_retry_tracker(tracker)
                names = "、".join(
                    str(ev.get("file_name") or ev.get("id")) for ev in all_retried_events[:5]
                )
                suffix = f" 等 {len(all_retried_events)} 项" if len(all_retried_events) > 5 else ""
                clear_note = f"（已清理 {attempts_deleted} 个 115 尝试锁 JSON）" if to_clear_and_retry else ""
                summary = f"已自动重试 {len(retried_ids)} 个 115 上传失败任务{clear_note}"
                self._append_log("upload_retry", "success", summary, f"来源={source}；文件={names}{suffix}")
                if ur.get("notify_on_retry", True):
                    self._send_notice(
                        "MediaVault 115 上传失败自动重试",
                        f"{summary}\n文件：{names}{suffix}",
                    )

            # 对命中“勿重复上传/风控”等需人工核对的失败事件，仅首次推送提醒
            notified_manual = self.get_data("notified_manual_ids") or []
            if not isinstance(notified_manual, list):
                notified_manual = []
            notified_set = {str(x) for x in notified_manual}
            new_manual = [ev for ev in manual_items if str(ev.get("id")) not in notified_set]
            if new_manual:
                for ev in new_manual:
                    notified_set.add(str(ev.get("id")))
                self.save_data("notified_manual_ids", list(notified_set)[-300:])
                names = "\n".join(
                    f"- {ev.get('file_name') or ev.get('id')}: {str(ev.get('error') or ev.get('message') or '')[:80]}"
                    for ev in new_manual[:5]
                )
                self._append_log(
                    "upload_retry",
                    "warning",
                    f"发现 {len(new_manual)} 个需人工核对的 115 上传失败项",
                    names,
                )
                if ur.get("notify_on_manual_required", True):
                    self._send_notice(
                        "MediaVault 115 上传异常（需人工核对）",
                        f"以下 {len(new_manual)} 个上传失败命中防重复/风控规则，已跳过自动重试，请在 MediaVault 联动面板核对后决定是否强制重试：\n{names}",
                    )

            return {
                "success": True,
                "total_failed": len(items),
                "retried_count": len(retried_ids),
                "retried_ids": retried_ids,
                "manual_confirm_count": len(manual_items),
                "cooldown_count": len(evaluated["cooldown"]),
                "exhausted_count": len(evaluated["exhausted"]),
            }
        except Exception as err:
            logger.error(f"[MediaVaultBridge] 上传失败巡检异常: {err}")
            self._append_log("upload_retry", "error", "115 上传失败巡检异常", str(err))
            return {"success": False, "message": str(err)}
        finally:
            self._retry_lock.release()

    # ── 核心业务：入库防抖聚合后处理 ──────────────────────────────────────────

    def _schedule_transfer_flush(self, dest_path: str) -> None:
        """将新入库路径放入防抖队列，等待窗口结束后统一触发 MediaVault 后处理。"""
        delay = int(self._config.get("debounce_seconds") or 30)
        with self._lock:
            if dest_path and dest_path not in self._pending_paths:
                self._pending_paths.append(dest_path)
            if self._debounce_timer is not None:
                self._debounce_timer.cancel()
            timer = threading.Timer(delay, self._flush_pending_transfers)
            timer.daemon = True
            self._debounce_timer = timer
            timer.start()

    def _flush_pending_transfers(self) -> None:
        """消费防抖队列并按开关依次触发监控同步、增量 STRM、刮削与 Emby 后处理。"""
        with self._lock:
            paths = list(self._pending_paths)
            self._pending_paths.clear()
            self._debounce_timer = None

        if not self._enabled or not paths:
            return

        client = self._build_client()
        if not client.is_configured():
            return

        th = self._config.get("transfer_hooks") or {}
        eh = self._config.get("emby_hooks") or {}
        rules = self._mapping_rules()
        actions_done: List[str] = []
        errors: List[str] = []

        if th.get("enabled"):
            if th.get("trigger_monitor_sync"):
                try:
                    client.trigger_monitor_sync(rule_idx=-1, full=False)
                    actions_done.append("触发监控增量同步")
                except Exception as err:
                    errors.append(f"监控同步失败: {err}")

            mapped_dirs: List[Dict[str, str]] = []
            seen_dirs = set()
            for p in paths:
                mapped = map_mp_path_to_mv(p, rules, use_parent_dir=True)
                if mapped and mapped["cloud_dir"] not in seen_dirs:
                    seen_dirs.add(mapped["cloud_dir"])
                    mapped_dirs.append(mapped)

            if th.get("trigger_strm_generate"):
                for m in mapped_dirs:
                    try:
                        client.strm_generate(
                            source_dir=m["cloud_dir"],
                            target_dir=m["strm_dir"],
                            cloud=m["storage"],
                            overwrite=bool(th.get("strm_overwrite", False)),
                        )
                        actions_done.append(f"增量STRM({m['cloud_dir']})")
                    except Exception as err:
                        errors.append(f"STRM生成失败({m['cloud_dir']}): {err}")

            if th.get("trigger_scrape"):
                for m in mapped_dirs:
                    target = m["strm_dir"] or m["cloud_dir"]
                    try:
                        client.scrape_directory(target_dir=target)
                        actions_done.append(f"刮削({target})")
                    except Exception as err:
                        errors.append(f"刮削失败({target}): {err}")

        if eh.get("enabled"):
            if eh.get("run_mediainfo"):
                try:
                    client.emby_mediainfo_run(scope="missing")
                    actions_done.append("Emby MediaInfo")
                except Exception as err:
                    errors.append(f"Emby MediaInfo失败: {err}")
            if eh.get("run_thumbnail"):
                try:
                    client.emby_thumbnail_run(scope="missing")
                    actions_done.append("Emby 缩略图")
                except Exception as err:
                    errors.append(f"Emby 缩略图失败: {err}")
            if eh.get("run_intro_skip"):
                try:
                    client.emby_intro_skip_detect(
                        server_slug=str(self._config.get("default_emby_slug") or "emby-default"),
                        only_missing=True,
                    )
                    actions_done.append("Emby 片头检测")
                except Exception as err:
                    errors.append(f"Emby 片头检测失败: {err}")

        status = "error" if (errors and not actions_done) else ("warning" if errors else "success")
        summary = f"入库聚合({len(paths)}项): " + ("、".join(actions_done) if actions_done else "无动作执行")
        detail = "；".join(errors) if errors else f"路径样例: {paths[0]}"
        self._append_log("transfer_hook", status, summary, detail)

    # ── 事件监听 ───────────────────────────────────────────────────────────────

    @eventmanager.register(EventType.TransferComplete)
    def on_transfer_complete(self, event: Event) -> None:
        """监听 MoviePilot 媒体整理完成事件并入队防抖触发。"""
        if not self._enabled or not event or not event.event_data:
            return
        th = self._config.get("transfer_hooks") or {}
        eh = self._config.get("emby_hooks") or {}
        if not th.get("enabled") and not eh.get("enabled"):
            return
        dest_path = _extract_transfer_dest_path(event.event_data)
        self._schedule_transfer_flush(dest_path or "(unknown)")

    @eventmanager.register(EventType.HistoryDeleted)
    def on_history_deleted(self, event: Event) -> None:
        """监听 MoviePilot 历史/源文件删除事件并触发 STRM 清理或孤立索引扫描。"""
        if not self._enabled or not event or not event.event_data:
            return
        dh = self._config.get("delete_hooks") or {}
        if not dh.get("enabled"):
            return
        client = self._build_client()
        if not client.is_configured():
            return

        dest_path = _extract_transfer_dest_path(event.event_data)
        mapped = map_mp_path_to_mv(dest_path, self._mapping_rules(), use_parent_dir=True) if dest_path else None
        storage = (mapped or {}).get("storage") or str(self._config.get("default_storage") or "115-default")
        cloud_dir = (mapped or {}).get("cloud_dir") or ""
        strm_dir = (mapped or {}).get("strm_dir") or ""

        actions_done: List[str] = []
        errors: List[str] = []
        if dh.get("trigger_cleanup_scan"):
            try:
                client.strm_cleanup_scan(strm_dir=strm_dir, cloud_dir=cloud_dir, storage=storage)
                actions_done.append("STRM 清理扫描")
            except Exception as err:
                errors.append(f"STRM 清理扫描失败: {err}")
        if dh.get("trigger_orphan_scan"):
            try:
                client.orphan_index_scan(storage=storage, path=cloud_dir)
                actions_done.append("孤立索引扫描")
            except Exception as err:
                errors.append(f"孤立索引扫描失败: {err}")

        if actions_done or errors:
            status = "error" if (errors and not actions_done) else ("warning" if errors else "success")
            self._append_log(
                "delete_hook",
                status,
                "删片联动: " + ("、".join(actions_done) if actions_done else "触发失败"),
                "；".join(errors) if errors else f"目标={dest_path or storage}",
            )

    @eventmanager.register(EventType.PluginAction)
    def on_plugin_action(self, event: Event) -> None:
        """响应远程命令（/mv_retry、/mv_sync）。"""
        if not self._enabled or not event or not event.event_data:
            return
        action = event.event_data.get("action")
        if action == "mv_retry_uploads":
            result = self.run_upload_retry_cycle(source="command")
            msg = (
                f"失败总数 {result.get('total_failed', 0)}，已重试 {result.get('retried_count', 0)} 项，"
                f"需人工核对 {result.get('manual_confirm_count', 0)} 项"
                if result.get("success")
                else f"执行失败：{result.get('message')}"
            )
            self._send_notice("MediaVault 115 失败重试结果", msg)
        elif action == "mv_trigger_sync":
            try:
                self._build_client().trigger_monitor_sync(rule_idx=-1, full=False)
                self._append_log("manual_action", "success", "远程命令触发目录监控同步", "")
                self._send_notice("MediaVault 目录监控同步", "已成功触发增量同步")
            except Exception as err:
                self._append_log("manual_action", "error", "远程命令触发同步失败", str(err))
                self._send_notice("MediaVault 目录监控同步失败", str(err))

    @eventmanager.register(EventType.UserMessage)
    def on_user_message(self, event: Event) -> None:
        """监听用户消息中的 115 分享链接并自动调用 MediaVault 转存。"""
        if not self._enabled or not event or not event.event_data:
            return
        st = self._config.get("share_transfer") or {}
        if not st.get("enabled") or not st.get("listen_user_message"):
            return
        text = str(event.event_data.get("text") or "").strip()
        links = extract_115_share_urls(text)
        if not links:
            return

        client = self._build_client()
        if not client.is_configured():
            return

        storage = str(self._config.get("default_storage") or "115-default")
        target_path = str(st.get("default_target_path") or "").strip()
        results: List[str] = []
        for item in links:
            url = item["share_url"]
            code = item["receive_code"]
            try:
                client.share_receive(
                    share_url=url,
                    target_path=target_path,
                    storage=storage,
                    receive_code=code,
                )
                results.append(f"✅ {url}")
                self._append_log("share_transfer", "success", "消息自动转存 115 分享链接", url)
            except Exception as err:
                results.append(f"❌ {url} ({err})")
                self._append_log("share_transfer", "error", "消息自动转存失败", f"{url}: {err}")

        self._send_notice(
            "MediaVault 115 分享链转存",
            "\n".join(results),
        )

    # ── 插件 REST API（供联邦前端调用） ────────────────────────────────────────

    def get_api(self) -> List[Dict[str, Any]]:
        """注册插件管理员 API 端点。"""
        return [
            {
                "path": "/overview",
                "endpoint": self.api_overview,
                "methods": ["GET"],
                "auth": "bear",
                "summary": "获取 MediaVault 联动总览",
            },
            {
                "path": "/config",
                "endpoint": self.api_get_config,
                "methods": ["GET"],
                "auth": "bear",
                "summary": "获取插件配置",
            },
            {
                "path": "/config",
                "endpoint": self.api_save_config,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "保存并重载插件配置",
            },
            {
                "path": "/test",
                "endpoint": self.api_test_connection,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "测试 MediaVault 连通性",
            },
            {
                "path": "/failed-uploads",
                "endpoint": self.api_failed_uploads,
                "methods": ["GET"],
                "auth": "bear",
                "summary": "获取 115 上传失败事件与记录",
            },
            {
                "path": "/retry-uploads",
                "endpoint": self.api_retry_uploads,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "重试单个/批量 115 上传失败任务",
            },
            {
                "path": "/actions/trigger",
                "endpoint": self.api_trigger_action,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "手动触发 MediaVault 运维动作",
            },
            {
                "path": "/quick-paths",
                "endpoint": self.api_save_quick_paths,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "保存常用运维路径对列表",
            },
            {
                "path": "/share/parse",
                "endpoint": self.api_share_parse,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "解析 115 分享链接",
            },
            {
                "path": "/share/receive",
                "endpoint": self.api_share_receive,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "转存 115 分享链接到网盘",
            },
            {
                "path": "/share/records",
                "endpoint": self.api_share_records,
                "methods": ["GET"],
                "auth": "bear",
                "summary": "获取 115 分享转存历史",
            },
            {
                "path": "/logs",
                "endpoint": self.api_get_logs,
                "methods": ["GET"],
                "auth": "bear",
                "summary": "获取插件联动执行日志",
            },
            {
                "path": "/logs/clear",
                "endpoint": self.api_clear_logs,
                "methods": ["POST"],
                "auth": "bear",
                "summary": "清空插件联动执行日志",
            },
        ]

    def api_get_config(
        self,
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """返回当前插件完整配置。"""
        return schemas.Response(success=True, data=copy.deepcopy(self._config))

    def api_save_config(
        self,
        payload: Dict[str, Any] = Body(default_factory=dict),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """保存并立即生效插件配置。"""
        merged = self._merge_config(payload)
        self.update_config(merged)
        self.init_plugin(merged)
        return schemas.Response(success=True, message="配置已保存", data=copy.deepcopy(self._config))

    def api_test_connection(
        self,
        payload: Dict[str, Any] = Body(default_factory=dict),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """使用表单参数或当前配置测试 MediaVault 连通性。"""
        mv_url = payload.get("mv_url") if payload.get("mv_url") is not None else self._config.get("mv_url")
        mv_api_key = payload.get("mv_api_key") if payload.get("mv_api_key") is not None else self._config.get("mv_api_key")
        timeout = int(payload.get("timeout") or self._config.get("timeout") or 10)
        ok, msg, data = self._build_client(mv_url=mv_url, mv_api_key=mv_api_key, timeout=timeout).test_connection()
        return schemas.Response(success=ok, message=msg, data=data)

    def api_overview(
        self,
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """聚合 MediaVault 运行状态、今日上传、STRM 与 Emby 后处理概览。"""
        client = self._build_client()
        if not client.is_configured():
            return schemas.Response(
                success=True,
                data={
                    "configured": False,
                    "connected": False,
                    "error": "尚未配置 MediaVault 服务地址与 API Key",
                    "config": copy.deepcopy(self._config),
                },
            )

        errors: List[str] = []
        health: Dict[str, Any] = {}
        today_upload: Dict[str, Any] = {}
        strm_stats: Dict[str, Any] = {}
        strm_gen_status: Dict[str, Any] = {}
        drives: List[Dict[str, Any]] = []
        emby_mediainfo: Dict[str, Any] = {}
        emby_thumbnail: Dict[str, Any] = {}
        emby_intro_skip: Dict[str, Any] = {}
        orphan_status: Dict[str, Any] = {}
        suggested_path_pairs: List[Dict[str, Any]] = []

        def _safe(label: str, fn):
            try:
                return fn()
            except Exception as err:
                errors.append(f"{label}: {err}")
                return {}

        health = _safe("健康检查", client.health)
        connected = bool(health.get("status") == "ok" or health.get("version"))
        if connected:
            today_upload = _safe("今日上传", client.today_upload)
            strm_stats = _safe("STRM统计", client.strm_stats)
            strm_gen_status = _safe("STRM状态", client.strm_generate_status)
            cd = _safe("云盘实例", client.cloud_drives)
            drives = cd.get("instances") if isinstance(cd, dict) else []
            emby_mediainfo = _safe("Emby MediaInfo", client.emby_mediainfo_status)
            emby_thumbnail = _safe("Emby 缩略图", client.emby_thumbnail_status)
            emby_intro_skip = _safe("Emby 片头检测", client.emby_intro_skip_status)
            orphan_status = _safe(
                "孤立索引",
                lambda: client.orphan_index_status(
                    storage=str(self._config.get("default_storage") or "115-default")
                ),
            )
            mc = _safe("监控规则", client.monitor_config)
            seen_pairs = set()
            for rule in (mc.get("rules") if isinstance(mc, dict) else []) or []:
                if not isinstance(rule, dict):
                    continue
                cloud_dir = str(rule.get("target_dir") or "").strip()
                strm_dir = str(rule.get("strm_dir") or "").strip()
                if not rule.get("enabled") or not cloud_dir:
                    continue
                pair_key = (cloud_dir, strm_dir)
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)
                label = str(rule.get("name") or "").strip() or (
                    cloud_dir.rsplit("/", 1)[-1] if "/" in cloud_dir.strip("/") else "全库"
                )
                suggested_path_pairs.append(
                    {
                        "id": f"mv_{len(suggested_path_pairs) + 1}",
                        "name": label,
                        "source_dir": cloud_dir,
                        "target_dir": strm_dir,
                        "storage": str(rule.get("target_storage") or self._config.get("default_storage") or "115-default"),
                        "auto": True,
                    }
                )

        return schemas.Response(
            success=True,
            data={
                "configured": True,
                "connected": connected,
                "errors": errors,
                "health": health,
                "today_upload": today_upload,
                "strm_stats": strm_stats,
                "strm_gen_status": strm_gen_status,
                "drives": drives or [],
                "emby": {
                    "mediainfo": emby_mediainfo.get("stats") if isinstance(emby_mediainfo, dict) else {},
                    "thumbnail": emby_thumbnail.get("stats") if isinstance(emby_thumbnail, dict) else {},
                    "intro_skip": emby_intro_skip.get("stats") if isinstance(emby_intro_skip, dict) else {},
                },
                "orphan_status": orphan_status,
                "suggested_path_pairs": suggested_path_pairs,
                "config": copy.deepcopy(self._config),
            },
        )

    def api_failed_uploads(
        self,
        page: int = 1,
        page_size: int = 50,
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """获取 MediaVault 失败的监控上传事件，并附加智能重试分类与计数。"""
        client = self._build_client()
        if not client.is_configured():
            return schemas.Response(success=False, message="请先配置 MediaVault 地址与 API Key")
        try:
            ur = self._config.get("upload_retry") or {}
            skip_regex = str(ur.get("skip_keywords_regex") or "")
            clear_attempts = bool(ur.get("clear_attempts_before_retry", True))
            res = client.monitor_events(status="failed", page=page, page_size=page_size)
            raw_items = res.get("items") if isinstance(res, dict) else []
            if not isinstance(raw_items, list):
                raw_items = []
            tracker = self._get_retry_tracker()

            enriched_items: List[Dict[str, Any]] = []
            for ev in raw_items:
                category, reason = classify_failed_event(
                    ev,
                    skip_regex=skip_regex,
                    clear_attempts_before_retry=clear_attempts,
                )
                rec = tracker.get(str(ev.get("id"))) or {}
                enriched_items.append(
                    {
                        **ev,
                        "retry_category": category,
                        "retry_reason": reason,
                        "auto_attempts": int(rec.get("attempts") or 0),
                    }
                )

            upload_rec = client.upload_records(status="failed", page=1, page_size=20)
            return schemas.Response(
                success=True,
                data={
                    "items": enriched_items,
                    "total": int(res.get("total") or len(enriched_items)) if isinstance(res, dict) else len(enriched_items),
                    "upload_records": (upload_rec.get("items") if isinstance(upload_rec, dict) else []) or [],
                },
            )
        except Exception as err:
            return schemas.Response(success=False, message=str(err))

    def api_retry_uploads(
        self,
        payload: Dict[str, Any] = Body(default_factory=dict),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """手动触发单条、批量或自动策略重试 115 上传失败任务。"""
        client = self._build_client()
        if not client.is_configured():
            return schemas.Response(success=False, message="请先配置 MediaVault 地址与 API Key")
        try:
            mode = str(payload.get("mode") or "ids")
            force = bool(payload.get("force", False))
            clear_attempts = bool(payload.get("clear_attempts", False))
            ur = self._config.get("upload_retry") or {}
            attempts_dir = str(ur.get("attempts_dir") or "/opt/config/offline115-attempts")

            if mode == "auto":
                result = self.run_upload_retry_cycle(source="manual_auto")
                return schemas.Response(
                    success=bool(result.get("success")),
                    message=result.get("message") or f"已重试 {result.get('retried_count', 0)} 项",
                    data=result,
                )

            event_ids = payload.get("event_ids") or []
            if not isinstance(event_ids, list) or not event_ids:
                return schemas.Response(success=False, message="请选择至少一条失败任务")

            cleared_count = 0
            if clear_attempts:
                clear_res = client.clear_offline115_attempts(attempts_dir=attempts_dir)
                cleared_count = int(clear_res.get("deleted") or 0)

            ids_int = [int(x) for x in event_ids]
            if len(ids_int) == 1:
                resp = client.retry_monitor_event(ids_int[0], force=force)
            else:
                resp = client.batch_retry_monitor_events(ids_int, force=force)

            clear_note = f"（清理 {cleared_count} 个锁文件）" if clear_attempts else ""
            self._append_log(
                "upload_retry",
                "success",
                f"手动{'强制' if force else ''}重试 {len(ids_int)} 条 115 上传任务{clear_note}",
                f"event_ids={ids_int}",
            )
            return schemas.Response(
                success=True,
                message=f"已提交 {len(ids_int)} 条任务重试{clear_note}",
                data=resp,
            )
        except Exception as err:
            self._append_log("upload_retry", "error", "手动重试上传任务失败", str(err))
            return schemas.Response(success=False, message=str(err))

    def api_save_quick_paths(
        self,
        payload: Dict[str, Any] = Body(default_factory=dict),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """保存用户自定义的常用运维路径对列表。"""
        pairs = payload.get("quick_path_pairs")
        if not isinstance(pairs, list):
            return schemas.Response(success=False, message="quick_path_pairs 参数格式无效")
        next_cfg = copy.deepcopy(self._config)
        next_cfg["quick_path_pairs"] = pairs
        merged = self._merge_config(next_cfg)
        self.update_config(merged)
        self._config = merged
        return schemas.Response(
            success=True,
            message="常用路径对已保存",
            data=copy.deepcopy(merged["quick_path_pairs"]),
        )

    def api_trigger_action(
        self,
        payload: Dict[str, Any] = Body(default_factory=dict),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """统一执行前端一键运维操作（监控同步、STRM、刮削、清理、Emby 后处理）。"""
        client = self._build_client()
        if not client.is_configured():
            return schemas.Response(success=False, message="请先配置 MediaVault 地址与 API Key")

        action = str(payload.get("action") or "").strip()
        storage = str(payload.get("storage") or self._config.get("default_storage") or "115-default")
        emby_slug = str(payload.get("server_slug") or self._config.get("default_emby_slug") or "emby-default")
        source_dir = str(payload.get("source_dir") or "").strip()
        target_dir = str(payload.get("target_dir") or "").strip()

        try:
            if action == "monitor_sync":
                res = client.trigger_monitor_sync(rule_idx=-1, full=bool(payload.get("full", False)))
                label = "目录监控同步"
            elif action == "strm_generate":
                if not source_dir:
                    rules = self._mapping_rules()
                    if rules:
                        source_dir = rules[0].mv_cloud_prefix
                        target_dir = target_dir or rules[0].mv_strm_prefix
                if not source_dir:
                    return schemas.Response(success=False, message="请填写云盘源目录或先配置路径映射")
                res = client.strm_generate(
                    source_dir=source_dir,
                    target_dir=target_dir,
                    cloud=storage,
                    overwrite=bool(payload.get("overwrite", False)),
                )
                label = f"增量 STRM 生成 ({source_dir})"
            elif action == "scrape":
                if not target_dir:
                    return schemas.Response(success=False, message="请填写需要刮削的目录路径")
                res = client.scrape_directory(target_dir=target_dir, overwrite=bool(payload.get("overwrite", False)))
                label = f"目录刮削 ({target_dir})"
            elif action == "cleanup_scan":
                res = client.strm_cleanup_scan(strm_dir=target_dir, cloud_dir=source_dir, storage=storage)
                label = "失效 STRM 清理扫描"
            elif action == "orphan_scan":
                res = client.orphan_index_scan(storage=storage, path=source_dir)
                label = "网盘孤立索引扫描"
            elif action == "emby_mediainfo":
                res = client.emby_mediainfo_run(scope=str(payload.get("scope") or "missing"))
                label = "Emby MediaInfo 提取"
            elif action == "emby_mediainfo_retry":
                res = client.emby_mediainfo_retry()
                label = "Emby MediaInfo 失败重试"
            elif action == "emby_thumbnail":
                res = client.emby_thumbnail_run(scope=str(payload.get("scope") or "missing"))
                label = "Emby 缩略图生成"
            elif action == "emby_thumbnail_retry":
                res = client.emby_thumbnail_retry()
                label = "Emby 缩略图失败重试"
            elif action == "clear_115_attempts":
                ur = self._config.get("upload_retry") or {}
                attempts_dir = str(
                    payload.get("attempts_dir") or ur.get("attempts_dir") or "/opt/config/offline115-attempts"
                )
                res = client.clear_offline115_attempts(attempts_dir=attempts_dir)
                label = f"清理 115 尝试锁（已删除 {res.get('deleted', 0)} 个 JSON）"
            elif action == "emby_intro_skip":
                res = client.emby_intro_skip_detect(server_slug=emby_slug, only_missing=True)
                label = "Emby 片头片尾检测"
            else:
                return schemas.Response(success=False, message=f"未知操作类型: {action}")

            self._append_log("manual_action", "success", f"手动触发：{label}", str(res)[:300])
            return schemas.Response(success=True, message=f"已触发{label}", data=res)
        except Exception as err:
            self._append_log("manual_action", "error", f"手动触发失败：{action}", str(err))
            return schemas.Response(success=False, message=str(err))

    def api_share_parse(
        self,
        payload: Dict[str, Any] = Body(default_factory=dict),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """解析 115 分享链接。"""
        share_url = str(payload.get("share_url") or "").strip()
        if not share_url:
            return schemas.Response(success=False, message="请输入 115 分享链接")
        try:
            data = self._build_client().share_parse(share_url)
            return schemas.Response(success=True, data=data)
        except Exception as err:
            return schemas.Response(success=False, message=str(err))

    def api_share_receive(
        self,
        payload: Dict[str, Any] = Body(default_factory=dict),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """执行 115 分享链接转存。"""
        share_url = str(payload.get("share_url") or "").strip()
        if not share_url:
            return schemas.Response(success=False, message="请输入 115 分享链接")
        st = self._config.get("share_transfer") or {}
        storage = str(payload.get("storage") or self._config.get("default_storage") or "115-default")
        target_path = str(
            payload.get("target_path")
            if payload.get("target_path") is not None
            else st.get("default_target_path") or ""
        ).strip()
        receive_code = str(payload.get("receive_code") or "").strip()
        try:
            data = self._build_client().share_receive(
                share_url=share_url,
                target_path=target_path,
                storage=storage,
                receive_code=receive_code,
            )
            self._append_log(
                "share_transfer",
                "success",
                "前端转存 115 分享链接成功",
                f"{share_url} -> {target_path or '默认目录'}",
            )
            return schemas.Response(success=True, message="已提交 115 分享转存", data=data)
        except Exception as err:
            self._append_log("share_transfer", "error", "前端转存 115 分享链接失败", str(err))
            return schemas.Response(success=False, message=str(err))

    def api_share_records(
        self,
        page: int = 1,
        page_size: int = 20,
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """查询 MediaVault 最近 115 分享转存记录。"""
        client = self._build_client()
        if not client.is_configured():
            return schemas.Response(success=True, data={"items": []})
        try:
            data = client.share_records(page=page, page_size=page_size)
            return schemas.Response(success=True, data=data)
        except Exception as err:
            return schemas.Response(success=False, message=str(err))

    def api_get_logs(
        self,
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """获取联动执行历史日志。"""
        logs = self.get_data("logs") or []
        return schemas.Response(success=True, data=logs if isinstance(logs, list) else [])

    def api_clear_logs(
        self,
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """清空联动执行历史日志。"""
        self.save_data("logs", [])
        return schemas.Response(success=True, message="联动日志已清空")
