"""MediaVaultBridge 联动插件核心引擎与 API 回归测试。"""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock

from app.core.event import Event
from app.plugins.mediavaultbridge import MediaVaultBridge
from app.plugins.mediavaultbridge.engine import (
    PathMappingRule,
    classify_failed_event,
    evaluate_retry_candidates,
    extract_115_share_urls,
    map_mp_path_to_mv,
)
from app.schemas.types import EventType


def test_path_mapping_longest_prefix() -> None:
    """路径映射应按最长前缀匹配并自动取文件父目录。"""
    rules = [
        PathMappingRule(mp_prefix="/media/link", mv_cloud_prefix="/media", mv_strm_prefix="/strm"),
        PathMappingRule(
            mp_prefix="/media/link/Anime",
            mv_cloud_prefix="/media/AnimeCloud",
            mv_strm_prefix="/strm/Anime",
            storage="115-anime",
        ),
    ]
    mapped = map_mp_path_to_mv(
        "/media/link/Anime/日番/测试番 (2026)/Season 01/ep01.mkv",
        rules,
        use_parent_dir=True,
    )
    assert mapped is not None
    assert mapped["storage"] == "115-anime"
    assert mapped["cloud_dir"] == "/media/AnimeCloud/日番/测试番 (2026)/Season 01"
    assert mapped["strm_dir"] == "/strm/Anime/日番/测试番 (2026)/Season 01"


def test_classify_and_evaluate_failed_uploads() -> None:
    """失败上传评估应正确区分可重试、需人工核对、冷却中与超限项。"""
    events = [
        {"id": 101, "file_name": "a.mkv", "error": "connection timed out"},
        {
            "id": 102,
            "file_name": "b.mkv",
            "message": "115 已接受上传请求，源文件已保留，请先核对云盘文件，勿重复上传。",
        },
        {"id": 103, "file_name": "c.mkv", "error": "502 bad gateway"},
        {"id": 104, "file_name": "d.mkv", "error": "network reset"},
    ]
    cat, _ = classify_failed_event(events[1])
    assert cat == "manual_confirm"

    tracker = {
        "103": {"attempts": 1, "last_ts": 1000.0},
        "104": {"attempts": 3, "last_ts": 100.0},
    }
    res = evaluate_retry_candidates(
        failed_events=events,
        retry_tracker=tracker,
        max_retries=3,
        cooldown_minutes=15,
        now_ts=1200.0,
    )
    assert [e["id"] for e in res["to_retry"]] == [101]
    assert [e["id"] for e in res["manual_confirm"]] == [102]
    assert [e["id"] for e in res["cooldown"]] == [103]
    assert [e["id"] for e in res["exhausted"]] == [104]


def test_extract_115_share_urls() -> None:
    """应从消息中准确提取 115 分享链接及访问码。"""
    text = "帮忙转存 https://115cdn.com/s/sw3abc12345 访问码：9x2k 谢谢"
    links = extract_115_share_urls(text)
    assert links == [
        {"share_url": "https://115cdn.com/s/sw3abc12345", "receive_code": "9x2k"}
    ]

    text2 = "https://115.com/s/sw3xyz99999?password=abcd"
    assert extract_115_share_urls(text2) == [
        {"share_url": "https://115.com/s/sw3xyz99999?password=abcd", "receive_code": "abcd"}
    ]


def test_upload_retry_cycle_skips_manual_and_retries_safe() -> None:
    """自动巡检应仅批量重试可安全项，并对需人工核对项去重告警。"""
    plugin = MediaVaultBridge()
    plugin.init_plugin(
        {
            "enabled": True,
            "mv_url": "http://127.0.0.1:7811",
            "mv_api_key": "test-key",
            "notify": True,
        }
    )

    fake_client = MagicMock()
    fake_client.is_configured.return_value = True
    fake_client.monitor_events.return_value = {
        "items": [
            {"id": 201, "file_name": "ok_retry.mkv", "error": "ReadTimeout"},
            {"id": 202, "file_name": "manual.mkv", "message": "请先核对云盘文件，勿重复上传"},
        ]
    }
    plugin._build_client = MagicMock(return_value=fake_client)
    plugin._send_notice = MagicMock()

    result = plugin.run_upload_retry_cycle(source="test")
    assert result["success"] is True
    assert result["retried_ids"] == [201]
    assert result["manual_confirm_count"] == 1
    fake_client.batch_retry_monitor_events.assert_called_once_with(event_ids=[201], force=False)
    assert plugin._send_notice.call_count == 2


def test_delete_hook_and_user_message_share() -> None:
    """删片事件与用户分享链消息应按开关调用对应 MediaVault 接口。"""
    plugin = MediaVaultBridge()
    plugin.init_plugin(
        {
            "enabled": True,
            "mv_url": "http://127.0.0.1:7811",
            "mv_api_key": "test-key",
            "delete_hooks": {"enabled": True, "trigger_cleanup_scan": True, "trigger_orphan_scan": True},
            "share_transfer": {"enabled": True, "listen_user_message": True, "default_target_path": "/media/Inbox"},
        }
    )

    fake_client = MagicMock()
    fake_client.is_configured.return_value = True
    plugin._build_client = MagicMock(return_value=fake_client)
    plugin._send_notice = MagicMock()

    del_event = Event(
        EventType.HistoryDeleted,
        {"dest": "/media/link/Movie/Demo (2026)/demo.mkv"},
    )
    plugin.on_history_deleted(del_event)
    fake_client.strm_cleanup_scan.assert_called_once()
    fake_client.orphan_index_scan.assert_called_once()

    msg_event = Event(
        EventType.UserMessage,
        {"text": "转存一下 https://115.com/s/sw3demo1234 提取码:1a2b"},
    )
    plugin.on_user_message(msg_event)
    fake_client.share_receive.assert_called_once_with(
        share_url="https://115.com/s/sw3demo1234",
        target_path="/media/Inbox",
        storage="115-default",
        receive_code="1a2b",
    )

    # 验证渲染模式与侧栏入口
    assert plugin.get_render_mode() == ("vue", "dist/assets")
    nav = plugin.get_sidebar_nav()
    assert len(nav) == 1 and nav[0]["nav_key"] == "main"
    assert isinstance(SimpleNamespace(ok=True), SimpleNamespace)
