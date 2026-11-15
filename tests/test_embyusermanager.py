"""EmbyUserManager 插件缺陷修复与数据库查询优化测试。"""
from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace
import pytest

import app.plugins.embyusermanager as emby_mod
from app.db.models.subscribehistory import SubscribeHistory
from app.db.models.user import User
from app.db.models.userconfig import UserConfig
from app.db.user_oper import UserOper
from app.plugins.embyusermanager import EmbyUserManager, _call_get_users


def test_plugin_loaded_from_current_repo() -> None:
    """确认测试加载的是当前插件仓库源码而非宿主旧副本。"""
    repo_root = Path(__file__).resolve().parents[1]
    assert Path(emby_mod.__file__).resolve().is_relative_to(repo_root)


def test_config_persisted_across_save_create_and_rename(monkeypatch: pytest.MonkeyPatch) -> None:
    """保存准入配置、新建用户自动加白名单、改名迁移名单均必须落库持久化。"""
    plugin = EmbyUserManager()
    # 清空初始配置
    plugin.update_config({})
    plugin.init_plugin({})

    # 1. api_save_config 传入已规范化字典时也必须落库
    normalized_payload = {
        "enabled": True,
        "allow_mode": "whitelist",
        "whitelist": ["alice"],
        "blacklist": ["mallory"],
        "allowed_servers": ["EmbyMain"],
        "allow_emby_admin": False,
    }
    save_resp = plugin.api_save_config(normalized_payload)
    assert save_resp.success is True
    persisted = plugin.get_config()
    assert persisted == normalized_payload

    # 模拟服务重启后重新加载插件
    reloaded = EmbyUserManager()
    update_spy_calls = []
    orig_update = reloaded.update_config
    monkeypatch.setattr(
        reloaded,
        "update_config",
        lambda cfg, *a, **kw: (update_spy_calls.append(cfg), orig_update(cfg, *a, **kw))[1],
    )
    reloaded.init_plugin(reloaded.get_config())
    assert reloaded._allow_mode == "whitelist"
    assert reloaded._whitelist == ["alice"]
    assert reloaded._allow_emby_admin is False
    # 配置已一致时启动加载不应产生多余写库
    assert update_spy_calls == []

    # 2. api_create_emby_user 勾选 add_to_whitelist 时必须落库
    fake_instance = SimpleNamespace(
        create_emby_user=lambda **kwargs: (True, "", {"Id": "u-bob", "Name": kwargs["name"]})
    )
    monkeypatch.setattr(
        "app.plugins.embyusermanager.MediaServerHelper.get_service",
        lambda self, name=None, type_filter=None: SimpleNamespace(instance=fake_instance),
    )
    create_resp = plugin.api_create_emby_user(
        {
            "server": "EmbyMain",
            "username": "bob",
            "password": "secret-password",
            "add_to_whitelist": True,
        }
    )
    assert create_resp.success is True
    assert plugin.get_config()["whitelist"] == ["alice", "bob"]

    # 3. 改名迁移黑白名单时必须落库
    fake_rename_instance = SimpleNamespace(update_user_name=lambda uid, new_name: (True, ""))
    monkeypatch.setattr(
        "app.plugins.embyusermanager.MediaServerHelper.get_service",
        lambda self, name=None, type_filter=None: SimpleNamespace(instance=fake_rename_instance),
    )
    rename_resp = plugin.api_update_emby_user(
        {
            "server": "EmbyMain",
            "user_id": "u-bob",
            "username": "bob",
            "new_username": "bob_renamed",
        }
    )
    assert rename_resp.success is True
    assert plugin.get_config()["whitelist"] == ["alice", "bob_renamed"]


def test_call_get_users_isolates_runtime_errors_without_double_call() -> None:
    """_call_get_users 遇到超时或运行时异常只调用一次并安全返回空列表，仅对签名不兼容回退。"""
    # 1. 支持 detailed 参数的实例仅调用一次
    detailed_calls = []

    class ModernEmby:
        def get_users(self, detailed: bool = False):
            detailed_calls.append(detailed)
            return [{"id": "1", "name": "alice"}]

    assert _call_get_users(ModernEmby(), detailed=False) == [{"id": "1", "name": "alice"}]
    assert detailed_calls == [False]

    # 2. 无参旧版实例正常调用一次
    legacy_calls = 0

    class LegacyEmby:
        def get_users(self):
            nonlocal legacy_calls
            legacy_calls += 1
            return [{"id": "2", "name": "bob"}]

    assert _call_get_users(LegacyEmby(), detailed=True) == [{"id": "2", "name": "bob"}]
    assert legacy_calls == 1

    # 3. 网络超时或运行时异常：绝不二次调用，绝不向外抛出异常
    timeout_calls = 0

    class TimeoutEmby:
        def get_users(self, detailed: bool = True):
            nonlocal timeout_calls
            timeout_calls += 1
            raise TimeoutError("Emby connect timeout")

    assert _call_get_users(TimeoutEmby(), detailed=True) == []
    assert timeout_calls == 1

    # 4. 函数体内部抛出 TypeError 时同样不应二次回退调用
    internal_type_error_calls = 0

    class BrokenPayloadEmby:
        def get_users(self, detailed: bool = True):
            nonlocal internal_type_error_calls
            internal_type_error_calls += 1
            raise TypeError("'NoneType' object is not iterable")

    assert _call_get_users(BrokenPayloadEmby(), detailed=True) == []
    assert internal_type_error_calls == 1


