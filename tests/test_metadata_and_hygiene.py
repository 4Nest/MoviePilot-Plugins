"""仓库插件元数据一致性、键名大小写对齐与运行目录纯净度测试。"""
from __future__ import annotations

import json
import re
from pathlib import Path

from app.plugins.embyusermanager import EmbyUserManager
from app.plugins.mediavaultbridge import MediaVaultBridge
from app.plugins.seedcleaner import SeedCleaner

REPO_ROOT = Path(__file__).resolve().parents[1]


def _extract_css_block(css_text: str, selector: str) -> str:
    pattern = re.compile(rf"{re.escape(selector)}\s*\{{([^}}]*)\}}", re.MULTILINE)
    matches = pattern.findall(css_text)
    return "\n".join(matches)


def test_plugin_frontend_antigravity_design_and_icon_contract() -> None:
    """联邦插件前端需对齐 Antigravity IDE 哑光分层规范，且不引入宿主未打包图标。"""
    emby_app = (REPO_ROOT / "frontend/embyusermanager/src/components/AppPage.vue").read_text(encoding="utf-8")
    emby_cfg = (REPO_ROOT / "frontend/embyusermanager/src/components/Config.vue").read_text(encoding="utf-8")
    seed_app = (REPO_ROOT / "frontend/seedcleaner/src/components/AppPage.vue").read_text(encoding="utf-8")
    seed_dry = (REPO_ROOT / "frontend/seedcleaner/src/components/DryRunPage.vue").read_text(encoding="utf-8")
    seed_cfg = (REPO_ROOT / "frontend/seedcleaner/src/components/Config.vue").read_text(encoding="utf-8")
    mv_app = (REPO_ROOT / "frontend/mediavaultbridge/src/components/AppPage.vue").read_text(encoding="utf-8")
    mv_cfg = (REPO_ROOT / "frontend/mediavaultbridge/src/components/Config.vue").read_text(encoding="utf-8")

    all_vue_sources = [emby_app, emby_cfg, seed_app, seed_dry, seed_cfg, mv_app, mv_cfg]

    # 1. 零重阴影、常规按钮不再使用 rounded="pill"、分段胶囊不再使用高饱和主色实心底
    for src in all_vue_sources:
        assert "0 6px 20px" not in src
        assert 'rounded="pill"' not in src
        assert "backdrop-filter" not in src

    assert "background: rgb(var(--v-theme-primary))" not in emby_app
    assert "background: rgb(var(--v-theme-primary))" not in seed_app
    assert "background: rgb(var(--v-theme-primary))" not in mv_app

    # 2. 外层页面消除居中限宽与横向缩进，严格对齐宿主流体左右基准线
    assert "padding: 2px 0 16px;" in _extract_css_block(emby_app, ".emby-page")
    assert "max-width: none;" in _extract_css_block(emby_app, ".emby-page")
    assert "padding: 2px 0 16px;" in _extract_css_block(seed_app, ".seed-page")
    assert "max-width: none;" in _extract_css_block(seed_app, ".seed-page")
    assert "padding: 2px 0 16px;" in _extract_css_block(mv_app, ".mv-page")
    assert "max-width: none;" in _extract_css_block(mv_app, ".mv-page")

    # 3. 卡片、表格容器、空状态框统一 12px 圆角与 0.08 极细描边
    for css_src, sel in [
        (emby_app, ".emby-card"),
        (emby_app, ".emby-empty"),
        (seed_app, ".seed-dl-card"),
        (seed_app, ".seed-table-card"),
        (seed_app, ".seed-empty-box"),
        (seed_dry, ".dry-table-card"),
        (seed_dry, ".dry-empty-box"),
        (mv_app, ".mv-card"),
        (mv_app, ".mv-table-card"),
        (mv_app, ".mv-empty-box"),
    ]:
        block = _extract_css_block(css_src, sel)
        assert "border-radius: 12px;" in block, f"{sel} 未对齐 12px 圆角"
        assert "rgba(var(--v-theme-on-surface), 0.08)" in block, f"{sel} 未对齐 0.08 极细描边"

    # 4. IDE 分段切换器（Segmented Control）槽与激活态实色 surface
    for css_src, slot_sel, active_sel in [
        (emby_app, ".emby-pills", ".emby-pill.is-active"),
        (seed_app, ".seed-pills", ".seed-pill.is-active"),
        (mv_app, ".mv-pills", ".mv-pill.is-active"),
    ]:
        slot_block = _extract_css_block(css_src, slot_sel)
        assert "padding: 3px;" in slot_block
        assert "border-radius: 9px;" in slot_block
        assert "rgba(var(--v-theme-on-surface), 0.04)" in slot_block
        assert "rgba(var(--v-theme-on-surface), 0.08)" in slot_block
        active_block = _extract_css_block(css_src, active_sel)
        assert "rgb(var(--v-theme-surface))" in active_block

    # 5. 弹窗统一 14px 圆角与紧凑 50px 标题栏
    for css_src, dlg_sel, hdr_sel in [
        (emby_app, ".emby-dialog", ".emby-dialog__header"),
        (seed_app, ".seed-dialog", ".seed-dialog__header"),
        (mv_app, ".mv-dialog", ".mv-dialog__header"),
    ]:
        assert "14px" in _extract_css_block(css_src, dlg_sel)
        assert "50px" in _extract_css_block(css_src, hdr_sel)

    # 6. 若同级目录存在宿主 icons-bundle.js，则校验所有 mdi-* 图标均已被宿主打包
    host_bundle = REPO_ROOT.parent / "moviepilot-neo-frontend/src/@iconify/icons-bundle.js"
    if host_bundle.is_file():
        bundle_text = host_bundle.read_text(encoding="utf-8")
        used_mdi = {
            m.removeprefix("mdi-")
            for src in all_vue_sources
            for m in re.findall(r"\bmdi-[a-z0-9-]+\b", src)
        }
        missing = sorted(icon for icon in used_mdi if f'"{icon}":' not in bundle_text)
        assert missing == [], f"发现宿主 icons-bundle.js 未打包的陌生 mdi 图标: {missing}"


def test_plugin_manifest_and_runtime_hygiene() -> None:
    """保留插件的键名、类名、版本号、Release 声明及运行目录结构必须完全一致且无源码残留。"""
    pkg = json.loads((REPO_ROOT / "package.v2.json").read_text(encoding="utf-8"))
    assert set(pkg.keys()) == {"EmbyUserManager", "SeedCleaner", "MediaVaultBridge"}

    expected = {
        "EmbyUserManager": (EmbyUserManager, "1.3.0"),
        "SeedCleaner": (SeedCleaner, "1.1.3"),
        "MediaVaultBridge": (MediaVaultBridge, "1.2.0"),
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
    assert "v1.3.0" in readme_text
    assert "v1.1.3" in readme_text
    assert "v1.2.0" in readme_text
    assert "bilibilinotify" not in readme_text.lower()
    assert "mediacovergenerator" not in readme_text.lower()
