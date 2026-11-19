import { importShared } from './__federation_fn_import-JrT3xvdd.js';

const {defineComponent:_defineComponent} = await importShared('vue');

const {resolveComponent:_resolveComponent,createVNode:_createVNode,createTextVNode:_createTextVNode,normalizeClass:_normalizeClass,createElementVNode:_createElementVNode,withCtx:_withCtx,toDisplayString:_toDisplayString,openBlock:_openBlock,createElementBlock:_createElementBlock,createCommentVNode:_createCommentVNode,renderList:_renderList,Fragment:_Fragment,createBlock:_createBlock} = await importShared('vue');

const _hoisted_1 = { class: "mv-cfg" };
const _hoisted_2 = { class: "mv-cfg__tabs" };
const _hoisted_3 = {
  key: 0,
  class: "mv-cfg__panel"
};
const _hoisted_4 = { class: "mv-cfg__section" };
const _hoisted_5 = { class: "mv-cfg__row" };
const _hoisted_6 = { class: "mv-cfg__test-bar" };
const _hoisted_7 = { class: "mv-cfg__section" };
const _hoisted_8 = { class: "mv-cfg__section-head" };
const _hoisted_9 = {
  key: 1,
  class: "mv-cfg__panel"
};
const _hoisted_10 = { class: "mv-cfg__section" };
const _hoisted_11 = { class: "mv-cfg__row mt-3" };
const _hoisted_12 = { class: "mv-cfg__row mt-3" };
const _hoisted_13 = {
  key: 2,
  class: "mv-cfg__panel"
};
const _hoisted_14 = { class: "mv-cfg__section" };
const _hoisted_15 = { class: "mv-cfg__row mt-2" };
const _hoisted_16 = { class: "mv-cfg__section" };
const _hoisted_17 = { class: "mv-cfg__row mt-2" };
const _hoisted_18 = {
  key: 3,
  class: "mv-cfg__panel"
};
const _hoisted_19 = { class: "mv-cfg__section" };
const _hoisted_20 = { class: "mv-cfg__row mt-2" };
const _hoisted_21 = { class: "mv-cfg__section" };
const _hoisted_22 = { class: "mv-cfg__row mt-2" };
const _hoisted_23 = { class: "mv-cfg__footer" };
const {onMounted,reactive,ref,watch} = await importShared('vue');