def test_migrate_and_delete_filter_by_username_instead_of_full_table_scan(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """改名迁移与删号应按 username 过滤查询 SubscribeHistory / UserConfig，禁止调用 .list() 全表拉取。"""
    plugin = EmbyUserManager()
    plugin.init_plugin({"enabled": True})

    # 清理残余数据
    for uname in ("migrate_src", "migrate_dst", "bystander"):
        User().delete_by_name(None, uname)

    UserOper().add(name="migrate_src", is_active=True, is_superuser=False, hashed_password="x")
    SubscribeHistory(name="测试剧集A", type="电视剧", username="migrate_src").create(None)
    SubscribeHistory(name="旁观者剧集", type="电影", username="bystander").create(None)
    UserConfig(username="migrate_src", key="CustomKey", value={"a": 1}).create(None)
    UserConfig(username="bystander", key="CustomKey", value={"b": 2}).create(None)

    # 禁止调用整表扫描 list()
    monkeypatch.setattr(
        SubscribeHistory,
        "list",
        classmethod(lambda cls, db=None: pytest.fail("禁止调用 SubscribeHistory.list 全表扫描")),
    )
    monkeypatch.setattr(
        UserConfig,
        "list",
        classmethod(lambda cls, db=None: pytest.fail("禁止调用 UserConfig.list 全表扫描")),
    )

    plugin._migrate_local_username("migrate_src", "migrate_dst")

    assert UserConfig.get_by_key(None, "migrate_src", "CustomKey") is None
    migrated_conf = UserConfig.get_by_key(None, "migrate_dst", "CustomKey")
    assert migrated_conf is not None and migrated_conf.value == {"a": 1}
    assert UserConfig.get_by_key(None, "bystander", "CustomKey") is not None

    from app.db import ScopedSession

    with ScopedSession() as session:
        dst_hist = (
            session.query(SubscribeHistory)
            .filter(SubscribeHistory.username == "migrate_dst")
            .all()
        )
        src_hist = (
            session.query(SubscribeHistory)
            .filter(SubscribeHistory.username == "migrate_src")
            .all()
        )
        bystander_hist = (
            session.query(SubscribeHistory)
            .filter(SubscribeHistory.username == "bystander")
            .all()
        )
    assert len(dst_hist) == 1
    assert len(src_hist) == 0
    assert len(bystander_hist) == 1

    # 删除用户时同样按 username 过滤清理 UserConfig，不影响旁观者
    del_resp = plugin.api_delete_user(
        {"username": "migrate_dst", "delete_mp_user": True, "delete_subscribes": False}
    )
    assert del_resp.success is True
    assert UserConfig.get_by_key(None, "migrate_dst", "CustomKey") is None
    assert UserConfig.get_by_key(None, "bystander", "CustomKey") is not None


def test_migrate_compatible_with_stub_models_and_duplicate_userconfig_keys(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """兼容无 ORM Mapper 的测试桩对象，且真实库遇到同名 UserConfig key 时安全去重不抛唯一约束异常。"""
    plugin = EmbyUserManager()
    plugin.init_plugin({"enabled": True})

    for uname in ("dup_src", "dup_dst"):
        User().delete_by_name(None, uname)
    UserConfig(username="dup_src", key="SharedKey", value={"v": "old"}).create(None)
    UserConfig(username="dup_dst", key="SharedKey", value={"v": "keep"}).create(None)

    plugin._migrate_local_username("dup_src", "dup_dst")
    assert UserConfig.get_by_key(None, "dup_src", "SharedKey") is None
    assert UserConfig.get_by_key(None, "dup_dst", "SharedKey").value == {"v": "keep"}

    # 测试桩对象回退兼容
    updated_records = []
    stub_hist = SimpleNamespace(
        username="stub_old",
        update=lambda _db, payload: updated_records.append(payload),
    )
    monkeypatch.setattr(
        emby_mod,
        "SubscribeHistory",
        SimpleNamespace(list=lambda _db: [stub_hist]),
    )
    plugin._migrate_local_username("stub_old", "stub_new")
    assert updated_records == [{"username": "stub_new"}]

