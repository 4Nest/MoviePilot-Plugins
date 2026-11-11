"""保种删种管家的统一种子快照、规则匹配与安全清理引擎。"""
import re
import time
from dataclasses import asdict, dataclass, fields
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple
from urllib.parse import urlparse


GIB = 1024**3
DISK_GUARD_RULE_ID = "__disk_guard__"


def _string_list(values: Any) -> List[str]:
    """将逗号文本或序列归一化为去重字符串列表。"""
    if isinstance(values, str):
        items = re.split(r"[,，\n]", values)
    elif isinstance(values, (list, tuple, set)):
        items = list(values)
    else:
        return []
    result: List[str] = []
    for item in items:
        text = str(item or "").strip()
        if text and text not in result:
            result.append(text)
    return result


def _optional_float(value: Any) -> Optional[float]:
    """把可空配置值安全转换为浮点数。"""
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _boolean(value: Any, default: bool = False) -> bool:
    """兼容 JSON 布尔值与常见字符串布尔值。"""
    if value is None:
        return default
    if isinstance(value, str):
        return value.strip().lower() not in {"", "0", "false", "no", "off", "否"}
    return bool(value)


def _value(item: Any, *names: str, default: Any = None) -> Any:
    """从字典或下载器对象中读取首个非空字段。"""
    for name in names:
        if isinstance(item, dict):
            value = item.get(name)
        else:
            value = getattr(item, name, None)
        if value is not None:
            return value
    return default


def _number(value: Any, default: float = 0.0) -> float:
    """把下载器数值安全转换为浮点数。"""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _epoch_seconds(value: Any) -> float:
    """提取可能为 datetime 或 Unix 时间戳的秒数。"""
    if hasattr(value, "timestamp"):
        try:
            return float(value.timestamp())
        except (TypeError, ValueError, OSError):
            return 0.0
    return _number(value)


@dataclass
class NormalizedTorrent:
    """qBittorrent 与 Transmission 共用的种子安全决策快照。"""

    downloader: str
    hash: str
    name: str
    save_path: str
    size: int
    ratio: float
    seeding_seconds: int
    added_seconds: int
    upspeed: float
    dlspeed: float
    progress: float
    state: str
    category: str
    tags: List[str]
    tracker: str
    tracker_msg: str
    is_transferred: bool

    def to_dict(self) -> Dict[str, Any]:
        """转换为可供 REST API 返回的字典。"""
        return asdict(self)


@dataclass
class CleanRule:
    """一条有序、多维且支持正则表达式的清理规则。"""

    id: str = ""
    name: str = "未命名规则"
    enabled: bool = True
    downloaders: List[str] = None
    delete_files: bool = True
    require_transferred: bool = True
    allow_incomplete: bool = False
    max_delete_per_run: int = 0
    metric_logic: str = "all"
    name_regex: str = ""
    exclude_name_regex: str = ""
    save_path_regex: str = ""
    exclude_save_path_regex: str = ""
    tracker_regex: str = ""
    exclude_tracker_regex: str = ""
    tracker_msg_regex: str = ""
    category_regex: str = ""
    tag_regex: str = ""
    exclude_tag_regex: str = ""
    states: List[str] = None
    min_ratio: Optional[float] = None
    max_ratio: Optional[float] = None
    min_seeding_hours: Optional[float] = None
    min_added_hours: Optional[float] = None
    min_size_gb: Optional[float] = None
    max_size_gb: Optional[float] = None
    max_upspeed_kbps: Optional[float] = None

    def __post_init__(self) -> None:
        """规范化规则集合字段与枚举值。"""
        self.downloaders = _string_list(self.downloaders)
        self.states = [state.lower() for state in _string_list(self.states)]
        self.metric_logic = "any" if str(self.metric_logic).lower() == "any" else "all"

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CleanRule":
        """从 API 配置构造规则，忽略未识别字段并安全转换数值。"""
        allowed = {field.name for field in fields(cls)}
        values = {key: value for key, value in (data or {}).items() if key in allowed}
        for key in (
            "min_ratio",
            "max_ratio",
            "min_seeding_hours",
            "min_added_hours",
            "min_size_gb",
            "max_size_gb",
            "max_upspeed_kbps",
        ):
            if key in values:
                values[key] = _optional_float(values[key])
        for key, default in (
            ("enabled", True),
            ("delete_files", True),
            ("require_transferred", True),
            ("allow_incomplete", False),
        ):
            values[key] = _boolean(values.get(key), default)
        try:
            values["max_delete_per_run"] = max(0, int(values.get("max_delete_per_run") or 0))
        except (TypeError, ValueError):
            values["max_delete_per_run"] = 0
        values["id"] = str(values.get("id") or "").strip()
        values["name"] = str(values.get("name") or "未命名规则").strip()
        return cls(**values)

    def to_dict(self) -> Dict[str, Any]:
        """转换为可持久化的规则字典。"""
        return asdict(self)

    def regex_errors(self) -> List[str]:
        """检查全部正则表达式并返回可读错误，不抛出编译异常。"""
        errors: List[str] = []
        for field in fields(self):
            if not field.name.endswith("regex"):
                continue
            pattern = str(getattr(self, field.name) or "")
            if not pattern:
                continue
            try:
                re.compile(pattern, re.IGNORECASE)
            except re.error as err:
                errors.append(f"规则「{self.name}」字段 {field.name} 非法正则：{err}")
        return errors


