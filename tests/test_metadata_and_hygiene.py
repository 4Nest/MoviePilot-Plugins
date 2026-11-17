"""仓库插件元数据一致性、键名大小写对齐与运行目录纯净度测试。"""
from __future__ import annotations

import json
from pathlib import Path

from app.plugins.embyusermanager import EmbyUserManager
from app.plugins.seedcleaner import SeedCleaner

REPO_ROOT = Path(__file__).resolve().parents[1]


def test_plugin_manifest_and_runtime_hygiene() -> None:
    """保留插件的键名、类名、版本号、Release 声明及运行目录结构必须完全一致且无源码残留。"""
    pkg = json.loads((REPO_ROOT / "package.v2.json").read_text(encoding="utf-8"))
    assert set(pkg.keys()) == {"EmbyUserManager", "SeedCleaner"}

    expected = {
        "EmbyUserManager": (EmbyUserManager, "1.2.3"),
        "SeedCleaner": (SeedCleaner, "1.1.2"),
    }
    for pid, (cls, ver) in expected.items():
        assert cls.__name__ == pid
        assert cls.author_url == "https://github.com/4Nest"
        assert cls.plugin_version == ver
        assert pkg[pid]["version"] == ver
        assert pkg[pid]["release"] is True
        assert f"v{ver}" in pkg[pid].get("history", {})

        runtime_dir = REPO_ROOT / "plugins.v2" / pid.lower()
        assert runtime_dir.is_dir()
        assert (runtime_dir / "__init__.py").is_file()
        assert (runtime_dir / "dist" / "assets" / "remoteEntry.js").is_file()
        assert not (runtime_dir / "frontend").exists()
        assert list(runtime_dir.rglob(".DS_Store")) == []

    assert not (REPO_ROOT / "plugins.v2" / "bilibilinotify").exists()
    assert not (REPO_ROOT / "plugins.v2" / "mediacovergenerator").exists()

    readme_text = (REPO_ROOT / "README.md").read_text(encoding="utf-8")
    assert "v1.2.3" in readme_text
    assert "v1.1.2" in readme_text
    assert "bilibilinotify" not in readme_text.lower()
    assert "mediacovergenerator" not in readme_text.lower()
