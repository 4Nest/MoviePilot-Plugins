"""MediaVault (Muvyo) OpenAPI 客户端封装。"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlencode

from app.utils.http import RequestUtils


class MediaVaultError(RuntimeError):
    """MediaVault 接口调用异常。"""


class MediaVaultClient:
    """基于 MoviePilot RequestUtils 的 MediaVault HTTP 客户端。"""

    def __init__(self, base_url: str, api_key: str, timeout: int = 20) -> None:
        """初始化客户端连接参数。"""
        self.base_url = str(base_url or "").strip().rstrip("/")
        self.api_key = str(api_key or "").strip()
        self.timeout = max(3, int(timeout or 20))

    def is_configured(self) -> bool:
        """检查是否已配置服务地址与 API Key。"""
        return bool(self.base_url and self.api_key)

    def _headers(self) -> Dict[str, str]:
        """构造包含 API Key 的请求头。"""
        return {
            "X-API-Key": self.api_key,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def _build_url(self, path: str, params: Optional[Dict[str, Any]] = None) -> str:
        """拼接完整的 /api/v1 接口 URL。"""
        clean_path = path if path.startswith("/") else f"/{path}"
        if not clean_path.startswith("/api/v1/"):
            clean_path = f"/api/v1{clean_path}"
        url = f"{self.base_url}{clean_path}"
        if params:
            filtered = {k: v for k, v in params.items() if v is not None and v != ""}
            if filtered:
                url = f"{url}?{urlencode(filtered)}"
        return url

    def request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        payload: Optional[Dict[str, Any]] = None,
        timeout: Optional[int] = None,
    ) -> Any:
        """发送请求并解包 MediaVault 标准响应体。"""
        if not self.is_configured():
            raise MediaVaultError("请先配置 MediaVault 服务地址与 API Key")
        url = self._build_url(path, params=params)
        req = RequestUtils(
            headers=self._headers(),
            timeout=timeout or self.timeout,
        )
        method_upper = method.upper()
        if method_upper == "GET":
            res = req.get_res(url)
        elif method_upper == "POST":
            res = req.post_res(url, json=payload if payload is not None else {})
        elif method_upper == "PUT":
            res = req.put_res(url, json=payload if payload is not None else {})
        elif method_upper == "DELETE":
            res = req.delete_res(url)
        else:
            raise MediaVaultError(f"不支持的 HTTP 方法: {method}")

        if res is None:
            raise MediaVaultError(f"无法连接 MediaVault（{url}），请检查地址与网络连通性")

        try:
            body = res.json()
        except Exception as err:
            text = (res.text or "").strip()[:200]
            raise MediaVaultError(
                f"MediaVault 返回非 JSON 响应（HTTP {res.status_code}）: {text}"
            ) from err

        if res.status_code >= 400:
            msg = ""
            if isinstance(body, dict):
                msg = str(body.get("message") or body.get("detail") or "").strip()
            raise MediaVaultError(msg or f"MediaVault 请求失败（HTTP {res.status_code}）")

        if isinstance(body, dict) and body.get("success") is False:
            raise MediaVaultError(str(body.get("message") or "MediaVault 操作失败"))

        if isinstance(body, dict) and "data" in body:
            return body["data"]
        return body

    # ── 系统与状态 ─────────────────────────────────────────────────────────────

    def health(self) -> Dict[str, Any]:
        """获取 MediaVault 健康状态与版本号。"""
        return self.request("GET", "/system/health") or {}

    def system_info(self) -> Dict[str, Any]:
        """获取 MediaVault 系统运行信息。"""
        return self.request("GET", "/system/info") or {}

    def dashboard_resources(self) -> Dict[str, Any]:
        """获取 MediaVault 资源占用统计。"""
        return self.request("GET", "/dashboard/resources") or {}

    def cloud_drives(self) -> Dict[str, Any]:
        """获取已配置的云盘实例列表。"""
        return self.request("GET", "/cloud-drive/instances") or {}

    def media_servers(self) -> Dict[str, Any]:
        """获取已配置的媒体服务器实例列表。"""
        return self.request("GET", "/media-server/instances") or {}

    # ── 115 上传监控与失败重试 ────────────────────────────────────────────────

    def today_upload(self) -> Dict[str, Any]:
        """获取今日 115 上传统计。"""
        return self.request("GET", "/monitor/events/today-upload") or {}

    def monitor_status(self) -> Dict[str, Any]:
        """获取目录监控实时运行状态。"""
        return self.request("GET", "/monitor/status") or {}

    def monitor_config(self) -> Dict[str, Any]:
        """获取目录监控规则配置（用于自动发现常用云盘/STRM 路径对）。"""
        return self.request("GET", "/monitor/config") or {}

    def monitor_events(
        self,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Dict[str, Any]:
        """分页查询目录监控事件列表。"""
        return (
            self.request(
                "GET",
                "/monitor/events",
                params={"status": status, "page": page, "page_size": page_size},
            )
            or {}
        )

    def retry_monitor_event(self, event_id: int, force: bool = False) -> Any:
        """重试单条监控上传事件。"""
        params = {"force": "true"} if force else None
        return self.request("POST", f"/monitor/events/{int(event_id)}/retry", params=params)

    def batch_retry_monitor_events(
        self,
        event_ids: List[int],
        force: bool = False,
    ) -> Any:
        """批量重试监控上传事件。"""
        payload: Dict[str, Any] = {"event_ids": [int(i) for i in event_ids]}
        if force:
            payload["force"] = True
        return self.request("POST", "/monitor/events/batch-retry", payload=payload)

    def trigger_monitor_sync(self, rule_idx: int = -1, full: bool = False) -> Any:
        """触发目录监控增量或全量同步。"""
        return self.request(
            "POST",
            "/monitor/trigger-sync",
            params={"rule_idx": rule_idx, "full": "true" if full else "false"},
        )

    def upload_records(
        self,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Dict[str, Any]:
        """查询 115 上传记录。"""
        return (
            self.request(
                "GET",
                "/files/115/upload/records",
                params={"status": status, "page": page, "page_size": page_size},
            )
            or {}
        )

    def browse_local(self, path: str) -> List[Dict[str, Any]]:
        """浏览 MediaVault 容器内指定本地目录。"""
        data = self.request("GET", "/files/local/browse", params={"path": path})
        return data if isinstance(data, list) else []

    def delete_local(self, file_paths: List[str]) -> Dict[str, Any]:
        """删除 MediaVault 容器内指定本地文件列表。"""
        if not file_paths:
            return {"deleted": 0, "failed": 0}
        res = self.request("POST", "/files/local/delete", payload={"file_ids": file_paths})
        return res if isinstance(res, dict) else {"deleted": len(file_paths), "failed": 0}

    def clear_offline115_attempts(
        self,
        attempts_dir: str = "/opt/config/offline115-attempts",
    ) -> Dict[str, Any]:
        """清理 MediaVault offline115-attempts 目录下的 JSON 锁文件（保留子目录）。"""
        target_dir = str(attempts_dir or "/opt/config/offline115-attempts").strip() or "/opt/config/offline115-attempts"
        entries = self.browse_local(target_dir)
        json_paths = [
            str(item.get("path"))
            for item in entries
            if isinstance(item, dict)
            and not item.get("is_dir")
            and str(item.get("name") or "").lower().endswith(".json")
            and item.get("path")
        ]
        if not json_paths:
            return {"dir": target_dir, "found": 0, "deleted": 0, "files": []}
        res = self.delete_local(json_paths)
        return {
            "dir": target_dir,
            "found": len(json_paths),
            "deleted": int(res.get("deleted", len(json_paths))),
            "failed": int(res.get("failed", 0)),
            "files": [p.rsplit("/", 1)[-1] for p in json_paths],
        }

    # ── STRM 与刮削 ───────────────────────────────────────────────────────────

    def strm_stats(self) -> Dict[str, Any]:
        """获取 STRM 索引统计信息。"""
        return self.request("GET", "/strm/records/stats") or {}

    def strm_generate_status(self) -> Dict[str, Any]:
        """获取 STRM 生成任务当前状态。"""
        return self.request("GET", "/strm/generate/status") or {}

    def strm_generate(
        self,
        source_dir: str,
        target_dir: str,
        cloud: str = "115-default",
        overwrite: bool = False,
        template: Optional[str] = None,
    ) -> Any:
        """触发指定网盘目录的增量 STRM 生成。"""
        payload: Dict[str, Any] = {
            "source_dir": source_dir,
            "target_dir": target_dir,
            "cloud": cloud,
            "overwrite": bool(overwrite),
        }
        if template:
            payload["template"] = template
        return self.request("POST", "/strm/generate", payload=payload, timeout=30)

    def scrape_directory(self, target_dir: str, overwrite: bool = False) -> Any:
        """触发指定 STRM 目录刮削。"""
        return self.request(
            "POST",
            "/scrape/directory",
            payload={"directory": target_dir, "strm_dir": target_dir, "overwrite": bool(overwrite)},
            timeout=30,
        )

    # ── STRM 清理与孤立索引 ───────────────────────────────────────────────────

    def strm_cleanup_scan(
        self,
        strm_dir: str = "",
        cloud_dir: str = "",
        storage: str = "115-default",
    ) -> Any:
        """触发失效 STRM 清理扫描。"""
        payload: Dict[str, Any] = {"storage": storage}
        if strm_dir:
            payload["strm_dir"] = strm_dir
        if cloud_dir:
            payload["cloud_dir"] = cloud_dir
        return self.request("POST", "/strm/records/cleanup/scan", payload=payload, timeout=30)

    def strm_cleanup_scan_status(self) -> Dict[str, Any]:
        """查询 STRM 清理扫描进度与结果。"""
        return self.request("GET", "/strm/records/cleanup/scan/status") or {}

    def strm_cleanup_execute(self, items: List[Dict[str, Any]]) -> Any:
        """执行失效 STRM 清理。"""
        return self.request("POST", "/strm/records/cleanup/execute", payload={"items": items})

    def orphan_index_scan(self, storage: str = "115-default", path: str = "") -> Any:
        """触发网盘孤立索引扫描。"""
        payload: Dict[str, Any] = {"storage": storage}
        if path:
            payload["path"] = path
        return self.request("POST", "/orphan-index/scan", payload=payload, timeout=30)

    def orphan_index_status(self, storage: str = "115-default") -> Dict[str, Any]:
        """查询网盘孤立索引扫描状态。"""
        return self.request("GET", "/orphan-index/status", params={"storage": storage}) or {}

    # ── Emby 增强后处理 ───────────────────────────────────────────────────────

    def emby_mediainfo_status(self) -> Dict[str, Any]:
        """获取 Emby MediaInfo 提取模块状态。"""
        return self.request("GET", "/emby-mediainfo") or {}

    def emby_mediainfo_run(self, scope: str = "missing") -> Any:
        """触发 Emby MediaInfo 提取任务。"""
        return self.request("POST", "/emby-mediainfo/run", payload={"scope": scope})

    def emby_mediainfo_retry(self) -> Any:
        """重试失败的 Emby MediaInfo 提取任务。"""
        return self.request("POST", "/emby-mediainfo/failures/retry")

    def emby_thumbnail_status(self) -> Dict[str, Any]:
        """获取 Emby 缩略图生成模块状态。"""
        return self.request("GET", "/emby-thumbnail") or {}

    def emby_thumbnail_run(self, scope: str = "missing") -> Any:
        """触发 Emby 缩略图生成任务。"""
        return self.request("POST", "/emby-thumbnail/run", payload={"scope": scope})

    def emby_thumbnail_retry(self) -> Any:
        """重试失败的 Emby 缩略图生成任务。"""
        return self.request("POST", "/emby-thumbnail/failures/retry")

    def emby_intro_skip_status(self) -> Dict[str, Any]:
        """获取 Emby 片头片尾跳过检测模块状态。"""
        return self.request("GET", "/emby-intro-skip") or {}

    def emby_intro_skip_detect(
        self,
        server_slug: str = "emby-default",
        series_id: Optional[str] = None,
        only_missing: bool = True,
    ) -> Any:
        """触发 Emby 片头片尾检测。"""
        payload: Dict[str, Any] = {
            "server_slug": server_slug,
            "only_missing": bool(only_missing),
        }
        if series_id:
            payload["series_id"] = series_id
        return self.request("POST", "/emby-intro-skip/detect", payload=payload)

    # ── 115 分享链转存 ────────────────────────────────────────────────────────

    def share_drives(self) -> Dict[str, Any]:
        """获取支持分享链转存的网盘列表。"""
        return self.request("GET", "/share-transfer/drives") or {}

    def share_parse(self, share_url: str) -> Dict[str, Any]:
        """解析 115 分享链接信息。"""
        return self.request("POST", "/share-transfer/parse", payload={"share_url": share_url}) or {}

    def share_receive(
        self,
        share_url: str,
        target_path: str = "",
        storage: str = "115-default",
        receive_code: str = "",
    ) -> Any:
        """执行 115 分享链接转存到指定目录。"""
        payload: Dict[str, Any] = {
            "share_url": share_url,
            "storage": storage,
        }
        if target_path:
            payload["target_path"] = target_path
        if receive_code:
            payload["receive_code"] = receive_code
        return self.request("POST", "/share-transfer/receive", payload=payload, timeout=45)

    def share_records(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """查询最近 115 分享转存记录。"""
        return (
            self.request(
                "GET",
                "/share-transfer/records",
                params={"page": page, "page_size": page_size},
            )
            or {}
        )

    def test_connection(self) -> Tuple[bool, str, Dict[str, Any]]:
        """测试 MediaVault 连通性与 API Key 有效性。"""
        try:
            health_data = self.health()
            version = health_data.get("version") or "unknown"
            return True, f"连接成功（MediaVault {version}）", health_data
        except Exception as err:
            return False, str(err), {}