@dataclass
class CleanCandidate:
    """一条包含命中原因与执行参数的待清理种子。"""

    torrent: NormalizedTorrent
    rule_id: str
    rule_name: str
    reason: str
    delete_files: bool = True

    @property
    def hash(self) -> str:
        """返回种子 Hash，便于执行与测试。"""
        return self.torrent.hash

    def to_dict(self) -> Dict[str, Any]:
        """转换为干跑预览及历史记录使用的字典。"""
        data = self.torrent.to_dict()
        data.update(
            {
                "rule_id": self.rule_id,
                "rule_name": self.rule_name,
                "reason": self.reason,
                "delete_files": self.delete_files,
                "size_gb": round(self.torrent.size / GIB, 3),
                "seeding_hours": round(self.torrent.seeding_seconds / 3600, 2),
                "added_hours": round(self.torrent.added_seconds / 3600, 2),
            }
        )
        return data


@dataclass
class CleanPlan:
    """一次巡检的完整干跑计划与配置错误集合。"""

    candidates: List[CleanCandidate]
    errors: List[str]
    scanned_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """转换为 REST API 可序列化结果。"""
        return {
            "candidates": [candidate.to_dict() for candidate in self.candidates],
            "candidate_count": len(self.candidates),
            "total_size": sum(candidate.torrent.size for candidate in self.candidates),
            "total_size_gb": round(
                sum(candidate.torrent.size for candidate in self.candidates) / GIB, 3
            ),
            "scanned_count": self.scanned_count,
            "errors": list(self.errors),
        }


