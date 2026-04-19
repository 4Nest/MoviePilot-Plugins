"""
API 端点模块
封装所有插件 API 处理逻辑
"""
from pathlib import Path
from typing import Any, Dict, List, Tuple

from app.log import logger


ALLOWED_STYLES = {
    "static_1", "static_2", "static_3", "static_4",
    "animated_1", "animated_2", "animated_3", "animated_4",
}


def api_clean_images(plugin) -> Dict[str, Any]:
    try:
        logger.info("【MediaCoverGenerator】收到立即清理图片缓存请求")
        plugin._MediaCoverGenerator__clean_generated_images()
        plugin._clean_images = False
        plugin._MediaCoverGenerator__update_config()
        return {"code": 0, "msg": "图片缓存清理完成"}
    except Exception as e:
        logger.error(f"【MediaCoverGenerator】立即清理图片失败: {e}", exc_info=True)
        return {"code": 1, "msg": f"图片缓存清理失败: {e}"}


def api_clean_fonts(plugin) -> Dict[str, Any]:
    try:
        logger.info("【MediaCoverGenerator】收到立即清理字体缓存请求")
        plugin._MediaCoverGenerator__clean_downloaded_fonts()
        plugin._clean_fonts = False
        plugin._MediaCoverGenerator__update_config()
        return {"code": 0, "msg": "字体缓存清理完成"}
    except Exception as e:
        logger.error(f"【MediaCoverGenerator】立即清理字体失败: {e}", exc_info=True)
        return {"code": 1, "msg": f"字体缓存清理失败: {e}"}


def api_generate_now(plugin, style: str = "") -> Dict[str, Any]:
    old_style = plugin._cover_style
    try:
        if not plugin._enabled:
            logger.warning("【MediaCoverGenerator】立即生成失败：插件未启用")
            return {"code": 1, "msg": "插件未启用，请先在设置页启用插件并保存"}
        if not plugin._selected_servers:
            logger.warning("【MediaCoverGenerator】立即生成失败：未勾选媒体服务器")
            return {"code": 1, "msg": "未勾选媒体服务器，请先在设置页勾选服务器并保存"}
        if not plugin._servers:
            logger.warning("【MediaCoverGenerator】立即生成失败：服务器连接信息为空")
            return {"code": 1, "msg": "服务器连接信息为空，请检查设置并保存后重试"}

        target_style = (style or "").strip()
        if target_style:
            if target_style not in ALLOWED_STYLES:
                return {"code": 1, "msg": f"不支持的风格: {target_style}"}
            plugin._cover_style = target_style
        logger.info(f"【MediaCoverGenerator】收到立即生成请求，风格: {plugin._cover_style}")
        tips = plugin._MediaCoverGenerator__update_all_libraries()
        return {"code": 0, "msg": tips or "封面生成任务已完成"}
    except Exception as e:
        logger.error(f"【MediaCoverGenerator】立即生成失败: {e}", exc_info=True)
        return {"code": 1, "msg": f"封面生成失败: {e}"}
    finally:
        plugin._cover_style = old_style


def api_set_cover_style(plugin, style: str = "") -> Dict[str, Any]:
    try:
        target_style = (style or "").strip()
        if target_style not in ALLOWED_STYLES:
            return {"code": 1, "msg": f"不支持的风格: {target_style}"}
        plugin._cover_style = target_style
        base, variant = plugin._MediaCoverGenerator__resolve_cover_style_ui(target_style)
        plugin._cover_style_base = base
        plugin._cover_style_variant = variant
        plugin._MediaCoverGenerator__update_config()
        logger.info(f"【MediaCoverGenerator】已保存封面风格: {target_style}")
        return {"code": 0, "msg": f"已保存风格: {target_style}"}
    except Exception as e:
        logger.error(f"【MediaCoverGenerator】保存封面风格失败: {e}", exc_info=True)
        return {"code": 1, "msg": f"保存风格失败: {e}"}


def _get_cover_style_parts(plugin) -> Tuple[str, int]:
    style = (plugin._cover_style or "static_1").strip()
    variant = "animated" if style.startswith("animated_") else "static"
    try:
        index = int(style.split("_")[-1])
    except Exception:
        index = 1
    index = max(1, min(4, index))
    return variant, index


def _set_cover_style_parts(plugin, variant: str, index: int):
    safe_variant = "animated" if variant == "animated" else "static"
    safe_index = max(1, min(4, int(index)))
    target_style = f"{safe_variant}_{safe_index}"
    plugin._cover_style = target_style
    plugin._cover_style_base = f"static_{safe_index}"
    plugin._cover_style_variant = safe_variant
    plugin._MediaCoverGenerator__update_config()
    logger.info(f"【MediaCoverGenerator】已保存封面风格: {target_style}")


def api_toggle_style_variant(plugin) -> Dict[str, Any]:
    try:
        variant, index = _get_cover_style_parts(plugin)
        new_variant = "animated" if variant == "static" else "static"
        _set_cover_style_parts(plugin, new_variant, index)
        return {"code": 0, "msg": f"已切换为{new_variant}风格{index}"}
    except Exception as e:
        logger.error(f"【MediaCoverGenerator】切换静态/动态失败: {e}", exc_info=True)
        return {"code": 1, "msg": f"切换失败: {e}"}


def _api_select_style(plugin, index: int) -> Dict[str, Any]:
    try:
        variant, _ = _get_cover_style_parts(plugin)
        _set_cover_style_parts(plugin, variant, index)
        return {"code": 0, "msg": f"已选择{variant}风格{index}"}
    except Exception as e:
        logger.error(f"【MediaCoverGenerator】选择风格失败: {e}", exc_info=True)
        return {"code": 1, "msg": f"选择风格失败: {e}"}


def api_select_style_1(plugin) -> Dict[str, Any]:
    return _api_select_style(plugin, 1)


def api_select_style_2(plugin) -> Dict[str, Any]:
    return _api_select_style(plugin, 2)


def api_select_style_3(plugin) -> Dict[str, Any]:
    return _api_select_style(plugin, 3)


def api_select_style_4(plugin) -> Dict[str, Any]:
    return _api_select_style(plugin, 4)


def _set_page_tab(plugin, tab: str):
    plugin._page_tab = tab if tab in ["generate-tab", "clean-tab"] else "generate-tab"
    logger.info(f"【MediaCoverGenerator】已切换页面Tab: {plugin._page_tab}")


def api_set_page_tab_generate(plugin) -> Dict[str, Any]:
    _set_page_tab(plugin, "generate-tab")
    return {"code": 0, "msg": "已切换到封面生成"}


def api_set_page_tab_clean(plugin) -> Dict[str, Any]:
    _set_page_tab(plugin, "clean-tab")
    return {"code": 0, "msg": "已切换到清理缓存"}
