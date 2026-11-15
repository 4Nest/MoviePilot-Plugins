"""SeedCleaner 插件批量查库、入库路径安全锁、正则预编译与长度防护测试。"""
from __future__ import annotations

import json
import re
from pathlib import Path
from types import SimpleNamespace
from typing import Any, List

import pytest
from sqlalchemy import event

import app.plugins.seedcleaner as sc_mod
from app.db import Engine, ScopedSession
from app.db.models.transferhistory import TransferHistory
from app.plugins.seedcleaner import SeedCleaner
from app.plugins.seedcleaner.engine import CleanEngine, CleanRule


class FakeDownloader:
    """模拟 qBittorrent / Transmission 下载器实例。"""

    def __init__(self, torrents: List[Any], free_space: int = 500 * 1024**3) -> None:
        self.torrents = torrents
        self.free_space = free_space
        self.delete_calls: List[Any] = []

    def get_torrents(self) -> tuple:
        return self.torrents, False

    def get_transfer_info(self) -> dict:
        return {"free_space": self.free_space, "total_space": 1000 * 1024**3}

    def delete_torrents(self, delete_file: bool, ids: str) -> bool:
        self.delete_calls.append((delete_file, ids))
        return True


def _setup_plugin(
    monkeypatch: pytest.MonkeyPatch,
    downloader: FakeDownloader,
    service_type: str = "qbittorrent",
    rules: list | None = None,
) -> SeedCleaner:
    monkeypatch.setattr(
        "app.plugins.seedcleaner.DownloaderHelper.get_services",
        lambda self: {
            "DL-1": SimpleNamespace(name="DL-1", type=service_type, instance=downloader)
        },
    )
    plugin = SeedCleaner()
    monkeypatch.setattr(plugin, "update_config", lambda config: True)
    monkeypatch.setattr(plugin, "post_message", lambda **kwargs: None)
    plugin.init_plugin(
        {
            "enabled": True,
            "notify": False,
            "rules": rules
            if rules is not None
            else [{"id": "r1", "name": "达标清理", "enabled": True, "min_ratio": 1.0}],
        }
    )
    return plugin


def test_seedcleaner_loaded_from_current_repo() -> None:
    """确认测试加载的是当前插件仓库源码而非宿主旧副本。"""
    repo_root = Path(__file__).resolve().parents[1]
    assert Path(sc_mod.__file__).resolve().is_relative_to(repo_root)


def test_overview_executes_zero_database_queries(monkeypatch: pytest.MonkeyPatch) -> None:
    """GET /overview 仅统计种子数量与体积，不得触发任何数据库查询。"""
    torrents = [
        {
            "hash": f"hash_{idx}",
            "name": f"Movie.{idx}.2025.mkv",
            "save_path": "/downloads/movies",
            "content_path": f"/downloads/movies/Movie.{idx}.2025.mkv",
            "size": 2 * 1024**3,
            "ratio": 3.0,
            "seeding_time": 86400,
            "progress": 1.0,
            "state": "uploading",
            "tags": "",
        }
        for idx in range(50)
    ]
    plugin = _setup_plugin(monkeypatch, FakeDownloader(torrents))

    sql_statements: List[str] = []

    def _record_sql(_conn, _cursor, statement, *_args):
        sql_statements.append(statement)

    event.listen(Engine, "before_cursor_execute", _record_sql)
    try:
        resp = plugin.api_overview()
    finally:
        event.remove(Engine, "before_cursor_execute", _record_sql)

    assert resp.success is True
    assert resp.data["downloaders"][0]["torrent_count"] == 50
    assert resp.data["downloaders"][0]["seeding_count"] == 50
    assert sql_statements == [], f"api_overview 不应触发任何 SQL，实际执行了：{sql_statements}"


