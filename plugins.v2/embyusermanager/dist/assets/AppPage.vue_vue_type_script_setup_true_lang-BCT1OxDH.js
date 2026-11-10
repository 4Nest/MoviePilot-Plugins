import { importShared } from './__federation_fn_import-JrT3xvdd.js';

const {defineComponent:_defineComponent} = await importShared('vue');

const {resolveComponent:_resolveComponent,createVNode:_createVNode,createElementVNode:_createElementVNode,toDisplayString:_toDisplayString,createTextVNode:_createTextVNode,withCtx:_withCtx,openBlock:_openBlock,createBlock:_createBlock,createCommentVNode:_createCommentVNode,renderList:_renderList,Fragment:_Fragment,createElementBlock:_createElementBlock} = await importShared('vue');

const _hoisted_1 = { class: "emby-user-manager pa-4" };
const _hoisted_2 = { class: "d-flex flex-wrap align-center justify-space-between mb-4 gap-3" };
const _hoisted_3 = { class: "d-flex align-center gap-2" };
const _hoisted_4 = { class: "d-flex align-center gap-2" };
const _hoisted_5 = { class: "text-h5 font-weight-bold mt-1" };
const _hoisted_6 = { class: "text-caption mt-1" };
const _hoisted_7 = { class: "text-h5 font-weight-bold mt-1" };
const _hoisted_8 = { class: "text-caption mt-1" };
const _hoisted_9 = { class: "text-h5 font-weight-bold mt-1" };
const _hoisted_10 = { class: "text-h5 font-weight-bold mt-1" };
const _hoisted_11 = { class: "d-flex flex-wrap align-center justify-space-between gap-3" };
const _hoisted_12 = { class: "d-flex align-center justify-space-between mb-2" };
const _hoisted_13 = { class: "d-flex align-center gap-2" };
const _hoisted_14 = { class: "font-weight-bold" };
const _hoisted_15 = { class: "d-flex align-center gap-1" };
const _hoisted_16 = { class: "font-weight-bold text-body-1" };
const _hoisted_17 = { class: "text-caption text-medium-emphasis" };
const _hoisted_18 = { class: "text-caption text-medium-emphasis mb-2" };
const _hoisted_19 = { class: "d-flex align-center flex-wrap gap-2 my-2" };
const _hoisted_20 = { class: "d-flex align-center justify-space-between flex-wrap gap-1" };
const _hoisted_21 = { class: "d-flex align-center gap-1" };
const _hoisted_22 = { class: "d-flex align-center gap-1" };
const _hoisted_23 = {
  key: 1,
  class: "text-center py-6 text-medium-emphasis"
};
const _hoisted_24 = {
  key: 0,
  class: "text-caption text-medium-emphasis"
};
const _hoisted_25 = {
  key: 1,
  class: "text-caption ms-1"
};
const _hoisted_26 = { class: "text-body-2 mb-3" };
const {computed,inject,onMounted,ref} = await importShared('vue');

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
    const subDialog = ref(false);
    const subDialogUser = ref("");
    const subDialogLoading = ref(false);
    const userSubscribes = ref([]);
    const deleteDialog = ref(false);
    const deleteTargetUser = ref(null);
    const deleteWithSubscribes = ref(false);
    const deletingUser = ref(false);
    const resolvedPluginId = computed(() => props.pluginId || "EmbyUserManager");
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
      deleteWithSubscribes.value = false;
      deleteDialog.value = true;
    }
    async function confirmDeleteUser() {
      if (!deleteTargetUser.value || !props.api?.post) return;
      deletingUser.value = true;
      try {
        const res = await props.api.post(`plugin/${resolvedPluginId.value}/user/delete`, {
          username: deleteTargetUser.value.username,
          delete_subscribes: deleteWithSubscribes.value
        });
        if (res?.success) {
          notifySuccess(res.message || "用户已删除");
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
      const _component_v_switch = _resolveComponent("v-switch");
      const _component_v_select = _resolveComponent("v-select");
      const _component_v_textarea = _resolveComponent("v-textarea");
      const _component_v_card_text = _resolveComponent("v-card-text");
      const _component_v_card_actions = _resolveComponent("v-card-actions");
      const _component_v_dialog = _resolveComponent("v-dialog");
      const _component_v_list_item_title = _resolveComponent("v-list-item-title");
      const _component_v_list_item_subtitle = _resolveComponent("v-list-item-subtitle");
      const _component_v_list_item = _resolveComponent("v-list-item");
      const _component_v_list = _resolveComponent("v-list");
      const _component_v_checkbox = _resolveComponent("v-checkbox");
      return _openBlock(), _createElementBlock("div", _hoisted_1, [
        _createElementVNode("div", _hoisted_2, [
          _createElementVNode("div", null, [
            _createElementVNode("div", _hoisted_3, [
              _createVNode(_component_v_icon, {
                icon: "mdi-account-group-outline",
                color: "primary",
                size: "28"
              }),
              _cache[16] || (_cache[16] = _createElementVNode("h2", { class: "text-h5 font-weight-bold mb-0" }, "Emby 用户与订阅管理", -1)),
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
            _cache[17] || (_cache[17] = _createElementVNode("div", { class: "text-body-2 text-medium-emphasis mt-1" }, " 同步查看 Emby 媒体服务器用户，控制登录准入黑白名单，并集中查看或清理各用户的影视订阅。 ", -1))
          ]),
          _createElementVNode("div", _hoisted_4, [
            _createVNode(_component_v_btn, {
              variant: "tonal",
              color: "primary",
              "prepend-icon": "mdi-shield-tune-outline",
              onClick: openSettingsDialog
            }, {
              default: _withCtx(() => [..._cache[18] || (_cache[18] = [
                _createTextVNode(" 准入策略设置 ", -1)
              ])]),
              _: 1
            }),
            _createVNode(_component_v_btn, {
              variant: "tonal",
              "prepend-icon": "mdi-refresh",
              loading: loading.value,
              onClick: fetchOverview
            }, {
              default: _withCtx(() => [..._cache[19] || (_cache[19] = [
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
                    _cache[20] || (_cache[20] = _createElementVNode("div", { class: "text-caption text-medium-emphasis" }, "Emby 媒体库用户", -1)),
                    _createElementVNode("div", _hoisted_5, _toDisplayString(stats.value.emby_user_count), 1),
                    _createElementVNode("div", _hoisted_6, " 来源实例：" + _toDisplayString(servers.value.length ? servers.value.map((s) => s.name).join("、") : "未配置或未连接"), 1)
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
                    _cache[21] || (_cache[21] = _createElementVNode("div", { class: "text-caption text-medium-emphasis" }, "允许登录用户", -1)),
                    _createElementVNode("div", _hoisted_7, _toDisplayString(stats.value.allowed_user_count), 1),
                    _createElementVNode("div", _hoisted_8, "当前策略：" + _toDisplayString(allowModeLabel(config.value.allow_mode)), 1)
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
                    _cache[22] || (_cache[22] = _createElementVNode("div", { class: "text-caption text-medium-emphasis" }, "已登录 MP 用户", -1)),
                    _createElementVNode("div", _hoisted_9, _toDisplayString(stats.value.mp_registered_count), 1),
                    _cache[23] || (_cache[23] = _createElementVNode("div", { class: "text-caption mt-1" }, "首次通过 Emby 登录时自动建号", -1))
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
                    _cache[24] || (_cache[24] = _createElementVNode("div", { class: "text-caption text-medium-emphasis" }, "普通用户订阅总数", -1)),
                    _createElementVNode("div", _hoisted_10, _toDisplayString(stats.value.total_subscribe_count), 1),
                    _cache[25] || (_cache[25] = _createElementVNode("div", { class: "text-caption mt-1" }, "可在订阅页按用户名筛选", -1))
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
                    default: _withCtx(() => [..._cache[26] || (_cache[26] = [
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
                    default: _withCtx(() => [..._cache[27] || (_cache[27] = [
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
                    default: _withCtx(() => [..._cache[28] || (_cache[28] = [
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
                    default: _withCtx(() => [..._cache[29] || (_cache[29] = [
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
            _cache[30] || (_cache[30] = _createElementVNode("div", { class: "text-body-1 font-weight-medium" }, "暂无匹配的 Emby 用户", -1)),
            _cache[31] || (_cache[31] = _createElementVNode("div", { class: "text-caption text-medium-emphasis mt-1" }, " 请确认已在「设定 -> 媒体服务器」中启用 Emby 实例，或调整上方筛选条件。 ", -1))
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
                              size: "36"
                            }, {
                              default: _withCtx(() => [
                                _createElementVNode("span", _hoisted_14, _toDisplayString(user.username.slice(0, 1).toUpperCase()), 1)
                              ]),
                              _: 2
                            }, 1024),
                            _createElementVNode("div", null, [
                              _createElementVNode("div", _hoisted_15, [
                                _createElementVNode("span", _hoisted_16, _toDisplayString(user.username), 1),
                                user.emby_is_admin ? (_openBlock(), _createBlock(_component_v_chip, {
                                  key: 0,
                                  size: "x-small",
                                  color: "purple",
                                  variant: "tonal"
                                }, {
                                  default: _withCtx(() => [..._cache[32] || (_cache[32] = [
                                    _createTextVNode(" Emby管理员 ", -1)
                                  ])]),
                                  _: 1
                                })) : _createCommentVNode("", true),
                                user.registered_in_mp ? (_openBlock(), _createBlock(_component_v_chip, {
                                  key: 1,
                                  size: "x-small",
                                  color: "info",
                                  variant: "tonal"
                                }, {
                                  default: _withCtx(() => [..._cache[33] || (_cache[33] = [
                                    _createTextVNode(" 已建号 ", -1)
                                  ])]),
                                  _: 1
                                })) : _createCommentVNode("", true)
                              ]),
                              _createElementVNode("div", _hoisted_17, " 服务器：" + _toDisplayString(user.emby_servers.length ? user.emby_servers.join("、") : "仅本地记录"), 1)
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
                        _createElementVNode("div", _hoisted_18, [
                          _createElementVNode("div", null, "准入说明：" + _toDisplayString(user.access_reason), 1),
                          _createElementVNode("div", null, "最近活跃：" + _toDisplayString(formatDateText(user.last_activity_date || user.last_login_date)), 1)
                        ]),
                        _createElementVNode("div", _hoisted_19, [
                          _createVNode(_component_v_chip, {
                            size: "small",
                            variant: "tonal",
                            color: "primary",
                            "prepend-icon": "mdi-movie-open-outline",
                            onClick: ($event) => openUserSubscribes(user)
                          }, {
                            default: _withCtx(() => [
                              _createTextVNode(" 电影订阅 " + _toDisplayString(user.movie_sub_count), 1)
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
                              _createTextVNode(" 剧集订阅 " + _toDisplayString(user.tv_sub_count), 1)
                            ]),
                            _: 2
                          }, 1032, ["onClick"]),
                          user.in_whitelist ? (_openBlock(), _createBlock(_component_v_chip, {
                            key: 0,
                            size: "x-small",
                            color: "success",
                            variant: "outlined"
                          }, {
                            default: _withCtx(() => [..._cache[34] || (_cache[34] = [
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
                            default: _withCtx(() => [..._cache[35] || (_cache[35] = [
                              _createTextVNode(" 黑名单 ", -1)
                            ])]),
                            _: 1
                          })) : _createCommentVNode("", true)
                        ])
                      ]),
                      _createVNode(_component_v_divider, { class: "my-2" }),
                      _createElementVNode("div", _hoisted_20, [
                        _createElementVNode("div", _hoisted_21, [
                          _createVNode(_component_v_btn, {
                            size: "x-small",
                            color: user.is_active ? "warning" : "success",
                            variant: "tonal",
                            "prepend-icon": user.is_active ? "mdi-account-cancel-outline" : "mdi-account-check-outline",
                            onClick: ($event) => toggleUserActive(user)
                          }, {
                            default: _withCtx(() => [
                              _createTextVNode(_toDisplayString(user.is_active ? "禁用登录" : "恢复启用"), 1)
                            ]),
                            _: 2
                          }, 1032, ["color", "prepend-icon", "onClick"]),
                          !user.in_whitelist ? (_openBlock(), _createBlock(_component_v_btn, {
                            key: 0,
                            size: "x-small",
                            color: "success",
                            variant: "text",
                            onClick: ($event) => updateAccessList(user, "whitelist", "add")
                          }, {
                            default: _withCtx(() => [..._cache[36] || (_cache[36] = [
                              _createTextVNode(" +白名单 ", -1)
                            ])]),
                            _: 1
                          }, 8, ["onClick"])) : (_openBlock(), _createBlock(_component_v_btn, {
                            key: 1,
                            size: "x-small",
                            color: "secondary",
                            variant: "text",
                            onClick: ($event) => updateAccessList(user, "whitelist", "remove")
                          }, {
                            default: _withCtx(() => [..._cache[37] || (_cache[37] = [
                              _createTextVNode(" -移出白名单 ", -1)
                            ])]),
                            _: 1
                          }, 8, ["onClick"])),
                          !user.in_blacklist ? (_openBlock(), _createBlock(_component_v_btn, {
                            key: 2,
                            size: "x-small",
                            color: "error",
                            variant: "text",
                            onClick: ($event) => updateAccessList(user, "blacklist", "add")
                          }, {
                            default: _withCtx(() => [..._cache[38] || (_cache[38] = [
                              _createTextVNode(" +黑名单 ", -1)
                            ])]),
                            _: 1
                          }, 8, ["onClick"])) : (_openBlock(), _createBlock(_component_v_btn, {
                            key: 3,
                            size: "x-small",
                            color: "secondary",
                            variant: "text",
                            onClick: ($event) => updateAccessList(user, "blacklist", "remove")
                          }, {
                            default: _withCtx(() => [..._cache[39] || (_cache[39] = [
                              _createTextVNode(" -移出黑名单 ", -1)
                            ])]),
                            _: 1
                          }, 8, ["onClick"]))
                        ]),
                        _createElementVNode("div", _hoisted_22, [
                          _createVNode(_component_v_btn, {
                            size: "x-small",
                            variant: "text",
                            color: "primary",
                            "prepend-icon": "mdi-format-list-bulleted",
                            onClick: ($event) => openUserSubscribes(user)
                          }, {
                            default: _withCtx(() => [..._cache[40] || (_cache[40] = [
                              _createTextVNode(" 订阅明细 ", -1)
                            ])]),
                            _: 1
                          }, 8, ["onClick"]),
                          user.registered_in_mp || user.total_sub_count > 0 ? (_openBlock(), _createBlock(_component_v_btn, {
                            key: 0,
                            size: "x-small",
                            variant: "text",
                            color: "error",
                            icon: "mdi-delete-outline",
                            title: "删除用户账号或清理订阅",
                            onClick: ($event) => openDeleteUserDialog(user)
                          }, null, 8, ["onClick"])) : _createCommentVNode("", true)
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
          modelValue: settingsDialog.value,
          "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => settingsDialog.value = $event),
          "max-width": "560"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "d-flex align-center justify-space-between" }, {
                  default: _withCtx(() => [
                    _cache[41] || (_cache[41] = _createElementVNode("span", null, "Emby 登录准入策略设置", -1)),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      onClick: _cache[2] || (_cache[2] = ($event) => settingsDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_divider),
                _createVNode(_component_v_card_text, { class: "d-flex flex-column gap-3" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_switch, {
                      modelValue: config.value.enabled,
                      "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => config.value.enabled = $event),
                      color: "primary",
                      label: "启用 Emby 用户管理与准入拦截",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_switch, {
                      modelValue: config.value.allow_emby_admin,
                      "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => config.value.allow_emby_admin = $event),
                      color: "primary",
                      label: "允许 Emby 管理员账号作为普通订阅用户登录",
                      "hide-details": ""
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_select, {
                      modelValue: config.value.allow_mode,
                      "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => config.value.allow_mode = $event),
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
                      "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => config.value.allowed_servers = $event),
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
                      "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => whitelistInput.value = $event),
                      label: "白名单用户名（多个用户名用逗号或换行分隔）",
                      variant: "outlined",
                      rows: "2",
                      density: "compact"
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_textarea, {
                      modelValue: blacklistInput.value,
                      "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => blacklistInput.value = $event),
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
                      onClick: _cache[9] || (_cache[9] = ($event) => settingsDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[42] || (_cache[42] = [
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
                      default: _withCtx(() => [..._cache[43] || (_cache[43] = [
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
          "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => subDialog.value = $event),
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
                      onClick: _cache[11] || (_cache[11] = ($event) => subDialog.value = false)
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
                    })) : userSubscribes.value.length === 0 ? (_openBlock(), _createElementBlock("div", _hoisted_23, " 该用户暂无订阅记录 ")) : (_openBlock(), _createBlock(_component_v_list, {
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
                                  sub.year ? (_openBlock(), _createElementBlock("span", _hoisted_24, "(" + _toDisplayString(sub.year) + ")", 1)) : _createCommentVNode("", true),
                                  sub.season ? (_openBlock(), _createElementBlock("span", _hoisted_25, "S" + _toDisplayString(sub.season), 1)) : _createCommentVNode("", true)
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
          "onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => deleteDialog.value = $event),
          "max-width": "460"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, null, {
                  default: _withCtx(() => [
                    _createTextVNode("移除用户 " + _toDisplayString(deleteTargetUser.value?.username), 1)
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, null, {
                  default: _withCtx(() => [
                    _createElementVNode("div", _hoisted_26, [
                      _cache[44] || (_cache[44] = _createTextVNode(" 确定要移除本地用户 ", -1)),
                      _createElementVNode("strong", null, _toDisplayString(deleteTargetUser.value?.username), 1),
                      _cache[45] || (_cache[45] = _createTextVNode(" 的账号记录吗？ ", -1))
                    ]),
                    _createVNode(_component_v_checkbox, {
                      modelValue: deleteWithSubscribes.value,
                      "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => deleteWithSubscribes.value = $event),
                      color: "error",
                      label: `同时删除该用户名下的全部订阅 (${deleteTargetUser.value?.total_sub_count || 0} 条)`,
                      "hide-details": ""
                    }, null, 8, ["modelValue", "label"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, { class: "justify-end pa-4" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_btn, {
                      variant: "text",
                      onClick: _cache[14] || (_cache[14] = ($event) => deleteDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[46] || (_cache[46] = [
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
                      default: _withCtx(() => [..._cache[47] || (_cache[47] = [
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
