"""仓库插件元数据一致性、行尾卫生与历史截断测试。"""
from __future__ import annotations

import json
from pathlib import Path

from app.plugins.bilibilinotify import BilibiliNotify
from app.plugins.embyusermanager import EmbyUserManager
from app.plugins.mediacovergenerator import MediaCoverGenerator
from app.plugins.seedcleaner import SeedCleaner

REPO_ROOT = Path(__file__).resolve().parents[1]


def test_author_urls_and_versions_consistent() -> None:
    """四个插件的 author_url 应统一为作者主页，且版本号与 package.v2.json 及 README.md 一致。"""
    for plugin_cls in (BilibiliNotify, MediaCoverGenerator, EmbyUserManager, SeedCleaner):
        assert plugin_cls.author_url == "https://github.com/4Nest"

    assert BilibiliNotify.plugin_version == "1.0.1"
    assert EmbyUserManager.plugin_version == "1.2.2"
    assert SeedCleaner.plugin_version == "1.1.1"

    pkg = json.loads((REPO_ROOT / "package.v2.json").read_text(encoding="utf-8"))
    assert pkg["bilibilinotify"]["version"] == "1.0.1"
    assert "v1.0.1" in pkg["bilibilinotify"].get("history", {})
    assert pkg["EmbyUserManager"]["version"] == "1.2.2"
    assert "v1.2.2" in pkg["EmbyUserManager"].get("history", {})
    assert pkg["SeedCleaner"]["version"] == "1.1.1"
    assert "v1.1.1" in pkg["SeedCleaner"].get("history", {})

    readme_text = (REPO_ROOT / "README.md").read_text(encoding="utf-8")
    assert "v1.2.2" in readme_text
    assert "v1.1.1" in readme_text


def test_bilibilinotify_lf_line_endings_and_history_cap(monkeypatch) -> None:
    """bilibilinotify 源码必须为 UTF-8 无 BOM + LF 行尾，且 _history 具备实例隔离与条数上限截断。"""
    raw_bytes = (REPO_ROOT / "plugins.v2" / "bilibilinotify" / "__init__.py").read_bytes()
    assert not raw_bytes.startswith(b"\xef\xbb\xbf")
    assert b"\r\n" not in raw_bytes

    first = BilibiliNotify()
    second = BilibiliNotify()
    monkeypatch.setattr(first, "update_config", lambda cfg: True)
    monkeypatch.setattr(second, "update_config", lambda cfg: True)

    bloated_history = [f"season_{i}" for i in range(500)]
    first.init_plugin({"enabled": False, "history": bloated_history})
    second.init_plugin({"enabled": False})

    assert len(first._history) <= 200
    assert first._history[-1] == "season_499"
    assert second._history == []

    # 验证 clear_history=True（即使未开启 run_once）也会立即清空并落库
    saved_configs = []
    monkeypatch.setattr(first, "update_config", lambda cfg: saved_configs.append(cfg) or True)
    first.init_plugin({"enabled": False, "history": ["s1", "s2"], "clear_history": True})
    assert first._history == []
    assert saved_configs and saved_configs[-1]["history"] == []
    assert saved_configs[-1]["clear_history"] is False

