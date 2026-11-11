"""MoviePilot V2 保种删种管家插件。"""
import copy
import re
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi import Body, Depends

from app import schemas
from app.db.models.user import User
from app.db.transferhistory_oper import TransferHistoryOper
from app.db.user_oper import get_current_admin
from app.helper.downloader import DownloaderHelper
from app.log import logger
from app.plugins import _PluginBase
from app.plugins.seedcleaner.engine import CleanEngine, CleanRule, GIB
from app.schemas.types import NotificationType
from app.utils.system import SystemUtils


DEFAULT_CONFIG: Dict[str, Any] = {
    "enabled": False,
    "cron": "*/30 * * * *",
    "notify": True,
    "protect_tags": ["保种", "辅种", "勿删", "keep"],
    "global_exclude_regex": "",
    "only_completed": True,
    "rules": [],
    "disk_guard": {
        "enabled": False,
        "free_space_threshold_gb": 50,
        "target_free_space_gb": 100,
        "min_protect_hours": 72,
        "sort_by": "oldest_seeding",
        "delete_files": True,
    },
}

PRESET_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "ratio_or_time",
        "name": "达标清理",
        "description": "分享率达到 2 或做种满 72 小时，且已经整理入库后清理。",
        "rule": {
            "id": "preset_ratio_or_time",
            "name": "达标清理（率或时）",
            "enabled": True,
            "metric_logic": "any",
            "min_ratio": 2,
            "min_seeding_hours": 72,
            "states": ["seeding", "paused", "stalled"],
            "require_transferred": True,
            "delete_files": True,
        },
    },
    {
        "id": "unregistered",
        "name": "站点注销红种清理",
        "description": "匹配 Tracker 注销、删除或封禁消息，允许清理未完成且未入库的死种。",
        "rule": {
            "id": "preset_unregistered",
            "name": "站点注销红种",
            "enabled": True,
            "tracker_msg_regex": (
                "unregistered|not registered|torrent not found|deleted|banned|不存在|已删除"
            ),
            "states": ["seeding", "paused", "stalled", "error", "other"],
            "require_transferred": False,
            "allow_incomplete": True,
            "delete_files": True,
        },
    },
    {
        "id": "cold_large",
        "name": "冷门大包淘汰",
        "description": "添加满 7 天、体积至少 20GB 且上传不高于 10KB/s 的已入库冷种。",
        "rule": {
            "id": "preset_cold_large",
            "name": "冷门大包淘汰",
            "enabled": True,
            "min_added_hours": 168,
            "min_size_gb": 20,
            "max_upspeed_kbps": 10,
            "states": ["seeding", "paused", "stalled"],
            "require_transferred": True,
            "delete_files": True,
        },
    },
    {
        "id": "official_exclude",
        "name": "官组正则排除示例",
        "description": "分享率达标时清理，但保留 HDArea、EPiC、WiKi、FRDS 官组种子。",
        "rule": {
            "id": "preset_official_exclude",
            "name": "达标清理（排除官组）",
            "enabled": True,
            "min_ratio": 2,
            "exclude_name_regex": "-(HDArea|EPiC|WiKi|FRDS)$",
            "states": ["seeding", "paused", "stalled"],
            "require_transferred": True,
            "delete_files": True,
        },
    },
]


def _normalize_tags(values: Any) -> List[str]:
    """归一化全局保护标签并去除空项与重复项。"""
    if isinstance(values, str):
        raw_items = re.split(r"[,，\n]", values)
    elif isinstance(values, (list, tuple, set)):
        raw_items = list(values)
    else:
        raw_items = []
    result: List[str] = []
    for item in raw_items:
        text = str(item or "").strip()
        if text and text not in result:
            result.append(text)
    return result


