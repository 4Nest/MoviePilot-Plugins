import { importShared } from './__federation_fn_import-JrT3xvdd.js';
import { _ as _export_sfc } from './_plugin-vue_export-helper-pcqpp-6-.js';

const {defineComponent:_defineComponent} = await importShared('vue');

const {resolveComponent:_resolveComponent,createVNode:_createVNode,createElementVNode:_createElementVNode,toDisplayString:_toDisplayString,createTextVNode:_createTextVNode,normalizeClass:_normalizeClass,withCtx:_withCtx,renderList:_renderList,Fragment:_Fragment,openBlock:_openBlock,createElementBlock:_createElementBlock,createCommentVNode:_createCommentVNode,createBlock:_createBlock,mergeProps:_mergeProps} = await importShared('vue');

const _hoisted_1 = { class: "emby-page" };
const _hoisted_2 = { class: "emby-topbar" };
const _hoisted_3 = { class: "emby-topbar__left" };
const _hoisted_4 = { class: "emby-topbar__icon" };
const _hoisted_5 = { class: "emby-topbar__heading" };
const _hoisted_6 = { class: "emby-topbar__title-row" };
const _hoisted_7 = { class: "emby-tag" };
const _hoisted_8 = { class: "emby-topbar__actions" };
const _hoisted_9 = { class: "emby-toolbar" };
const _hoisted_10 = { class: "emby-toolbar__left" };
const _hoisted_11 = {
  class: "emby-pills emby-pills--mode",
  role: "tablist",
  "aria-label": "功能视图切换"
};
const _hoisted_12 = {
  class: "emby-pills",
  role: "group",
  "aria-label": "用户状态筛选"
};
const _hoisted_13 = ["onClick"];
const _hoisted_14 = {
  class: "emby-sub-counter",
  title: "全员电影与剧集订阅总数"
};
const _hoisted_15 = {
  key: 1,
  class: "emby-pills",
  role: "group",
  "aria-label": "审批状态筛选"
};
const _hoisted_16 = ["onClick"];
const _hoisted_17 = { class: "emby-toolbar__right" };
const _hoisted_18 = { class: "d-flex flex-wrap align-center justify-space-between ga-2" };
const _hoisted_19 = {
  key: 1,
  class: "emby-empty"
};
const _hoisted_20 = { class: "text-subtitle-1 font-weight-bold" };
const _hoisted_21 = { class: "text-body-2 text-medium-emphasis mt-1 mb-3" };
const _hoisted_22 = {
  key: 2,
  class: "emby-approval-list"
};
const _hoisted_23 = { class: "emby-approval-card__poster" };
const _hoisted_24 = ["src", "alt"];
const _hoisted_25 = {
  key: 1,
  class: "emby-approval-card__poster-fallback"
};
const _hoisted_26 = { class: "emby-approval-card__main" };
const _hoisted_27 = { class: "emby-approval-card__title-row" };
const _hoisted_28 = { class: "emby-approval-card__title" };
const _hoisted_29 = {
  key: 0,
  class: "emby-approval-card__year"
};
const _hoisted_30 = {
  key: 1,
  class: "emby-chip is-neutral"
};
const _hoisted_31 = {
  key: 2,
  class: "emby-approval-card__vote"
};
const _hoisted_32 = { class: "emby-approval-card__meta" };
const _hoisted_33 = ["title"];
const _hoisted_34 = { class: "emby-approval-card__actions" };
const _hoisted_35 = {
  key: 0,
  class: "emby-empty"
};
const _hoisted_36 = { class: "text-subtitle-1 font-weight-bold" };
const _hoisted_37 = { class: "text-body-2 text-medium-emphasis mt-1 mb-3" };
const _hoisted_38 = {
  key: 1,
  class: "emby-grid"
};
const _hoisted_39 = { class: "emby-card__head" };
const _hoisted_40 = { class: "emby-card__avatar" };
const _hoisted_41 = { class: "emby-card__identity" };
const _hoisted_42 = { class: "emby-card__name-line" };
const _hoisted_43 = ["title"];
const _hoisted_44 = {
  key: 1,
  class: "emby-chip is-success"
};
const _hoisted_45 = {
  key: 2,
  class: "emby-chip is-error"
};
const _hoisted_46 = {
  key: 3,
  class: "emby-chip is-primary"
};
const _hoisted_47 = {
  key: 4,
  class: "emby-chip is-info"
};
const _hoisted_48 = ["onClick"];
const _hoisted_49 = ["title"];
const _hoisted_50 = { class: "emby-card__stats" };
const _hoisted_51 = ["onClick"];
const _hoisted_52 = ["title"];
const _hoisted_53 = { class: "emby-card__footer" };
const _hoisted_54 = { class: "d-flex align-center ga-2" };
const _hoisted_55 = {
  key: 0,
  class: "text-caption text-medium-emphasis"
};
const _hoisted_56 = { class: "font-weight-bold mb-1" };
const _hoisted_57 = { class: "d-flex align-center ga-2" };
const _hoisted_58 = { class: "emby-pwd-box" };
const _hoisted_59 = { class: "d-flex align-center justify-space-between" };
const _hoisted_60 = { class: "d-flex align-center ga-2 text-body-2 font-weight-medium" };
const _hoisted_61 = {
  key: 0,
  class: "text-caption text-medium-emphasis"
};
const _hoisted_62 = { class: "d-flex align-center ga-2" };
const _hoisted_63 = { class: "d-flex align-center ga-2" };
const _hoisted_64 = {
  key: 1,
  class: "text-center py-6 text-medium-emphasis text-body-2"
};
const _hoisted_65 = {
  key: 0,
  class: "text-caption text-medium-emphasis"
};
const _hoisted_66 = {
  key: 1,
  class: "text-caption ms-1"
};
const _hoisted_67 = { class: "d-flex align-center ga-2" };
const {computed,inject,onMounted,reactive,ref} = await importShared('vue');

