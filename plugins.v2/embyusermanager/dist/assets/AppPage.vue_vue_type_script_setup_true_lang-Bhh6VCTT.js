import { importShared } from './__federation_fn_import-JrT3xvdd.js';

const {defineComponent:_defineComponent} = await importShared('vue');

const {resolveComponent:_resolveComponent,createVNode:_createVNode,createElementVNode:_createElementVNode,toDisplayString:_toDisplayString,createTextVNode:_createTextVNode,withCtx:_withCtx,openBlock:_openBlock,createBlock:_createBlock,createCommentVNode:_createCommentVNode,renderList:_renderList,Fragment:_Fragment,createElementBlock:_createElementBlock} = await importShared('vue');

const _hoisted_1 = { class: "emby-user-manager pa-4" };
const _hoisted_2 = { class: "d-flex flex-wrap align-center justify-space-between mb-4 gap-3" };
const _hoisted_3 = { class: "d-flex align-center flex-wrap gap-2" };
const _hoisted_4 = { class: "d-flex align-center flex-wrap gap-2" };
const _hoisted_5 = { class: "text-h5 font-weight-bold mt-1" };
const _hoisted_6 = { class: "text-caption mt-1" };
const _hoisted_7 = { class: "text-h5 font-weight-bold mt-1" };
const _hoisted_8 = { class: "text-caption mt-1" };
const _hoisted_9 = { class: "text-h5 font-weight-bold mt-1" };
const _hoisted_10 = { class: "text-h5 font-weight-bold mt-1" };
const _hoisted_11 = { class: "d-flex flex-wrap align-center justify-space-between gap-3" };
const _hoisted_12 = { class: "d-flex align-center justify-space-between mb-2" };
const _hoisted_13 = { class: "d-flex align-center gap-2 min-w-0" };
const _hoisted_14 = { class: "font-weight-bold" };
const _hoisted_15 = { class: "min-w-0" };
const _hoisted_16 = { class: "d-flex align-center flex-wrap gap-1" };
const _hoisted_17 = { class: "font-weight-bold text-body-1" };
const _hoisted_18 = { class: "text-caption text-medium-emphasis" };
const _hoisted_19 = { class: "text-caption text-medium-emphasis mb-2" };
const _hoisted_20 = { class: "d-flex align-center flex-wrap gap-2 my-2" };
const _hoisted_21 = { class: "d-flex align-center justify-space-between flex-wrap gap-1" };
const _hoisted_22 = { class: "d-flex align-center flex-wrap gap-1" };
const _hoisted_23 = { class: "d-flex align-center gap-1" };
const _hoisted_24 = {
  key: 0,
  class: "text-caption text-medium-emphasis"
};
const _hoisted_25 = {
  key: 0,
  class: "text-caption text-medium-emphasis"
};
const _hoisted_26 = {
  key: 1,
  class: "text-center py-6 text-medium-emphasis"
};
const _hoisted_27 = {
  key: 0,
  class: "text-caption text-medium-emphasis"
};
const _hoisted_28 = {
  key: 1,
  class: "text-caption ms-1"
};
const _hoisted_29 = { class: "text-body-2 mb-1" };
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
    const keyword = ref("");
    const statusFilter = ref("all");
    const config = ref({
      enabled: true,
      allow_mode: "all",
      whitelist: [],
      blacklist: [],
      allowed_servers: [],
      allow_emby_admin: true
    });
    const servers = ref([]);
    const stats = ref({
      emby_user_count: 0,
      mp_registered_count: 0,
      allowed_user_count: 0,
      total_subscribe_count: 0
    });
    const users = ref([]);
    const settingsDialog = ref(false);
    const whitelistInput = ref("");
    const blacklistInput = ref("");
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
      add_to_whitelist: false
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
            allow_emby_admin: Boolean(res.data.config?.allow_emby_admin ?? true)
          };
          whitelistInput.value = config.value.whitelist.join(", ");
          blacklistInput.value = config.value.blacklist.join(", ");
          servers.value = res.data.servers || [];
          stats.value = res.data.stats || stats.value;
          users.value = res.data.users || [];
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
    function statusColor(status) {
      if (status === "allowed") return "success";
      if (status === "blocked") return "warning";
      return "error";
    }
    function statusLabel(status) {
      if (status === "allowed") return "允许登录";
      if (status === "blocked") return "准入拦截";
      return "已禁用";
    }
    function allowModeLabel(mode) {
      if (mode === "whitelist") return "白名单模式";
      if (mode === "blacklist") return "黑名单模式";
      return "允许全部 Emby 用户";
    }
    function formatDateText(value) {
      if (!value) return "暂无记录";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleString("zh-CN", { hour12: false });
    }
    function primaryServerAccount(user) {
      const map = user.server_accounts || {};
      const firstServer = user.emby_servers[0];
      if (firstServer && map[firstServer]) return map[firstServer];
      const keys = Object.keys(map);
      return keys.length ? map[keys[0]] : null;
    }
    function folderSummaryText(user) {
      const acc = primaryServerAccount(user);
      if (!acc) return "仅本地账号";
      if (acc.enable_all_folders) return "全部媒体库";
      return `限定 ${acc.enabled_folders?.length || 0} 个媒体库`;
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
          add_to_whitelist: createForm.add_to_whitelist
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
    function openSettingsDialog() {
      whitelistInput.value = config.value.whitelist.join(", ");
      blacklistInput.value = config.value.blacklist.join(", ");
      settingsDialog.value = true;
    }
    async function savePolicyConfig() {
      if (!props.api?.post) return;
      savingConfig.value = true;
      try {
        const payload = {
          ...config.value,
          whitelist: parseListText(whitelistInput.value),
          blacklist: parseListText(blacklistInput.value)
        };
        const res = await props.api.post(`plugin/${resolvedPluginId.value}/config`, payload);
        if (res?.success) {
          notifySuccess("登录准入策略已保存");
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
      const _component_v_chip = _resolveComponent("v-chip");
      const _component_v_btn = _resolveComponent("v-btn");
      const _component_v_card = _resolveComponent("v-card");
      const _component_v_col = _resolveComponent("v-col");
      const _component_v_row = _resolveComponent("v-row");
      const _component_v_text_field = _resolveComponent("v-text-field");
      const _component_v_chip_group = _resolveComponent("v-chip-group");
      const _component_v_progress_linear = _resolveComponent("v-progress-linear");
      const _component_v_avatar = _resolveComponent("v-avatar");
      const _component_v_divider = _resolveComponent("v-divider");
      const _component_v_card_title = _resolveComponent("v-card-title");
      const _component_v_select = _resolveComponent("v-select");
      const _component_v_switch = _resolveComponent("v-switch");
      const _component_v_checkbox = _resolveComponent("v-checkbox");
      const _component_v_card_text = _resolveComponent("v-card-text");
      const _component_v_alert = _resolveComponent("v-alert");
      const _component_v_card_actions = _resolveComponent("v-card-actions");
      const _component_v_dialog = _resolveComponent("v-dialog");
      const _component_v_textarea = _resolveComponent("v-textarea");
      const _component_v_list_item_title = _resolveComponent("v-list-item-title");
      const _component_v_list_item_subtitle = _resolveComponent("v-list-item-subtitle");
      const _component_v_list_item = _resolveComponent("v-list-item");
      const _component_v_list = _resolveComponent("v-list");
      return _openBlock(), _createElementBlock("div", _hoisted_1, [
        _createElementVNode("div", _hoisted_2, [
          _createElementVNode("div", null, [
            _createElementVNode("div", _hoisted_3, [
              _createVNode(_component_v_icon, {
                icon: "mdi-account-group-outline",
                color: "primary",
                size: "28"
              }),
              _cache[56] || (_cache[56] = _createElementVNode("h2", { class: "text-h5 font-weight-bold mb-0" }, "Emby 账号与订阅管理", -1)),
              _createVNode(_component_v_chip, {
                color: config.value.enabled ? "success" : "secondary",
                size: "small",
                variant: "tonal"
              }, {
                default: _withCtx(() => [
                  _createTextVNode(_toDisplayString(config.value.enabled ? allowModeLabel(config.value.allow_mode) : "准入拦截已关闭"), 1)
                ]),
                _: 1
              }, 8, ["color"])
            ]),
            _cache[57] || (_cache[57] = _createElementVNode("div", { class: "text-body-2 text-medium-emphasis mt-1" }, " 直接新建、编辑、删除 Emby 媒体服务器账号与媒体库权限，并管控 MoviePilot 登录准入与个人订阅。 ", -1))
          ]),
          _createElementVNode("div", _hoisted_4, [
            _createVNode(_component_v_btn, {
              color: "primary",
              variant: "flat",
              "prepend-icon": "mdi-account-plus-outline",
              disabled: servers.value.length === 0,
              onClick: openCreateDialog
            }, {
              default: _withCtx(() => [..._cache[58] || (_cache[58] = [
                _createTextVNode(" 新建 Emby 账号 ", -1)
              ])]),
              _: 1
            }, 8, ["disabled"]),
            _createVNode(_component_v_btn, {
              variant: "tonal",
              color: "primary",
              "prepend-icon": "mdi-shield-tune-outline",
              onClick: openSettingsDialog
            }, {
              default: _withCtx(() => [..._cache[59] || (_cache[59] = [
                _createTextVNode(" 准入策略 ", -1)
              ])]),
              _: 1
            }),
            _createVNode(_component_v_btn, {
              variant: "tonal",
              "prepend-icon": "mdi-refresh",
              loading: loading.value,
              onClick: fetchOverview
            }, {
              default: _withCtx(() => [..._cache[60] || (_cache[60] = [
                _createTextVNode(" 刷新 ", -1)
              ])]),
              _: 1
            }, 8, ["loading"])
          ])
        ]),
        _createVNode(_component_v_row, {
          class: "mb-4",
          dense: ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_col, {
              cols: "6",
              sm: "3"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card, {
                  variant: "tonal",
                  color: "primary",
                  class: "pa-3"
                }, {
                  default: _withCtx(() => [
                    _cache[61] || (_cache[61] = _createElementVNode("div", { class: "text-caption text-medium-emphasis" }, "Emby 媒体库账号", -1)),
                    _createElementVNode("div", _hoisted_5, _toDisplayString(stats.value.emby_user_count), 1),
                    _createElementVNode("div", _hoisted_6, " 实例：" + _toDisplayString(servers.value.length ? servers.value.map((s) => s.name).join("、") : "未连接"), 1)
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createVNode(_component_v_col, {
              cols: "6",
              sm: "3"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card, {
                  variant: "tonal",
                  color: "success",
                  class: "pa-3"
                }, {
                  default: _withCtx(() => [
                    _cache[62] || (_cache[62] = _createElementVNode("div", { class: "text-caption text-medium-emphasis" }, "允许登录 MP", -1)),
                    _createElementVNode("div", _hoisted_7, _toDisplayString(stats.value.allowed_user_count), 1),
                    _createElementVNode("div", _hoisted_8, "策略：" + _toDisplayString(allowModeLabel(config.value.allow_mode)), 1)
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createVNode(_component_v_col, {
              cols: "6",
              sm: "3"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card, {
                  variant: "tonal",
                  color: "info",
                  class: "pa-3"
                }, {
                  default: _withCtx(() => [
                    _cache[63] || (_cache[63] = _createElementVNode("div", { class: "text-caption text-medium-emphasis" }, "已登录 MP 用户", -1)),
                    _createElementVNode("div", _hoisted_9, _toDisplayString(stats.value.mp_registered_count), 1),
                    _cache[64] || (_cache[64] = _createElementVNode("div", { class: "text-caption mt-1" }, "首次使用 Emby 登录自动建号", -1))
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createVNode(_component_v_col, {
              cols: "6",
              sm: "3"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card, {
                  variant: "tonal",
                  color: "warning",
                  class: "pa-3"
                }, {
                  default: _withCtx(() => [
                    _cache[65] || (_cache[65] = _createElementVNode("div", { class: "text-caption text-medium-emphasis" }, "普通用户订阅总数", -1)),
                    _createElementVNode("div", _hoisted_10, _toDisplayString(stats.value.total_subscribe_count), 1),
                    _cache[66] || (_cache[66] = _createElementVNode("div", { class: "text-caption mt-1" }, "可在订阅页按用户名筛选", -1))
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          _: 1
        }),
        _createVNode(_component_v_card, {
          class: "mb-4 pa-3",
          variant: "outlined"
        }, {
          default: _withCtx(() => [
            _createElementVNode("div", _hoisted_11, [
              _createVNode(_component_v_text_field, {
                modelValue: keyword.value,
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => keyword.value = $event),
                "prepend-inner-icon": "mdi-magnify",
                placeholder: "搜索 Emby 用户名...",
                density: "compact",
                variant: "outlined",
                "hide-details": "",
                clearable: "",
                style: { "max-width": "320px", "min-width": "220px" }
              }, null, 8, ["modelValue"]),
              _createVNode(_component_v_chip_group, {
                modelValue: statusFilter.value,
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => statusFilter.value = $event),
                mandatory: "",
                "selected-class": "text-primary"
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_chip, {
                    value: "all",
                    size: "small",
                    filter: "",
                    variant: "tonal"
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode("全部 (" + _toDisplayString(users.value.length) + ")", 1)
                    ]),
                    _: 1
                  }),
                  _createVNode(_component_v_chip, {
                    value: "allowed",
                    size: "small",
                    filter: "",
                    variant: "tonal",
                    color: "success"
                  }, {
                    default: _withCtx(() => [..._cache[67] || (_cache[67] = [
                      _createTextVNode("允许登录", -1)
                    ])]),
                    _: 1
                  }),
                  _createVNode(_component_v_chip, {
                    value: "blocked",
                    size: "small",
                    filter: "",
                    variant: "tonal",
                    color: "warning"
                  }, {
                    default: _withCtx(() => [..._cache[68] || (_cache[68] = [
                      _createTextVNode("准入拦截", -1)
                    ])]),
                    _: 1
                  }),
                  _createVNode(_component_v_chip, {
                    value: "disabled",
                    size: "small",
                    filter: "",
                    variant: "tonal",
                    color: "error"
                  }, {
                    default: _withCtx(() => [..._cache[69] || (_cache[69] = [
                      _createTextVNode("已禁用", -1)
                    ])]),
                    _: 1
                  }),
                  _createVNode(_component_v_chip, {
                    value: "registered",
                    size: "small",
                    filter: "",
                    variant: "tonal",
                    color: "info"
                  }, {
                    default: _withCtx(() => [..._cache[70] || (_cache[70] = [
                      _createTextVNode("已登录 MP", -1)
                    ])]),
                    _: 1
                  })
                ]),
                _: 1
              }, 8, ["modelValue"])
            ])
          ]),
          _: 1
        }),
        loading.value ? (_openBlock(), _createBlock(_component_v_progress_linear, {
          key: 0,
          indeterminate: "",
          color: "primary",
          class: "mb-3"
        })) : _createCommentVNode("", true),
        !loading.value && filteredUsers.value.length === 0 ? (_openBlock(), _createBlock(_component_v_card, {
          key: 1,
          variant: "outlined",
          class: "pa-8 text-center"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_icon, {
              icon: "mdi-account-off-outline",
              size: "48",
              color: "medium-emphasis",
              class: "mb-2"
            }),
            _cache[71] || (_cache[71] = _createElementVNode("div", { class: "text-body-1 font-weight-medium" }, "暂无匹配的 Emby 用户", -1)),
            _cache[72] || (_cache[72] = _createElementVNode("div", { class: "text-caption text-medium-emphasis mt-1" }, " 可点击右上角「新建 Emby 账号」创建新用户，或检查媒体服务器连接状态。 ", -1))
          ]),
          _: 1
        })) : (_openBlock(), _createBlock(_component_v_row, {
          key: 2,
          dense: ""
        }, {
          default: _withCtx(() => [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(filteredUsers.value, (user) => {
              return _openBlock(), _createBlock(_component_v_col, {
                key: user.username,
                cols: "12",
                md: "6",
                lg: "4"
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_card, {
                    variant: "outlined",
                    class: "pa-3 h-100 d-flex flex-column justify-space-between"
                  }, {
                    default: _withCtx(() => [
                      _createElementVNode("div", null, [
                        _createElementVNode("div", _hoisted_12, [
                          _createElementVNode("div", _hoisted_13, [
                            _createVNode(_component_v_avatar, {
                              color: "primary",
                              variant: "tonal",
                              size: "38"
                            }, {
                              default: _withCtx(() => [
                                _createElementVNode("span", _hoisted_14, _toDisplayString(user.username.slice(0, 1).toUpperCase()), 1)
                              ]),
                              _: 2
                            }, 1024),
                            _createElementVNode("div", _hoisted_15, [
                              _createElementVNode("div", _hoisted_16, [
                                _createElementVNode("span", _hoisted_17, _toDisplayString(user.username), 1),
                                user.emby_is_admin ? (_openBlock(), _createBlock(_component_v_chip, {
                                  key: 0,
                                  size: "x-small",
                                  color: "purple",
                                  variant: "tonal"
                                }, {
                                  default: _withCtx(() => [..._cache[73] || (_cache[73] = [
                                    _createTextVNode(" Emby管理员 ", -1)
                                  ])]),
                                  _: 1
                                })) : _createCommentVNode("", true),
                                user.emby_is_disabled ? (_openBlock(), _createBlock(_component_v_chip, {
                                  key: 1,
                                  size: "x-small",
                                  color: "error",
                                  variant: "tonal"
                                }, {
                                  default: _withCtx(() => [..._cache[74] || (_cache[74] = [
                                    _createTextVNode(" Emby已停用 ", -1)
                                  ])]),
                                  _: 1
                                })) : _createCommentVNode("", true),
                                user.registered_in_mp ? (_openBlock(), _createBlock(_component_v_chip, {
                                  key: 2,
                                  size: "x-small",
                                  color: "info",
                                  variant: "tonal"
                                }, {
                                  default: _withCtx(() => [..._cache[75] || (_cache[75] = [
                                    _createTextVNode(" 已登录MP ", -1)
                                  ])]),
                                  _: 1
                                })) : _createCommentVNode("", true)
                              ]),
                              _createElementVNode("div", _hoisted_18, _toDisplayString(user.emby_servers.length ? user.emby_servers.join("、") : "仅本地记录") + " · " + _toDisplayString(folderSummaryText(user)) + " · " + _toDisplayString(user.has_password ? "已设密码" : "免密登录"), 1)
                            ])
                          ]),
                          _createVNode(_component_v_chip, {
                            color: statusColor(user.access_status),
                            size: "small",
                            variant: "tonal"
                          }, {
                            default: _withCtx(() => [
                              _createTextVNode(_toDisplayString(statusLabel(user.access_status)), 1)
                            ]),
                            _: 2
                          }, 1032, ["color"])
                        ]),
                        _createElementVNode("div", _hoisted_19, [
                          _createElementVNode("div", null, "MP 准入：" + _toDisplayString(user.access_reason), 1),
                          _createElementVNode("div", null, "最近活跃：" + _toDisplayString(formatDateText(user.last_activity_date || user.last_login_date)), 1)
                        ]),
                        _createElementVNode("div", _hoisted_20, [
                          _createVNode(_component_v_chip, {
                            size: "small",
                            variant: "tonal",
                            color: "primary",
                            "prepend-icon": "mdi-movie-open-outline",
                            onClick: ($event) => openUserSubscribes(user)
                          }, {
                            default: _withCtx(() => [
                              _createTextVNode(" 电影 " + _toDisplayString(user.movie_sub_count), 1)
                            ]),
                            _: 2
                          }, 1032, ["onClick"]),
                          _createVNode(_component_v_chip, {
                            size: "small",
                            variant: "tonal",
                            color: "warning",
                            "prepend-icon": "mdi-television",
                            onClick: ($event) => openUserSubscribes(user)
                          }, {
                            default: _withCtx(() => [
                              _createTextVNode(" 剧集 " + _toDisplayString(user.tv_sub_count), 1)
                            ]),
                            _: 2
                          }, 1032, ["onClick"]),
                          user.in_whitelist ? (_openBlock(), _createBlock(_component_v_chip, {
                            key: 0,
                            size: "x-small",
                            color: "success",
                            variant: "outlined"
                          }, {
                            default: _withCtx(() => [..._cache[76] || (_cache[76] = [
                              _createTextVNode(" 白名单 ", -1)
                            ])]),
                            _: 1
                          })) : _createCommentVNode("", true),
                          user.in_blacklist ? (_openBlock(), _createBlock(_component_v_chip, {
                            key: 1,
                            size: "x-small",
                            color: "error",
                            variant: "outlined"
                          }, {
                            default: _withCtx(() => [..._cache[77] || (_cache[77] = [
                              _createTextVNode(" 黑名单 ", -1)
                            ])]),
                            _: 1
                          })) : _createCommentVNode("", true)
                        ])
                      ]),
                      _createVNode(_component_v_divider, { class: "my-2" }),
                      _createElementVNode("div", _hoisted_21, [
                        _createElementVNode("div", _hoisted_22, [
                          user.emby_servers.length > 0 ? (_openBlock(), _createBlock(_component_v_btn, {
                            key: 0,
                            size: "x-small",
                            color: "primary",
                            variant: "tonal",
                            "prepend-icon": "mdi-account-edit-outline",
                            onClick: ($event) => openEditDialog(user)
                          }, {
                            default: _withCtx(() => [..._cache[78] || (_cache[78] = [
                              _createTextVNode(" 编辑账号 ", -1)
                            ])]),
                            _: 1
                          }, 8, ["onClick"])) : _createCommentVNode("", true),
                          _createVNode(_component_v_btn, {
                            size: "x-small",
                            color: user.is_active ? "warning" : "success",
                            variant: "tonal",
                            "prepend-icon": user.is_active ? "mdi-account-cancel-outline" : "mdi-account-check-outline",
                            onClick: ($event) => toggleUserActive(user)
                          }, {
                            default: _withCtx(() => [
                              _createTextVNode(_toDisplayString(user.is_active ? "禁登MP" : "允许MP"), 1)
                            ]),
                            _: 2
                          }, 1032, ["color", "prepend-icon", "onClick"]),
                          !user.in_whitelist ? (_openBlock(), _createBlock(_component_v_btn, {
                            key: 1,
                            size: "x-small",
                            color: "success",
                            variant: "text",
                            onClick: ($event) => updateAccessList(user, "whitelist", "add")
                          }, {
                            default: _withCtx(() => [..._cache[79] || (_cache[79] = [
                              _createTextVNode(" +白名单 ", -1)
                            ])]),
                            _: 1
                          }, 8, ["onClick"])) : (_openBlock(), _createBlock(_component_v_btn, {
                            key: 2,
                            size: "x-small",
                            color: "secondary",
                            variant: "text",
                            onClick: ($event) => updateAccessList(user, "whitelist", "remove")
                          }, {
                            default: _withCtx(() => [..._cache[80] || (_cache[80] = [
                              _createTextVNode(" -白名单 ", -1)
                            ])]),
                            _: 1
                          }, 8, ["onClick"])),
                          !user.in_blacklist ? (_openBlock(), _createBlock(_component_v_btn, {
                            key: 3,
                            size: "x-small",
                            color: "error",
                            variant: "text",
                            onClick: ($event) => updateAccessList(user, "blacklist", "add")
                          }, {
                            default: _withCtx(() => [..._cache[81] || (_cache[81] = [
                              _createTextVNode(" +黑名单 ", -1)
                            ])]),
                            _: 1
                          }, 8, ["onClick"])) : (_openBlock(), _createBlock(_component_v_btn, {
                            key: 4,
                            size: "x-small",
                            color: "secondary",
                            variant: "text",
                            onClick: ($event) => updateAccessList(user, "blacklist", "remove")
                          }, {
                            default: _withCtx(() => [..._cache[82] || (_cache[82] = [
                              _createTextVNode(" -黑名单 ", -1)
                            ])]),
                            _: 1
                          }, 8, ["onClick"]))
                        ]),
                        _createElementVNode("div", _hoisted_23, [
                          _createVNode(_component_v_btn, {
                            size: "x-small",
                            variant: "text",
                            color: "info",
                            icon: "mdi-format-list-bulleted",
                            title: "查看订阅明细",
                            onClick: ($event) => openUserSubscribes(user)
                          }, null, 8, ["onClick"]),
                          _createVNode(_component_v_btn, {
                            size: "x-small",
                            variant: "text",
                            color: "error",
                            icon: "mdi-delete-outline",
                            title: "删除 Emby 账号或清理订阅",
                            onClick: ($event) => openDeleteUserDialog(user)
                          }, null, 8, ["onClick"])
                        ])
                      ])
                    ]),
                    _: 2
                  }, 1024)
                ]),
                _: 2
              }, 1024);
            }), 128))
          ]),
          _: 1
        })),
        _createVNode(_component_v_dialog, {
          modelValue: createDialog.value,
          "onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => createDialog.value = $event),
          "max-width": "620",
          scrollable: ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "d-flex align-center justify-space-between" }, {
                  default: _withCtx(() => [
                    _cache[83] || (_cache[83] = _createElementVNode("span", null, "新建 Emby 媒体服务器账号", -1)),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      onClick: _cache[2] || (_cache[2] = ($event) => createDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_divider),
                !createdCredential.value ? (_openBlock(), _createBlock(_component_v_card_text, {
                  key: 0,
                  class: "d-flex flex-column gap-3 pt-4"
                }, {
                  default: _withCtx(() => [
                    servers.value.length > 1 ? (_openBlock(), _createBlock(_component_v_select, {
                      key: 0,
                      modelValue: createForm.server,
                      "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => createForm.server = $event),
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
                              "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => createForm.username = $event),
                              label: "Emby 用户名 *",
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
                              "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => createForm.password = $event),
                              type: showCreatePassword.value ? "text" : "password",
                              label: "初始密码（留空则随机生成）",
                              variant: "outlined",
                              density: "compact",
                              "hide-details": "",
                              "append-inner-icon": showCreatePassword.value ? "mdi-eye-off-outline" : "mdi-eye-outline",
                              "onClick:appendInner": _cache[6] || (_cache[6] = ($event) => showCreatePassword.value = !showCreatePassword.value)
                            }, null, 8, ["modelValue", "type", "append-inner-icon"])
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    }),
                    _createVNode(_component_v_select, {
                      modelValue: createForm.copy_from_user_id,
                      "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => createForm.copy_from_user_id = $event),
                      items: [{ id: "", name: "不复制（按下方自定义权限配置）" }, ...createTemplateUsers.value],
                      "item-title": "name",
                      "item-value": "id",
                      label: "从现有用户复制权限配置（可选）",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": ""
                    }, null, 8, ["modelValue", "items"]),
                    !createForm.copy_from_user_id ? (_openBlock(), _createElementBlock(_Fragment, { key: 1 }, [
                      _createVNode(_component_v_divider, { class: "my-1" }),
                      _cache[85] || (_cache[85] = _createElementVNode("div", { class: "text-subtitle-2 font-weight-bold" }, "Emby 账号权限与媒体库授权", -1)),
                      _createVNode(_component_v_row, { dense: "" }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_col, {
                            cols: "12",
                            sm: "6"
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_switch, {
                                modelValue: createForm.is_admin,
                                "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => createForm.is_admin = $event),
                                color: "primary",
                                density: "compact",
                                label: "设为 Emby 管理员",
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
                              _createVNode(_component_v_switch, {
                                modelValue: createForm.is_hidden,
                                "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => createForm.is_hidden = $event),
                                color: "primary",
                                density: "compact",
                                label: "在登录界面隐藏此账号",
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
                              _createVNode(_component_v_switch, {
                                modelValue: createForm.enable_remote_access,
                                "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => createForm.enable_remote_access = $event),
                                color: "primary",
                                density: "compact",
                                label: "允许外网远程连接",
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
                              _createVNode(_component_v_switch, {
                                modelValue: createForm.enable_downloading,
                                "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => createForm.enable_downloading = $event),
                                color: "primary",
                                density: "compact",
                                label: "允许下载媒体文件",
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
                              _createVNode(_component_v_switch, {
                                modelValue: createForm.enable_video_transcoding,
                                "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => createForm.enable_video_transcoding = $event),
                                color: "primary",
                                density: "compact",
                                label: "允许视频播放转码",
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
                              _createVNode(_component_v_switch, {
                                modelValue: createForm.enable_audio_transcoding,
                                "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => createForm.enable_audio_transcoding = $event),
                                color: "primary",
                                density: "compact",
                                label: "允许音频播放转码",
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
                        "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => createForm.simultaneous_stream_limit = $event),
                        modelModifiers: { number: true },
                        type: "number",
                        min: "0",
                        label: "最大同时播放流数量限制（0 表示不限制）",
                        variant: "outlined",
                        density: "compact",
                        "hide-details": ""
                      }, null, 8, ["modelValue"]),
                      _createVNode(_component_v_switch, {
                        modelValue: createForm.enable_all_folders,
                        "onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => createForm.enable_all_folders = $event),
                        color: "success",
                        density: "compact",
                        label: "允许访问所有媒体库",
                        "hide-details": ""
                      }, null, 8, ["modelValue"]),
                      !createForm.enable_all_folders ? (_openBlock(), _createBlock(_component_v_card, {
                        key: 0,
                        variant: "outlined",
                        class: "pa-3"
                      }, {
                        default: _withCtx(() => [
                          _cache[84] || (_cache[84] = _createElementVNode("div", { class: "text-caption text-medium-emphasis mb-2" }, "勾选允许该用户访问的媒体库：", -1)),
                          createServerFolders.value.length === 0 ? (_openBlock(), _createElementBlock("div", _hoisted_24, " 未读取到媒体库文件夹列表 ")) : (_openBlock(), _createBlock(_component_v_row, {
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
                                      "onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => createForm.enabled_folders = $event),
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
                    _createVNode(_component_v_divider, { class: "my-1" }),
                    _createVNode(_component_v_checkbox, {
                      modelValue: createForm.add_to_whitelist,
                      "onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => createForm.add_to_whitelist = $event),
                      color: "success",
                      density: "compact",
                      label: "同时将该用户加入 MoviePilot 登录白名单",
                      "hide-details": ""
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                })) : (_openBlock(), _createBlock(_component_v_card_text, {
                  key: 1,
                  class: "pt-4"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_alert, {
                      type: "success",
                      variant: "tonal",
                      icon: "mdi-key-check-outline"
                    }, {
                      title: _withCtx(() => [
                        _createTextVNode("账号 " + _toDisplayString(createdCredential.value.username) + " 创建成功", 1)
                      ]),
                      default: _withCtx(() => [
                        _cache[86] || (_cache[86] = _createElementVNode("div", { class: "mb-3" }, "初始密码已随机生成，请立即复制并妥善保管：", -1)),
                        _createVNode(_component_v_text_field, {
                          "model-value": createdCredential.value.password,
                          label: "随机生成的初始密码",
                          readonly: "",
                          variant: "outlined",
                          density: "compact",
                          "append-inner-icon": "mdi-content-copy",
                          "onClick:appendInner": _cache[18] || (_cache[18] = ($event) => _ctx.navigator.clipboard?.writeText(createdCredential.value?.password || ""))
                        }, null, 8, ["model-value"])
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                })),
                _createVNode(_component_v_divider),
                _createVNode(_component_v_card_actions, { class: "justify-end pa-4" }, {
                  default: _withCtx(() => [
                    !createdCredential.value ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                      _createVNode(_component_v_btn, {
                        variant: "text",
                        onClick: _cache[19] || (_cache[19] = ($event) => createDialog.value = false)
                      }, {
                        default: _withCtx(() => [..._cache[87] || (_cache[87] = [
                          _createTextVNode("取消", -1)
                        ])]),
                        _: 1
                      }),
                      _createVNode(_component_v_btn, {
                        color: "primary",
                        variant: "flat",
                        loading: creatingUser.value,
                        onClick: submitCreateUser
                      }, {
                        default: _withCtx(() => [..._cache[88] || (_cache[88] = [
                          _createTextVNode(" 创建账号 ", -1)
                        ])]),
                        _: 1
                      }, 8, ["loading"])
                    ], 64)) : (_openBlock(), _createBlock(_component_v_btn, {
                      key: 1,
                      color: "primary",
                      variant: "flat",
                      onClick: _cache[20] || (_cache[20] = ($event) => createDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[89] || (_cache[89] = [
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
          "onUpdate:modelValue": _cache[39] || (_cache[39] = ($event) => editDialog.value = $event),
          "max-width": "640",
          scrollable: ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "d-flex align-center justify-space-between" }, {
                  default: _withCtx(() => [
                    _createElementVNode("span", null, "编辑 Emby 账号：" + _toDisplayString(editForm.username), 1),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      onClick: _cache[22] || (_cache[22] = ($event) => editDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_divider),
                editLoading.value ? (_openBlock(), _createBlock(_component_v_progress_linear, {
                  key: 0,
                  indeterminate: "",
                  color: "primary"
                })) : _createCommentVNode("", true),
                _createVNode(_component_v_card_text, { class: "d-flex flex-column gap-3 pt-4" }, {
                  default: _withCtx(() => [
                    editTargetUser.value && editTargetUser.value.emby_servers.length > 1 ? (_openBlock(), _createBlock(_component_v_select, {
                      key: 0,
                      "model-value": editForm.server,
                      items: editTargetUser.value.emby_servers,
                      label: "当前编辑的 Emby 服务器实例",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "",
                      "onUpdate:modelValue": onEditServerChange
                    }, null, 8, ["model-value", "items"])) : _createCommentVNode("", true),
                    _createVNode(_component_v_row, { dense: "" }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_col, {
                          cols: "12",
                          sm: "6"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_text_field, {
                              modelValue: editForm.new_username,
                              "onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => editForm.new_username = $event),
                              label: "Emby 用户名",
                              variant: "outlined",
                              density: "compact",
                              hint: "修改用户名会自动同步迁移本地订阅归属",
                              "persistent-hint": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          sm: "6"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.change_password,
                              "onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => editForm.change_password = $event),
                              color: "warning",
                              density: "compact",
                              label: "重置 / 修改登录密码",
                              "hide-details": ""
                            }, null, 8, ["modelValue"]),
                            editForm.change_password ? (_openBlock(), _createBlock(_component_v_text_field, {
                              key: 0,
                              modelValue: editForm.new_password,
                              "onUpdate:modelValue": _cache[25] || (_cache[25] = ($event) => editForm.new_password = $event),
                              type: showEditPassword.value ? "text" : "password",
                              label: "新密码（留空表示清空密码设为免密）",
                              variant: "outlined",
                              density: "compact",
                              "hide-details": "",
                              class: "mt-2",
                              "append-inner-icon": showEditPassword.value ? "mdi-eye-off-outline" : "mdi-eye-outline",
                              "onClick:appendInner": _cache[26] || (_cache[26] = ($event) => showEditPassword.value = !showEditPassword.value)
                            }, null, 8, ["modelValue", "type", "append-inner-icon"])) : _createCommentVNode("", true)
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    }),
                    _createVNode(_component_v_divider, { class: "my-1" }),
                    _cache[91] || (_cache[91] = _createElementVNode("div", { class: "text-subtitle-2 font-weight-bold" }, "账号状态与权限策略", -1)),
                    _createVNode(_component_v_row, { dense: "" }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_col, {
                          cols: "12",
                          sm: "6"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.is_disabled,
                              "onUpdate:modelValue": _cache[27] || (_cache[27] = ($event) => editForm.is_disabled = $event),
                              color: "error",
                              density: "compact",
                              label: "在 Emby 中禁用此账号",
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
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.mp_is_active,
                              "onUpdate:modelValue": _cache[28] || (_cache[28] = ($event) => editForm.mp_is_active = $event),
                              color: "success",
                              density: "compact",
                              label: "允许登录 MoviePilot 订阅",
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
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.is_admin,
                              "onUpdate:modelValue": _cache[29] || (_cache[29] = ($event) => editForm.is_admin = $event),
                              color: "primary",
                              density: "compact",
                              label: "Emby 管理员权限",
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
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.is_hidden,
                              "onUpdate:modelValue": _cache[30] || (_cache[30] = ($event) => editForm.is_hidden = $event),
                              color: "primary",
                              density: "compact",
                              label: "在 Emby 登录界面隐藏",
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
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.enable_remote_access,
                              "onUpdate:modelValue": _cache[31] || (_cache[31] = ($event) => editForm.enable_remote_access = $event),
                              color: "primary",
                              density: "compact",
                              label: "允许外网远程连接",
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
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.enable_downloading,
                              "onUpdate:modelValue": _cache[32] || (_cache[32] = ($event) => editForm.enable_downloading = $event),
                              color: "primary",
                              density: "compact",
                              label: "允许下载媒体文件",
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
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.enable_video_transcoding,
                              "onUpdate:modelValue": _cache[33] || (_cache[33] = ($event) => editForm.enable_video_transcoding = $event),
                              color: "primary",
                              density: "compact",
                              label: "允许视频播放转码",
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
                            _createVNode(_component_v_switch, {
                              modelValue: editForm.enable_audio_transcoding,
                              "onUpdate:modelValue": _cache[34] || (_cache[34] = ($event) => editForm.enable_audio_transcoding = $event),
                              color: "primary",
                              density: "compact",
                              label: "允许音频播放转码",
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
                      "onUpdate:modelValue": _cache[35] || (_cache[35] = ($event) => editForm.simultaneous_stream_limit = $event),
                      modelModifiers: { number: true },
                      type: "number",
                      min: "0",
                      label: "最大同时播放流数量限制（0 表示不限制）",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_divider, { class: "my-1" }),
                    _cache[92] || (_cache[92] = _createElementVNode("div", { class: "text-subtitle-2 font-weight-bold" }, "媒体库访问范围", -1)),
                    _createVNode(_component_v_switch, {
                      modelValue: editForm.enable_all_folders,
                      "onUpdate:modelValue": _cache[36] || (_cache[36] = ($event) => editForm.enable_all_folders = $event),
                      color: "success",
                      density: "compact",
                      label: "允许访问所有媒体库",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    !editForm.enable_all_folders ? (_openBlock(), _createBlock(_component_v_card, {
                      key: 1,
                      variant: "outlined",
                      class: "pa-3"
                    }, {
                      default: _withCtx(() => [
                        _cache[90] || (_cache[90] = _createElementVNode("div", { class: "text-caption text-medium-emphasis mb-2" }, "勾选允许访问的媒体库：", -1)),
                        editServerFolders.value.length === 0 ? (_openBlock(), _createElementBlock("div", _hoisted_25, " 未读取到媒体库文件夹列表 ")) : (_openBlock(), _createBlock(_component_v_row, {
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
                                    "onUpdate:modelValue": _cache[37] || (_cache[37] = ($event) => editForm.enabled_folders = $event),
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
                _createVNode(_component_v_divider),
                _createVNode(_component_v_card_actions, { class: "justify-end pa-4" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_btn, {
                      variant: "text",
                      onClick: _cache[38] || (_cache[38] = ($event) => editDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[93] || (_cache[93] = [
                        _createTextVNode("取消", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "primary",
                      variant: "flat",
                      loading: savingEdit.value,
                      onClick: submitEditUser
                    }, {
                      default: _withCtx(() => [..._cache[94] || (_cache[94] = [
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
          "onUpdate:modelValue": _cache[48] || (_cache[48] = ($event) => settingsDialog.value = $event),
          "max-width": "560"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "d-flex align-center justify-space-between" }, {
                  default: _withCtx(() => [
                    _cache[95] || (_cache[95] = _createElementVNode("span", null, "MoviePilot 登录准入策略设置", -1)),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      onClick: _cache[40] || (_cache[40] = ($event) => settingsDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_divider),
                _createVNode(_component_v_card_text, { class: "d-flex flex-column gap-3" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_switch, {
                      modelValue: config.value.enabled,
                      "onUpdate:modelValue": _cache[41] || (_cache[41] = ($event) => config.value.enabled = $event),
                      color: "primary",
                      label: "启用 Emby 用户管理与准入拦截",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_switch, {
                      modelValue: config.value.allow_emby_admin,
                      "onUpdate:modelValue": _cache[42] || (_cache[42] = ($event) => config.value.allow_emby_admin = $event),
                      color: "primary",
                      label: "允许 Emby 管理员账号作为普通订阅用户登录",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_select, {
                      modelValue: config.value.allow_mode,
                      "onUpdate:modelValue": _cache[43] || (_cache[43] = ($event) => config.value.allow_mode = $event),
                      items: [
                        { title: "全部允许（除黑名单/禁用账号外均可登录）", value: "all" },
                        { title: "白名单模式（仅白名单中的 Emby 用户可登录）", value: "whitelist" },
                        { title: "黑名单模式（拦截黑名单中的 Emby 用户）", value: "blacklist" }
                      ],
                      "item-title": "title",
                      "item-value": "value",
                      label: "登录准入模式",
                      variant: "outlined",
                      density: "compact"
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_select, {
                      modelValue: config.value.allowed_servers,
                      "onUpdate:modelValue": _cache[44] || (_cache[44] = ($event) => config.value.allowed_servers = $event),
                      items: servers.value.map((s) => s.name),
                      label: "允许登录的 Emby 服务器（留空表示全部已启用实例）",
                      variant: "outlined",
                      density: "compact",
                      multiple: "",
                      chips: "",
                      clearable: ""
                    }, null, 8, ["modelValue", "items"]),
                    _createVNode(_component_v_textarea, {
                      modelValue: whitelistInput.value,
                      "onUpdate:modelValue": _cache[45] || (_cache[45] = ($event) => whitelistInput.value = $event),
                      label: "白名单用户名（多个用户名用逗号或换行分隔）",
                      variant: "outlined",
                      rows: "2",
                      density: "compact"
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_textarea, {
                      modelValue: blacklistInput.value,
                      "onUpdate:modelValue": _cache[46] || (_cache[46] = ($event) => blacklistInput.value = $event),
                      label: "黑名单用户名（多个用户名用逗号或换行分隔）",
                      variant: "outlined",
                      rows: "2",
                      density: "compact"
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, { class: "justify-end pa-4" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_btn, {
                      variant: "text",
                      onClick: _cache[47] || (_cache[47] = ($event) => settingsDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[96] || (_cache[96] = [
                        _createTextVNode("取消", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "primary",
                      variant: "flat",
                      loading: savingConfig.value,
                      onClick: savePolicyConfig
                    }, {
                      default: _withCtx(() => [..._cache[97] || (_cache[97] = [
                        _createTextVNode(" 保存设置 ", -1)
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
          "onUpdate:modelValue": _cache[50] || (_cache[50] = ($event) => subDialog.value = $event),
          "max-width": "640"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "d-flex align-center justify-space-between" }, {
                  default: _withCtx(() => [
                    _createElementVNode("span", null, _toDisplayString(subDialogUser.value) + " 的订阅记录 (" + _toDisplayString(userSubscribes.value.length) + ")", 1),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      onClick: _cache[49] || (_cache[49] = ($event) => subDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_divider),
                _createVNode(_component_v_card_text, null, {
                  default: _withCtx(() => [
                    subDialogLoading.value ? (_openBlock(), _createBlock(_component_v_progress_linear, {
                      key: 0,
                      indeterminate: "",
                      color: "primary",
                      class: "mb-3"
                    })) : userSubscribes.value.length === 0 ? (_openBlock(), _createElementBlock("div", _hoisted_26, " 该用户暂无订阅记录 ")) : (_openBlock(), _createBlock(_component_v_list, {
                      key: 2,
                      lines: "two",
                      density: "comfortable"
                    }, {
                      default: _withCtx(() => [
                        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(userSubscribes.value, (sub) => {
                          return _openBlock(), _createBlock(_component_v_list_item, {
                            key: sub.id
                          }, {
                            prepend: _withCtx(() => [
                              _createVNode(_component_v_icon, {
                                icon: sub.type === "电影" ? "mdi-movie-open-outline" : "mdi-television",
                                color: sub.type === "电影" ? "success" : "warning"
                              }, null, 8, ["icon", "color"])
                            ]),
                            default: _withCtx(() => [
                              _createVNode(_component_v_list_item_title, { class: "font-weight-medium" }, {
                                default: _withCtx(() => [
                                  _createTextVNode(_toDisplayString(sub.name) + " ", 1),
                                  sub.year ? (_openBlock(), _createElementBlock("span", _hoisted_27, "(" + _toDisplayString(sub.year) + ")", 1)) : _createCommentVNode("", true),
                                  sub.season ? (_openBlock(), _createElementBlock("span", _hoisted_28, "S" + _toDisplayString(sub.season), 1)) : _createCommentVNode("", true)
                                ]),
                                _: 2
                              }, 1024),
                              _createVNode(_component_v_list_item_subtitle, null, {
                                default: _withCtx(() => [
                                  _createTextVNode(" 类型：" + _toDisplayString(sub.type) + " · 状态：" + _toDisplayString(sub.state || "R") + " · 订阅时间：" + _toDisplayString(sub.date || "-"), 1)
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
          "onUpdate:modelValue": _cache[55] || (_cache[55] = ($event) => deleteDialog.value = $event),
          "max-width": "480"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "text-error" }, {
                  default: _withCtx(() => [
                    _createTextVNode("删除用户：" + _toDisplayString(deleteTargetUser.value?.username), 1)
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_divider),
                _createVNode(_component_v_card_text, { class: "d-flex flex-column gap-2 pt-4" }, {
                  default: _withCtx(() => [
                    _createElementVNode("div", _hoisted_29, [
                      _cache[98] || (_cache[98] = _createTextVNode(" 请选择要对用户 ", -1)),
                      _createElementVNode("strong", null, _toDisplayString(deleteTargetUser.value?.username), 1),
                      _cache[99] || (_cache[99] = _createTextVNode(" 执行的清理范围： ", -1))
                    ]),
                    deleteTargetUser.value && deleteTargetUser.value.emby_servers.length > 0 ? (_openBlock(), _createBlock(_component_v_checkbox, {
                      key: 0,
                      modelValue: deleteFromEmby.value,
                      "onUpdate:modelValue": _cache[51] || (_cache[51] = ($event) => deleteFromEmby.value = $event),
                      color: "error",
                      density: "compact",
                      label: `从 Emby 媒体服务器 (${deleteTargetUser.value.emby_servers.join("、")}) 彻底删除该账号`,
                      "hide-details": ""
                    }, null, 8, ["modelValue", "label"])) : _createCommentVNode("", true),
                    _createVNode(_component_v_checkbox, {
                      modelValue: deleteMpUser.value,
                      "onUpdate:modelValue": _cache[52] || (_cache[52] = ($event) => deleteMpUser.value = $event),
                      color: "warning",
                      density: "compact",
                      label: "移除 MoviePilot 本地账号与个人配置记录",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_checkbox, {
                      modelValue: deleteWithSubscribes.value,
                      "onUpdate:modelValue": _cache[53] || (_cache[53] = ($event) => deleteWithSubscribes.value = $event),
                      color: "error",
                      density: "compact",
                      label: `同时清理该用户名下的全部影视订阅 (${deleteTargetUser.value?.total_sub_count || 0} 条)`,
                      "hide-details": ""
                    }, null, 8, ["modelValue", "label"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, { class: "justify-end pa-4" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_btn, {
                      variant: "text",
                      onClick: _cache[54] || (_cache[54] = ($event) => deleteDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[100] || (_cache[100] = [
                        _createTextVNode("取消", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "error",
                      variant: "flat",
                      loading: deletingUser.value,
                      onClick: confirmDeleteUser
                    }, {
                      default: _withCtx(() => [..._cache[101] || (_cache[101] = [
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

export { _sfc_main as _ };