class SeedCleaner(_PluginBase):
    """按多维规则、正则表达式和磁盘水位安全管理下载器保种与删种。"""

    plugin_name = "保种删种管家"
    plugin_desc = "多维条件与正则清理规则、模拟干跑、磁盘低水位应急保盘，支持 qBittorrent 与 Transmission。"
    plugin_icon = "clean.png"
    plugin_version = "1.0.0"
    plugin_author = "4Nest"
    author_url = "https://github.com/4Nest"
    plugin_label = "下载器,保种,清理"
    plugin_config_prefix = "seedcleaner_"
    plugin_order = 20
    auth_level = 1

    def __init__(self) -> None:
        """初始化插件依赖与防止并发清理的运行锁。"""
        super().__init__()
        self._enabled = False
        self._config = copy.deepcopy(DEFAULT_CONFIG)
        self._run_lock = threading.Lock()
        self._downloader_helper = DownloaderHelper()
        self._transfer_oper = TransferHistoryOper()

    def init_plugin(self, config: dict = None) -> None:
        """合并并规范化插件配置，不隐式开启危险清理。"""
        merged = copy.deepcopy(DEFAULT_CONFIG)
        if isinstance(config, dict):
            merged.update(config)
        merged["enabled"] = bool(merged.get("enabled", False))
        merged["cron"] = str(merged.get("cron") or "*/30 * * * *").strip()
        merged["notify"] = bool(merged.get("notify", True))
        merged["protect_tags"] = _normalize_tags(merged.get("protect_tags"))
        merged["global_exclude_regex"] = str(merged.get("global_exclude_regex") or "")
        merged["only_completed"] = bool(merged.get("only_completed", True))
        rules: List[Dict[str, Any]] = []
        for index, item in enumerate(merged.get("rules") or []):
            if not isinstance(item, dict):
                continue
            rule = CleanRule.from_dict(item)
            if not rule.id:
                rule.id = f"rule_{index + 1}"
            rules.append(rule.to_dict())
        merged["rules"] = rules
        guard = copy.deepcopy(DEFAULT_CONFIG["disk_guard"])
        if isinstance(merged.get("disk_guard"), dict):
            guard.update(merged["disk_guard"])
        merged["disk_guard"] = guard
        self._config = merged
        self._enabled = merged["enabled"]

    def get_state(self) -> bool:
        """获取插件启用状态。"""
        return self._enabled

    @staticmethod
    def get_render_mode() -> Tuple[str, Optional[str]]:
        """声明使用 Vue 模块联邦渲染。"""
        return "vue", "dist/assets"

    def get_sidebar_nav(self) -> List[Dict[str, Any]]:
        """启用时在整理分组注册保种管家全页入口。"""
        if not self._enabled:
            return []
        return [
            {
                "nav_key": "main",
                "title": "保种管家",
                "icon": "mdi-broom",
                "section": "organize",
                "permission": "manage",
                "order": 20,
            }
        ]

    @staticmethod
    def get_command() -> List[Dict[str, Any]]:
        """插件不提供远程命令。"""
        return []

    def get_service(self) -> List[Dict[str, Any]]:
        """按配置 Cron 注册定时巡检服务，非法表达式安全停用。"""
        if not self._enabled or not self._config.get("cron"):
            return []
        try:
            from apscheduler.triggers.cron import CronTrigger

            trigger = CronTrigger.from_crontab(self._config["cron"])
        except Exception as err:
            logger.error(f"保种删种管家 Cron 配置无效：{err}")
            return []
        return [
            {
                "id": "SeedCleanerInspect",
                "name": "保种删种管家定时巡检",
                "trigger": trigger,
                "func": self.run_cleanup,
                "kwargs": {},
            }
        ]

    def get_form(self) -> Tuple[Optional[List[dict]], Dict[str, Any]]:
        """返回 Vue 配置组件使用的默认配置。"""
        return None, copy.deepcopy(DEFAULT_CONFIG)

    def get_page(self) -> Optional[List[dict]]:
        """详情页由联邦 Page 组件渲染。"""
        return None

    def stop_service(self) -> None:
        """释放插件资源；周期任务由宿主调度器统一注销。"""
        return None

    def get_api(self) -> List[Dict[str, Any]]:
        """注册配置、概况、模板、正则测试、干跑、执行及历史接口。"""
        definitions = [
            ("/config", self.api_config, ["GET"], "获取保种管家配置"),
            ("/config", self.api_save_config, ["POST"], "保存保种管家配置"),
            ("/overview", self.api_overview, ["GET"], "获取下载器磁盘与做种概况"),
            ("/templates", self.api_templates, ["GET"], "获取内置规则模板"),
            ("/templates/import", self.api_import_templates, ["POST"], "导入内置规则模板"),
            ("/regex/test", self.api_regex_test, ["POST"], "在线测试正则表达式"),
            ("/dry-run", self.api_dry_run, ["POST"], "模拟干跑清理预览"),
            ("/run", self.api_run, ["POST"], "立即执行清理"),
            ("/history", self.api_history, ["GET"], "查询最近清理历史"),
            ("/history", self.api_clear_history, ["DELETE"], "清空清理历史"),
        ]
        return [
            {
                "path": path,
                "endpoint": endpoint,
                "methods": methods,
                "auth": "bear",
                "summary": summary,
            }
            for path, endpoint, methods, summary in definitions
        ]

    def api_config(self, _: User = Depends(get_current_admin)) -> schemas.Response:
        """返回当前完整插件配置。"""
        return schemas.Response(success=True, data=copy.deepcopy(self._config))

    def api_save_config(
        self,
        payload: dict = Body(...),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """校验并保存前端提交的配置。"""
        if not isinstance(payload, dict):
            return schemas.Response(success=False, message="配置格式不正确")
        self.init_plugin(payload)
        self.update_config(copy.deepcopy(self._config))
        return schemas.Response(
            success=True,
            message="保种管家配置已保存",
            data=copy.deepcopy(self._config),
        )

    @staticmethod
    def _info_optional(info: Any, *keys: str) -> Optional[float]:
        """提取可空数值，保留下载器明确返回的零剩余空间。"""
        for key in keys:
            value = info.get(key) if isinstance(info, dict) else getattr(info, key, None)
            if value is not None:
                try:
                    return float(value)
                except (TypeError, ValueError):
                    return None
        return None

    @staticmethod
    def _info_value(info: Any, *keys: str) -> float:
        """从字典或传输信息对象中提取数值，缺失时返回零。"""
        return SeedCleaner._info_optional(info, *keys) or 0.0

    def _transfer_info(self, instance: Any) -> Any:
        """兼容下载器的 get_transfer_info 与 transfer_info 接口。"""
        for method_name in ("get_transfer_info", "transfer_info"):
            method = getattr(instance, method_name, None)
            if callable(method):
                try:
                    return method() or {}
                except Exception as err:
                    logger.warning(f"读取下载器传输信息失败：{err}")
                    return {}
        return {}

    def _disk_space(self, info: Any, save_paths: List[str]) -> Tuple[Optional[float], Optional[float]]:
        """优先读取下载器空间信息，缺失时从可访问的本地保存路径计算。"""
        free = self._info_optional(info, "free_space", "free_space_on_disk", "freeSpace", "free")
        total = self._info_optional(info, "total_space", "totalSpace", "total")
        if free is not None:
            return max(0.0, free), max(0.0, total) if total is not None else None
        existing_paths = [Path(path) for path in dict.fromkeys(save_paths) if path and Path(path).exists()]
        if not existing_paths:
            return None, None
        try:
            total_bytes, free_bytes = SystemUtils.space_usage(existing_paths)
            return free_bytes, total_bytes
        except Exception as err:
            logger.warning(f"计算下载目录剩余空间失败：{err}")
            return None, None

    def _is_transferred(self, torrent_hash: str, save_path: str) -> bool:
        """通过成功整理历史的 Hash 或精确保存路径判定入库安全锁。"""
        try:
            if torrent_hash:
                histories = self._transfer_oper.list_by_hash(torrent_hash) or []
                if any(bool(getattr(item, "status", False)) for item in histories):
                    return True
            if save_path:
                return bool(
                    self._transfer_oper.list_success_by_src(
                        src=save_path, recursive=False
                    )
                    or []
                )
        except Exception as err:
            logger.warning(f"查询种子整理历史失败 ({torrent_hash})：{err}")
        return False

    def _collect_snapshots(self) -> Tuple[Dict[str, Dict[str, Any]], Dict[str, Any], List[str]]:
        """采集所有已配置 qBittorrent/Transmission 的种子与磁盘快照。"""
        snapshots: Dict[str, Dict[str, Any]] = {}
        instances: Dict[str, Any] = {}
        errors: List[str] = []
        try:
            services = self._downloader_helper.get_services() or {}
        except Exception as err:
            return {}, {}, [f"获取下载器列表失败：{err}"]
        engine = CleanEngine(self._config)
        for name, service in services.items():
            service_type = str(getattr(service, "type", "") or "").lower()
            instance = getattr(service, "instance", None)
            if service_type not in {"qbittorrent", "transmission"} or not instance:
                continue
            instances[name] = instance
            try:
                torrents_result = instance.get_torrents()
                raw_torrents, has_error = (
                    torrents_result
                    if isinstance(torrents_result, tuple)
                    else (torrents_result, False)
                )
                if has_error:
                    errors.append(f"下载器 {name} 获取种子失败")
                    continue
                torrents = [
                    engine.normalize_torrent(raw, name, self._is_transferred)
                    for raw in raw_torrents or []
                ]
                info = self._transfer_info(instance)
                free_space, total_space = self._disk_space(
                    info, [torrent.save_path for torrent in torrents]
                )
                snapshots[name] = {
                    "torrents": torrents,
                    "free_space": free_space,
                    "total_space": total_space,
                    "type": service_type,
                    "download_speed": self._info_value(
                        info, "dl_info_speed", "downloadSpeed", "download_speed"
                    ),
                    "upload_speed": self._info_value(
                        info, "up_info_speed", "uploadSpeed", "upload_speed"
                    ),
                }
            except Exception as err:
                logger.error(f"保种管家采集下载器 {name} 失败：{err}")
                errors.append(f"下载器 {name} 采集失败：{err}")
        return snapshots, instances, errors

    @staticmethod
    def _overview_items(snapshots: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """把内部快照转换为前端下载器概况卡片。"""
        items: List[Dict[str, Any]] = []
        for name, snapshot in snapshots.items():
            torrents = snapshot.get("torrents", [])
            free_space = snapshot.get("free_space")
            total_space = snapshot.get("total_space")
            items.append(
                {
                    "name": name,
                    "type": snapshot.get("type"),
                    "torrent_count": len(torrents),
                    "seeding_count": sum(
                        torrent.state in {"seeding", "stalled", "paused"} for torrent in torrents
                    ),
                    "total_size": sum(torrent.size for torrent in torrents),
                    "total_size_gb": round(sum(torrent.size for torrent in torrents) / GIB, 2),
                    "free_space": free_space,
                    "free_space_gb": round(free_space / GIB, 2) if free_space is not None else None,
                    "total_space": total_space,
                    "total_space_gb": round(total_space / GIB, 2) if total_space is not None else None,
                    "download_speed": snapshot.get("download_speed", 0),
                    "upload_speed": snapshot.get("upload_speed", 0),
                    "low_space": bool(
                        free_space is not None
                        and free_space
                        < float(snapshot.get("threshold_gb", 0) or 0) * GIB
                    ),
                }
            )
        return items

    def api_overview(self, _: User = Depends(get_current_admin)) -> schemas.Response:
        """返回下载器实时磁盘空间、速度和做种统计。"""
        snapshots, _, errors = self._collect_snapshots()
        guard = self._config.get("disk_guard", {})
        for snapshot in snapshots.values():
            snapshot["threshold_gb"] = guard.get("free_space_threshold_gb", 0)
        return schemas.Response(
            success=True,
            data={"downloaders": self._overview_items(snapshots), "errors": errors},
        )

    def run_cleanup(self, dry_run: bool = False) -> Dict[str, Any]:
        """执行一次完整巡检；干跑只返回计划，真删才执行并记录历史。"""
        if not self._run_lock.acquire(blocking=False):
            return {
                "success": False,
                "dry_run": dry_run,
                "message": "已有一次清理任务正在执行",
                "candidates": [],
                "deleted": [],
                "failed": [],
                "errors": [],
            }
        try:
            snapshots, instances, collection_errors = self._collect_snapshots()
            engine = CleanEngine(self._config)
            plan = engine.plan(snapshots)
            plan.errors = collection_errors + plan.errors
            if any("非法正则" in error for error in plan.errors):
                result = plan.to_dict()
                result.update(
                    {
                        "success": False,
                        "dry_run": dry_run,
                        "deleted": [],
                        "failed": [],
                        "message": "存在非法正则，已停止本次清理",
                    }
                )
                return result

            def delete_torrent(downloader: str, torrent_hash: str, delete_files: bool) -> bool:
                """调用对应下载器删除指定种子，可选择是否删除源文件。"""
                instance = instances.get(downloader)
                if not instance:
                    return False
                return bool(instance.delete_torrents(delete_file=delete_files, ids=torrent_hash))

            result = engine.execute(plan, delete_torrent, dry_run=dry_run)
            result["success"] = True
            result["message"] = (
                f"干跑预览：命中 {len(result['candidates'])} 个种子"
                if dry_run
                else f"清理完成：成功 {len(result['deleted'])}，失败 {len(result['failed'])}"
            )
            if not dry_run and (result["deleted"] or result["failed"]):
                self._record_history(result)
            if not dry_run and result["deleted"] and self._config.get("notify", True):
                self._notify_result(result)
            return result
        except Exception as err:
            logger.error(f"保种删种管家巡检失败：{err}")
            return {
                "success": False,
                "dry_run": dry_run,
                "message": f"巡检失败：{err}",
                "candidates": [],
                "deleted": [],
                "failed": [],
                "errors": [str(err)],
            }
        finally:
            self._run_lock.release()

    def _record_history(self, result: Dict[str, Any]) -> None:
        """将本轮成功与失败记录合并到最近 200 条持久化历史。"""
        current = self.get_data("history") or []
        if not isinstance(current, list):
            current = []
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        entries: List[Dict[str, Any]] = []
        for status, key in (("success", "deleted"), ("failed", "failed")):
            for item in result.get(key, []):
                entries.append({"time": timestamp, "status": status, **item})
        self.save_data("history", (entries + current)[:200])

    def _notify_result(self, result: Dict[str, Any]) -> None:
        """推送只包含数量、体积、失败数和规则摘要的清理通知。"""
        deleted = result.get("deleted", [])
        size_gb = sum(float(item.get("size") or 0) for item in deleted) / GIB
        rule_summary: Dict[str, int] = {}
        for item in deleted:
            name = str(item.get("rule_name") or "未知规则")
            rule_summary[name] = rule_summary.get(name, 0) + 1
        rules_text = "；".join(f"{name} {count} 项" for name, count in rule_summary.items())
        text = (
            f"成功清理 {len(deleted)} 个种子，释放约 {size_gb:.2f}GB；"
            f"失败 {len(result.get('failed', []))} 个。\n{rules_text}"
        )
        self.post_message(
            mtype=NotificationType.Plugin,
            title="保种删种管家清理报告",
            text=text,
        )

    def api_dry_run(self, _: User = Depends(get_current_admin)) -> schemas.Response:
        """返回不会调用下载器删除接口的模拟干跑结果。"""
        result = self.run_cleanup(dry_run=True)
        return schemas.Response(
            success=result.get("success", False),
            message=result.get("message"),
            data=result,
        )

    def api_run(self, _: User = Depends(get_current_admin)) -> schemas.Response:
        """立即执行真实清理并返回逐项结果。"""
        result = self.run_cleanup(dry_run=False)
        return schemas.Response(
            success=result.get("success", False),
            message=result.get("message"),
            data=result,
        )

    def api_history(self, _: User = Depends(get_current_admin)) -> schemas.Response:
        """查询按时间倒序保存的最近清理历史。"""
        history = self.get_data("history") or []
        return schemas.Response(success=True, data=history if isinstance(history, list) else [])

    def api_clear_history(self, _: User = Depends(get_current_admin)) -> schemas.Response:
        """清空插件持久化清理历史。"""
        self.save_data("history", [])
        return schemas.Response(success=True, message="清理历史已清空", data=[])

    def api_templates(self, _: User = Depends(get_current_admin)) -> schemas.Response:
        """返回四个内置高频清理规则模板。"""
        return schemas.Response(success=True, data=copy.deepcopy(PRESET_TEMPLATES))

    def api_import_templates(
        self,
        payload: dict = Body(...),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """按模板 ID 一键导入规则，已存在的模板规则不会重复添加。"""
        requested = payload.get("ids") or ([payload.get("id")] if payload.get("id") else [])
        requested_ids = {str(item) for item in requested}
        if not requested_ids:
            return schemas.Response(success=False, message="请选择要导入的规则模板")
        config = copy.deepcopy(self._config)
        rules = config.get("rules", [])
        existing_ids = {str(rule.get("id")) for rule in rules}
        imported: List[str] = []
        for template in PRESET_TEMPLATES:
            if template["id"] not in requested_ids:
                continue
            rule = copy.deepcopy(template["rule"])
            if rule["id"] in existing_ids:
                continue
            rules.append(rule)
            existing_ids.add(rule["id"])
            imported.append(template["name"])
        if not imported:
            return schemas.Response(success=False, message="所选模板不存在或已导入", data=config)
        config["rules"] = rules
        self.init_plugin(config)
        self.update_config(copy.deepcopy(self._config))
        return schemas.Response(
            success=True,
            message=f"已导入：{'、'.join(imported)}",
            data=copy.deepcopy(self._config),
        )

    def api_regex_test(
        self,
        payload: dict = Body(...),
        _: User = Depends(get_current_admin),
    ) -> schemas.Response:
        """在线安全测试大小写不敏感正则并返回匹配片段与错误。"""
        pattern = str((payload or {}).get("pattern") or "")
        text = str((payload or {}).get("text") or "")
        if not pattern:
            return schemas.Response(success=False, message="请输入正则表达式")
        try:
            match = re.search(pattern, text, re.IGNORECASE)
        except re.error as err:
            return schemas.Response(
                success=True,
                data={"valid": False, "matched": False, "error": str(err)},
            )
        return schemas.Response(
            success=True,
            data={
                "valid": True,
                "matched": bool(match),
                "match": match.group(0) if match else "",
                "groups": list(match.groups()) if match else [],
                "error": "",
            },
        )