const _sfc_main = /* @__PURE__ */ _defineComponent({
  __name: "Config",
  props: {
    initialConfig: { type: Object, default: () => ({}) },
    api: { type: Object, default: () => ({}) },
    pluginId: { type: String, default: "MediaVaultBridge" },
    embedded: { type: Boolean, default: false }
  },
  emits: ["save", "close", "switch", "layout"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    onMounted(() => {
      if (!props.embedded) {
        emit("layout", { maxWidth: "64rem" });
      }
    });
    function defaultConfig() {
      return {
        enabled: false,
        mv_url: "http://192.168.2.110:7811",
        mv_api_key: "",
        timeout: 20,
        notify: true,
        default_storage: "115-default",
        default_emby_slug: "emby-default",
        debounce_seconds: 30,
        path_mappings: [
          {
            mp_prefix: "/media/link",
            mv_cloud_prefix: "/media",
            mv_strm_prefix: "",
            storage: "115-default",
            enabled: true
          }
        ],
        upload_retry: {
          enabled: true,
          cron: "*/15 * * * *",
          max_retries: 3,
          cooldown_minutes: 15,
          force_retry: false,
          skip_keywords_regex: "勿重复上传|请先核对云盘文件|已接受上传请求|风控|空间不足|capacity|quota|permission denied",
          notify_on_retry: true,
          notify_on_manual_required: true
        },
        transfer_hooks: {
          enabled: true,
          trigger_monitor_sync: true,
          trigger_strm_generate: false,
          strm_overwrite: false,
          trigger_scrape: false
        },
        delete_hooks: {
          enabled: true,
          trigger_cleanup_scan: true,
          trigger_orphan_scan: false
        },
        emby_hooks: {
          enabled: false,
          run_mediainfo: true,
          run_thumbnail: false,
          run_intro_skip: false
        },
        share_transfer: {
          enabled: true,
          listen_user_message: true,
          default_target_path: "",
          trigger_strm_after: false
        }
      };
    }
    function mergeInitial(raw) {
      const base = defaultConfig();
      if (!raw || typeof raw !== "object") return base;
      return {
        ...base,
        ...raw,
        path_mappings: Array.isArray(raw.path_mappings) ? raw.path_mappings.map((m) => ({
          mp_prefix: String(m?.mp_prefix || ""),
          mv_cloud_prefix: String(m?.mv_cloud_prefix || ""),
          mv_strm_prefix: String(m?.mv_strm_prefix || ""),
          storage: String(m?.storage || "115-default"),
          enabled: m?.enabled !== false
        })) : base.path_mappings,
        upload_retry: { ...base.upload_retry, ...raw.upload_retry || {} },
        transfer_hooks: { ...base.transfer_hooks, ...raw.transfer_hooks || {} },
        delete_hooks: { ...base.delete_hooks, ...raw.delete_hooks || {} },
        emby_hooks: { ...base.emby_hooks, ...raw.emby_hooks || {} },
        share_transfer: { ...base.share_transfer, ...raw.share_transfer || {} }
      };
    }
    const form = ref(mergeInitial(props.initialConfig));
    const activeTab = ref("base");
    const testing = ref(false);
    const testResult = reactive({ ok: null, msg: "" });
    watch(
      () => props.initialConfig,
      (next) => {
        form.value = mergeInitial(next);
      },
      { deep: true }
    );
    function addMapping() {
      form.value.path_mappings.push({
        mp_prefix: "",
        mv_cloud_prefix: "",
        mv_strm_prefix: "",
        storage: form.value.default_storage || "115-default",
        enabled: true
      });
    }
    function removeMapping(idx) {
      form.value.path_mappings.splice(idx, 1);
    }
    async function testConnection() {
      if (!props.api?.post) return;
      testing.value = true;
      testResult.ok = null;
      testResult.msg = "";
      try {
        const res = await props.api.post(`plugin/${props.pluginId}/test`, {
          mv_url: form.value.mv_url,
          mv_api_key: form.value.mv_api_key,
          timeout: form.value.timeout
        });
        testResult.ok = Boolean(res?.success);
        testResult.msg = res?.message || (testResult.ok ? "连接成功" : "连接失败");
      } catch (err) {
        testResult.ok = false;
        testResult.msg = err?.message || "连接测试失败";
      } finally {
        testing.value = false;
      }
    }
    function submit() {
      emit("save", JSON.parse(JSON.stringify(form.value)));
    }
    return (_ctx, _cache) => {
      const _component_VIcon = _resolveComponent("VIcon");
      const _component_VSwitch = _resolveComponent("VSwitch");
      const _component_VTextField = _resolveComponent("VTextField");
      const _component_VCol = _resolveComponent("VCol");
      const _component_VRow = _resolveComponent("VRow");
      const _component_VBtn = _resolveComponent("VBtn");
      const _component_VTextarea = _resolveComponent("VTextarea");
      return _openBlock(), _createElementBlock("div", _hoisted_1, [
        _createElementVNode("div", _hoisted_2, [
          _createElementVNode("button", {
            type: "button",
            class: _normalizeClass(["mv-cfg__tab", { "is-active": activeTab.value === "base" }]),
            onClick: _cache[0] || (_cache[0] = ($event) => activeTab.value = "base")
          }, [
            _createVNode(_component_VIcon, {
              icon: "mdi-server",
              size: "16"
            }),
            _cache[36] || (_cache[36] = _createTextVNode(" 连接与路径 ", -1))
          ], 2),
          _createElementVNode("button", {
            type: "button",
            class: _normalizeClass(["mv-cfg__tab", { "is-active": activeTab.value === "retry" }]),
            onClick: _cache[1] || (_cache[1] = ($event) => activeTab.value = "retry")
          }, [
            _createVNode(_component_VIcon, {
              icon: "mdi-restart",
              size: "16"
            }),
            _cache[37] || (_cache[37] = _createTextVNode(" 115 失败重试 ", -1))
          ], 2),
          _createElementVNode("button", {
            type: "button",
            class: _normalizeClass(["mv-cfg__tab", { "is-active": activeTab.value === "hooks" }]),
            onClick: _cache[2] || (_cache[2] = ($event) => activeTab.value = "hooks")
          }, [
            _createVNode(_component_VIcon, {
              icon: "mdi-auto-fix",
              size: "16"
            }),
            _cache[38] || (_cache[38] = _createTextVNode(" 入库与清理联动 ", -1))
          ], 2),
          _createElementVNode("button", {
            type: "button",
            class: _normalizeClass(["mv-cfg__tab", { "is-active": activeTab.value === "emby_share" }]),
            onClick: _cache[3] || (_cache[3] = ($event) => activeTab.value = "emby_share")
          }, [
            _createVNode(_component_VIcon, {
              icon: "mdi-share-variant",
              size: "16"
            }),
            _cache[39] || (_cache[39] = _createTextVNode(" Emby 与分享转存 ", -1))
          ], 2)
        ]),
        activeTab.value === "base" ? (_openBlock(), _createElementBlock("div", _hoisted_3, [
          _createElementVNode("div", _hoisted_4, [
            _createElementVNode("div", _hoisted_5, [
              _createVNode(_component_VSwitch, {
                modelValue: form.value.enabled,
                "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.value.enabled = $event),
                label: "启用 MediaVault 联动管家",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VSwitch, {
                modelValue: form.value.notify,
                "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.value.notify = $event),
                label: "发送联动与异常通知",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"])
            ]),
            _createVNode(_component_VRow, {
              dense: "",
              class: "mt-2"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_VCol, {
                  cols: "12",
                  md: "6"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VTextField, {
                      modelValue: form.value.mv_url,
                      "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.value.mv_url = $event),
                      label: "MediaVault 服务地址",
                      placeholder: "http://192.168.2.110:7811",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "auto"
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_VCol, {
                  cols: "12",
                  md: "6"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VTextField, {
                      modelValue: form.value.mv_api_key,
                      "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => form.value.mv_api_key = $event),
                      label: "API Key (X-API-Key)",
                      type: "password",
                      placeholder: "在 MediaVault 系统设置中生成的 API Key",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "auto"
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_VCol, {
                  cols: "12",
                  md: "4"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VTextField, {
                      modelValue: form.value.default_storage,
                      "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => form.value.default_storage = $event),
                      label: "默认 115 存储标识",
                      placeholder: "115-default",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "auto"
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_VCol, {
                  cols: "12",
                  md: "4"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VTextField, {
                      modelValue: form.value.default_emby_slug,
                      "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => form.value.default_emby_slug = $event),
                      label: "默认 Emby 实例标识",
                      placeholder: "emby-default",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "auto"
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_VCol, {
                  cols: "6",
                  md: "2"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VTextField, {
                      modelValue: form.value.debounce_seconds,
                      "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => form.value.debounce_seconds = $event),
                      modelModifiers: { number: true },
                      label: "防抖秒数",
                      type: "number",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "auto"
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_VCol, {
                  cols: "6",
                  md: "2"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VTextField, {
                      modelValue: form.value.timeout,
                      "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => form.value.timeout = $event),
                      modelModifiers: { number: true },
                      label: "超时(秒)",
                      type: "number",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "auto"
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createElementVNode("div", _hoisted_6, [
              _createVNode(_component_VBtn, {
                size: "small",
                variant: "tonal",
                color: "primary",
                "prepend-icon": "mdi-shield-check",
                loading: testing.value,
                onClick: testConnection
              }, {
                default: _withCtx(() => [..._cache[40] || (_cache[40] = [
                  _createTextVNode(" 测试连接 ", -1)
                ])]),
                _: 1
              }, 8, ["loading"]),
              testResult.msg ? (_openBlock(), _createElementBlock("span", {
                key: 0,
                class: _normalizeClass(["mv-cfg__test-msg", testResult.ok ? "text-success" : "text-error"])
              }, _toDisplayString(testResult.msg), 3)) : _createCommentVNode("", true)
            ])
          ]),
          _createElementVNode("div", _hoisted_7, [
            _createElementVNode("div", _hoisted_8, [
              _cache[42] || (_cache[42] = _createElementVNode("div", null, [
                _createElementVNode("div", { class: "mv-cfg__section-title" }, "路径映射规则（MP 路径 → MediaVault 云盘 / STRM 路径）"),
                _createElementVNode("div", { class: "mv-cfg__section-desc" }, "入库或删片时按最长前缀自动换算目标云盘目录与 STRM 目录。")
              ], -1)),
              _createVNode(_component_VBtn, {
                size: "small",
                variant: "tonal",
                "prepend-icon": "mdi-plus",
                onClick: addMapping
              }, {
                default: _withCtx(() => [..._cache[41] || (_cache[41] = [
                  _createTextVNode(" 新增映射 ", -1)
                ])]),
                _: 1
              })
            ]),
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(form.value.path_mappings, (item, idx) => {
              return _openBlock(), _createElementBlock("div", {
                key: idx,
                class: "mv-cfg__map-row"
              }, [
                _createVNode(_component_VRow, {
                  dense: "",
                  align: "center"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VCol, {
                      cols: "12",
                      md: "3"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_VTextField, {
                          modelValue: item.mp_prefix,
                          "onUpdate:modelValue": ($event) => item.mp_prefix = $event,
                          label: "MP 路径前缀",
                          placeholder: "/media/link",
                          variant: "outlined",
                          density: "compact",
                          "hide-details": ""
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ]),
                      _: 2
                    }, 1024),
                    _createVNode(_component_VCol, {
                      cols: "12",
                      md: "3"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_VTextField, {
                          modelValue: item.mv_cloud_prefix,
                          "onUpdate:modelValue": ($event) => item.mv_cloud_prefix = $event,
                          label: "MV 云盘前缀",
                          placeholder: "/media",
                          variant: "outlined",
                          density: "compact",
                          "hide-details": ""
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ]),
                      _: 2
                    }, 1024),
                    _createVNode(_component_VCol, {
                      cols: "12",
                      md: "3"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_VTextField, {
                          modelValue: item.mv_strm_prefix,
                          "onUpdate:modelValue": ($event) => item.mv_strm_prefix = $event,
                          label: "MV STRM 前缀（可选）",
                          placeholder: "/strm",
                          variant: "outlined",
                          density: "compact",
                          "hide-details": ""
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ]),
                      _: 2
                    }, 1024),
                    _createVNode(_component_VCol, {
                      cols: "8",
                      md: "2"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_VTextField, {
                          modelValue: item.storage,
                          "onUpdate:modelValue": ($event) => item.storage = $event,
                          label: "存储",
                          placeholder: "115-default",
                          variant: "outlined",
                          density: "compact",
                          "hide-details": ""
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ]),
                      _: 2
                    }, 1024),
                    _createVNode(_component_VCol, {
                      cols: "4",
                      md: "1",
                      class: "d-flex justify-end"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_VBtn, {
                          icon: "mdi-delete",
                          size: "small",
                          variant: "text",
                          color: "error",
                          onClick: ($event) => removeMapping(idx)
                        }, null, 8, ["onClick"])
                      ]),
                      _: 2
                    }, 1024)
                  ]),
                  _: 2
                }, 1024)
              ]);
            }), 128))
          ])
        ])) : activeTab.value === "retry" ? (_openBlock(), _createElementBlock("div", _hoisted_9, [
          _createElementVNode("div", _hoisted_10, [
            _cache[43] || (_cache[43] = _createElementVNode("div", { class: "mv-cfg__section-title" }, "115 上传失败自动巡检与重试", -1)),
            _cache[44] || (_cache[44] = _createElementVNode("div", { class: "mv-cfg__section-desc" }, " 定时拉取 MediaVault 目录监控失败事件；对普通网络/超时失败按次数与冷却自动重试，命中“勿重复上传/请先核对云盘文件”等关键词时自动跳过并通知人工核对。 ", -1)),
            _createElementVNode("div", _hoisted_11, [
              _createVNode(_component_VSwitch, {
                modelValue: form.value.upload_retry.enabled,
                "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => form.value.upload_retry.enabled = $event),
                label: "启用定时巡检自动重试",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VSwitch, {
                modelValue: form.value.upload_retry.force_retry,
                "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => form.value.upload_retry.force_retry = $event),
                label: "自动重试时附加 force=true",
                color: "warning",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"])
            ]),
            _createVNode(_component_VRow, {
              dense: "",
              class: "mt-2"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_VCol, {
                  cols: "12",
                  md: "4"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VTextField, {
                      modelValue: form.value.upload_retry.cron,
                      "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => form.value.upload_retry.cron = $event),
                      label: "巡检 Cron 表达式",
                      placeholder: "*/15 * * * *",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "auto"
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_VCol, {
                  cols: "6",
                  md: "4"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VTextField, {
                      modelValue: form.value.upload_retry.max_retries,
                      "onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => form.value.upload_retry.max_retries = $event),
                      modelModifiers: { number: true },
                      label: "单任务最大自动重试次数",
                      type: "number",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "auto"
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_VCol, {
                  cols: "6",
                  md: "4"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VTextField, {
                      modelValue: form.value.upload_retry.cooldown_minutes,
                      "onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => form.value.upload_retry.cooldown_minutes = $event),
                      modelModifiers: { number: true },
                      label: "同任务重试冷却(分钟)",
                      type: "number",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "auto"
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_VCol, {
                  cols: "12",
                  class: "mt-2"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VTextarea, {
                      modelValue: form.value.upload_retry.skip_keywords_regex,
                      "onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => form.value.upload_retry.skip_keywords_regex = $event),
                      label: "跳过自动重试的错误信息正则（命中则标为需人工核对）",
                      rows: "2",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "auto"
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createElementVNode("div", _hoisted_12, [
              _createVNode(_component_VSwitch, {
                modelValue: form.value.upload_retry.notify_on_retry,
                "onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => form.value.upload_retry.notify_on_retry = $event),
                label: "自动重试成功时发送通知",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VSwitch, {
                modelValue: form.value.upload_retry.notify_on_manual_required,
                "onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => form.value.upload_retry.notify_on_manual_required = $event),
                label: "发现需人工核对失败项时告警（单条仅推一次）",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"])
            ])
          ])
        ])) : activeTab.value === "hooks" ? (_openBlock(), _createElementBlock("div", _hoisted_13, [
          _createElementVNode("div", _hoisted_14, [
            _cache[45] || (_cache[45] = _createElementVNode("div", { class: "mv-cfg__section-title" }, "媒体入库事件联动（TransferComplete 防抖聚合）", -1)),
            _createElementVNode("div", _hoisted_15, [
              _createVNode(_component_VSwitch, {
                modelValue: form.value.transfer_hooks.enabled,
                "onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => form.value.transfer_hooks.enabled = $event),
                label: "启用入库联动",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VSwitch, {
                modelValue: form.value.transfer_hooks.trigger_monitor_sync,
                "onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => form.value.transfer_hooks.trigger_monitor_sync = $event),
                label: "触发目录监控增量同步",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VSwitch, {
                modelValue: form.value.transfer_hooks.trigger_strm_generate,
                "onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => form.value.transfer_hooks.trigger_strm_generate = $event),
                label: "按映射目录触发增量 STRM 生成",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VSwitch, {
                modelValue: form.value.transfer_hooks.strm_overwrite,
                "onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => form.value.transfer_hooks.strm_overwrite = $event),
                label: "覆盖已有 STRM",
                color: "warning",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VSwitch, {
                modelValue: form.value.transfer_hooks.trigger_scrape,
                "onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => form.value.transfer_hooks.trigger_scrape = $event),
                label: "触发目录刮削",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"])
            ])
          ]),
          _createElementVNode("div", _hoisted_16, [
            _cache[46] || (_cache[46] = _createElementVNode("div", { class: "mv-cfg__section-title" }, "删片 / 洗版清理联动（HistoryDeleted）", -1)),
            _cache[47] || (_cache[47] = _createElementVNode("div", { class: "mv-cfg__section-desc" }, "默认仅触发安全扫描，不自动删除网盘或 STRM 文件，避免误删。", -1)),
            _createElementVNode("div", _hoisted_17, [
              _createVNode(_component_VSwitch, {
                modelValue: form.value.delete_hooks.enabled,
                "onUpdate:modelValue": _cache[25] || (_cache[25] = ($event) => form.value.delete_hooks.enabled = $event),
                label: "启用删片联动",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VSwitch, {
                modelValue: form.value.delete_hooks.trigger_cleanup_scan,
                "onUpdate:modelValue": _cache[26] || (_cache[26] = ($event) => form.value.delete_hooks.trigger_cleanup_scan = $event),
                label: "触发失效 STRM 清理扫描",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VSwitch, {
                modelValue: form.value.delete_hooks.trigger_orphan_scan,
                "onUpdate:modelValue": _cache[27] || (_cache[27] = ($event) => form.value.delete_hooks.trigger_orphan_scan = $event),
                label: "触发网盘孤立索引扫描",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"])
            ])
          ])
        ])) : (_openBlock(), _createElementBlock("div", _hoisted_18, [
          _createElementVNode("div", _hoisted_19, [
            _cache[48] || (_cache[48] = _createElementVNode("div", { class: "mv-cfg__section-title" }, "Emby 增强后处理（入库聚合后自动触发）", -1)),
            _createElementVNode("div", _hoisted_20, [
              _createVNode(_component_VSwitch, {
                modelValue: form.value.emby_hooks.enabled,
                "onUpdate:modelValue": _cache[28] || (_cache[28] = ($event) => form.value.emby_hooks.enabled = $event),
                label: "启用 Emby 后处理联动",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VSwitch, {
                modelValue: form.value.emby_hooks.run_mediainfo,
                "onUpdate:modelValue": _cache[29] || (_cache[29] = ($event) => form.value.emby_hooks.run_mediainfo = $event),
                label: "提取缺失 MediaInfo",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VSwitch, {
                modelValue: form.value.emby_hooks.run_thumbnail,
                "onUpdate:modelValue": _cache[30] || (_cache[30] = ($event) => form.value.emby_hooks.run_thumbnail = $event),
                label: "生成缺失缩略图",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VSwitch, {
                modelValue: form.value.emby_hooks.run_intro_skip,
                "onUpdate:modelValue": _cache[31] || (_cache[31] = ($event) => form.value.emby_hooks.run_intro_skip = $event),
                label: "检测缺失片头片尾",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"])
            ])
          ]),
          _createElementVNode("div", _hoisted_21, [
            _cache[49] || (_cache[49] = _createElementVNode("div", { class: "mv-cfg__section-title" }, "115 分享链直连转存", -1)),
            _createElementVNode("div", _hoisted_22, [
              _createVNode(_component_VSwitch, {
                modelValue: form.value.share_transfer.enabled,
                "onUpdate:modelValue": _cache[32] || (_cache[32] = ($event) => form.value.share_transfer.enabled = $event),
                label: "启用分享链转存",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VSwitch, {
                modelValue: form.value.share_transfer.listen_user_message,
                "onUpdate:modelValue": _cache[33] || (_cache[33] = ($event) => form.value.share_transfer.listen_user_message = $event),
                label: "监听 MP 消息通道中的 115 分享链接自动转存",
                color: "primary",
                "hide-details": "",
                density: "compact"
              }, null, 8, ["modelValue"])
            ]),
            _createVNode(_component_VRow, {
              dense: "",
              class: "mt-2"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_VCol, {
                  cols: "12",
                  md: "8"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VTextField, {
                      modelValue: form.value.share_transfer.default_target_path,
                      "onUpdate:modelValue": _cache[34] || (_cache[34] = ($event) => form.value.share_transfer.default_target_path = $event),
                      label: "默认转存网盘目录（留空使用 MediaVault 默认路径）",
                      placeholder: "/media/Inbox",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "auto"
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
          ])
        ])),
        _createElementVNode("div", _hoisted_23, [
          !__props.embedded ? (_openBlock(), _createBlock(_component_VBtn, {
            key: 0,
            variant: "text",
            onClick: _cache[35] || (_cache[35] = ($event) => emit("close"))
          }, {
            default: _withCtx(() => [..._cache[50] || (_cache[50] = [
              _createTextVNode("取消", -1)
            ])]),
            _: 1
          })) : _createCommentVNode("", true),
          _createVNode(_component_VBtn, {
            color: "primary",
            variant: "flat",
            "prepend-icon": "mdi-check",
            onClick: submit
          }, {
            default: _withCtx(() => [..._cache[51] || (_cache[51] = [
              _createTextVNode(" 保存配置 ", -1)
            ])]),
            _: 1
          })
        ])
      ]);
    };
  }
});

const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};

const Config = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-f37d56fd"]]);

export { _export_sfc as _, Config as default };