def test_batch_transfer_check_eliminates_n_plus_one_and_matches_exact_content_path(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """批量入库校验最多执行 1 次 SQL，精确匹配 hash/单文件/多文件目录前缀，绝不误判同父目录未入库种子。"""
    with ScopedSession() as session:
        session.query(TransferHistory).delete()
        session.commit()

    # 构造整理历史：
    # 1. Hash 成功记录（小写存库，下载器返回大写也能匹配）
    TransferHistory(
        src="/other/path/ByHash.mkv",
        download_hash="hash_ok_001",
        status=True,
    ).create(None)
    # 2. Hash 失败记录（status=False，绝不能当成已入库）
    TransferHistory(
        src="/downloads/movies/Failed.Movie.2025.mkv",
        download_hash="hash_fail_002",
        status=False,
    ).create(None)
    # 3. 单文件种子无 Hash 入库记录
    TransferHistory(
        src="/downloads/movies/Single.Transferred.2025.mkv",
        download_hash="",
        status=True,
    ).create(None)
    # 4. 多文件目录种子子集入库记录（嵌套季目录）
    TransferHistory(
        src="/downloads/tv/Show.Pack.S01/Season 1/S01E01.mkv",
        download_hash=None,
        status=True,
    ).create(None)

    raw_torrents = [
        # 应命中：Hash 匹配
        {
            "hash": "HASH_OK_001",
            "name": "ByHash.mkv",
            "save_path": "/downloads/movies",
            "size": 1024**3,
            "ratio": 2.0,
            "progress": 1.0,
            "state": "uploading",
            "tags": "",
        },
        # 不应命中：status=False 的失败整理记录
        {
            "hash": "hash_fail_002",
            "name": "Failed.Movie.2025.mkv",
            "save_path": "/downloads/movies",
            "content_path": "/downloads/movies/Failed.Movie.2025.mkv",
            "size": 1024**3,
            "ratio": 2.0,
            "progress": 1.0,
            "state": "uploading",
            "tags": "",
        },
        # 应命中：qB content_path 精确等于单文件入库 src
        {
            "hash": "no_db_hash_single",
            "name": "Single.Transferred.2025.mkv",
            "save_path": "/downloads/movies/",
            "content_path": "/downloads/movies/Single.Transferred.2025.mkv",
            "size": 1024**3,
            "ratio": 2.0,
            "progress": 1.0,
            "state": "uploading",
            "tags": "",
        },
        # 应命中：多文件种子 save_path + name 组合作为入库子文件的严格父目录
        {
            "hash": "no_db_hash_pack",
            "name": "Show.Pack.S01",
            "save_path": "/downloads/tv/",
            "size": 1024**3,
            "ratio": 2.0,
            "progress": 1.0,
            "state": "uploading",
            "tags": "",
        },
        # 绝不应命中：与已入库种子同处 /downloads/tv 公共父目录的未入库种子
        {
            "hash": "untransferred_sibling_tv",
            "name": "Untransferred.Show.S01",
            "save_path": "/downloads/tv",
            "size": 1024**3,
            "ratio": 2.0,
            "progress": 1.0,
            "state": "uploading",
            "tags": "",
        },
        # 绝不应命中：名称为已入库目录前缀子串（Show.Pack.S0 vs Show.Pack.S01）的未入库种子
        {
            "hash": "untransferred_prefix_trap",
            "name": "Show.Pack.S0",
            "save_path": "/downloads/tv",
            "size": 1024**3,
            "ratio": 2.0,
            "progress": 1.0,
            "state": "uploading",
            "tags": "",
        },
        # 绝不应命中：缺少 name 且 content_path 退化为公共父目录的异常种子
        {
            "hash": "missing_name_trap",
            "name": "",
            "save_path": "/downloads/tv",
            "content_path": "/downloads/tv",
            "size": 1024**3,
            "ratio": 2.0,
            "progress": 1.0,
            "state": "uploading",
            "tags": "",
        },
    ]
    # 再追加 100 个普通未入库种子验证 SQL 查询次数恒为 1
    for i in range(100):
        raw_torrents.append(
            {
                "hash": f"bulk_untransferred_{i}",
                "name": f"Bulk.Untransferred.{i}.mkv",
                "save_path": "/downloads/movies",
                "size": 1024**3,
                "ratio": 2.0,
                "progress": 1.0,
                "state": "uploading",
                "tags": "",
            }
        )

    plugin = _setup_plugin(monkeypatch, FakeDownloader(raw_torrents))

    transfer_queries: List[str] = []

    def _count_transfer_sql(_conn, _cursor, statement, *_args):
        if "transferhistory" in statement.lower():
            transfer_queries.append(statement)

    event.listen(Engine, "before_cursor_execute", _count_transfer_sql)
    try:
        result = plugin.run_cleanup(dry_run=True)
    finally:
        event.remove(Engine, "before_cursor_execute", _count_transfer_sql)

    assert result["success"] is True
    assert len(transfer_queries) == 1, (
        f"107 个种子巡检应只执行 1 次 transferhistory 批量查询，实际执行了 {len(transfer_queries)} 次"
    )
    matched_hashes = {item["hash"] for item in result["candidates"]}
    assert matched_hashes == {
        "hash_ok_001",
        "no_db_hash_single",
        "no_db_hash_pack",
    }


def test_rule_precompiles_regex_and_serializes_cleanly(monkeypatch: pytest.MonkeyPatch) -> None:
    """规则与引擎应在初始化阶段预编译正则，批量评估种子时不再重复 re.compile。"""
    rule = CleanRule.from_dict(
        {
            "id": "perf-rule",
            "name": "预编译规则",
            "enabled": True,
            "name_regex": r"Movie\.\d{4}",
            "exclude_name_regex": r"-(WiKi|FRDS)$",
            "tracker_regex": r"tracker\.example",
            "tag_regex": r"已整理",
        }
    )
    # to_dict 必须可被标准 JSON 序列化，不泄漏 Pattern 对象
    serialized = json.dumps(rule.to_dict(), ensure_ascii=False)
    assert "perf-rule" in serialized

    engine = CleanEngine({"global_exclude_regex": r"DO_NOT_DELETE"})
    torrents = [
        engine.normalize_torrent(
            {
                "hash": f"h{i}",
                "name": f"Movie.2025.Part{i}-NTb",
                "save_path": "/downloads",
                "size": 1024,
                "ratio": 3.0,
                "progress": 1.0,
                "state": "uploading",
                "tags": "已整理",
                "tracker": "https://tracker.example.com/announce",
            },
            "QB",
        )
        for i in range(50)
    ]

    orig_compile = re.compile
    compile_calls = 0

    def _counting_compile(*args, **kwargs):
        nonlocal compile_calls
        compile_calls += 1
        return orig_compile(*args, **kwargs)

    monkeypatch.setattr(re, "compile", _counting_compile)
    for torrent in torrents:
        matched, _ = engine.match_rule(torrent, rule)
        assert matched is True

    assert compile_calls == 0, f"匹配阶段不应重复调用 re.compile，实际调用了 {compile_calls} 次"

    # 若运行期动态修改规则正则字段，缓存应自动检测失效并重新编译一次
    rule.name_regex = r"NonExistentPattern"
    matched_after_mutation, _ = engine.match_rule(torrents[0], rule)
    assert matched_after_mutation is False
    assert compile_calls == 1


def test_tagged_torrents_skip_transferhistory_query_entirely(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """当所有种子均已带『已整理』标签时，巡检干跑也应做到 0 次 transferhistory 查询。"""
    torrents = [
        SimpleNamespace(
            hashString=f"tr_{i}",
            name=f"Show.S01E0{i}",
            downloadDir="/downloads/tv",
            totalSize=1024**3,
            uploadRatio=2.5,
            doneDate=100,
            addedDate=50,
            rateUpload=0,
            rateDownload=0,
            percentDone=1.0,
            status="seeding",
            labels=["已整理"],
            trackerStats=[],
            errorString="",
        )
        for i in range(10)
    ]
    plugin = _setup_plugin(monkeypatch, FakeDownloader(torrents), service_type="transmission")

    transfer_queries: List[str] = []

    def _count_transfer_sql(_conn, _cursor, statement, *_args):
        if "transferhistory" in statement.lower():
            transfer_queries.append(statement)

    event.listen(Engine, "before_cursor_execute", _count_transfer_sql)
    try:
        res = plugin.run_cleanup(dry_run=True)
    finally:
        event.remove(Engine, "before_cursor_execute", _count_transfer_sql)

    assert res["success"] is True
    assert len(res["candidates"]) == 10
    assert transfer_queries == []


def test_api_regex_test_length_limits_and_friendly_error() -> None:
    """api_regex_test 应拦截超长表达式与超长样本，并对非法正则返回友好提示。"""
    plugin = SeedCleaner()

    ok_resp = plugin.api_regex_test({"pattern": r"-(WiKi|FRDS)$", "text": "Movie.2025-WiKi"})
    assert ok_resp.success is True
    assert ok_resp.data["valid"] is True
    assert ok_resp.data["matched"] is True
    assert ok_resp.data["groups"] == ["WiKi"]

    bad_resp = plugin.api_regex_test({"pattern": "[unclosed", "text": "sample"})
    assert bad_resp.data["valid"] is False
    assert bad_resp.data["matched"] is False
    assert bad_resp.data["error"]

    long_pattern_resp = plugin.api_regex_test({"pattern": "a" * 513, "text": "sample"})
    assert long_pattern_resp.success is False

    long_text_resp = plugin.api_regex_test({"pattern": "abc", "text": "x" * 4097})
    assert long_text_resp.success is False
