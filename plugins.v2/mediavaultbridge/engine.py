"""MediaVault 联动纯逻辑引擎：路径映射、失败上传重试评估与分享链提取。"""
from __future__ import annotations

import re
import time
from dataclasses import asdict, dataclass
from pathlib import PurePosixPath
from typing import Any, Dict, List, Optional, Tuple


DEFAULT_SKIP_RETRY_KEYWORDS = (
    "勿重复上传|请先核对云盘文件|已接受上传请求|风控|空间不足|capacity|quota|permission denied"
)

_SHARE_URL_PATTERN = re.compile(
    r"(https?://(?:115\.com|115cdn\.com|anxia\.com)/s/[A-Za-z0-9]+(?:\?[^\s，。,;；]*)?)",
    re.IGNORECASE,
)
_RECEIVE_CODE_PATTERN = re.compile(
    r"(?:访问码|提取码|密码|code)[：:\s]*([A-Za-z0-9]{4})",
    re.IGNORECASE,
)


def normalize_posix_path(path: str) -> str:
    """规范化 POSIX 路径（去除尾斜杠，保留根路径）。"""
    raw = str(path or "").strip().replace("\\", "/")
    if not raw:
        return ""
    while "//" in raw:
        raw = raw.replace("//", "/")
    if len(raw) > 1 and raw.endswith("/"):
        raw = raw.rstrip("/")
    return raw


@dataclass
class PathMappingRule:
    """MoviePilot 路径到 MediaVault 云盘/STRM 目录的映射规则。"""

    mp_prefix: str
    mv_cloud_prefix: str
    mv_strm_prefix: str = ""
    storage: str = "115-default"
    enabled: bool = True

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PathMappingRule":
        """从配置字典构建路径映射规则。"""
        return cls(
            mp_prefix=normalize_posix_path(data.get("mp_prefix") or ""),
            mv_cloud_prefix=normalize_posix_path(data.get("mv_cloud_prefix") or ""),
            mv_strm_prefix=normalize_posix_path(data.get("mv_strm_prefix") or ""),
            storage=str(data.get("storage") or "115-default").strip() or "115-default",
            enabled=bool(data.get("enabled", True)),
        )

    def to_dict(self) -> Dict[str, Any]:
        """序列化路径映射规则。"""
        return asdict(self)


def map_mp_path_to_mv(
    mp_path: str,
    rules: List[PathMappingRule],
    use_parent_dir: bool = True,
) -> Optional[Dict[str, str]]:
    """按最长前缀将 MoviePilot 目标路径映射为 MediaVault 云盘路径与 STRM 路径。"""
    normalized = normalize_posix_path(mp_path)
    if not normalized:
        return None

    target_dir = normalized
    if use_parent_dir:
        posix = PurePosixPath(normalized)
        if posix.suffix:
            target_dir = normalize_posix_path(str(posix.parent))

    candidates = [r for r in rules if r.enabled and r.mp_prefix and r.mv_cloud_prefix]
    candidates.sort(key=lambda r: len(r.mp_prefix), reverse=True)

    for rule in candidates:
        prefix = rule.mp_prefix
        if target_dir == prefix or target_dir.startswith(f"{prefix}/"):
            rel = target_dir[len(prefix) :].lstrip("/")
            cloud_dir = (
                f"{rule.mv_cloud_prefix}/{rel}" if rel else rule.mv_cloud_prefix
            )
            strm_dir = ""
            if rule.mv_strm_prefix:
                strm_dir = (
                    f"{rule.mv_strm_prefix}/{rel}" if rel else rule.mv_strm_prefix
                )
            return {
                "storage": rule.storage,
                "cloud_dir": normalize_posix_path(cloud_dir),
                "strm_dir": normalize_posix_path(strm_dir),
                "matched_prefix": prefix,
            }
    return None


def classify_failed_event(
    event: Dict[str, Any],
    skip_regex: str = DEFAULT_SKIP_RETRY_KEYWORDS,
) -> Tuple[str, str]:
    """判定失败上传事件是否可安全自动重试，或需人工核对。"""
    msg = str(
        event.get("error")
        or event.get("message")
        or event.get("error_message")
        or ""
    ).strip()
    if skip_regex:
        try:
            if re.search(skip_regex, msg, re.IGNORECASE):
                return "manual_confirm", "命中防重复/风控保护关键词，建议核对云盘后再决定是否强制重试"
        except re.error:
            pass
    return "retryable", "常规上传失败，可安全重试"


def evaluate_retry_candidates(
    failed_events: List[Dict[str, Any]],
    retry_tracker: Dict[str, Dict[str, Any]],
    max_retries: int = 3,
    cooldown_minutes: int = 15,
    skip_regex: str = DEFAULT_SKIP_RETRY_KEYWORDS,
    now_ts: Optional[float] = None,
) -> Dict[str, List[Dict[str, Any]]]:
    """筛选本次可自动重试、冷却中、超限及需人工核对的失败上传事件。"""
    current_ts = now_ts if now_ts is not None else time.time()
    cooldown_sec = max(0, int(cooldown_minutes)) * 60
    limit = max(1, int(max_retries))

    result: Dict[str, List[Dict[str, Any]]] = {
        "to_retry": [],
        "manual_confirm": [],
        "cooldown": [],
        "exhausted": [],
    }

    for event in failed_events:
        event_id = event.get("id")
        if event_id is None:
            continue
        key = str(event_id)
        category, reason = classify_failed_event(event, skip_regex=skip_regex)
        record = retry_tracker.get(key) or {}
        attempts = int(record.get("attempts") or 0)
        last_ts = float(record.get("last_ts") or 0.0)

        enriched = {
            **event,
            "retry_category": category,
            "retry_reason": reason,
            "auto_attempts": attempts,
            "last_retry_ts": last_ts,
        }

        if category == "manual_confirm":
            result["manual_confirm"].append(enriched)
            continue
        if attempts >= limit:
            result["exhausted"].append(enriched)
            continue
        if last_ts > 0 and (current_ts - last_ts) < cooldown_sec:
            result["cooldown"].append(enriched)
            continue
        result["to_retry"].append(enriched)

    return result


def extract_115_share_urls(text: str) -> List[Dict[str, str]]:
    """从消息文本中提取 115 分享链接及附带的访问码。"""
    raw = str(text or "").strip()
    if not raw:
        return []
    matches = _SHARE_URL_PATTERN.findall(raw)
    if not matches:
        return []

    code_match = _RECEIVE_CODE_PATTERN.search(raw)
    fallback_code = code_match.group(1) if code_match else ""

    seen = set()
    items: List[Dict[str, str]] = []
    for url in matches:
        clean_url = url.strip().rstrip(".,;，。；)）]】")
        if clean_url in seen:
            continue
        seen.add(clean_url)
        code = ""
        m_param = re.search(r"[?&]password=([A-Za-z0-9]{4})", clean_url, re.IGNORECASE)
        if m_param:
            code = m_param.group(1)
        elif fallback_code:
            code = fallback_code
        items.append({"share_url": clean_url, "receive_code": code})
    return items