const _sfc_main = /* @__PURE__ */ _defineComponent({
  __name: "AppPage",
  props: {
    api: {
      type: Object,
      default: () => ({})
    },
    pluginId: {
      type: String,
      default: "EmbyUserManager"
    },
    navKey: {
      type: String,
      default: "main"
    }
  },
  emits: ["action", "switch", "close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const toast = inject("moviepilot:toast", null);
    const loading = ref(false);
    const savingConfig = ref(false);
    const activeTab = ref("users");
    const keyword = ref("");
    const statusFilter = ref("all");
    const approvalFilter = ref("pending");
    const actingApprovalIds = ref({});
    const batchApproving = ref(false);
    const clearingHistory = ref(false);
    const config = ref({
      enabled: true,
      allow_mode: "all",
      whitelist: [],
      blacklist: [],
      allowed_servers: [],
      allow_emby_admin: true,
      subscribe_approval_enabled: false,
      approval_bypass_users: [],
      approval_notify_telegram: true,
      approval_tg_chat_id: ""
    });
    const servers = ref([]);
    const stats = ref({
      emby_user_count: 0,
      mp_registered_count: 0,
      allowed_user_count: 0,
      total_subscribe_count: 0,
      pending_approval_count: 0
    });
    const users = ref([]);
    const approvals = ref([]);
    const settingsDialog = ref(false);
    const whitelistInput = ref("");
    const blacklistInput = ref("");
    const approvalBypassInput = ref("");
    const createDialog = ref(false);
    const creatingUser = ref(false);
    const showCreatePassword = ref(false);
    const createdCredential = ref(null);
    const createForm = reactive({
      server: "",
      username: "",
      password: "",
      copy_from_user_id: "",
      is_admin: false,
      is_hidden: true,
      enable_all_folders: true,
      enabled_folders: [],
      enable_remote_access: true,
      enable_downloading: true,
      enable_video_transcoding: true,
      enable_audio_transcoding: true,
      simultaneous_stream_limit: 0,
      add_to_whitelist: false,
      add_to_approval_bypass: false
    });
    const editDialog = ref(false);
    const editLoading = ref(false);
    const savingEdit = ref(false);
    const showEditPassword = ref(false);
    const editTargetUser = ref(null);
    const editForm = reactive({
      server: "",
      user_id: "",
      username: "",
      new_username: "",
      change_password: false,
      new_password: "",
      mp_is_active: true,
      is_admin: false,
      is_disabled: false,
      is_hidden: true,
      enable_all_folders: true,
      enabled_folders: [],
      enable_remote_access: true,
      enable_downloading: true,
      enable_video_transcoding: true,
      enable_audio_transcoding: true,
      simultaneous_stream_limit: 0
    });
    const subDialog = ref(false);
    const subDialogUser = ref("");
    const subDialogLoading = ref(false);
    const userSubscribes = ref([]);
    const deleteDialog = ref(false);
    const deleteTargetUser = ref(null);
    const deleteFromEmby = ref(false);
    const deleteMpUser = ref(true);
    const deleteWithSubscribes = ref(false);
    const deletingUser = ref(false);
    const resolvedPluginId = computed(() => props.pluginId || "EmbyUserManager");
    const createServerObj = computed(() => servers.value.find((s) => s.name === createForm.server) || servers.value[0]);
    const createServerFolders = computed(() => createServerObj.value?.folders || []);
    const createTemplateUsers = computed(() => createServerObj.value?.users || []);
    const editServerObj = computed(() => servers.value.find((s) => s.name === editForm.server) || servers.value[0]);
    const editServerFolders = ref([]);
    const filterPills = computed(() => [
      { value: "all", label: "全部", count: users.value.length },
      { value: "allowed", label: "可登录", count: users.value.filter((u) => u.access_status === "allowed").length },
      {
        value: "blocked",
        label: "准入拦截",
        count: users.value.filter((u) => u.access_status === "blocked").length
      },
      { value: "disabled", label: "已禁用", count: users.value.filter((u) => u.access_status === "disabled").length },
      { value: "registered", label: "已登录 MP", count: stats.value.mp_registered_count }
    ]);
    const pendingApprovalCount = computed(() => approvals.value.filter((item) => item.status === "pending").length);
    const handledApprovalCount = computed(() => approvals.value.filter((item) => item.status !== "pending").length);
    const approvalPills = computed(() => [
      { value: "pending", label: "待审批", count: pendingApprovalCount.value },
      {
        value: "approved",
        label: "已通过",
        count: approvals.value.filter((i) => i.status === "approved").length
      },
      {
        value: "manual",
        label: "手动入库",
        count: approvals.value.filter((i) => i.status === "manual").length
      },
      {
        value: "rejected",
        label: "已拒绝",
        count: approvals.value.filter((i) => i.status === "rejected").length
      },
      { value: "all", label: "全部", count: approvals.value.length }
    ]);
    function notifySuccess(msg) {
      toast?.success(msg);
    }
    function notifyError(msg) {
      toast?.error(msg);
    }
    function parseListText(text) {
      return text.replace(/\n/g, ",").split(",").map((item) => item.trim()).filter((item, idx, arr) => Boolean(item) && arr.indexOf(item) === idx);
    }
    async function fetchOverview() {
      if (!props.api?.get) return;
      loading.value = true;
      try {
        const res = await props.api.get(`plugin/${resolvedPluginId.value}/overview`);
        if (res?.success && res.data) {
          config.value = {
            enabled: Boolean(res.data.config?.enabled ?? true),
            allow_mode: res.data.config?.allow_mode || "all",
            whitelist: res.data.config?.whitelist || [],
            blacklist: res.data.config?.blacklist || [],
            allowed_servers: res.data.config?.allowed_servers || [],
            allow_emby_admin: Boolean(res.data.config?.allow_emby_admin ?? true),
            subscribe_approval_enabled: Boolean(res.data.config?.subscribe_approval_enabled ?? false),
            approval_bypass_users: res.data.config?.approval_bypass_users || [],
            approval_notify_telegram: Boolean(res.data.config?.approval_notify_telegram ?? true),
            approval_tg_chat_id: String(res.data.config?.approval_tg_chat_id ?? "")
          };
          whitelistInput.value = config.value.whitelist.join(", ");
          blacklistInput.value = config.value.blacklist.join(", ");
          approvalBypassInput.value = config.value.approval_bypass_users.join(", ");
          servers.value = res.data.servers || [];
          stats.value = {
            ...stats.value,
            ...res.data.stats || {}
          };
          users.value = res.data.users || [];
          approvals.value = Array.isArray(res.data.approvals) ? res.data.approvals : [];
        }
      } catch (err) {
        console.error("加载 Emby 用户概览失败:", err);
        notifyError("加载 Emby 用户概览失败");
      } finally {
        loading.value = false;
      }
    }
    const filteredUsers = computed(() => {
      const kw = keyword.value.trim().toLowerCase();
      return users.value.filter((user) => {
        if (kw && !user.username.toLowerCase().includes(kw)) return false;
        if (statusFilter.value === "registered" && !user.registered_in_mp) return false;
        if (statusFilter.value !== "all" && statusFilter.value !== "registered" && user.access_status !== statusFilter.value) {
          return false;
        }
        return true;
      });
    });
    const filteredApprovals = computed(() => {
      const kw = keyword.value.trim().toLowerCase();
      return approvals.value.filter((item) => {
        if (approvalFilter.value !== "all" && item.status !== approvalFilter.value) return false;
        if (kw) {
          const hay = `${item.title || ""} ${item.username || ""} ${item.year || ""}`.toLowerCase();
          if (!hay.includes(kw)) return false;
        }
        return true;
      });
    });
    function approvalStatusLabel(status) {
      if (status === "approved") return "已通过并提交 MP";
      if (status === "manual") return "已标记手动入库";
      if (status === "rejected") return "已拒绝";
      return "待审批";
    }
    function jumpToUserApprovals(username) {
      activeTab.value = "approvals";
      approvalFilter.value = "pending";
      keyword.value = username;
    }
    function statusLabel(status) {
      if (status === "allowed") return "允许登录";
      if (status === "blocked") return "准入拦截";
      return "已禁用";
    }
    function allowModeLabel(mode) {
      if (mode === "whitelist") return `白名单 (${config.value.whitelist.length})`;
      if (mode === "blacklist") return `黑名单 (${config.value.blacklist.length})`;
      return "全部允许";
    }
    function formatCompactTime(value) {
      if (!value) return "暂无活跃";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1e3);
      if (diffSec >= 0 && diffSec < 60) return "刚刚";
      if (diffSec >= 60 && diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
      if (diffSec >= 3600 && diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`;
      if (diffSec >= 86400 && diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} 天前`;
      const pad = (n) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }
    function primaryServerAccount(user) {
      const map = user.server_accounts || {};
      const firstServer = user.emby_servers[0];
      if (firstServer && map[firstServer]) return map[firstServer];
      const keys = Object.keys(map);
      return keys.length ? map[keys[0]] : null;
    }
    function userMetaSummary(user) {
      const serverPart = user.emby_servers.length ? user.emby_servers.join("、") : "仅本地记录";
      const acc = primaryServerAccount(user);
      if (!acc) return serverPart;
      const folderPart = acc.enable_all_folders ? "全部媒体库" : `${acc.enabled_folders?.length || 0} 个媒体库`;
      const pwdPart = user.has_password === false ? " · 免密" : "";
      return `${serverPart} · ${folderPart}${pwdPart}`;
    }
    function copyPasswordText(pwd) {
      if (!pwd) return;
      navigator.clipboard?.writeText(pwd);
      notifySuccess("密码已复制到剪贴板");
    }
    function openCreateDialog() {
      if (!servers.value.length) {
        notifyError("当前没有已启用的 Emby 媒体服务器实例");
        return;
      }
      createForm.server = servers.value[0].name;
      createForm.username = "";
      createForm.password = "";
      createForm.copy_from_user_id = "";
      createForm.is_admin = false;
      createForm.is_hidden = true;
      createForm.enable_all_folders = true;
      createForm.enabled_folders = [];
      createForm.enable_remote_access = true;
      createForm.enable_downloading = true;
      createForm.enable_video_transcoding = true;
      createForm.enable_audio_transcoding = true;
      createForm.simultaneous_stream_limit = 0;
      createForm.add_to_whitelist = config.value.allow_mode === "whitelist";
      createForm.add_to_approval_bypass = false;
      showCreatePassword.value = false;
      createdCredential.value = null;
      createDialog.value = true;
    }
    async function submitCreateUser() {
      if (!props.api?.post) return;
      const uname = createForm.username.trim();
      if (!uname) {
        notifyError("请输入新 Emby 用户名");
        return;
      }
      creatingUser.value = true;
      try {
        const payload = {
          server: createForm.server,
          username: uname,
          password: createForm.password,
          copy_from_user_id: createForm.copy_from_user_id || "",
          add_to_whitelist: createForm.add_to_whitelist,
          add_to_approval_bypass: createForm.add_to_approval_bypass
        };
        if (!createForm.copy_from_user_id) {
          Object.assign(payload, {
            is_admin: createForm.is_admin,
            is_hidden: createForm.is_hidden,
            enable_all_folders: createForm.enable_all_folders,
            enabled_folders: createForm.enable_all_folders ? [] : createForm.enabled_folders,
            enable_remote_access: createForm.enable_remote_access,
            enable_downloading: createForm.enable_downloading,
            enable_video_transcoding: createForm.enable_video_transcoding,
            enable_audio_transcoding: createForm.enable_audio_transcoding,
            simultaneous_stream_limit: Number(createForm.simultaneous_stream_limit) || 0
          });
        }
        const res = await props.api.post(`plugin/${resolvedPluginId.value}/emby/user/create`, payload);
        if (res?.success) {
          notifySuccess(res.message || "创建 Emby 账号成功");
          if (res.data?.generated_password && res.data?.password) {
            createdCredential.value = {
              username: res.data.username,
              password: res.data.password
            };
          } else {
            createDialog.value = false;
          }
          await fetchOverview();
        } else {
          notifyError(res?.message || "创建 Emby 账号失败");
        }
      } catch (err) {
        console.error(err);
        notifyError("创建 Emby 账号请求失败");
      } finally {
        creatingUser.value = false;
      }
    }
    async function loadEditServerDetail(user, serverName) {
      const acc = user.server_accounts?.[serverName];
      editForm.server = serverName;
      editForm.username = user.username;
      editForm.new_username = user.username;
      editForm.change_password = false;
      editForm.new_password = "";
      editForm.mp_is_active = user.is_active;
      editServerFolders.value = editServerObj.value?.folders || [];
      if (acc) {
        editForm.user_id = acc.user_id;
        editForm.is_admin = acc.is_admin;
        editForm.is_disabled = acc.is_disabled;
        editForm.is_hidden = acc.is_hidden;
        editForm.enable_all_folders = acc.enable_all_folders;
        editForm.enabled_folders = [...acc.enabled_folders || []];
        editForm.enable_remote_access = acc.enable_remote_access;
        editForm.enable_downloading = acc.enable_downloading;
        editForm.enable_video_transcoding = acc.enable_video_transcoding;
        editForm.enable_audio_transcoding = acc.enable_audio_transcoding;
        editForm.simultaneous_stream_limit = acc.simultaneous_stream_limit || 0;
      }
      if (!props.api?.get || !acc?.user_id) return;
      editLoading.value = true;
      try {
        const res = await props.api.get(`plugin/${resolvedPluginId.value}/emby/user`, {
          params: { server: serverName, user_id: acc.user_id }
        });
        if (res?.success && res.data) {
          const p = res.data.policy || {};
          editForm.user_id = res.data.user_id || acc.user_id;
          editForm.new_username = res.data.username || user.username;
          editForm.is_admin = Boolean(p.is_admin);
          editForm.is_disabled = Boolean(p.is_disabled);
          editForm.is_hidden = Boolean(p.is_hidden ?? true);
          editForm.enable_all_folders = Boolean(p.enable_all_folders ?? true);
          editForm.enabled_folders = Array.isArray(p.enabled_folders) ? [...p.enabled_folders] : [];
          editForm.enable_remote_access = Boolean(p.enable_remote_access ?? true);
          editForm.enable_downloading = Boolean(p.enable_downloading ?? true);
          editForm.enable_video_transcoding = Boolean(p.enable_video_transcoding ?? true);
          editForm.enable_audio_transcoding = Boolean(p.enable_audio_transcoding ?? true);
          editForm.simultaneous_stream_limit = Number(p.simultaneous_stream_limit) || 0;
          if (Array.isArray(res.data.folders) && res.data.folders.length) {
            editServerFolders.value = res.data.folders;
          }
        }
      } catch (err) {
        console.error("获取 Emby 用户实时详情失败:", err);
      } finally {
        editLoading.value = false;
      }
    }
    async function openEditDialog(user) {
      if (!user.emby_servers.length) {
        notifyError("该账号仅存在于本地记录中，不在 Emby 服务器上");
        return;
      }
      editTargetUser.value = user;
      showEditPassword.value = false;
      editDialog.value = true;
      await loadEditServerDetail(user, user.emby_servers[0]);
    }
    async function onEditServerChange(nextServer) {
      if (!editTargetUser.value || !nextServer) return;
      await loadEditServerDetail(editTargetUser.value, nextServer);
    }
    async function submitEditUser() {
      if (!props.api?.post || !editForm.user_id) return;
      if (!editForm.new_username.trim()) {
        notifyError("用户名不能为空");
        return;
      }
      savingEdit.value = true;
      try {
        const res = await props.api.post(`plugin/${resolvedPluginId.value}/emby/user/update`, {
          server: editForm.server,
          user_id: editForm.user_id,
          username: editForm.username,
          new_username: editForm.new_username.trim(),
          change_password: editForm.change_password,
          new_password: editForm.new_password,
          mp_is_active: editForm.mp_is_active,
          policy: {
            is_admin: editForm.is_admin,
            is_disabled: editForm.is_disabled,
            is_hidden: editForm.is_hidden,
            enable_all_folders: editForm.enable_all_folders,
            enabled_folders: editForm.enable_all_folders ? [] : editForm.enabled_folders,
            enable_remote_access: editForm.enable_remote_access,
            enable_downloading: editForm.enable_downloading,
            enable_video_transcoding: editForm.enable_video_transcoding,
            enable_audio_transcoding: editForm.enable_audio_transcoding,
            simultaneous_stream_limit: Number(editForm.simultaneous_stream_limit) || 0
          }
        });
        if (res?.success) {
          notifySuccess(res.message || "Emby 用户信息已更新");
          editDialog.value = false;
          await fetchOverview();
        } else {
          notifyError(res?.message || "更新 Emby 用户失败");
        }
      } catch (err) {
        console.error(err);
        notifyError("更新 Emby 用户请求失败");
      } finally {
        savingEdit.value = false;
      }
    }
    async function toggleUserActive(user) {
      if (!props.api?.post) return;
      const nextActive = !user.is_active;
      try {
        const res = await props.api.post(`plugin/${resolvedPluginId.value}/user/status`, {
          username: user.username,
          is_active: nextActive
        });
        if (res?.success) {
          notifySuccess(res.message || "状态已更新");
          await fetchOverview();
        } else {
          notifyError(res?.message || "操作失败");
        }
      } catch (err) {
        console.error(err);
        notifyError("更新用户状态失败");
      }
    }
    async function updateAccessList(user, listType, action) {
      if (!props.api?.post) return;
      try {
        const res = await props.api.post(`plugin/${resolvedPluginId.value}/user/access-list`, {
          username: user.username,
          list_type: listType,
          action
        });
        if (res?.success) {
          notifySuccess(res.message || "名单已更新");
          await fetchOverview();
        } else {
          notifyError(res?.message || "更新名单失败");
        }
      } catch (err) {
        console.error(err);
        notifyError("更新名单失败");
      }
    }
    async function handleApprovalAction(item, action) {
      if (!props.api?.post || actingApprovalIds.value[item.id]) return;
      actingApprovalIds.value[item.id] = true;
      try {
        const res = await props.api.post(`plugin/${resolvedPluginId.value}/approval/action`, {
          request_id: item.id,
          action
        });
        if (res?.success) {
          notifySuccess(res.message || "操作已完成");
          if (Array.isArray(res.data?.approvals)) {
            approvals.value = res.data.approvals;
          }
          await fetchOverview();
        } else {
          notifyError(res?.message || "处理审批失败");
        }
      } catch (err) {
        console.error(err);
        notifyError("处理审批请求失败");
      } finally {
        delete actingApprovalIds.value[item.id];
      }
    }
    async function approveAllFiltered() {
      const pendingIds = filteredApprovals.value.filter((i) => i.status === "pending").map((i) => i.id);
      if (!pendingIds.length || !props.api?.post) return;
      batchApproving.value = true;
      try {
        const res = await props.api.post(`plugin/${resolvedPluginId.value}/approval/action`, {
          request_ids: pendingIds,
          action: "approve"
        });
        if (res?.success) {
          notifySuccess(res.message || "批量通过已完成");
          await fetchOverview();
        } else {
          notifyError(res?.message || "批量通过失败");
        }
      } catch (err) {
        console.error(err);
        notifyError("批量通过请求失败");
      } finally {
        batchApproving.value = false;
      }
    }
    async function clearApprovalHistory() {
      if (!props.api?.post) return;
      clearingHistory.value = true;
      try {
        const res = await props.api.post(`plugin/${resolvedPluginId.value}/approval/clear`, {});
        if (res?.success) {
          notifySuccess(res.message || "已清理历史审批记录");
          if (Array.isArray(res.data?.approvals)) {
            approvals.value = res.data.approvals;
          }
        } else {
          notifyError(res?.message || "清理历史记录失败");
        }
      } catch (err) {
        console.error(err);
        notifyError("清理历史记录请求失败");
      } finally {
        clearingHistory.value = false;
      }
    }
    function openSettingsDialog() {
      whitelistInput.value = config.value.whitelist.join(", ");
      blacklistInput.value = config.value.blacklist.join(", ");
      approvalBypassInput.value = config.value.approval_bypass_users.join(", ");
      settingsDialog.value = true;
    }
    async function savePolicyConfig() {
      if (!props.api?.post) return;
      savingConfig.value = true;
      try {
        const payload = {
          ...config.value,
          approval_tg_chat_id: (config.value.approval_tg_chat_id || "").trim(),
          whitelist: parseListText(whitelistInput.value),
          blacklist: parseListText(blacklistInput.value),
          approval_bypass_users: parseListText(approvalBypassInput.value)
        };
        const res = await props.api.post(`plugin/${resolvedPluginId.value}/config`, payload);
        if (res?.success) {
          notifySuccess("准入与订阅审批策略已保存");
          settingsDialog.value = false;
          await fetchOverview();
          emit("action");
        } else {
          notifyError(res?.message || "保存配置失败");
        }
      } catch (err) {
        console.error(err);
        notifyError("保存配置失败");
      } finally {
        savingConfig.value = false;
      }
    }
    async function openUserSubscribes(user) {
      if (!props.api?.get) return;
      subDialogUser.value = user.username;
      subDialog.value = true;
      subDialogLoading.value = true;
      userSubscribes.value = [];
      try {
        const res = await props.api.get(`plugin/${resolvedPluginId.value}/user/subscribes`, {
          params: { username: user.username }
        });
        if (res?.success && Array.isArray(res.data)) {
          userSubscribes.value = res.data;
        }
      } catch (err) {
        console.error(err);
        notifyError("读取用户订阅列表失败");
      } finally {
        subDialogLoading.value = false;
      }
    }
    function openDeleteUserDialog(user) {
      deleteTargetUser.value = user;
      deleteFromEmby.value = user.emby_servers.length > 0;
      deleteMpUser.value = true;
      deleteWithSubscribes.value = false;
      deleteDialog.value = true;
    }
    async function confirmDeleteUser() {
      if (!deleteTargetUser.value || !props.api?.post) return;
      if (!deleteFromEmby.value && !deleteMpUser.value && !deleteWithSubscribes.value) {
        notifyError("请至少勾选一项要删除或清理的内容");
        return;
      }
      deletingUser.value = true;
      try {
        const res = await props.api.post(`plugin/${resolvedPluginId.value}/user/delete`, {
          username: deleteTargetUser.value.username,
          delete_from_emby: deleteFromEmby.value,
          delete_mp_user: deleteMpUser.value,
          delete_subscribes: deleteWithSubscribes.value,
          emby_servers: deleteTargetUser.value.emby_servers
        });
        if (res?.success) {
          notifySuccess(res.message || "用户删除操作已完成");
          deleteDialog.value = false;
          await fetchOverview();
        } else {
          notifyError(res?.message || "删除用户失败");
        }
      } catch (err) {
        console.error(err);
        notifyError("删除用户失败");
      } finally {
        deletingUser.value = false;
      }
    }
    onMounted(() => {
      fetchOverview();
    });
    return (_ctx, _cache) => {
      const _component_v_icon = _resolveComponent("v-icon");
      const _component_v_btn = _resolveComponent("v-btn");
      const _component_v_text_field = _resolveComponent("v-text-field");
      const _component_v_progress_linear = _resolveComponent("v-progress-linear");
      const _component_v_alert = _resolveComponent("v-alert");
      const _component_v_spacer = _resolveComponent("v-spacer");
      const _component_v_list_item_title = _resolveComponent("v-list-item-title");
      const _component_v_list_item = _resolveComponent("v-list-item");
      const _component_v_divider = _resolveComponent("v-divider");
      const _component_v_list = _resolveComponent("v-list");
      const _component_v_menu = _resolveComponent("v-menu");
      const _component_v_card_title = _resolveComponent("v-card-title");
      const _component_v_select = _resolveComponent("v-select");
      const _component_v_col = _resolveComponent("v-col");
      const _component_v_row = _resolveComponent("v-row");
      const _component_v_switch = _resolveComponent("v-switch");
      const _component_v_checkbox = _resolveComponent("v-checkbox");
      const _component_v_card = _resolveComponent("v-card");
      const _component_v_card_text = _resolveComponent("v-card-text");
      const _component_v_card_actions = _resolveComponent("v-card-actions");
      const _component_v_dialog = _resolveComponent("v-dialog");
      const _component_v_textarea = _resolveComponent("v-textarea");
      const _component_v_list_item_subtitle = _resolveComponent("v-list-item-subtitle");
      return _openBlock(), _createElementBlock("div", _hoisted_1, [
        _createElementVNode("header", _hoisted_2, [
          _createElementVNode("div", _hoisted_3, [
            _createElementVNode("div", _hoisted_4, [
              _createVNode(_component_v_icon, {
                icon: "mdi-account-group-outline",
                size: "22"
              })
            ]),
            _createElementVNode("div", _hoisted_5, [
              _createElementVNode("div", _hoisted_6, [
                _cache[66] || (_cache[66] = _createElementVNode("h2", null, "Emby 用户管理", -1)),
                _createElementVNode("span", _hoisted_7, [
                  _createVNode(_component_v_icon, {
                    icon: "mdi-server-outline",
                    size: "13"
                  }),
                  _createTextVNode(" " + _toDisplayString(servers.value.length ? servers.value.map((s) => s.name).join("、") : "未连接服务器"), 1)
                ]),
                _createElementVNode("button", {
                  type: "button",
                  class: _normalizeClass(["emby-tag emby-tag--clickable", config.value.enabled ? "is-active" : "is-muted"]),
                  onClick: openSettingsDialog
                }, [
                  _createVNode(_component_v_icon, {
                    icon: config.value.enabled ? "mdi-shield-check-outline" : "mdi-shield-off-outline",
                    size: "13"
                  }, null, 8, ["icon"]),
                  _createTextVNode(" " + _toDisplayString(config.value.enabled ? `准入：${allowModeLabel(config.value.allow_mode)}` : "准入已关闭"), 1)
                ], 2),
                _createElementVNode("button", {
                  type: "button",
                  class: _normalizeClass([
                    "emby-tag emby-tag--clickable",
                    pendingApprovalCount.value > 0 ? "is-warning" : config.value.subscribe_approval_enabled ? "is-active" : "is-muted"
                  ]),
                  onClick: _cache[0] || (_cache[0] = ($event) => config.value.subscribe_approval_enabled || approvals.value.length ? activeTab.value = "approvals" : openSettingsDialog())
                }, [
                  _createVNode(_component_v_icon, {
                    icon: config.value.subscribe_approval_enabled ? "mdi-bell-check" : "mdi-bell-sleep-outline",
                    size: "13"
                  }, null, 8, ["icon"]),
                  _createTextVNode(" " + _toDisplayString(config.value.subscribe_approval_enabled ? pendingApprovalCount.value > 0 ? `订阅审批 · 待审 ${pendingApprovalCount.value}` : "订阅审批已开启" : "订阅审批已关闭"), 1)
                ], 2)
              ])
            ])
          ]),
          _createElementVNode("div", _hoisted_8, [
            _createVNode(_component_v_btn, {
              icon: "mdi-refresh",
              variant: "text",
              size: "small",
              rounded: "lg",
              "aria-label": "刷新列表",
              loading: loading.value,
              onClick: fetchOverview
            }, null, 8, ["loading"]),
            _createVNode(_component_v_btn, {
              size: "small",
              variant: "outlined",
              rounded: "lg",
              "prepend-icon": "mdi-shield-lock-outline",
              onClick: openSettingsDialog
            }, {
              default: _withCtx(() => [..._cache[67] || (_cache[67] = [
                _createTextVNode(" 准入与审批策略 ", -1)
              ])]),
              _: 1
            }),
            _createVNode(_component_v_btn, {
              size: "small",
              color: "primary",
              variant: "flat",
              rounded: "lg",
              "prepend-icon": "mdi-account-plus-outline",
              disabled: servers.value.length === 0,
              onClick: openCreateDialog
            }, {
              default: _withCtx(() => [..._cache[68] || (_cache[68] = [
                _createTextVNode(" 新建账号 ", -1)
              ])]),
              _: 1
            }, 8, ["disabled"])
          ])
        ]),
        _createElementVNode("section", _hoisted_9, [
          _createElementVNode("div", _hoisted_10, [
            _createElementVNode("div", _hoisted_11, [
              _createElementVNode("button", {
                type: "button",
                class: _normalizeClass(["emby-pill", { "is-active": activeTab.value === "users" }]),
                onClick: _cache[1] || (_cache[1] = ($event) => activeTab.value = "users")
              }, [
                _createVNode(_component_v_icon, {
                  icon: "mdi-account-multiple-outline",
                  size: "14"
                }),
                _cache[69] || (_cache[69] = _createElementVNode("span", null, "用户列表", -1)),
                _createElementVNode("strong", null, _toDisplayString(users.value.length), 1)
              ], 2),
              _createElementVNode("button", {
                type: "button",
                class: _normalizeClass(["emby-pill", { "is-active": activeTab.value === "approvals" }]),
                onClick: _cache[2] || (_cache[2] = ($event) => activeTab.value = "approvals")
              }, [
                _createVNode(_component_v_icon, {
                  icon: "mdi-clipboard-list-outline",
                  size: "14"
                }),
                _cache[70] || (_cache[70] = _createElementVNode("span", null, "订阅审批", -1)),
                _createElementVNode("strong", {
                  class: _normalizeClass({ "is-alert": pendingApprovalCount.value > 0 })
                }, _toDisplayString(pendingApprovalCount.value > 0 ? pendingApprovalCount.value : approvals.value.length), 3)
              ], 2)
            ]),
            activeTab.value === "users" ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
              _createElementVNode("div", _hoisted_12, [
                (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(filterPills.value, (item) => {
                  return _openBlock(), _createElementBlock("button", {
                    key: item.value,
                    type: "button",
                    class: _normalizeClass(["emby-pill", { "is-active": statusFilter.value === item.value }]),
                    onClick: ($event) => statusFilter.value = item.value
                  }, [
                    _createElementVNode("span", null, _toDisplayString(item.label), 1),
                    _createElementVNode("strong", null, _toDisplayString(item.count), 1)
                  ], 10, _hoisted_13);
                }), 128))
              ]),
              _createElementVNode("span", _hoisted_14, [
                _createVNode(_component_v_icon, {
                  icon: "mdi-playlist-star",
                  size: "14"
                }),
                _createTextVNode(" 订阅 " + _toDisplayString(stats.value.total_subscribe_count), 1)
              ])
            ], 64)) : (_openBlock(), _createElementBlock("div", _hoisted_15, [
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(approvalPills.value, (item) => {
                return _openBlock(), _createElementBlock("button", {
                  key: item.value,
                  type: "button",
                  class: _normalizeClass(["emby-pill", { "is-active": approvalFilter.value === item.value }]),
                  onClick: ($event) => approvalFilter.value = item.value
                }, [
                  _createElementVNode("span", null, _toDisplayString(item.label), 1),
                  _createElementVNode("strong", null, _toDisplayString(item.count), 1)
                ], 10, _hoisted_16);
              }), 128))
            ]))
          ]),
          _createElementVNode("div", _hoisted_17, [
            activeTab.value === "approvals" && filteredApprovals.value.some((i) => i.status === "pending") ? (_openBlock(), _createBlock(_component_v_btn, {
              key: 0,
              size: "small",
              color: "success",
              variant: "tonal",
              rounded: "lg",
              "prepend-icon": "mdi-check-all",
              loading: batchApproving.value,
              onClick: approveAllFiltered
            }, {
              default: _withCtx(() => [..._cache[71] || (_cache[71] = [
                _createTextVNode(" 全部通过 ", -1)
              ])]),
              _: 1
            }, 8, ["loading"])) : _createCommentVNode("", true),
            activeTab.value === "approvals" && handledApprovalCount.value > 0 ? (_openBlock(), _createBlock(_component_v_btn, {
              key: 1,
              size: "small",
              variant: "outlined",
              rounded: "lg",
              "prepend-icon": "mdi-broom",
              loading: clearingHistory.value,
              onClick: clearApprovalHistory
            }, {
              default: _withCtx(() => [..._cache[72] || (_cache[72] = [
                _createTextVNode(" 清理历史 ", -1)
              ])]),
              _: 1
            }, 8, ["loading"])) : _createCommentVNode("", true),
            _createVNode(_component_v_text_field, {
              modelValue: keyword.value,
              "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => keyword.value = $event),
              class: "emby-search",
              "prepend-inner-icon": "mdi-magnify",
              placeholder: activeTab.value === "users" ? "搜索用户名..." : "搜索片名或申请人...",
              density: "compact",
              variant: "outlined",
              "hide-details": "",
              clearable: ""
            }, null, 8, ["modelValue", "placeholder"])
          ])
        ]),
        loading.value ? (_openBlock(), _createBlock(_component_v_progress_linear, {
          key: 0,
          indeterminate: "",
          color: "primary",
          class: "mb-3",
          rounded: ""
        })) : _createCommentVNode("", true),
        activeTab.value === "approvals" ? (_openBlock(), _createElementBlock(_Fragment, { key: 1 }, [
          !config.value.subscribe_approval_enabled ? (_openBlock(), _createBlock(_component_v_alert, {
            key: 0,
            type: "info",
            variant: "tonal",
            density: "compact",
            rounded: "lg",
            class: "mb-3"
          }, {
            default: _withCtx(() => [
              _createElementVNode("div", _hoisted_18, [
                _cache[74] || (_cache[74] = _createElementVNode("span", { class: "text-body-2" }, " 当前尚未开启「普通用户订阅审批」，非管理员发起的订阅将直接提交至 MoviePilot。 ", -1)),
                _createVNode(_component_v_btn, {
                  size: "x-small",
                  color: "primary",
                  variant: "flat",
                  rounded: "lg",
                  onClick: openSettingsDialog
                }, {
                  default: _withCtx(() => [..._cache[73] || (_cache[73] = [
                    _createTextVNode(" 前往开启 ", -1)
                  ])]),
                  _: 1
                })
              ])
            ]),
            _: 1
          })) : _createCommentVNode("", true),
          !loading.value && filteredApprovals.value.length === 0 ? (_openBlock(), _createElementBlock("div", _hoisted_19, [
            _createVNode(_component_v_icon, {
              icon: "mdi-clipboard-search-outline",
              size: "38",
              class: "mb-2 text-medium-emphasis"
            }),
            _createElementVNode("div", _hoisted_20, _toDisplayString(approvalFilter.value === "pending" && !keyword.value ? "暂无待审批订阅申请" : "未找到匹配的审批记录"), 1),
            _createElementVNode("div", _hoisted_21, _toDisplayString(approvalFilter.value === "pending" && !keyword.value ? "当普通 Emby 用户发起新订阅时，将在此处展示并同步推送 Telegram 审批卡片" : "可切换状态筛选或清空搜索关键词查看其他记录"), 1),
            keyword.value || approvalFilter.value !== "all" ? (_openBlock(), _createBlock(_component_v_btn, {
              key: 0,
              size: "small",
              variant: "tonal",
              rounded: "lg",
              onClick: _cache[4] || (_cache[4] = ($event) => {
                keyword.value = "";
                approvalFilter.value = "all";
              })
            }, {
              default: _withCtx(() => [..._cache[75] || (_cache[75] = [
                _createTextVNode(" 查看全部记录 ", -1)
              ])]),
              _: 1
            })) : _createCommentVNode("", true)
          ])) : (_openBlock(), _createElementBlock("div", _hoisted_22, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(filteredApprovals.value, (req) => {
              return _openBlock(), _createElementBlock("article", {
                key: req.id,
                class: _normalizeClass(["emby-approval-card", `is-${req.status}`])
              }, [
                _createElementVNode("div", _hoisted_23, [
                  req.poster ? (_openBlock(), _createElementBlock("img", {
                    key: 0,
                    src: req.poster,
                    alt: req.title,
                    loading: "lazy"
                  }, null, 8, _hoisted_24)) : (_openBlock(), _createElementBlock("div", _hoisted_25, [
                    _createVNode(_component_v_icon, {
                      icon: req.type === "电影" ? "mdi-movie-open-outline" : "mdi-television",
                      size: "24"
                    }, null, 8, ["icon"])
                  ]))
                ]),
                _createElementVNode("div", _hoisted_26, [
                  _createElementVNode("div", _hoisted_27, [
                    _createElementVNode("span", _hoisted_28, _toDisplayString(req.title), 1),
                    req.year ? (_openBlock(), _createElementBlock("span", _hoisted_29, "(" + _toDisplayString(req.year) + ")", 1)) : _createCommentVNode("", true),
                    _createElementVNode("span", {
                      class: _normalizeClass(["emby-chip", req.type === "电影" ? "is-success" : "is-info"])
                    }, _toDisplayString(req.type === "电影" ? "电影" : "剧集"), 3),
                    req.type !== "电影" && req.season ? (_openBlock(), _createElementBlock("span", _hoisted_30, " 第 " + _toDisplayString(req.season) + " 季 ", 1)) : _createCommentVNode("", true),
                    req.vote && req.vote > 0 ? (_openBlock(), _createElementBlock("span", _hoisted_31, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-star",
                        size: "13",
                        color: "warning"
                      }),
                      _createTextVNode(" " + _toDisplayString(Number(req.vote).toFixed(1)), 1)
                    ])) : _createCommentVNode("", true)
                  ]),
                  _createElementVNode("div", _hoisted_32, [
                    _createElementVNode("span", null, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-account-outline",
                        size: "13"
                      }),
                      _cache[76] || (_cache[76] = _createTextVNode(" 申请人：", -1)),
                      _createElementVNode("b", null, _toDisplayString(req.username), 1)
                    ]),
                    _cache[78] || (_cache[78] = _createElementVNode("span", { class: "emby-dot" }, "·", -1)),
                    _createElementVNode("span", null, _toDisplayString(req.created_at || "-"), 1),
                    req.status !== "pending" && req.handled_by ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                      _cache[77] || (_cache[77] = _createElementVNode("span", { class: "emby-dot" }, "·", -1)),
                      _createElementVNode("span", null, "由 " + _toDisplayString(req.handled_by) + " 处理于 " + _toDisplayString(req.handled_at || "-"), 1)
                    ], 64)) : _createCommentVNode("", true)
                  ]),
                  req.overview ? (_openBlock(), _createElementBlock("div", {
                    key: 0,
                    class: "emby-approval-card__overview",
                    title: req.overview
                  }, _toDisplayString(req.overview), 9, _hoisted_33)) : _createCommentVNode("", true)
                ]),
                _createElementVNode("div", _hoisted_34, [
                  req.status === "pending" ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                    _createVNode(_component_v_btn, {
                      size: "small",
                      color: "success",
                      variant: "flat",
                      rounded: "lg",
                      "prepend-icon": "mdi-check-circle-outline",
                      loading: Boolean(actingApprovalIds.value[req.id]),
                      onClick: ($event) => handleApprovalAction(req, "approve")
                    }, {
                      default: _withCtx(() => [..._cache[79] || (_cache[79] = [
                        _createTextVNode(" 通过并提交 MP ", -1)
                      ])]),
                      _: 1
                    }, 8, ["loading", "onClick"]),
                    _createVNode(_component_v_btn, {
                      size: "small",
                      color: "info",
                      variant: "tonal",
                      rounded: "lg",
                      "prepend-icon": "mdi-tray-arrow-down",
                      loading: Boolean(actingApprovalIds.value[req.id]),
                      onClick: ($event) => handleApprovalAction(req, "manual")
                    }, {
                      default: _withCtx(() => [..._cache[80] || (_cache[80] = [
                        _createTextVNode(" 标记手动入库 ", -1)
                      ])]),
                      _: 1
                    }, 8, ["loading", "onClick"]),
                    _createVNode(_component_v_btn, {
                      size: "small",
                      color: "error",
                      variant: "tonal",
                      rounded: "lg",
                      "prepend-icon": "mdi-close-circle-outline",
                      loading: Boolean(actingApprovalIds.value[req.id]),
                      onClick: ($event) => handleApprovalAction(req, "reject")
                    }, {
                      default: _withCtx(() => [..._cache[81] || (_cache[81] = [
                        _createTextVNode(" 拒绝申请 ", -1)
                      ])]),
                      _: 1
                    }, 8, ["loading", "onClick"])
                  ], 64)) : (_openBlock(), _createElementBlock(_Fragment, { key: 1 }, [
                    _createElementVNode("span", {
                      class: _normalizeClass(["emby-approval-badge", `is-${req.status}`])
                    }, [
                      _createTextVNode(_toDisplayString(approvalStatusLabel(req.status)) + " ", 1),
                      req.status === "approved" && req.subscribe_id ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                        _createTextVNode("#" + _toDisplayString(req.subscribe_id), 1)
                      ], 64)) : _createCommentVNode("", true)
                    ], 2),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-delete-outline",
                      size: "x-small",
                      variant: "text",
                      rounded: "lg",
                      color: "medium-emphasis",
                      "aria-label": "删除记录",
                      loading: Boolean(actingApprovalIds.value[req.id]),
                      onClick: ($event) => handleApprovalAction(req, "delete")
                    }, null, 8, ["loading", "onClick"])
                  ], 64))
                ])
              ], 2);
            }), 128))
          ]))
        ], 64)) : (_openBlock(), _createElementBlock(_Fragment, { key: 2 }, [
          !loading.value && filteredUsers.value.length === 0 ? (_openBlock(), _createElementBlock("div", _hoisted_35, [
            _createVNode(_component_v_icon, {
              icon: "mdi-account-search-outline",
              size: "38",
              class: "mb-2 text-medium-emphasis"
            }),
            _createElementVNode("div", _hoisted_36, _toDisplayString(keyword.value || statusFilter.value !== "all" ? "未找到匹配的用户" : "暂无 Emby 用户"), 1),
            _createElementVNode("div", _hoisted_37, _toDisplayString(keyword.value || statusFilter.value !== "all" ? "可尝试调整筛选条件或清空搜索词" : "点击右上角「新建账号」创建首个媒体库用户"), 1),
            !keyword.value && statusFilter.value === "all" ? (_openBlock(), _createBlock(_component_v_btn, {
              key: 0,
              size: "small",
              color: "primary",
              variant: "tonal",
              rounded: "lg",
              "prepend-icon": "mdi-account-plus-outline",
              disabled: servers.value.length === 0,
              onClick: openCreateDialog
            }, {
              default: _withCtx(() => [..._cache[82] || (_cache[82] = [
                _createTextVNode(" 新建账号 ", -1)
              ])]),
              _: 1
            }, 8, ["disabled"])) : (_openBlock(), _createBlock(_component_v_btn, {
              key: 1,
              size: "small",
              variant: "tonal",
              rounded: "lg",
              onClick: _cache[5] || (_cache[5] = ($event) => {
                keyword.value = "";
                statusFilter.value = "all";
              })
            }, {
              default: _withCtx(() => [..._cache[83] || (_cache[83] = [
                _createTextVNode(" 重置筛选 ", -1)
              ])]),
              _: 1
            }))
          ])) : (_openBlock(), _createElementBlock("div", _hoisted_38, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(filteredUsers.value, (user) => {
              return _openBlock(), _createElementBlock("article", {
                key: user.username,
                class: _normalizeClass(["emby-card", `emby-card--${user.access_status}`])
              }, [
                _createElementVNode("div", _hoisted_39, [
                  _createElementVNode("div", _hoisted_40, _toDisplayString(user.username.slice(0, 1).toUpperCase()), 1),
                  _createElementVNode("div", _hoisted_41, [
                    _createElementVNode("div", _hoisted_42, [
                      _createElementVNode("span", {
                        class: "emby-card__name",
                        title: user.username
                      }, _toDisplayString(user.username), 9, _hoisted_43),
                      user.emby_is_admin ? (_openBlock(), _createBlock(_component_v_icon, {
                        key: 0,
                        icon: "mdi-crown-outline",
                        color: "warning",
                        size: "15",
                        title: "Emby 管理员"
                      })) : _createCommentVNode("", true),
                      user.in_whitelist ? (_openBlock(), _createElementBlock("span", _hoisted_44, "白名单")) : _createCommentVNode("", true),
                      user.in_blacklist ? (_openBlock(), _createElementBlock("span", _hoisted_45, "黑名单")) : _createCommentVNode("", true),
                      user.in_approval_bypass ? (_openBlock(), _createElementBlock("span", _hoisted_46, "免审")) : _createCommentVNode("", true),
                      user.registered_in_mp ? (_openBlock(), _createElementBlock("span", _hoisted_47, "MP")) : _createCommentVNode("", true),
                      user.pending_sub_count && user.pending_sub_count > 0 ? (_openBlock(), _createElementBlock("button", {
                        key: 5,
                        type: "button",
                        class: "emby-chip is-warning emby-chip--clickable",
                        onClick: ($event) => jumpToUserApprovals(user.username)
                      }, " 待审 " + _toDisplayString(user.pending_sub_count), 9, _hoisted_48)) : _createCommentVNode("", true)
                    ]),
                    _createElementVNode("div", {
                      class: "emby-card__meta",
                      title: userMetaSummary(user)
                    }, _toDisplayString(userMetaSummary(user)), 9, _hoisted_49)
                  ]),
                  _createElementVNode("span", {
                    class: _normalizeClass(["emby-status", `is-${user.access_status}`])
                  }, [
                    _cache[84] || (_cache[84] = _createElementVNode("i", null, null, -1)),
                    _createTextVNode(_toDisplayString(statusLabel(user.access_status)), 1)
                  ], 2)
                ]),
                _createElementVNode("div", _hoisted_50, [
                  _createElementVNode("button", {
                    type: "button",
                    class: "emby-card__subs",
                    onClick: ($event) => openUserSubscribes(user)
                  }, [
                    _createVNode(_component_v_icon, {
                      icon: "mdi-movie-open-outline",
                      size: "14"
                    }),
                    _createElementVNode("span", null, [
                      _cache[85] || (_cache[85] = _createTextVNode("电影 ", -1)),
                      _createElementVNode("b", null, _toDisplayString(user.movie_sub_count), 1)
                    ]),
                    _cache[87] || (_cache[87] = _createElementVNode("span", { class: "emby-dot" }, "·", -1)),
                    _createElementVNode("span", null, [
                      _cache[86] || (_cache[86] = _createTextVNode("剧集 ", -1)),
                      _createElementVNode("b", null, _toDisplayString(user.tv_sub_count), 1)
                    ]),
                    _createVNode(_component_v_icon, {
                      icon: "mdi-chevron-right",
                      size: "15",
                      class: "ms-auto text-disabled"
                    })
                  ], 8, _hoisted_51),
                  _createElementVNode("div", {
                    class: "emby-card__active",
                    title: user.last_activity_date || user.last_login_date || ""
                  }, [
                    _createVNode(_component_v_icon, {
                      icon: "mdi-clock-outline",
                      size: "13"
                    }),
                    _createElementVNode("span", null, _toDisplayString(formatCompactTime(user.last_activity_date || user.last_login_date)), 1)
                  ], 8, _hoisted_52)
                ]),
                _createElementVNode("div", _hoisted_53, [
                  user.emby_servers.length > 0 ? (_openBlock(), _createBlock(_component_v_btn, {
                    key: 0,
                    size: "x-small",
                    color: "primary",
                    variant: "tonal",
                    rounded: "lg",
                    class: "px-3",
                    "prepend-icon": "mdi-account-edit-outline",
                    onClick: ($event) => openEditDialog(user)
                  }, {
                    default: _withCtx(() => [..._cache[88] || (_cache[88] = [
                      _createTextVNode(" 编辑 ", -1)
                    ])]),
                    _: 1
                  }, 8, ["onClick"])) : _createCommentVNode("", true),
                  _createVNode(_component_v_btn, {
                    size: "x-small",
                    color: user.is_active ? "warning" : "success",
                    variant: "tonal",
                    rounded: "lg",
                    class: "px-3",
                    "prepend-icon": user.is_active ? "mdi-account-cancel-outline" : "mdi-account-check-outline",
                    onClick: ($event) => toggleUserActive(user)
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode(_toDisplayString(user.is_active ? "禁登 MP" : "允许 MP"), 1)
                    ]),
                    _: 2
                  }, 1032, ["color", "prepend-icon", "onClick"]),
                  _createVNode(_component_v_spacer),
                  _createVNode(_component_v_menu, {
                    location: "bottom end",
                    "close-on-content-click": ""
                  }, {
                    activator: _withCtx(({ props: menuProps }) => [
                      _createVNode(_component_v_btn, _mergeProps({ ref_for: true }, menuProps, {
                        icon: "mdi-dots-horizontal",
                        variant: "text",
                        size: "x-small",
                        rounded: "lg",
                        "aria-label": "更多操作"
                      }), null, 16)
                    ]),
                    default: _withCtx(() => [
                      _createVNode(_component_v_list, {
                        density: "compact",
                        rounded: "lg",
                        class: "py-1 emby-menu-list"
                      }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_list_item, {
                            "prepend-icon": "mdi-playlist-check",
                            onClick: ($event) => updateAccessList(user, "whitelist", user.in_whitelist ? "remove" : "add")
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_list_item_title, null, {
                                default: _withCtx(() => [
                                  _createTextVNode(_toDisplayString(user.in_whitelist ? "移出白名单" : "加入白名单"), 1)
                                ]),
                                _: 2
                              }, 1024)
                            ]),
                            _: 2
                          }, 1032, ["onClick"]),
                          _createVNode(_component_v_list_item, {
                            "prepend-icon": "mdi-account-cancel-outline",
                            onClick: ($event) => updateAccessList(user, "blacklist", user.in_blacklist ? "remove" : "add")
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_list_item_title, null, {
                                default: _withCtx(() => [
                                  _createTextVNode(_toDisplayString(user.in_blacklist ? "移出黑名单" : "加入黑名单"), 1)
                                ]),
                                _: 2
                              }, 1024)
                            ]),
                            _: 2
                          }, 1032, ["onClick"]),
                          _createVNode(_component_v_list_item, {
                            "prepend-icon": "mdi-check-decagram-outline",
                            onClick: ($event) => updateAccessList(user, "approval_bypass", user.in_approval_bypass ? "remove" : "add")
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_list_item_title, null, {
                                default: _withCtx(() => [
                                  _createTextVNode(_toDisplayString(user.in_approval_bypass ? "取消订阅免审" : "设为订阅免审"), 1)
                                ]),
                                _: 2
                              }, 1024)
                            ]),
                            _: 2
                          }, 1032, ["onClick"]),
                          _createVNode(_component_v_list_item, {
                            "prepend-icon": "mdi-format-list-bulleted",
                            onClick: ($event) => openUserSubscribes(user)
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_list_item_title, null, {
                                default: _withCtx(() => [
                                  _createTextVNode("查看订阅明细 (" + _toDisplayString(user.total_sub_count) + ")", 1)
                                ]),
                                _: 2
                              }, 1024)
                            ]),
                            _: 2
                          }, 1032, ["onClick"]),
                          _createVNode(_component_v_divider, { class: "my-1" }),
                          _createVNode(_component_v_list_item, {
                            class: "text-error",
                            "prepend-icon": "mdi-delete-outline",
                            onClick: ($event) => openDeleteUserDialog(user)
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_list_item_title, null, {
                                default: _withCtx(() => [..._cache[89] || (_cache[89] = [
                                  _createTextVNode("删除账号 / 清理订阅", -1)
                                ])]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["onClick"])
                        ]),
                        _: 2
                      }, 1024)
                    ]),
                    _: 2
                  }, 1024)
                ])
              ], 2);
            }), 128))
          ]))
        ], 64)),
        _createVNode(_component_v_dialog, {
          modelValue: createDialog.value,
          "onUpdate:modelValue": _cache[26] || (_cache[26] = ($event) => createDialog.value = $event),
          "max-width": "600",
          scrollable: ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, { class: "emby-dialog" }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "emby-dialog__header" }, {
                  default: _withCtx(() => [
                    _createElementVNode("span", _hoisted_54, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-account-plus-outline",
                        size: "20",
                        color: "primary"
                      }),
                      _cache[90] || (_cache[90] = _createElementVNode("span", null, "新建 Emby 账号", -1))
                    ]),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      rounded: "lg",
                      onClick: _cache[6] || (_cache[6] = ($event) => createDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                !createdCredential.value ? (_openBlock(), _createBlock(_component_v_card_text, {
                  key: 0,
                  class: "emby-dialog__body"
                }, {
                  default: _withCtx(() => [
                    servers.value.length > 1 ? (_openBlock(), _createBlock(_component_v_select, {
                      key: 0,
                      modelValue: createForm.server,
                      "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => createForm.server = $event),
                      items: servers.value.map((s) => s.name),
                      label: "目标 Emby 服务器",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": ""
                    }, null, 8, ["modelValue", "items"])) : _createCommentVNode("", true),
                    _createVNode(_component_v_row, { dense: "" }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_col, {
                          cols: "12",
                          sm: "6"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_text_field, {
                              modelValue: createForm.username,
                              "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => createForm.username = $event),
                              label: "用户名 *",
                              placeholder: "例如：alice",
                              variant: "outlined",
                              density: "compact",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          sm: "6"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_text_field, {
                              modelValue: createForm.password,
                              "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => createForm.password = $event),
                              type: showCreatePassword.value ? "text" : "password",
                              label: "初始密码（留空随机生成）",
                              variant: "outlined",
                              density: "compact",
                              "hide-details": "",
                              "append-inner-icon": showCreatePassword.value ? "mdi-eye-off-outline" : "mdi-eye-outline",
                              "onClick:appendInner": _cache[10] || (_cache[10] = ($event) => showCreatePassword.value = !showCreatePassword.value)
                            }, null, 8, ["modelValue", "type", "append-inner-icon"])
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    }),
                    _createVNode(_component_v_select, {
                      modelValue: createForm.copy_from_user_id,
                      "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => createForm.copy_from_user_id = $event),
                      items: [{ id: "", name: "自定义权限配置" }, ...createTemplateUsers.value],
                      "item-title": "name",
                      "item-value": "id",
                      label: "复制现有用户权限（可选）",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": ""
                    }, null, 8, ["modelValue", "items"]),
                    !createForm.copy_from_user_id ? (_openBlock(), _createElementBlock(_Fragment, { key: 1 }, [
                      _cache[91] || (_cache[91] = _createElementVNode("div", { class: "emby-dialog__subhead" }, "权限与媒体库授权", -1)),
                      _createVNode(_component_v_row, { dense: "" }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_col, { cols: "6" }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_switch, {
                                modelValue: createForm.is_admin,
                                "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => createForm.is_admin = $event),
                                color: "primary",
                                density: "compact",
                                label: "Emby 管理员",
                                "hide-details": ""
                              }, null, 8, ["modelValue"])
                            ]),
                            _: 1
                          }),
                          _createVNode(_component_v_col, { cols: "6" }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_switch, {
                                modelValue: createForm.is_hidden,
                                "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => createForm.is_hidden = $event),
                                color: "primary",
                                density: "compact",
                                label: "登录页隐藏",
                                "hide-details": ""
                              }, null, 8, ["modelValue"])
                            ]),
                            _: 1
                          }),
                          _createVNode(_component_v_col, { cols: "6" }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_switch, {
                                modelValue: createForm.enable_remote_access,
                                "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => createForm.enable_remote_access = $event),
                                color: "primary",
                                density: "compact",
                                label: "允许外网连接",
                                "hide-details": ""
                              }, null, 8, ["modelValue"])
                            ]),
                            _: 1
                          }),
                          _createVNode(_component_v_col, { cols: "6" }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_switch, {
                                modelValue: createForm.enable_downloading,
                                "onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => createForm.enable_downloading = $event),
                                color: "primary",
                                density: "compact",
                                label: "允许下载媒体",
                                "hide-details": ""
                              }, null, 8, ["modelValue"])
                            ]),
                            _: 1
                          }),
                          _createVNode(_component_v_col, { cols: "6" }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_switch, {
                                modelValue: createForm.enable_video_transcoding,
                                "onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => createForm.enable_video_transcoding = $event),
                                color: "primary",
                                density: "compact",
                                label: "允许视频转码",
                                "hide-details": ""
                              }, null, 8, ["modelValue"])
                            ]),
                            _: 1
                          }),
                          _createVNode(_component_v_col, { cols: "6" }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_switch, {
                                modelValue: createForm.enable_audio_transcoding,
                                "onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => createForm.enable_audio_transcoding = $event),
                                color: "primary",
                                density: "compact",
                                label: "允许音频转码",
                                "hide-details": ""
                              }, null, 8, ["modelValue"])
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      }),
                      _createVNode(_component_v_text_field, {
                        modelValue: createForm.simultaneous_stream_limit,
                        "onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => createForm.simultaneous_stream_limit = $event),
                        modelModifiers: { number: true },
                        type: "number",
                        min: "0",
                        label: "最大并发播放流数（0 为不限）",
                        variant: "outlined",
                        density: "compact",
                        "hide-details": ""
                      }, null, 8, ["modelValue"]),
                      _createVNode(_component_v_switch, {
                        modelValue: createForm.enable_all_folders,
                        "onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => createForm.enable_all_folders = $event),
                        color: "primary",
                        density: "compact",
                        label: "允许访问全部媒体库",
                        "hide-details": ""
                      }, null, 8, ["modelValue"]),
                      !createForm.enable_all_folders ? (_openBlock(), _createBlock(_component_v_card, {
                        key: 0,
                        variant: "outlined",
                        rounded: "lg",
                        class: "pa-3 emby-subcard"
                      }, {
                        default: _withCtx(() => [
                          createServerFolders.value.length === 0 ? (_openBlock(), _createElementBlock("div", _hoisted_55, " 未读取到媒体库列表 ")) : (_openBlock(), _createBlock(_component_v_row, {
                            key: 1,
                            dense: ""
                          }, {
                            default: _withCtx(() => [
                              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(createServerFolders.value, (folder) => {
                                return _openBlock(), _createBlock(_component_v_col, {
                                  key: folder.id,
                                  cols: "6",
                                  sm: "4"
                                }, {
                                  default: _withCtx(() => [
                                    _createVNode(_component_v_checkbox, {
                                      modelValue: createForm.enabled_folders,
                                      "onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => createForm.enabled_folders = $event),
                                      value: folder.id,
                                      label: folder.name,
                                      density: "compact",
                                      "hide-details": ""
                                    }, null, 8, ["modelValue", "value", "label"])
                                  ]),
                                  _: 2
                                }, 1024);
                              }), 128))
                            ]),
                            _: 1
                          }))
                        ]),
                        _: 1
                      })) : _createCommentVNode("", true)
                    ], 64)) : _createCommentVNode("", true),
                    _createVNode(_component_v_checkbox, {
                      modelValue: createForm.add_to_whitelist,
                      "onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => createForm.add_to_whitelist = $event),
                      color: "primary",
                      density: "compact",
                      label: "同时加入 MoviePilot 登录白名单",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_checkbox, {
                      modelValue: createForm.add_to_approval_bypass,
                      "onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => createForm.add_to_approval_bypass = $event),
                      color: "primary",
                      density: "compact",
                      label: "同时加入订阅免审直通名单",
                      "hide-details": ""
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                })) : (_openBlock(), _createBlock(_component_v_card_text, {
                  key: 1,
                  class: "emby-dialog__body"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_alert, {
                      type: "success",
                      variant: "tonal",
                      rounded: "lg",
                      icon: "mdi-check-circle-outline"
                    }, {
                      default: _withCtx(() => [
                        _createElementVNode("div", _hoisted_56, "账号 " + _toDisplayString(createdCredential.value.username) + " 创建成功", 1),
                        _cache[92] || (_cache[92] = _createElementVNode("div", { class: "text-body-2 mb-3" }, "请复制并保存自动生成的初始密码：", -1)),
                        _createVNode(_component_v_text_field, {
                          "model-value": createdCredential.value.password,
                          label: "初始密码",
                          readonly: "",
                          variant: "outlined",
                          density: "compact",
                          "hide-details": "",
                          "append-inner-icon": "mdi-content-copy",
                          "onClick:appendInner": _cache[23] || (_cache[23] = ($event) => copyPasswordText(createdCredential.value?.password))
                        }, null, 8, ["model-value"])
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                })),
                _createVNode(_component_v_card_actions, { class: "emby-dialog__footer" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    !createdCredential.value ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                      _createVNode(_component_v_btn, {
                        variant: "text",
                        rounded: "lg",
                        onClick: _cache[24] || (_cache[24] = ($event) => createDialog.value = false)
                      }, {
                        default: _withCtx(() => [..._cache[93] || (_cache[93] = [
                          _createTextVNode("取消", -1)
                        ])]),
                        _: 1
                      }),
                      _createVNode(_component_v_btn, {
                        color: "primary",
                        variant: "flat",
                        rounded: "lg",
                        class: "px-5",
                        loading: creatingUser.value,
                        onClick: submitCreateUser
                      }, {
                        default: _withCtx(() => [..._cache[94] || (_cache[94] = [
                          _createTextVNode(" 创建账号 ", -1)
                        ])]),
                        _: 1
                      }, 8, ["loading"])
                    ], 64)) : (_openBlock(), _createBlock(_component_v_btn, {
                      key: 1,
                      color: "primary",
                      variant: "flat",
                      rounded: "lg",
                      class: "px-5",
                      onClick: _cache[25] || (_cache[25] = ($event) => createDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[95] || (_cache[95] = [
                        _createTextVNode("完成", -1)
                      ])]),
                      _: 1
                    }))
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue"]),
        _createVNode(_component_v_dialog, {
          modelValue: editDialog.value,
          "onUpdate:modelValue": _cache[44] || (_cache[44] = ($event) => editDialog.value = $event),
          "max-width": "620",
          scrollable: ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, { class: "emby-dialog" }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "emby-dialog__header" }, {
                  default: _withCtx(() => [
                    _createElementVNode("span", _hoisted_57, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-account-edit-outline",
                        size: "20",
                        color: "primary"
                      }),
                      _createElementVNode("span", null, "编辑账号：" + _toDisplayString(editForm.username), 1)
                    ]),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      rounded: "lg",
                      onClick: _cache[27] || (_cache[27] = ($event) => editDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                editLoading.value ? (_openBlock(), _createBlock(_component_v_progress_linear, {
                  key: 0,
                  indeterminate: "",
                  color: "primary"
                })) : _createCommentVNode("", true),
                _createVNode(_component_v_card_text, { class: "emby-dialog__body" }, {
                  default: _withCtx(() => [
                    editTargetUser.value && editTargetUser.value.emby_servers.length > 1 ? (_openBlock(), _createBlock(_component_v_select, {
                      key: 0,
                      "model-value": editForm.server,
                      items: editTargetUser.value.emby_servers,
                      label: "Emby 服务器实例",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "",
                      "onUpdate:modelValue": onEditServerChange
                    }, null, 8, ["model-value", "items"])) : _createCommentVNode("", true),
                    _createVNode(_component_v_text_field, {
                      modelValue: editForm.new_username,
                      "onUpdate:modelValue": _cache[28] || (_cache[28] = ($event) => editForm.new_username = $event),
                      label: "Emby 用户名（改名将同步迁移本地订阅）",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createElementVNode("div", _hoisted_58, [
                      _createElementVNode("div", _hoisted_59, [
                        _createElementVNode("span", _hoisted_60, [
                          _createVNode(_component_v_icon, {
                            icon: "mdi-key-outline",
                            size: "17",
                            color: "primary"
                          }),
                          _cache[96] || (_cache[96] = _createTextVNode(" 重置登录密码 ", -1))
                        ]),
                        _createVNode(_component_v_switch, {
                          modelValue: editForm.change_password,
                          "onUpdate:modelValue": _cache[29] || (_cache[29] = ($event) => editForm.change_password = $event),
                          color: "primary",
                          density: "compact",
                          "hide-details": ""
                        }, null, 8, ["modelValue"])
                      ]),
                      editForm.change_password ? (_openBlock(), _createBlock(_component_v_text_field, {
                        key: 0,
                        modelValue: editForm.new_password,
                        "onUpdate:modelValue": _cache[30] || (_cache[30] = ($event) => editForm.new_password = $event),
                        type: showEditPassword.value ? "text" : "password",
                        label: "新密码（留空将清除密码改为免密）",
                        variant: "outlined",
                        density: "compact",
                        "hide-details": "",
                        class: "mt-2",
                        "append-inner-icon": showEditPassword.value ? "mdi-eye-off-outline" : "mdi-eye-outline",
                        "onClick:appendInner": _cache[31] || (_cache[31] = ($event) => showEditPassword.value = !showEditPassword.value)
                      }, null, 8, ["modelValue", "type", "append-inner-icon"])) : _createCommentVNode("", true)
                    ]),
                    _cache[97] || (_cache[97] = _createElementVNode("div", { class: "emby-dialog__subhead" }, "状态与权限", -1)),
                    _createVNode(_component_v_row, { dense: "" }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_col, { cols: "6" }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.mp_is_active,
                              "onUpdate:modelValue": _cache[32] || (_cache[32] = ($event) => editForm.mp_is_active = $event),
                              color: "primary",
                              density: "compact",
                              label: "允许登录 MP",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, { cols: "6" }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.is_disabled,
                              "onUpdate:modelValue": _cache[33] || (_cache[33] = ($event) => editForm.is_disabled = $event),
                              color: "error",
                              density: "compact",
                              label: "Emby 禁用此号",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, { cols: "6" }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.is_admin,
                              "onUpdate:modelValue": _cache[34] || (_cache[34] = ($event) => editForm.is_admin = $event),
                              color: "primary",
                              density: "compact",
                              label: "Emby 管理员",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, { cols: "6" }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.is_hidden,
                              "onUpdate:modelValue": _cache[35] || (_cache[35] = ($event) => editForm.is_hidden = $event),
                              color: "primary",
                              density: "compact",
                              label: "登录页隐藏",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, { cols: "6" }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.enable_remote_access,
                              "onUpdate:modelValue": _cache[36] || (_cache[36] = ($event) => editForm.enable_remote_access = $event),
                              color: "primary",
                              density: "compact",
                              label: "允许外网连接",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, { cols: "6" }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.enable_downloading,
                              "onUpdate:modelValue": _cache[37] || (_cache[37] = ($event) => editForm.enable_downloading = $event),
                              color: "primary",
                              density: "compact",
                              label: "允许下载媒体",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, { cols: "6" }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.enable_video_transcoding,
                              "onUpdate:modelValue": _cache[38] || (_cache[38] = ($event) => editForm.enable_video_transcoding = $event),
                              color: "primary",
                              density: "compact",
                              label: "允许视频转码",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, { cols: "6" }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.enable_audio_transcoding,
                              "onUpdate:modelValue": _cache[39] || (_cache[39] = ($event) => editForm.enable_audio_transcoding = $event),
                              color: "primary",
                              density: "compact",
                              label: "允许音频转码",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    }),
                    _createVNode(_component_v_text_field, {
                      modelValue: editForm.simultaneous_stream_limit,
                      "onUpdate:modelValue": _cache[40] || (_cache[40] = ($event) => editForm.simultaneous_stream_limit = $event),
                      modelModifiers: { number: true },
                      type: "number",
                      min: "0",
                      label: "最大并发播放流数（0 为不限）",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_switch, {
                      modelValue: editForm.enable_all_folders,
                      "onUpdate:modelValue": _cache[41] || (_cache[41] = ($event) => editForm.enable_all_folders = $event),
                      color: "primary",
                      density: "compact",
                      label: "允许访问全部媒体库",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    !editForm.enable_all_folders ? (_openBlock(), _createBlock(_component_v_card, {
                      key: 1,
                      variant: "outlined",
                      rounded: "lg",
                      class: "pa-3 emby-subcard"
                    }, {
                      default: _withCtx(() => [
                        editServerFolders.value.length === 0 ? (_openBlock(), _createElementBlock("div", _hoisted_61, " 未读取到媒体库列表 ")) : (_openBlock(), _createBlock(_component_v_row, {
                          key: 1,
                          dense: ""
                        }, {
                          default: _withCtx(() => [
                            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(editServerFolders.value, (folder) => {
                              return _openBlock(), _createBlock(_component_v_col, {
                                key: folder.id,
                                cols: "6",
                                sm: "4"
                              }, {
                                default: _withCtx(() => [
                                  _createVNode(_component_v_checkbox, {
                                    modelValue: editForm.enabled_folders,
                                    "onUpdate:modelValue": _cache[42] || (_cache[42] = ($event) => editForm.enabled_folders = $event),
                                    value: folder.id,
                                    label: folder.name,
                                    density: "compact",
                                    "hide-details": ""
                                  }, null, 8, ["modelValue", "value", "label"])
                                ]),
                                _: 2
                              }, 1024);
                            }), 128))
                          ]),
                          _: 1
                        }))
                      ]),
                      _: 1
                    })) : _createCommentVNode("", true)
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, { class: "emby-dialog__footer" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    _createVNode(_component_v_btn, {
                      variant: "text",
                      rounded: "lg",
                      onClick: _cache[43] || (_cache[43] = ($event) => editDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[98] || (_cache[98] = [
                        _createTextVNode("取消", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "primary",
                      variant: "flat",
                      rounded: "lg",
                      class: "px-5",
                      loading: savingEdit.value,
                      onClick: submitEditUser
                    }, {
                      default: _withCtx(() => [..._cache[99] || (_cache[99] = [
                        _createTextVNode(" 保存修改 ", -1)
                      ])]),
                      _: 1
                    }, 8, ["loading"])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue"]),
        _createVNode(_component_v_dialog, {
          modelValue: settingsDialog.value,
          "onUpdate:modelValue": _cache[57] || (_cache[57] = ($event) => settingsDialog.value = $event),
          "max-width": "580",
          scrollable: ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, { class: "emby-dialog" }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "emby-dialog__header" }, {
                  default: _withCtx(() => [
                    _createElementVNode("span", _hoisted_62, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-shield-lock-outline",
                        size: "20",
                        color: "primary"
                      }),
                      _cache[100] || (_cache[100] = _createElementVNode("span", null, "登录准入与订阅审批策略", -1))
                    ]),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      rounded: "lg",
                      onClick: _cache[45] || (_cache[45] = ($event) => settingsDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, { class: "emby-dialog__body" }, {
                  default: _withCtx(() => [
                    _cache[102] || (_cache[102] = _createElementVNode("div", { class: "emby-dialog__subhead" }, "1. 登录准入控制", -1)),
                    _createVNode(_component_v_alert, {
                      type: "info",
                      variant: "tonal",
                      density: "compact",
                      rounded: "lg",
                      class: "text-caption"
                    }, {
                      default: _withCtx(() => [..._cache[101] || (_cache[101] = [
                        _createTextVNode(" 仅控制谁能使用 Emby 账号登录 MoviePilot 发起订阅，不影响 Emby 自身观影权限。 ", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_switch, {
                      modelValue: config.value.enabled,
                      "onUpdate:modelValue": _cache[46] || (_cache[46] = ($event) => config.value.enabled = $event),
                      color: "primary",
                      density: "compact",
                      label: "启用登录准入控制",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_switch, {
                      modelValue: config.value.allow_emby_admin,
                      "onUpdate:modelValue": _cache[47] || (_cache[47] = ($event) => config.value.allow_emby_admin = $event),
                      color: "primary",
                      density: "compact",
                      label: "允许 Emby 管理员作为普通订阅用户登录",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_select, {
                      modelValue: config.value.allow_mode,
                      "onUpdate:modelValue": _cache[48] || (_cache[48] = ($event) => config.value.allow_mode = $event),
                      items: [
                        { title: "全部允许（未禁用账号均可登录）", value: "all" },
                        { title: "白名单模式（仅白名单可登录）", value: "whitelist" },
                        { title: "黑名单模式（拦截黑名单用户）", value: "blacklist" }
                      ],
                      "item-title": "title",
                      "item-value": "value",
                      label: "准入模式",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_select, {
                      modelValue: config.value.allowed_servers,
                      "onUpdate:modelValue": _cache[49] || (_cache[49] = ($event) => config.value.allowed_servers = $event),
                      items: servers.value.map((s) => s.name),
                      label: "限定 Emby 实例（留空为全部）",
                      variant: "outlined",
                      density: "compact",
                      multiple: "",
                      chips: "",
                      clearable: "",
                      "hide-details": ""
                    }, null, 8, ["modelValue", "items"]),
                    _createVNode(_component_v_textarea, {
                      modelValue: whitelistInput.value,
                      "onUpdate:modelValue": _cache[50] || (_cache[50] = ($event) => whitelistInput.value = $event),
                      label: "白名单用户名（逗号或换行分隔）",
                      variant: "outlined",
                      rows: "2",
                      density: "compact",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_textarea, {
                      modelValue: blacklistInput.value,
                      "onUpdate:modelValue": _cache[51] || (_cache[51] = ($event) => blacklistInput.value = $event),
                      label: "黑名单用户名（逗号或换行分隔）",
                      variant: "outlined",
                      rows: "2",
                      density: "compact",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_divider, { class: "my-1" }),
                    _cache[103] || (_cache[103] = _createElementVNode("div", { class: "emby-dialog__subhead" }, "2. 普通用户订阅审批", -1)),
                    _createVNode(_component_v_switch, {
                      modelValue: config.value.subscribe_approval_enabled,
                      "onUpdate:modelValue": _cache[52] || (_cache[52] = ($event) => config.value.subscribe_approval_enabled = $event),
                      color: "primary",
                      density: "compact",
                      label: "开启普通用户订阅审批（通过后才提交到 MoviePilot）",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_switch, {
                      modelValue: config.value.approval_notify_telegram,
                      "onUpdate:modelValue": _cache[53] || (_cache[53] = ($event) => config.value.approval_notify_telegram = $event),
                      color: "primary",
                      density: "compact",
                      label: "推送 Telegram 审批卡片（含通过并提交 MP / 标记手动入库 / 拒绝按钮）",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_text_field, {
                      modelValue: config.value.approval_tg_chat_id,
                      "onUpdate:modelValue": _cache[54] || (_cache[54] = ($event) => config.value.approval_tg_chat_id = $event),
                      label: "审批通知 Telegram Chat ID（可选，留空走系统默认通知会话）",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_textarea, {
                      modelValue: approvalBypassInput.value,
                      "onUpdate:modelValue": _cache[55] || (_cache[55] = ($event) => approvalBypassInput.value = $event),
                      label: "免审批直通用户名单（逗号或换行分隔，名单内用户订阅直接提交 MP）",
                      variant: "outlined",
                      rows: "2",
                      density: "compact",
                      "hide-details": ""
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, { class: "emby-dialog__footer" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    _createVNode(_component_v_btn, {
                      variant: "text",
                      rounded: "lg",
                      onClick: _cache[56] || (_cache[56] = ($event) => settingsDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[104] || (_cache[104] = [
                        _createTextVNode("取消", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "primary",
                      variant: "flat",
                      rounded: "lg",
                      class: "px-5",
                      loading: savingConfig.value,
                      onClick: savePolicyConfig
                    }, {
                      default: _withCtx(() => [..._cache[105] || (_cache[105] = [
                        _createTextVNode(" 保存策略 ", -1)
                      ])]),
                      _: 1
                    }, 8, ["loading"])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue"]),
        _createVNode(_component_v_dialog, {
          modelValue: subDialog.value,
          "onUpdate:modelValue": _cache[59] || (_cache[59] = ($event) => subDialog.value = $event),
          "max-width": "600",
          scrollable: ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, { class: "emby-dialog" }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "emby-dialog__header" }, {
                  default: _withCtx(() => [
                    _createElementVNode("span", _hoisted_63, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-playlist-star",
                        size: "20",
                        color: "primary"
                      }),
                      _createElementVNode("span", null, _toDisplayString(subDialogUser.value) + " 的订阅 (" + _toDisplayString(userSubscribes.value.length) + ")", 1)
                    ]),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      rounded: "lg",
                      onClick: _cache[58] || (_cache[58] = ($event) => subDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, { class: "pa-3" }, {
                  default: _withCtx(() => [
                    subDialogLoading.value ? (_openBlock(), _createBlock(_component_v_progress_linear, {
                      key: 0,
                      indeterminate: "",
                      color: "primary",
                      class: "mb-2"
                    })) : userSubscribes.value.length === 0 ? (_openBlock(), _createElementBlock("div", _hoisted_64, " 该用户暂无订阅记录 ")) : (_openBlock(), _createBlock(_component_v_list, {
                      key: 2,
                      lines: "two",
                      density: "compact"
                    }, {
                      default: _withCtx(() => [
                        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(userSubscribes.value, (sub) => {
                          return _openBlock(), _createBlock(_component_v_list_item, {
                            key: sub.id,
                            rounded: "lg"
                          }, {
                            prepend: _withCtx(() => [
                              _createVNode(_component_v_icon, {
                                icon: sub.type === "电影" ? "mdi-movie-open-outline" : "mdi-television",
                                color: sub.type === "电影" ? "success" : "info"
                              }, null, 8, ["icon", "color"])
                            ]),
                            default: _withCtx(() => [
                              _createVNode(_component_v_list_item_title, { class: "font-weight-medium" }, {
                                default: _withCtx(() => [
                                  _createTextVNode(_toDisplayString(sub.name) + " ", 1),
                                  sub.year ? (_openBlock(), _createElementBlock("span", _hoisted_65, "(" + _toDisplayString(sub.year) + ")", 1)) : _createCommentVNode("", true),
                                  sub.season ? (_openBlock(), _createElementBlock("span", _hoisted_66, "S" + _toDisplayString(sub.season), 1)) : _createCommentVNode("", true)
                                ]),
                                _: 2
                              }, 1024),
                              _createVNode(_component_v_list_item_subtitle, null, {
                                default: _withCtx(() => [
                                  _createTextVNode(_toDisplayString(sub.type) + " · 状态 " + _toDisplayString(sub.state || "R") + " · " + _toDisplayString(sub.date || "-"), 1)
                                ]),
                                _: 2
                              }, 1024)
                            ]),
                            _: 2
                          }, 1024);
                        }), 128))
                      ]),
                      _: 1
                    }))
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue"]),
        _createVNode(_component_v_dialog, {
          modelValue: deleteDialog.value,
          "onUpdate:modelValue": _cache[65] || (_cache[65] = ($event) => deleteDialog.value = $event),
          "max-width": "460"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, { class: "emby-dialog" }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "emby-dialog__header text-error" }, {
                  default: _withCtx(() => [
                    _createElementVNode("span", _hoisted_67, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-alert-circle-outline",
                        size: "20",
                        color: "error"
                      }),
                      _createElementVNode("span", null, "删除用户：" + _toDisplayString(deleteTargetUser.value?.username), 1)
                    ]),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      rounded: "lg",
                      onClick: _cache[60] || (_cache[60] = ($event) => deleteDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, { class: "emby-dialog__body" }, {
                  default: _withCtx(() => [
                    _cache[106] || (_cache[106] = _createElementVNode("div", { class: "text-body-2 text-medium-emphasis" }, "勾选需要清理的范围：", -1)),
                    deleteTargetUser.value && deleteTargetUser.value.emby_servers.length > 0 ? (_openBlock(), _createBlock(_component_v_checkbox, {
                      key: 0,
                      modelValue: deleteFromEmby.value,
                      "onUpdate:modelValue": _cache[61] || (_cache[61] = ($event) => deleteFromEmby.value = $event),
                      color: "error",
                      density: "compact",
                      label: `从 Emby (${deleteTargetUser.value.emby_servers.join("、")}) 删除该账号`,
                      "hide-details": ""
                    }, null, 8, ["modelValue", "label"])) : _createCommentVNode("", true),
                    _createVNode(_component_v_checkbox, {
                      modelValue: deleteMpUser.value,
                      "onUpdate:modelValue": _cache[62] || (_cache[62] = ($event) => deleteMpUser.value = $event),
                      color: "error",
                      density: "compact",
                      label: "移除 MoviePilot 本地账号记录",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_checkbox, {
                      modelValue: deleteWithSubscribes.value,
                      "onUpdate:modelValue": _cache[63] || (_cache[63] = ($event) => deleteWithSubscribes.value = $event),
                      color: "error",
                      density: "compact",
                      label: `清理名下全部影视订阅 (${deleteTargetUser.value?.total_sub_count || 0} 条)`,
                      "hide-details": ""
                    }, null, 8, ["modelValue", "label"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, { class: "emby-dialog__footer" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    _createVNode(_component_v_btn, {
                      variant: "text",
                      rounded: "lg",
                      onClick: _cache[64] || (_cache[64] = ($event) => deleteDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[107] || (_cache[107] = [
                        _createTextVNode("取消", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "error",
                      variant: "flat",
                      rounded: "lg",
                      class: "px-5",
                      loading: deletingUser.value,
                      onClick: confirmDeleteUser
                    }, {
                      default: _withCtx(() => [..._cache[108] || (_cache[108] = [
                        _createTextVNode(" 确认删除 ", -1)
                      ])]),
                      _: 1
                    }, 8, ["loading"])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue"])
      ]);
    };
  }
});

const AppPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-492b4a4b"]]);

export { AppPage as default };
