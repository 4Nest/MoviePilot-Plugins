import { importShared } from './__federation_fn_import-JrT3xvdd.js';
import Config, { _ as _export_sfc } from './__federation_expose_Config-BTY7e3Dd.js';

const {defineComponent:_defineComponent} = await importShared('vue');

const {resolveComponent:_resolveComponent,openBlock:_openBlock,createBlock:_createBlock,createCommentVNode:_createCommentVNode,createVNode:_createVNode,withCtx:_withCtx,createElementVNode:_createElementVNode,createTextVNode:_createTextVNode,toDisplayString:_toDisplayString,renderList:_renderList,Fragment:_Fragment,createElementBlock:_createElementBlock} = await importShared('vue');

const _hoisted_1 = { class: "seed-page" };
const _hoisted_2 = { class: "hero-card" };
const _hoisted_3 = { class: "hero-heading" };
const _hoisted_4 = { class: "hero-actions" };
const _hoisted_5 = { class: "content-section" };
const _hoisted_6 = { class: "section-heading" };
const _hoisted_7 = { class: "d-flex align-center justify-space-between mb-3" };
const _hoisted_8 = { class: "d-flex align-center ga-2" };
const _hoisted_9 = { class: "text-caption text-medium-emphasis" };
const _hoisted_10 = { class: "d-flex justify-space-between text-body-2 mb-1" };
const _hoisted_11 = { class: "downloader-stats" };
const _hoisted_12 = { class: "d-flex justify-space-between mt-3 text-caption text-medium-emphasis" };
const _hoisted_13 = { class: "content-section" };
const _hoisted_14 = { class: "section-heading" };
const _hoisted_15 = { class: "d-flex ga-2" };
const _hoisted_16 = ["title"];
const _hoisted_17 = { class: "reason-text" };
const _hoisted_18 = { class: "empty-state" };
const _hoisted_19 = { class: "content-section" };
const _hoisted_20 = { class: "section-heading" };
const _hoisted_21 = ["title"];
const _hoisted_22 = {
  key: 0,
  class: "text-caption text-error"
};
const _hoisted_23 = { class: "empty-state compact" };
const _hoisted_24 = { class: "d-flex align-center ga-2 mb-2" };
const _hoisted_25 = {
  key: 0,
  class: "mt-1"
};
const {computed,inject,onMounted,reactive,ref,watch} = await importShared('vue');
const _sfc_main = /* @__PURE__ */ _defineComponent({
  __name: "AppPage",
  props: {
    api: { type: Object, default: () => ({}) },
    pluginId: { type: String, default: "SeedCleaner" },
    navKey: { type: String, default: "main" }
  },
  emits: ["action", "switch", "close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const hostToast = inject("moviepilot:toast", null);
    const loading = ref(false);
    const working = ref("");
    const config = ref({ rules: [], disk_guard: {} });
    const downloaders = ref([]);
    const collectionErrors = ref([]);
    const preview = ref(null);
    const history = ref([]);
    const templates = ref([]);
    const settingsDialog = ref(false);
    const templatesDialog = ref(false);
    const runDialog = ref(false);
    const clearHistoryDialog = ref(false);
    const regexDialog = ref(false);
    const snackbar = reactive({ show: false, text: "", color: "success" });
    const regexForm = reactive({ pattern: "", text: "" });
    const regexResult = ref(null);
    const regexTesting = ref(false);
    let regexTimer;
    let regexGeneration = 0;
    const previewItems = computed(() => preview.value?.candidates || []);
    const previewSize = computed(() => Number(preview.value?.total_size_gb || 0));
    const enabledRuleCount = computed(() => (config.value.rules || []).filter((rule) => rule.enabled).length);
    const guardEnabled = computed(() => Boolean(config.value.disk_guard?.enabled));
    const previewHeaders = [
      { title: "种子", key: "name", minWidth: 280 },
      { title: "下载器", key: "downloader", width: 130 },
      { title: "体积", key: "size_gb", width: 100 },
      { title: "分享率", key: "ratio", width: 90 },
      { title: "做种时长", key: "seeding_hours", width: 110 },
      { title: "命中规则", key: "rule_name", width: 170 },
      { title: "命中原因", key: "reason", minWidth: 300 }
    ];
    const historyHeaders = [
      { title: "时间", key: "time", width: 165 },
      { title: "结果", key: "status", width: 85 },
      { title: "种子", key: "name", minWidth: 250 },
      { title: "下载器", key: "downloader", width: 120 },
      { title: "体积", key: "size_gb", width: 100 },
      { title: "规则", key: "rule_name", width: 160 }
    ];
    function notify(message, color = "success") {
      snackbar.text = message;
      snackbar.color = color;
      snackbar.show = true;
      if (color === "success") hostToast?.success(message);
      else if (color === "error") hostToast?.error(message);
      else hostToast?.info(message);
    }
    function responseMessage(error) {
      return error?.response?.data?.message || error?.message || "请求失败，请检查后端日志";
    }
    async function loadConfig() {
      if (!props.api?.get) return;
      try {
        const response = await props.api.get(`plugin/${props.pluginId}/config`);
        if (response?.success && response.data) config.value = response.data;
      } catch (error) {
        notify(responseMessage(error), "error");
      }
    }
    async function loadOverview() {
      if (!props.api?.get) return;
      try {
        const response = await props.api.get(`plugin/${props.pluginId}/overview`);
        if (response?.success) {
          downloaders.value = response.data?.downloaders || [];
          collectionErrors.value = response.data?.errors || [];
        }
      } catch (error) {
        notify(responseMessage(error), "error");
      }
    }
    async function loadHistory() {
      if (!props.api?.get) return;
      try {
        const response = await props.api.get(`plugin/${props.pluginId}/history`);
        if (response?.success) history.value = response.data || [];
      } catch (error) {
        notify(responseMessage(error), "error");
      }
    }
    async function loadTemplates() {
      if (!props.api?.get) return;
      try {
        const response = await props.api.get(`plugin/${props.pluginId}/templates`);
        if (response?.success) templates.value = response.data || [];
      } catch (error) {
        notify(responseMessage(error), "error");
      }
    }
    async function refreshAll() {
      loading.value = true;
      await Promise.all([loadConfig(), loadOverview(), loadHistory(), loadTemplates()]);
      loading.value = false;
    }
    async function saveConfig(nextConfig) {
      try {
        const response = await props.api.post(`plugin/${props.pluginId}/config`, nextConfig);
        if (!response?.success) throw new Error(response?.message || "配置保存失败");
        config.value = response.data || nextConfig;
        settingsDialog.value = false;
        notify("配置已保存");
        emit("action");
      } catch (error) {
        notify(responseMessage(error), "error");
      }
    }
    async function dryRun() {
      working.value = "dry";
      try {
        const response = await props.api.post(`plugin/${props.pluginId}/dry-run`, {});
        preview.value = response?.data || { candidates: [], errors: [response?.message || "干跑失败"] };
        if (response?.success) notify(`干跑完成：命中 ${preview.value.candidate_count || 0} 个种子`, "info");
        else notify(response?.message || "干跑失败", "error");
      } catch (error) {
        notify(responseMessage(error), "error");
      } finally {
        working.value = "";
      }
    }
    async function executeCleanup() {
      working.value = "run";
      runDialog.value = false;
      try {
        const response = await props.api.post(`plugin/${props.pluginId}/run`, {});
        if (!response?.success) throw new Error(response?.message || "清理失败");
        const deleted = response.data?.deleted?.length || 0;
        const failed = response.data?.failed?.length || 0;
        notify(`清理完成：成功 ${deleted}，失败 ${failed}`, failed ? "info" : "success");
        preview.value = null;
        await Promise.all([loadOverview(), loadHistory()]);
        emit("action");
      } catch (error) {
        notify(responseMessage(error), "error");
      } finally {
        working.value = "";
      }
    }
    async function importTemplate(template) {
      try {
        const response = await props.api.post(`plugin/${props.pluginId}/templates/import`, { id: template.id });
        if (!response?.success) throw new Error(response?.message || "模板导入失败");
        config.value = response.data || config.value;
        notify(response.message || `已导入「${template.name}」`);
        emit("action");
      } catch (error) {
        notify(responseMessage(error), "error");
      }
    }
    async function clearHistory() {
      try {
        const response = await props.api.delete(`plugin/${props.pluginId}/history`);
        if (!response?.success) throw new Error(response?.message || "清空失败");
        history.value = [];
        clearHistoryDialog.value = false;
        notify("清理历史已清空");
      } catch (error) {
        notify(responseMessage(error), "error");
      }
    }
    async function testRegex() {
      if (!regexForm.pattern) {
        regexResult.value = null;
        return;
      }
      const generation = ++regexGeneration;
      regexTesting.value = true;
      try {
        const response = await props.api.post(`plugin/${props.pluginId}/regex/test`, { ...regexForm });
        if (generation === regexGeneration) regexResult.value = response?.data || { valid: false, error: response?.message };
      } catch (error) {
        if (generation === regexGeneration) regexResult.value = { valid: false, matched: false, error: responseMessage(error) };
      } finally {
        if (generation === regexGeneration) regexTesting.value = false;
      }
    }
    watch(
      () => [regexForm.pattern, regexForm.text, regexDialog.value],
      () => {
        if (regexTimer) clearTimeout(regexTimer);
        if (regexDialog.value && regexForm.pattern) regexTimer = setTimeout(testRegex, 350);
      }
    );
    function formatSpeed(bytes) {
      if (!bytes) return "0 B/s";
      if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB/s`;
      return `${(bytes / 1024).toFixed(1)} KB/s`;
    }
    function freePercent(item) {
      if (!item.total_space_gb || item.free_space_gb == null) return 0;
      return Math.max(0, Math.min(100, item.free_space_gb / item.total_space_gb * 100));
    }
    onMounted(refreshAll);
    return (_ctx, _cache) => {
      const _component_v_progress_linear = _resolveComponent("v-progress-linear");
      const _component_v_icon = _resolveComponent("v-icon");
      const _component_v_avatar = _resolveComponent("v-avatar");
      const _component_v_btn = _resolveComponent("v-btn");
      const _component_v_card = _resolveComponent("v-card");
      const _component_v_col = _resolveComponent("v-col");
      const _component_v_row = _resolveComponent("v-row");
      const _component_v_alert = _resolveComponent("v-alert");
      const _component_v_chip = _resolveComponent("v-chip");
      const _component_v_data_table = _resolveComponent("v-data-table");
      const _component_v_card_title = _resolveComponent("v-card-title");
      const _component_v_divider = _resolveComponent("v-divider");
      const _component_v_card_text = _resolveComponent("v-card-text");
      const _component_v_dialog = _resolveComponent("v-dialog");
      const _component_v_card_subtitle = _resolveComponent("v-card-subtitle");
      const _component_v_spacer = _resolveComponent("v-spacer");
      const _component_v_card_actions = _resolveComponent("v-card-actions");
      const _component_v_textarea = _resolveComponent("v-textarea");
      const _component_v_snackbar = _resolveComponent("v-snackbar");
      return _openBlock(), _createElementBlock("div", _hoisted_1, [
        loading.value ? (_openBlock(), _createBlock(_component_v_progress_linear, {
          key: 0,
          indeterminate: "",
          color: "primary",
          class: "top-progress"
        })) : _createCommentVNode("", true),
        _createElementVNode("header", _hoisted_2, [
          _createElementVNode("div", _hoisted_3, [
            _createVNode(_component_v_avatar, {
              size: "54",
              color: "primary",
              variant: "tonal"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_icon, {
                  size: "30",
                  icon: "mdi-broom"
                })
              ]),
              _: 1
            }),
            _cache[19] || (_cache[19] = _createElementVNode("div", null, [
              _createElementVNode("div", { class: "text-h5 font-weight-bold" }, "保种删种管家"),
              _createElementVNode("div", { class: "text-body-2 text-medium-emphasis" }, "安全规则 · 正则筛选 · 干跑预览 · 磁盘低水位保盘")
            ], -1))
          ]),
          _createElementVNode("div", _hoisted_4, [
            _createVNode(_component_v_btn, {
              variant: "text",
              icon: "mdi-refresh",
              loading: loading.value,
              title: "刷新",
              onClick: refreshAll
            }, null, 8, ["loading"]),
            _createVNode(_component_v_btn, {
              variant: "outlined",
              "prepend-icon": "mdi-tune",
              onClick: _cache[0] || (_cache[0] = ($event) => settingsDialog.value = true)
            }, {
              default: _withCtx(() => [..._cache[20] || (_cache[20] = [
                _createTextVNode("规则配置", -1)
              ])]),
              _: 1
            }),
            _createVNode(_component_v_btn, {
              color: "primary",
              variant: "tonal",
              "prepend-icon": "mdi-eye-outline",
              loading: working.value === "dry",
              onClick: dryRun
            }, {
              default: _withCtx(() => [..._cache[21] || (_cache[21] = [
                _createTextVNode("干跑预览", -1)
              ])]),
              _: 1
            }, 8, ["loading"]),
            _createVNode(_component_v_btn, {
              color: "error",
              "prepend-icon": "mdi-play",
              loading: working.value === "run",
              onClick: _cache[1] || (_cache[1] = ($event) => runDialog.value = true)
            }, {
              default: _withCtx(() => [..._cache[22] || (_cache[22] = [
                _createTextVNode("立即清理", -1)
              ])]),
              _: 1
            }, 8, ["loading"])
          ])
        ]),
        _createVNode(_component_v_row, { class: "summary-row" }, {
          default: _withCtx(() => [
            _createVNode(_component_v_col, {
              cols: "6",
              md: "3"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card, {
                  class: "metric-card",
                  variant: "tonal"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_icon, {
                      color: "primary",
                      icon: "mdi-format-list-checks"
                    }),
                    _createElementVNode("div", null, [
                      _createElementVNode("strong", null, _toDisplayString(enabledRuleCount.value), 1),
                      _cache[23] || (_cache[23] = _createElementVNode("span", null, "启用规则", -1))
                    ])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createVNode(_component_v_col, {
              cols: "6",
              md: "3"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card, {
                  class: "metric-card",
                  variant: "tonal"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_icon, {
                      color: "info",
                      icon: "mdi-eye-check-outline"
                    }),
                    _createElementVNode("div", null, [
                      _createElementVNode("strong", null, _toDisplayString(previewItems.value.length), 1),
                      _cache[24] || (_cache[24] = _createElementVNode("span", null, "预览命中", -1))
                    ])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createVNode(_component_v_col, {
              cols: "6",
              md: "3"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card, {
                  class: "metric-card",
                  variant: "tonal"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_icon, {
                      color: "warning",
                      icon: "mdi-harddisk"
                    }),
                    _createElementVNode("div", null, [
                      _createElementVNode("strong", null, _toDisplayString(guardEnabled.value ? "已启用" : "未启用"), 1),
                      _cache[25] || (_cache[25] = _createElementVNode("span", null, "低水位保盘", -1))
                    ])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createVNode(_component_v_col, {
              cols: "6",
              md: "3"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card, {
                  class: "metric-card",
                  variant: "tonal"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_icon, {
                      color: "success",
                      icon: "mdi-history"
                    }),
                    _createElementVNode("div", null, [
                      _createElementVNode("strong", null, _toDisplayString(history.value.length), 1),
                      _cache[26] || (_cache[26] = _createElementVNode("span", null, "最近清理记录", -1))
                    ])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          _: 1
        }),
        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(collectionErrors.value, (error) => {
          return _openBlock(), _createBlock(_component_v_alert, {
            key: error,
            type: "error",
            variant: "tonal",
            density: "compact",
            class: "mb-3"
          }, {
            default: _withCtx(() => [
              _createTextVNode(_toDisplayString(error), 1)
            ]),
            _: 2
          }, 1024);
        }), 128)),
        _createElementVNode("section", _hoisted_5, [
          _createElementVNode("div", _hoisted_6, [
            _createElementVNode("div", null, [
              _createVNode(_component_v_icon, { icon: "mdi-download-network-outline" }),
              _cache[27] || (_cache[27] = _createElementVNode("span", null, "下载器实时概况", -1))
            ]),
            _cache[28] || (_cache[28] = _createElementVNode("span", { class: "text-caption text-medium-emphasis" }, "磁盘空间按下载器接口或可访问保存路径计算", -1))
          ]),
          downloaders.value.length ? (_openBlock(), _createBlock(_component_v_row, { key: 0 }, {
            default: _withCtx(() => [
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(downloaders.value, (item) => {
                return _openBlock(), _createBlock(_component_v_col, {
                  key: item.name,
                  cols: "12",
                  md: "6",
                  xl: "4"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_card, {
                      class: "downloader-card",
                      variant: "outlined"
                    }, {
                      default: _withCtx(() => [
                        _createElementVNode("div", _hoisted_7, [
                          _createElementVNode("div", _hoisted_8, [
                            _createVNode(_component_v_avatar, {
                              size: "36",
                              color: item.type === "qbittorrent" ? "primary" : "deep-orange",
                              variant: "tonal"
                            }, {
                              default: _withCtx(() => [
                                _createVNode(_component_v_icon, {
                                  icon: item.type === "qbittorrent" ? "mdi-qrcode" : "mdi-transit-connection-variant"
                                }, null, 8, ["icon"])
                              ]),
                              _: 2
                            }, 1032, ["color"]),
                            _createElementVNode("div", null, [
                              _createElementVNode("strong", null, _toDisplayString(item.name), 1),
                              _createElementVNode("div", _hoisted_9, _toDisplayString(item.type), 1)
                            ])
                          ]),
                          _createVNode(_component_v_chip, {
                            color: item.low_space ? "error" : "success",
                            size: "small",
                            variant: "tonal"
                          }, {
                            default: _withCtx(() => [
                              _createTextVNode(_toDisplayString(item.low_space ? "低水位" : "空间正常"), 1)
                            ]),
                            _: 2
                          }, 1032, ["color"])
                        ]),
                        _createElementVNode("div", _hoisted_10, [
                          _cache[29] || (_cache[29] = _createElementVNode("span", null, "剩余空间", -1)),
                          _createElementVNode("strong", null, _toDisplayString(item.free_space_gb == null ? "不可用" : `${item.free_space_gb} GB`), 1)
                        ]),
                        _createVNode(_component_v_progress_linear, {
                          "model-value": freePercent(item),
                          color: item.low_space ? "error" : "primary",
                          height: "7",
                          rounded: "",
                          class: "mb-3"
                        }, null, 8, ["model-value", "color"]),
                        _createElementVNode("div", _hoisted_11, [
                          _createElementVNode("span", null, [
                            _createVNode(_component_v_icon, {
                              size: "16",
                              icon: "mdi-file-multiple-outline"
                            }),
                            _createTextVNode(_toDisplayString(item.torrent_count) + " 任务", 1)
                          ]),
                          _createElementVNode("span", null, [
                            _createVNode(_component_v_icon, {
                              size: "16",
                              icon: "mdi-seed"
                            }),
                            _createTextVNode(_toDisplayString(item.seeding_count) + " 做种", 1)
                          ]),
                          _createElementVNode("span", null, [
                            _createVNode(_component_v_icon, {
                              size: "16",
                              icon: "mdi-database-outline"
                            }),
                            _createTextVNode(_toDisplayString(item.total_size_gb) + " GB", 1)
                          ])
                        ]),
                        _createElementVNode("div", _hoisted_12, [
                          _createElementVNode("span", null, "↓ " + _toDisplayString(formatSpeed(item.download_speed)), 1),
                          _createElementVNode("span", null, "↑ " + _toDisplayString(formatSpeed(item.upload_speed)), 1)
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
          })) : (_openBlock(), _createBlock(_component_v_alert, {
            key: 1,
            type: "info",
            variant: "outlined",
            icon: "mdi-information-outline"
          }, {
            default: _withCtx(() => [..._cache[30] || (_cache[30] = [
              _createTextVNode("未发现可用的 qBittorrent 或 Transmission 实例，请先在系统设置中启用下载器。", -1)
            ])]),
            _: 1
          }))
        ]),
        _createElementVNode("section", _hoisted_13, [
          _createElementVNode("div", _hoisted_14, [
            _createElementVNode("div", null, [
              _createVNode(_component_v_icon, { icon: "mdi-test-tube" }),
              _cache[31] || (_cache[31] = _createElementVNode("span", null, "模拟干跑预览", -1)),
              previewItems.value.length ? (_openBlock(), _createBlock(_component_v_chip, {
                key: 0,
                size: "small",
                color: "primary",
                variant: "tonal"
              }, {
                default: _withCtx(() => [
                  _createTextVNode("共 " + _toDisplayString(previewSize.value.toFixed(2)) + " GB", 1)
                ]),
                _: 1
              })) : _createCommentVNode("", true)
            ]),
            _createElementVNode("div", _hoisted_15, [
              _createVNode(_component_v_btn, {
                size: "small",
                variant: "text",
                "prepend-icon": "mdi-regex",
                onClick: _cache[2] || (_cache[2] = ($event) => regexDialog.value = true)
              }, {
                default: _withCtx(() => [..._cache[32] || (_cache[32] = [
                  _createTextVNode("正则测试", -1)
                ])]),
                _: 1
              }),
              _createVNode(_component_v_btn, {
                size: "small",
                variant: "text",
                "prepend-icon": "mdi-view-grid-plus",
                onClick: _cache[3] || (_cache[3] = ($event) => templatesDialog.value = true)
              }, {
                default: _withCtx(() => [..._cache[33] || (_cache[33] = [
                  _createTextVNode("预设模板", -1)
                ])]),
                _: 1
              })
            ])
          ]),
          preview.value?.errors?.length ? (_openBlock(), _createBlock(_component_v_alert, {
            key: 0,
            type: "warning",
            variant: "tonal",
            class: "mb-3"
          }, {
            default: _withCtx(() => [
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(preview.value.errors, (error) => {
                return _openBlock(), _createElementBlock("div", { key: error }, _toDisplayString(error), 1);
              }), 128))
            ]),
            _: 1
          })) : _createCommentVNode("", true),
          preview.value ? (_openBlock(), _createBlock(_component_v_card, {
            key: 1,
            variant: "outlined",
            class: "table-card"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_v_data_table, {
                headers: previewHeaders,
                items: previewItems.value,
                "item-value": "hash",
                density: "comfortable",
                "items-per-page": 10,
                hover: ""
              }, {
                "item.name": _withCtx(({ item }) => [
                  _createElementVNode("div", {
                    class: "torrent-name",
                    title: item.name
                  }, _toDisplayString(item.name), 9, _hoisted_16),
                  !item.delete_files ? (_openBlock(), _createBlock(_component_v_chip, {
                    key: 0,
                    size: "x-small",
                    variant: "tonal"
                  }, {
                    default: _withCtx(() => [..._cache[34] || (_cache[34] = [
                      _createTextVNode("保留下载文件", -1)
                    ])]),
                    _: 1
                  })) : _createCommentVNode("", true)
                ]),
                "item.size_gb": _withCtx(({ item }) => [
                  _createTextVNode(_toDisplayString(Number(item.size_gb).toFixed(2)) + " GB", 1)
                ]),
                "item.ratio": _withCtx(({ item }) => [
                  _createVNode(_component_v_chip, {
                    size: "small",
                    variant: "tonal"
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode(_toDisplayString(Number(item.ratio).toFixed(2)), 1)
                    ]),
                    _: 2
                  }, 1024)
                ]),
                "item.seeding_hours": _withCtx(({ item }) => [
                  _createTextVNode(_toDisplayString(Number(item.seeding_hours).toFixed(1)) + " h", 1)
                ]),
                "item.reason": _withCtx(({ item }) => [
                  _createElementVNode("span", _hoisted_17, _toDisplayString(item.reason), 1)
                ]),
                "no-data": _withCtx(() => [
                  _createElementVNode("div", _hoisted_18, [
                    _createVNode(_component_v_icon, {
                      size: "42",
                      icon: "mdi-shield-check",
                      color: "success"
                    }),
                    _cache[35] || (_cache[35] = _createElementVNode("strong", null, "没有种子命中清理条件", -1)),
                    _cache[36] || (_cache[36] = _createElementVNode("span", null, "当前配置下无需删除。", -1))
                  ])
                ]),
                _: 1
              }, 8, ["items"])
            ]),
            _: 1
          })) : (_openBlock(), _createBlock(_component_v_card, {
            key: 2,
            variant: "outlined",
            class: "preview-placeholder"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_v_icon, {
                size: "48",
                color: "primary",
                icon: "mdi-clipboard-search-outline"
              }),
              _cache[38] || (_cache[38] = _createElementVNode("div", null, [
                _createElementVNode("strong", null, "先干跑，再决定"),
                _createElementVNode("p", null, "预览会列出每个种子的下载器、体积、分享率、做种时长、命中规则和具体原因，不会调用删除接口。")
              ], -1)),
              _createVNode(_component_v_btn, {
                color: "primary",
                variant: "tonal",
                "prepend-icon": "mdi-play-outline",
                loading: working.value === "dry",
                onClick: dryRun
              }, {
                default: _withCtx(() => [..._cache[37] || (_cache[37] = [
                  _createTextVNode("开始干跑", -1)
                ])]),
                _: 1
              }, 8, ["loading"])
            ]),
            _: 1
          }))
        ]),
        _createElementVNode("section", _hoisted_19, [
          _createElementVNode("div", _hoisted_20, [
            _createElementVNode("div", null, [
              _createVNode(_component_v_icon, { icon: "mdi-history" }),
              _cache[39] || (_cache[39] = _createElementVNode("span", null, "最近清理历史", -1))
            ]),
            _createVNode(_component_v_btn, {
              size: "small",
              color: "error",
              variant: "text",
              "prepend-icon": "mdi-delete-sweep",
              disabled: !history.value.length,
              onClick: _cache[4] || (_cache[4] = ($event) => clearHistoryDialog.value = true)
            }, {
              default: _withCtx(() => [..._cache[40] || (_cache[40] = [
                _createTextVNode("清空历史", -1)
              ])]),
              _: 1
            }, 8, ["disabled"])
          ]),
          _createVNode(_component_v_card, {
            variant: "outlined",
            class: "table-card"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_v_data_table, {
                headers: historyHeaders,
                items: history.value,
                density: "comfortable",
                "items-per-page": 10,
                hover: ""
              }, {
                "item.status": _withCtx(({ item }) => [
                  _createVNode(_component_v_chip, {
                    color: item.status === "success" ? "success" : "error",
                    size: "small",
                    variant: "tonal"
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode(_toDisplayString(item.status === "success" ? "成功" : "失败"), 1)
                    ]),
                    _: 2
                  }, 1032, ["color"])
                ]),
                "item.name": _withCtx(({ item }) => [
                  _createElementVNode("div", {
                    class: "torrent-name",
                    title: item.name
                  }, _toDisplayString(item.name), 9, _hoisted_21),
                  item.error ? (_openBlock(), _createElementBlock("div", _hoisted_22, _toDisplayString(item.error), 1)) : _createCommentVNode("", true)
                ]),
                "item.size_gb": _withCtx(({ item }) => [
                  _createTextVNode(_toDisplayString(Number(item.size_gb || 0).toFixed(2)) + " GB", 1)
                ]),
                "no-data": _withCtx(() => [
                  _createElementVNode("div", _hoisted_23, [
                    _createVNode(_component_v_icon, { icon: "mdi-history" }),
                    _cache[41] || (_cache[41] = _createElementVNode("span", null, "暂无清理历史", -1))
                  ])
                ]),
                _: 1
              }, 8, ["items"])
            ]),
            _: 1
          })
        ]),
        _createVNode(_component_v_dialog, {
          modelValue: settingsDialog.value,
          "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => settingsDialog.value = $event),
          "max-width": "1180",
          scrollable: ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "d-flex align-center justify-space-between pa-4" }, {
                  default: _withCtx(() => [
                    _createElementVNode("span", null, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-tune",
                        class: "mr-2"
                      }),
                      _cache[42] || (_cache[42] = _createTextVNode("保种管家配置", -1))
                    ]),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      onClick: _cache[5] || (_cache[5] = ($event) => settingsDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_divider),
                _createVNode(_component_v_card_text, { class: "pa-4" }, {
                  default: _withCtx(() => [
                    _createVNode(Config, {
                      "initial-config": config.value,
                      api: props.api,
                      onSave: saveConfig,
                      onClose: _cache[6] || (_cache[6] = ($event) => settingsDialog.value = false)
                    }, null, 8, ["initial-config", "api"])
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
          modelValue: templatesDialog.value,
          "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => templatesDialog.value = $event),
          "max-width": "900",
          scrollable: ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "pa-4" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_icon, {
                      icon: "mdi-view-grid-plus",
                      class: "mr-2"
                    }),
                    _cache[43] || (_cache[43] = _createTextVNode("一键导入高频规则模板", -1))
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_subtitle, { class: "px-4 pb-2 text-wrap" }, {
                  default: _withCtx(() => [..._cache[44] || (_cache[44] = [
                    _createTextVNode("导入后仍需保存配置并干跑确认。已存在的模板不会重复导入。", -1)
                  ])]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_row, null, {
                      default: _withCtx(() => [
                        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(templates.value, (template) => {
                          return _openBlock(), _createBlock(_component_v_col, {
                            key: template.id,
                            cols: "12",
                            md: "6"
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_card, {
                                variant: "outlined",
                                class: "template-card"
                              }, {
                                default: _withCtx(() => [
                                  _createElementVNode("div", _hoisted_24, [
                                    _createVNode(_component_v_icon, {
                                      color: "primary",
                                      icon: template.id === "unregistered" ? "mdi-alert-octagon" : template.id === "cold_large" ? "mdi-snowflake" : template.id === "official_exclude" ? "mdi-shield-crown" : "mdi-medal"
                                    }, null, 8, ["icon"]),
                                    _createElementVNode("strong", null, _toDisplayString(template.name), 1)
                                  ]),
                                  _createElementVNode("p", null, _toDisplayString(template.description), 1),
                                  _createVNode(_component_v_btn, {
                                    block: "",
                                    color: "primary",
                                    variant: "tonal",
                                    "prepend-icon": "mdi-import",
                                    onClick: ($event) => importTemplate(template)
                                  }, {
                                    default: _withCtx(() => [..._cache[45] || (_cache[45] = [
                                      _createTextVNode("导入此模板", -1)
                                    ])]),
                                    _: 1
                                  }, 8, ["onClick"])
                                ]),
                                _: 2
                              }, 1024)
                            ]),
                            _: 2
                          }, 1024);
                        }), 128))
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    _createVNode(_component_v_btn, {
                      onClick: _cache[8] || (_cache[8] = ($event) => templatesDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[46] || (_cache[46] = [
                        _createTextVNode("完成", -1)
                      ])]),
                      _: 1
                    })
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
          modelValue: runDialog.value,
          "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => runDialog.value = $event),
          "max-width": "520"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "text-error" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_icon, {
                      icon: "mdi-alert",
                      class: "mr-2"
                    }),
                    _cache[47] || (_cache[47] = _createTextVNode("确认立即执行真实清理？", -1))
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, null, {
                  default: _withCtx(() => [..._cache[48] || (_cache[48] = [
                    _createTextVNode("本轮将按当前规则直接删除下载器任务，规则开启「连同源文件删除」时数据不可恢复。建议先取消并执行干跑预览。", -1)
                  ])]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    _createVNode(_component_v_btn, {
                      onClick: _cache[10] || (_cache[10] = ($event) => runDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[49] || (_cache[49] = [
                        _createTextVNode("取消", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "error",
                      "prepend-icon": "mdi-delete",
                      onClick: executeCleanup
                    }, {
                      default: _withCtx(() => [..._cache[50] || (_cache[50] = [
                        _createTextVNode("确认真删", -1)
                      ])]),
                      _: 1
                    })
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
          modelValue: clearHistoryDialog.value,
          "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => clearHistoryDialog.value = $event),
          "max-width": "420"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, null, {
                  default: _withCtx(() => [..._cache[51] || (_cache[51] = [
                    _createTextVNode("清空清理历史？", -1)
                  ])]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, null, {
                  default: _withCtx(() => [..._cache[52] || (_cache[52] = [
                    _createTextVNode("仅清空插件历史记录，不影响下载器或媒体库。", -1)
                  ])]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    _createVNode(_component_v_btn, {
                      onClick: _cache[12] || (_cache[12] = ($event) => clearHistoryDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[53] || (_cache[53] = [
                        _createTextVNode("取消", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "error",
                      onClick: clearHistory
                    }, {
                      default: _withCtx(() => [..._cache[54] || (_cache[54] = [
                        _createTextVNode("确认清空", -1)
                      ])]),
                      _: 1
                    })
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
          modelValue: regexDialog.value,
          "onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => regexDialog.value = $event),
          "max-width": "760"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "pa-4" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_icon, {
                      icon: "mdi-regex",
                      class: "mr-2"
                    }),
                    _cache[55] || (_cache[55] = _createTextVNode("正则表达式实时测试", -1))
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_alert, {
                      type: "info",
                      variant: "tonal",
                      density: "compact",
                      class: "mb-4"
                    }, {
                      default: _withCtx(() => [..._cache[56] || (_cache[56] = [
                        _createTextVNode("后端使用 Python re.IGNORECASE，与规则引擎一致；输入后自动测试，无需保存。", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_textarea, {
                      modelValue: regexForm.pattern,
                      "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => regexForm.pattern = $event),
                      label: "正则表达式",
                      rows: "2",
                      "auto-grow": "",
                      variant: "outlined",
                      placeholder: "unregistered|not registered|不存在"
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_textarea, {
                      modelValue: regexForm.text,
                      "onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => regexForm.text = $event),
                      label: "待测试文本",
                      rows: "4",
                      "auto-grow": "",
                      variant: "outlined",
                      placeholder: "Tracker 返回：Unregistered torrent",
                      class: "mt-3"
                    }, null, 8, ["modelValue"]),
                    regexTesting.value ? (_openBlock(), _createBlock(_component_v_progress_linear, {
                      key: 0,
                      indeterminate: "",
                      color: "primary",
                      class: "my-2"
                    })) : _createCommentVNode("", true),
                    regexResult.value ? (_openBlock(), _createBlock(_component_v_alert, {
                      key: 1,
                      type: !regexResult.value.valid ? "error" : regexResult.value.matched ? "success" : "warning",
                      variant: "tonal",
                      class: "mt-4"
                    }, {
                      default: _withCtx(() => [
                        !regexResult.value.valid ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                          _createTextVNode("非法正则：" + _toDisplayString(regexResult.value.error), 1)
                        ], 64)) : regexResult.value.matched ? (_openBlock(), _createElementBlock(_Fragment, { key: 1 }, [
                          _cache[57] || (_cache[57] = _createTextVNode("匹配成功：", -1)),
                          _createElementVNode("code", null, _toDisplayString(regexResult.value.match), 1),
                          regexResult.value.groups?.length ? (_openBlock(), _createElementBlock("div", _hoisted_25, "捕获组：" + _toDisplayString(regexResult.value.groups.join("、")), 1)) : _createCommentVNode("", true)
                        ], 64)) : (_openBlock(), _createElementBlock(_Fragment, { key: 2 }, [
                          _createTextVNode("表达式合法，但未匹配待测文本。")
                        ], 64))
                      ]),
                      _: 1
                    }, 8, ["type"])) : _createCommentVNode("", true)
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    _createVNode(_component_v_btn, {
                      onClick: _cache[16] || (_cache[16] = ($event) => regexDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[58] || (_cache[58] = [
                        _createTextVNode("关闭", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "primary",
                      loading: regexTesting.value,
                      onClick: testRegex
                    }, {
                      default: _withCtx(() => [..._cache[59] || (_cache[59] = [
                        _createTextVNode("立即测试", -1)
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
        _createVNode(_component_v_snackbar, {
          modelValue: snackbar.show,
          "onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => snackbar.show = $event),
          color: snackbar.color,
          timeout: "3000"
        }, {
          default: _withCtx(() => [
            _createTextVNode(_toDisplayString(snackbar.text), 1)
          ]),
          _: 1
        }, 8, ["modelValue", "color"])
      ]);
    };
  }
});

const AppPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-5c570afb"]]);

export { AppPage as default };
