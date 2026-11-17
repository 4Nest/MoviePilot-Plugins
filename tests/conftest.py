"""MoviePilot-Plugins 单元测试引导：隔离数据库并将本仓 plugins.v2 挂载到最高优先级。"""
from __future__ import annotations

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
PLUGINS_V2_DIR = REPO_ROOT / "plugins.v2"
BACKEND_ROOT = Path(
    os.environ.get("MP_BACKEND_DIR")
    or (REPO_ROOT.parent / "moviepilot-neo")
).resolve()

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.testing.bootstrap import prepare_v2_backend  # noqa: E402

prepare_v2_backend(REPO_ROOT)

import app.plugins as _app_plugins  # noqa: E402

# 确保 app.plugins.<plugin> 优先从当前插件仓库 plugins.v2 加载，而非后端仓内旧副本
_plugins_v2_str = str(PLUGINS_V2_DIR)
if hasattr(_app_plugins, "__path__"):
    _existing_paths = [p for p in _app_plugins.__path__ if p != _plugins_v2_str]
    _app_plugins.__path__[:] = [_plugins_v2_str, *_existing_paths]

for _mod_name in list(sys.modules):
    if _mod_name.startswith(
        (
            "app.plugins.embyusermanager",
            "app.plugins.seedcleaner",
        )
    ):
        sys.modules.pop(_mod_name, None)

from app.testing.network_guard import block_real_network  # noqa: E402,F401


def pytest_sessionfinish(session, exitstatus):
    """释放后台线程与日志资源，保证测试进程干净退出。"""
    try:
        from app.helper.thread import ThreadHelper

        helper = ThreadHelper.get_existing_instance()
        if helper:
            helper.shutdown()
    except Exception:
        pass

    try:
        from app.helper.message import stop_message

        stop_message()
    except Exception:
        pass

    try:
        from app.log import LoggerManager

        LoggerManager.shutdown()
    except Exception:
        pass