class CleanEngine:
    """执行全局保护、规则匹配、磁盘低水位计算与幂等清理计划。"""

    _REGEX_FIELDS = (
        ("name_regex", "name", "名称"),
        ("exclude_name_regex", "name", "名称排除"),
        ("save_path_regex", "save_path", "保存路径"),
        ("exclude_save_path_regex", "save_path", "保存路径排除"),
        ("tracker_regex", "tracker", "Tracker"),
        ("exclude_tracker_regex", "tracker", "Tracker 排除"),
        ("tracker_msg_regex", "tracker_msg", "Tracker 消息"),
        ("category_regex", "category", "分类"),
        ("exclude_tag_regex", "tags", "标签排除"),
    )

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        """保存全局保护配置并预解析规则列表。"""
        self.config = config or {}
        self.protect_tags = {
            tag.casefold()
            for tag in _string_list(
                self.config.get("protect_tags", ["保种", "辅种", "勿删", "keep"])
            )
        }
        self.global_exclude_regex = str(self.config.get("global_exclude_regex") or "")
        self.only_completed = _boolean(self.config.get("only_completed"), True)

    @staticmethod
    def _normalize_state(raw_state: Any, error: Any = None, error_msg: Any = None) -> str:
        """把两种下载器状态映射为统一的六类状态。"""
        state = str(raw_state or "").strip().lower().replace("_", "")
        if error not in (None, "", 0, "0", False) or str(error_msg or "").strip():
            return "error"
        if state in {"uploading", "forcedup", "seeding"}:
            return "seeding"
        if state in {"stalledup", "stalled"}:
            return "stalled"
        if state in {"pausedup", "pauseddl", "paused", "stopped", "seedpending", "queuedup"}:
            return "paused"
        if state in {"error", "missingfiles", "unknown"}:
            return "error"
        if state in {
            "downloading",
            "forceddl",
            "metadl",
            "stalleddl",
            "downloadpending",
            "queueddl",
            "allocating",
            "moving",
            "checkingdl",
            "checkingup",
            "checkingresumedata",
        }:
            return "downloading"
        return "other"

    @staticmethod
    def _tracker_details(raw: Any) -> Tuple[str, str]:
        """提取主 Tracker 地址与全部 Tracker 状态消息。"""
        tracker = str(_value(raw, "tracker", default="") or "")
        messages: List[str] = []
        stats = _value(raw, "trackerStats", "tracker_stats", default=[]) or []
        if isinstance(stats, dict):
            stats = list(stats.values())
        if not tracker and isinstance(stats, Iterable):
            for stat in stats:
                candidate = str(_value(stat, "host", "announce", "url", default="") or "")
                if candidate:
                    tracker = candidate
                    break
        if isinstance(stats, Iterable):
            for stat in stats:
                message = str(
                    _value(
                        stat,
                        "lastAnnounceResult",
                        "last_announce_result",
                        "message",
                        "status",
                        default="",
                    )
                    or ""
                ).strip()
                if message:
                    messages.append(message)
        if not tracker:
            trackers = _value(raw, "trackers", default=[]) or []
            if isinstance(trackers, dict):
                trackers = list(trackers.values())
            if isinstance(trackers, Iterable) and not isinstance(trackers, (str, bytes)):
                for item in trackers:
                    candidate = str(_value(item, "url", "host", "announce", default=item) or "")
                    if candidate:
                        tracker = candidate
                        break
        error_msg = str(_value(raw, "errorString", "error_string", default="") or "").strip()
        if error_msg:
            messages.append(error_msg)
        if tracker and "://" not in tracker and "." in tracker:
            tracker = f"https://{tracker}"
        return tracker, " | ".join(dict.fromkeys(messages))

    def normalize_torrent(
        self,
        raw: Any,
        downloader: str,
        transfer_checker: Optional[Callable[[str, str], bool]] = None,
        now: Optional[float] = None,
    ) -> NormalizedTorrent:
        """归一化 qBittorrent/Transmission 种子，并计算入库安全锁。"""
        current_time = time.time() if now is None else now
        torrent_hash = str(_value(raw, "hash", "hashString", "hash_string", default="") or "").lower()
        name = str(_value(raw, "name", default="") or "")
        save_path = str(
            _value(raw, "save_path", "downloadDir", "download_dir", "savePath", default="") or ""
        )
        tags = _string_list(_value(raw, "tags", "labels", default=[]))
        progress = _number(_value(raw, "progress", "percentDone", "percent_done", default=0))
        if 0 <= progress <= 1:
            progress *= 100
        progress = min(100.0, max(0.0, progress))
        explicit_seeding = _value(raw, "seeding_time", "secondsSeeding", "seeding_seconds")
        if explicit_seeding is not None:
            seeding_seconds = max(0, int(_number(explicit_seeding)))
        else:
            done_time = _epoch_seconds(_value(raw, "doneDate", "completion_on", "done_date", default=0))
            seeding_seconds = max(0, int(current_time - done_time)) if done_time else 0
        explicit_added = _value(raw, "added_seconds")
        if explicit_added is not None:
            added_seconds = max(0, int(_number(explicit_added)))
        else:
            added_time = _epoch_seconds(_value(raw, "added_on", "addedDate", "added_date", default=0))
            added_seconds = max(0, int(current_time - added_time)) if added_time else 0
        tracker, tracker_msg = self._tracker_details(raw)
        if not tracker_msg:
            tracker_msg = str(_value(raw, "tracker_msg", default="") or "")
        transferred = any(tag.casefold() == "已整理".casefold() for tag in tags)
        if not transferred and transfer_checker:
            try:
                transferred = bool(transfer_checker(torrent_hash, save_path))
            except Exception:
                transferred = False
        return NormalizedTorrent(
            downloader=downloader,
            hash=torrent_hash,
            name=name,
            save_path=save_path,
            size=max(0, int(_number(_value(raw, "size", "totalSize", "total_size", default=0)))),
            ratio=_number(_value(raw, "ratio", "uploadRatio", "upload_ratio", default=0)),
            seeding_seconds=seeding_seconds,
            added_seconds=added_seconds,
            upspeed=max(0.0, _number(_value(raw, "upspeed", "rateUpload", "rate_upload", default=0))),
            dlspeed=max(0.0, _number(_value(raw, "dlspeed", "rateDownload", "rate_download", default=0))),
            progress=progress,
            state=self._normalize_state(
                _value(raw, "state", "status", default=""),
                _value(raw, "error", default=None),
                _value(raw, "errorString", "error_string", default=""),
            ),
            category=str(_value(raw, "category", default="") or ""),
            tags=tags,
            tracker=tracker,
            tracker_msg=tracker_msg,
            is_transferred=transferred,
        )

    @staticmethod
    def _regex_match(pattern: str, value: Any) -> bool:
        """以大小写不敏感方式匹配文本或标签列表，非法表达式返回 False。"""
        if not pattern:
            return True
        try:
            compiled = re.compile(pattern, re.IGNORECASE)
        except re.error:
            return False
        values = value if isinstance(value, list) else [value]
        return any(compiled.search(str(item or "")) is not None for item in values)

    def _global_protection_reason(self, torrent: NormalizedTorrent) -> str:
        """返回全局标签或名称排除原因，未保护时返回空字符串。"""
        protected = [tag for tag in torrent.tags if tag.casefold() in self.protect_tags]
        if protected:
            return f"命中全局保护标签：{', '.join(protected)}"
        if self.global_exclude_regex and self._regex_match(self.global_exclude_regex, torrent.name):
            return "命中全局排除名称正则"
        return ""

    def match_rule(self, torrent: NormalizedTorrent, rule: CleanRule) -> Tuple[bool, List[str]]:
        """判断种子是否满足规则，并返回所有命中条件的人类可读原因。"""
        if not rule.enabled:
            return False, []
        if rule.regex_errors():
            return False, []
        if rule.downloaders and torrent.downloader not in rule.downloaders:
            return False, []
        protection = self._global_protection_reason(torrent)
        if protection:
            return False, []
        if rule.require_transferred and not torrent.is_transferred:
            return False, []
        if self.only_completed and not rule.allow_incomplete and torrent.progress < 100:
            return False, []
        if rule.states and torrent.state not in rule.states:
            return False, []

        reasons: List[str] = []
        for field_name, attribute, label in self._REGEX_FIELDS:
            pattern = str(getattr(rule, field_name) or "")
            if not pattern:
                continue
            value = getattr(torrent, attribute)
            matched = self._regex_match(pattern, value)
            if field_name.startswith("exclude_"):
                if matched:
                    return False, []
                reasons.append(f"{label}未命中 {pattern}")
            else:
                if not matched:
                    return False, []
                reasons.append(f"{label}匹配 {pattern}")
        if rule.tag_regex:
            if not self._regex_match(rule.tag_regex, torrent.tags):
                return False, []
            reasons.append(f"标签匹配 {rule.tag_regex}")

        metric_checks: List[Tuple[bool, str]] = []
        metric_values = (
            (rule.min_ratio, torrent.ratio >= rule.min_ratio if rule.min_ratio is not None else False,
             f"分享率 {torrent.ratio:.2f} ≥ {rule.min_ratio}"),
            (rule.max_ratio, torrent.ratio <= rule.max_ratio if rule.max_ratio is not None else False,
             f"分享率 {torrent.ratio:.2f} ≤ {rule.max_ratio}"),
            (rule.min_seeding_hours,
             torrent.seeding_seconds >= rule.min_seeding_hours * 3600
             if rule.min_seeding_hours is not None else False,
             f"做种 {torrent.seeding_seconds / 3600:.1f} 小时 ≥ {rule.min_seeding_hours}"),
            (rule.min_added_hours,
             torrent.added_seconds >= rule.min_added_hours * 3600
             if rule.min_added_hours is not None else False,
             f"添加 {torrent.added_seconds / 3600:.1f} 小时 ≥ {rule.min_added_hours}"),
            (rule.min_size_gb, torrent.size >= rule.min_size_gb * GIB if rule.min_size_gb is not None else False,
             f"体积 {torrent.size / GIB:.2f}GB ≥ {rule.min_size_gb}GB"),
            (rule.max_size_gb, torrent.size <= rule.max_size_gb * GIB if rule.max_size_gb is not None else False,
             f"体积 {torrent.size / GIB:.2f}GB ≤ {rule.max_size_gb}GB"),
            (rule.max_upspeed_kbps,
             torrent.upspeed <= rule.max_upspeed_kbps * 1024
             if rule.max_upspeed_kbps is not None else False,
             f"上传 {torrent.upspeed / 1024:.1f}KB/s ≤ {rule.max_upspeed_kbps}KB/s"),
        )
        for configured, passed, reason in metric_values:
            if configured is not None:
                metric_checks.append((passed, reason))
        if metric_checks:
            if rule.metric_logic == "any":
                passed_reasons = [reason for passed, reason in metric_checks if passed]
                if not passed_reasons:
                    return False, []
                reasons.append("任一数值达标：" + "；".join(passed_reasons))
            else:
                if not all(passed for passed, _ in metric_checks):
                    return False, []
                reasons.extend(reason for _, reason in metric_checks)
        if not reasons:
            reasons.append("满足规则全部安全条件")
        return True, reasons

    def _new_candidate(
        self, torrent: NormalizedTorrent, rule: CleanRule, reasons: List[str]
    ) -> CleanCandidate:
        """创建普通规则命中候选。"""
        return CleanCandidate(
            torrent=torrent,
            rule_id=rule.id or rule.name,
            rule_name=rule.name,
            reason="；".join(reasons),
            delete_files=rule.delete_files,
        )

    def select_disk_guard(
        self,
        torrents: List[NormalizedTorrent],
        free_space: Optional[float],
        disk_guard: Optional[Dict[str, Any]] = None,
    ) -> List[CleanCandidate]:
        """按低水位目标计算最少应急淘汰集合，不绕过任何安全锁。"""
        guard = disk_guard if disk_guard is not None else self.config.get("disk_guard", {})
        guard = guard or {}
        if not _boolean(guard.get("enabled"), False) or free_space is None:
            return []
        threshold = (_optional_float(guard.get("free_space_threshold_gb")) or 0) * GIB
        target = (_optional_float(guard.get("target_free_space_gb")) or 0) * GIB
        if free_space >= threshold or free_space >= target:
            return []
        min_protect_seconds = max(
            0.0, _optional_float(guard.get("min_protect_hours")) or 0
        ) * 3600
        safe: List[NormalizedTorrent] = []
        for torrent in torrents:
            if torrent.progress < 100 or not torrent.is_transferred:
                continue
            if torrent.seeding_seconds < min_protect_seconds:
                continue
            if self._global_protection_reason(torrent):
                continue
            safe.append(torrent)
        sort_by = str(guard.get("sort_by") or "oldest_seeding")
        sort_keys: Dict[str, Callable[[NormalizedTorrent], Any]] = {
            "oldest_seeding": lambda item: -item.seeding_seconds,
            "largest_size": lambda item: -item.size,
            "lowest_upspeed": lambda item: item.upspeed,
            "highest_ratio": lambda item: -item.ratio,
        }
        safe.sort(key=sort_keys.get(sort_by, sort_keys["oldest_seeding"]))
        labels = {
            "oldest_seeding": "做种最久",
            "largest_size": "体积最大",
            "lowest_upspeed": "上传最慢",
            "highest_ratio": "分享率最高",
        }
        selected: List[CleanCandidate] = []
        projected_free = free_space
        delete_files = _boolean(guard.get("delete_files"), True)
        for torrent in safe:
            if projected_free >= target:
                break
            selected.append(
                CleanCandidate(
                    torrent=torrent,
                    rule_id=DISK_GUARD_RULE_ID,
                    rule_name="磁盘低水位应急保盘",
                    reason=(
                        f"剩余空间 {free_space / GIB:.2f}GB 低于阈值 {threshold / GIB:.2f}GB；"
                        f"按{labels.get(sort_by, '做种最久')}淘汰，目标 {target / GIB:.2f}GB"
                    ),
                    delete_files=delete_files,
                )
            )
            if delete_files:
                projected_free += torrent.size
        return selected

    def plan(
        self,
        snapshots: Dict[str, Dict[str, Any]],
        rules: Optional[List[CleanRule]] = None,
        disk_guard: Optional[Dict[str, Any]] = None,
    ) -> CleanPlan:
        """生成跨下载器、去重且遵守规则顺序和单轮上限的清理计划。"""
        rule_list = rules if rules is not None else [
            CleanRule.from_dict(item) for item in self.config.get("rules", []) if isinstance(item, dict)
        ]
        errors: List[str] = []
        if self.global_exclude_regex:
            try:
                re.compile(self.global_exclude_regex, re.IGNORECASE)
            except re.error as err:
                errors.append(f"全局排除名称非法正则：{err}")
        for rule in rule_list:
            if rule.enabled:
                errors.extend(rule.regex_errors())
        candidates: List[CleanCandidate] = []
        scanned_count = 0
        selected_keys = set()
        if not errors:
            for rule in rule_list:
                if not rule.enabled:
                    continue
                rule_count = 0
                for downloader, snapshot in snapshots.items():
                    torrents = snapshot.get("torrents", [])
                    for torrent in torrents:
                        if not isinstance(torrent, NormalizedTorrent):
                            continue
                        key = (downloader, torrent.hash)
                        if key in selected_keys:
                            continue
                        matched, reasons = self.match_rule(torrent, rule)
                        if not matched:
                            continue
                        if rule.max_delete_per_run and rule_count >= rule.max_delete_per_run:
                            continue
                        candidates.append(self._new_candidate(torrent, rule, reasons))
                        selected_keys.add(key)
                        rule_count += 1
            guard = disk_guard if disk_guard is not None else self.config.get("disk_guard")
            for downloader, snapshot in snapshots.items():
                normal_reclaim = sum(
                    candidate.torrent.size
                    for candidate in candidates
                    if candidate.torrent.downloader == downloader and candidate.delete_files
                )
                free_space = snapshot.get("free_space")
                adjusted_free = free_space + normal_reclaim if free_space is not None else None
                for candidate in self.select_disk_guard(
                    snapshot.get("torrents", []), adjusted_free, guard
                ):
                    key = (downloader, candidate.hash)
                    if key in selected_keys:
                        continue
                    candidates.append(candidate)
                    selected_keys.add(key)
        for snapshot in snapshots.values():
            scanned_count += len(snapshot.get("torrents", []))
        return CleanPlan(candidates=candidates, errors=errors, scanned_count=scanned_count)

    def execute(
        self,
        plan: CleanPlan,
        deleter: Callable[[str, str, bool], bool],
        dry_run: bool = False,
    ) -> Dict[str, Any]:
        """执行或干跑清理计划，逐个记录成功与失败且隔离删除异常。"""
        result = plan.to_dict()
        result.update({"dry_run": dry_run, "deleted": [], "failed": []})
        if dry_run:
            return result
        for candidate in plan.candidates:
            item = candidate.to_dict()
            try:
                success = bool(
                    deleter(candidate.torrent.downloader, candidate.hash, candidate.delete_files)
                )
            except Exception as err:
                success = False
                item["error"] = str(err)
            if success:
                result["deleted"].append(item)
            else:
                result["failed"].append(item)
        return result
