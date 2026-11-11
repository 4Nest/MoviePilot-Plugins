import { importShared } from './__federation_fn_import-JrT3xvdd.js';

const {defineComponent:_defineComponent} = await importShared('vue');

const {createTextVNode:_createTextVNode,resolveComponent:_resolveComponent,withCtx:_withCtx,createVNode:_createVNode,toDisplayString:_toDisplayString,createElementVNode:_createElementVNode,openBlock:_openBlock,createBlock:_createBlock,createCommentVNode:_createCommentVNode,renderList:_renderList,Fragment:_Fragment,createElementBlock:_createElementBlock,normalizeClass:_normalizeClass} = await importShared('vue');

const _hoisted_1 = { class: "seed-config" };
const _hoisted_2 = { class: "d-flex align-center justify-space-between mb-3 flex-wrap ga-2" };
const _hoisted_3 = { class: "d-flex align-center ga-3 flex-wrap" };
const _hoisted_4 = { class: "font-weight-medium" };
const _hoisted_5 = { class: "section-title" };
const _hoisted_6 = { class: "section-title" };
const _hoisted_7 = { class: "d-flex justify-end ga-2 mt-3" };
const _hoisted_8 = { class: "d-flex align-center ga-3 mb-3" };
const _hoisted_9 = { class: "sticky-actions" };
const {ref,watch} = await importShared('vue');

const _sfc_main = /* @__PURE__ */ _defineComponent({
  __name: "Config",
  props: {
    initialConfig: { type: Object, default: () => ({}) },
    api: { type: Object, default: () => ({}) }
  },
  emits: ["save", "close", "switch"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const stateItems = [
      { title: "做种中", value: "seeding" },
      { title: "已暂停", value: "paused" },
      { title: "做种停滞", value: "stalled" },
      { title: "错误/死种", value: "error" },
      { title: "下载中", value: "downloading" },
      { title: "其他", value: "other" }
    ];
    const sortItems = [
      { title: "做种最久优先", value: "oldest_seeding" },
      { title: "体积最大优先", value: "largest_size" },
      { title: "上传最慢优先", value: "lowest_upspeed" },
      { title: "分享率最高优先", value: "highest_ratio" }
    ];
    const activeTab = ref("general");
    function defaultRule() {
      return {
        id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: "新清理规则",
        enabled: true,
        downloaders: [],
        delete_files: true,
        require_transferred: true,
        allow_incomplete: false,
        max_delete_per_run: 0,
        metric_logic: "all",
        name_regex: "",
        exclude_name_regex: "",
        save_path_regex: "",
        exclude_save_path_regex: "",
        tracker_regex: "",
        exclude_tracker_regex: "",
        tracker_msg_regex: "",
        category_regex: "",
        tag_regex: "",
        exclude_tag_regex: "",
        states: ["seeding", "paused", "stalled"],
        min_ratio: null,
        max_ratio: null,
        min_seeding_hours: null,
        min_added_hours: null,
        min_size_gb: null,
        max_size_gb: null,
        max_upspeed_kbps: null
      };
    }
    function normalizeRule(raw, index) {
      return { ...defaultRule(), ...clone(raw), id: raw?.id || `rule_${index + 1}` };
    }
    function clone(value) {
      return JSON.parse(JSON.stringify(value ?? {}));
    }
    function defaultConfig() {
      return {
        enabled: false,
        cron: "*/30 * * * *",
        notify: true,
        protect_tags: ["保种", "辅种", "勿删", "keep"],
        global_exclude_regex: "",
        only_completed: true,
        rules: [],
        disk_guard: {
          enabled: false,
          free_space_threshold_gb: 50,
          target_free_space_gb: 100,
          min_protect_hours: 72,
          sort_by: "oldest_seeding",
          delete_files: true
        }
      };
    }
    function normalizeConfig(raw) {
      const base = defaultConfig();
      return {
        ...base,
        ...clone(raw),
        protect_tags: Array.isArray(raw?.protect_tags) ? [...raw.protect_tags] : base.protect_tags,
        rules: Array.isArray(raw?.rules) ? raw.rules.map(normalizeRule) : [],
        disk_guard: { ...base.disk_guard, ...clone(raw?.disk_guard) || {} }
      };
    }
    const config = ref(normalizeConfig(props.initialConfig));
    watch(
      () => props.initialConfig,
      (value) => {
        config.value = normalizeConfig(value);
      },
      { deep: true }
    );
    function addRule() {
      config.value.rules.push(defaultRule());
      activeTab.value = "rules";
    }
    function removeRule(index) {
      config.value.rules.splice(index, 1);
    }
    function duplicateRule(index) {
      const copy = normalizeRule(config.value.rules[index], index);
      copy.id = `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      copy.name = `${copy.name}（副本）`;
      config.value.rules.splice(index + 1, 0, copy);
    }
    function saveConfig() {
      emit("save", clone(config.value));
    }
    return (_ctx, _cache) => {
      const _component_v_alert = _resolveComponent("v-alert");
      const _component_v_tab = _resolveComponent("v-tab");
      const _component_v_chip = _resolveComponent("v-chip");
      const _component_v_tabs = _resolveComponent("v-tabs");
      const _component_v_switch = _resolveComponent("v-switch");
      const _component_v_col = _resolveComponent("v-col");
      const _component_v_text_field = _resolveComponent("v-text-field");
      const _component_v_combobox = _resolveComponent("v-combobox");
      const _component_v_row = _resolveComponent("v-row");
      const _component_v_card = _resolveComponent("v-card");
      const _component_v_window_item = _resolveComponent("v-window-item");
      const _component_v_btn = _resolveComponent("v-btn");
      const _component_v_icon = _resolveComponent("v-icon");
      const _component_v_expansion_panel_title = _resolveComponent("v-expansion-panel-title");
      const _component_v_select = _resolveComponent("v-select");
      const _component_v_btn_toggle = _resolveComponent("v-btn-toggle");
      const _component_v_divider = _resolveComponent("v-divider");
      const _component_v_expansion_panel_text = _resolveComponent("v-expansion-panel-text");
      const _component_v_expansion_panel = _resolveComponent("v-expansion-panel");
      const _component_v_expansion_panels = _resolveComponent("v-expansion-panels");
      const _component_v_avatar = _resolveComponent("v-avatar");
      const _component_v_window = _resolveComponent("v-window");
      return _openBlock(), _createElementBlock("div", _hoisted_1, [
        _createVNode(_component_v_alert, {
          type: "warning",
          variant: "tonal",
          density: "compact",
          class: "mb-4"
        }, {
          default: _withCtx(() => [..._cache[15] || (_cache[15] = [
            _createTextVNode(" 所有规则默认要求「已完成 + 已整理入库」。请先干跑预览，确认真删范围；保护标签与全局排除始终优先生效。 ", -1)
          ])]),
          _: 1
        }),
        _createVNode(_component_v_tabs, {
          modelValue: activeTab.value,
          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => activeTab.value = $event),
          color: "primary",
          class: "mb-4",
          "show-arrows": ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_tab, {
              value: "general",
              "prepend-icon": "mdi-tune"
            }, {
              default: _withCtx(() => [..._cache[16] || (_cache[16] = [
                _createTextVNode("全局与调度", -1)
              ])]),
              _: 1
            }),
            _createVNode(_component_v_tab, {
              value: "rules",
              "prepend-icon": "mdi-format-list-checks"
            }, {
              default: _withCtx(() => [
                _cache[17] || (_cache[17] = _createTextVNode(" 清理规则 ", -1)),
                _createVNode(_component_v_chip, {
                  size: "x-small",
                  class: "ml-2"
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(config.value.rules.length), 1)
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createVNode(_component_v_tab, {
              value: "disk",
              "prepend-icon": "mdi-harddisk"
            }, {
              default: _withCtx(() => [..._cache[18] || (_cache[18] = [
                _createTextVNode("低水位保盘", -1)
              ])]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue"]),
        _createVNode(_component_v_window, {
          modelValue: activeTab.value,
          "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => activeTab.value = $event)
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_window_item, { value: "general" }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card, {
                  variant: "outlined",
                  class: "pa-4"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_row, null, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_col, {
                          cols: "12",
                          md: "4"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: config.value.enabled,
                              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => config.value.enabled = $event),
                              color: "primary",
                              label: "启用插件与定时巡检",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          md: "4"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: config.value.notify,
                              "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => config.value.notify = $event),
                              color: "primary",
                              label: "清理后发送汇总通知",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          md: "4"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: config.value.only_completed,
                              "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => config.value.only_completed = $event),
                              color: "primary",
                              label: "全局仅清理已完成任务",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          md: "6"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_text_field, {
                              modelValue: config.value.cron,
                              "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => config.value.cron = $event),
                              label: "巡检 Cron",
                              hint: "默认每 30 分钟；例如 */30 * * * *",
                              "persistent-hint": "",
                              variant: "outlined"
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          md: "6"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_combobox, {
                              modelValue: config.value.protect_tags,
                              "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => config.value.protect_tags = $event),
                              multiple: "",
                              chips: "",
                              "closable-chips": "",
                              label: "全局保护标签",
                              hint: "输入后回车；保种、辅种、勿删、keep 永不删除",
                              "persistent-hint": "",
                              variant: "outlined"
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, { cols: "12" }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_text_field, {
                              modelValue: config.value.global_exclude_regex,
                              "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => config.value.global_exclude_regex = $event),
                              label: "全局排除名称正则（大小写不敏感）",
                              placeholder: "例如：-(HDArea|EPiC|WiKi|FRDS)$",
                              variant: "outlined"
                            }, null, 8, ["modelValue"])
                          ]),
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
            }),
            _createVNode(_component_v_window_item, { value: "rules" }, {
              default: _withCtx(() => [
                _createElementVNode("div", _hoisted_2, [
                  _cache[20] || (_cache[20] = _createElementVNode("div", { class: "text-body-2 text-medium-emphasis" }, "规则自上而下匹配，同一种子只命中一次；数值条件可选全部满足或任一达标。", -1)),
                  _createVNode(_component_v_btn, {
                    color: "primary",
                    "prepend-icon": "mdi-plus",
                    onClick: addRule
                  }, {
                    default: _withCtx(() => [..._cache[19] || (_cache[19] = [
                      _createTextVNode("添加规则", -1)
                    ])]),
                    _: 1
                  })
                ]),
                !config.value.rules.length ? (_openBlock(), _createBlock(_component_v_alert, {
                  key: 0,
                  type: "info",
                  variant: "tonal"
                }, {
                  default: _withCtx(() => [..._cache[21] || (_cache[21] = [
                    _createTextVNode("暂无规则。可添加空白规则，或在主页面导入四个预设模板。", -1)
                  ])]),
                  _: 1
                })) : (_openBlock(), _createBlock(_component_v_expansion_panels, {
                  key: 1,
                  multiple: "",
                  variant: "accordion"
                }, {
                  default: _withCtx(() => [
                    (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(config.value.rules, (rule, index) => {
                      return _openBlock(), _createBlock(_component_v_expansion_panel, {
                        key: rule.id
                      }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_expansion_panel_title, null, {
                            default: _withCtx(() => [
                              _createElementVNode("div", _hoisted_3, [
                                _createVNode(_component_v_icon, {
                                  color: rule.enabled ? "success" : "disabled"
                                }, {
                                  default: _withCtx(() => [
                                    _createTextVNode(_toDisplayString(rule.enabled ? "mdi-check-circle" : "mdi-pause-circle"), 1)
                                  ]),
                                  _: 2
                                }, 1032, ["color"]),
                                _createElementVNode("span", _hoisted_4, _toDisplayString(index + 1) + ". " + _toDisplayString(rule.name), 1),
                                _createVNode(_component_v_chip, {
                                  size: "x-small",
                                  variant: "tonal"
                                }, {
                                  default: _withCtx(() => [
                                    _createTextVNode(_toDisplayString(rule.metric_logic === "any" ? "任一数值达标" : "全部数值满足"), 1)
                                  ]),
                                  _: 2
                                }, 1024),
                                rule.require_transferred ? (_openBlock(), _createBlock(_component_v_chip, {
                                  key: 0,
                                  size: "x-small",
                                  color: "success",
                                  variant: "tonal"
                                }, {
                                  default: _withCtx(() => [..._cache[22] || (_cache[22] = [
                                    _createTextVNode("入库锁", -1)
                                  ])]),
                                  _: 1
                                })) : _createCommentVNode("", true)
                              ])
                            ]),
                            _: 2
                          }, 1024),
                          _createVNode(_component_v_expansion_panel_text, null, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_row, null, {
                                default: _withCtx(() => [
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "5"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.name,
                                        "onUpdate:modelValue": ($event) => rule.name = $event,
                                        label: "规则名称",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "4"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_combobox, {
                                        modelValue: rule.downloaders,
                                        "onUpdate:modelValue": ($event) => rule.downloaders = $event,
                                        multiple: "",
                                        chips: "",
                                        "closable-chips": "",
                                        label: "限定下载器（空为全部）",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "3"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.max_delete_per_run,
                                        "onUpdate:modelValue": ($event) => rule.max_delete_per_run = $event,
                                        modelModifiers: { number: true },
                                        type: "number",
                                        min: "0",
                                        label: "单轮上限（0 不限）",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "6",
                                    md: "3"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_switch, {
                                        modelValue: rule.enabled,
                                        "onUpdate:modelValue": ($event) => rule.enabled = $event,
                                        color: "primary",
                                        label: "启用",
                                        "hide-details": ""
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "6",
                                    md: "3"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_switch, {
                                        modelValue: rule.delete_files,
                                        "onUpdate:modelValue": ($event) => rule.delete_files = $event,
                                        color: "error",
                                        label: "连同源文件删除",
                                        "hide-details": ""
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "6",
                                    md: "3"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_switch, {
                                        modelValue: rule.require_transferred,
                                        "onUpdate:modelValue": ($event) => rule.require_transferred = $event,
                                        color: "success",
                                        label: "仅已整理入库",
                                        "hide-details": ""
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "6",
                                    md: "3"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_switch, {
                                        modelValue: rule.allow_incomplete,
                                        "onUpdate:modelValue": ($event) => rule.allow_incomplete = $event,
                                        color: "warning",
                                        label: "允许未完成任务",
                                        "hide-details": ""
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "6"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_select, {
                                        modelValue: rule.states,
                                        "onUpdate:modelValue": ($event) => rule.states = $event,
                                        items: stateItems,
                                        multiple: "",
                                        chips: "",
                                        label: "允许状态（空为不限）",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "6"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_btn_toggle, {
                                        modelValue: rule.metric_logic,
                                        "onUpdate:modelValue": ($event) => rule.metric_logic = $event,
                                        mandatory: "",
                                        color: "primary",
                                        variant: "outlined",
                                        divided: "",
                                        class: "w-100"
                                      }, {
                                        default: _withCtx(() => [
                                          _createVNode(_component_v_btn, {
                                            value: "all",
                                            class: "flex-1-1"
                                          }, {
                                            default: _withCtx(() => [..._cache[23] || (_cache[23] = [
                                              _createTextVNode("数值全部满足 AND", -1)
                                            ])]),
                                            _: 1
                                          }),
                                          _createVNode(_component_v_btn, {
                                            value: "any",
                                            class: "flex-1-1"
                                          }, {
                                            default: _withCtx(() => [..._cache[24] || (_cache[24] = [
                                              _createTextVNode("任一数值达标 OR", -1)
                                            ])]),
                                            _: 1
                                          })
                                        ]),
                                        _: 1
                                      }, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024)
                                ]),
                                _: 2
                              }, 1024),
                              _createVNode(_component_v_divider, { class: "my-4" }),
                              _createElementVNode("div", _hoisted_5, [
                                _createVNode(_component_v_icon, { icon: "mdi-regex" }),
                                _cache[25] || (_cache[25] = _createTextVNode("正则条件", -1))
                              ]),
                              _createVNode(_component_v_row, null, {
                                default: _withCtx(() => [
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "6"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.name_regex,
                                        "onUpdate:modelValue": ($event) => rule.name_regex = $event,
                                        label: "种子名称包含正则",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "6"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.exclude_name_regex,
                                        "onUpdate:modelValue": ($event) => rule.exclude_name_regex = $event,
                                        label: "种子名称排除正则",
                                        placeholder: "-(HDArea|EPiC|WiKi|FRDS)$",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "6"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.save_path_regex,
                                        "onUpdate:modelValue": ($event) => rule.save_path_regex = $event,
                                        label: "保存路径包含正则",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "6"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.exclude_save_path_regex,
                                        "onUpdate:modelValue": ($event) => rule.exclude_save_path_regex = $event,
                                        label: "保存路径排除正则",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "6"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.tracker_regex,
                                        "onUpdate:modelValue": ($event) => rule.tracker_regex = $event,
                                        label: "Tracker 包含正则",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "6"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.exclude_tracker_regex,
                                        "onUpdate:modelValue": ($event) => rule.exclude_tracker_regex = $event,
                                        label: "Tracker 排除正则",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, { cols: "12" }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.tracker_msg_regex,
                                        "onUpdate:modelValue": ($event) => rule.tracker_msg_regex = $event,
                                        label: "Tracker 状态/报错正则",
                                        placeholder: "unregistered|not registered|torrent not found|deleted|banned|不存在|已删除",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "4"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.category_regex,
                                        "onUpdate:modelValue": ($event) => rule.category_regex = $event,
                                        label: "分类正则",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "4"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.tag_regex,
                                        "onUpdate:modelValue": ($event) => rule.tag_regex = $event,
                                        label: "标签包含正则",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "4"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.exclude_tag_regex,
                                        "onUpdate:modelValue": ($event) => rule.exclude_tag_regex = $event,
                                        label: "标签排除正则",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024)
                                ]),
                                _: 2
                              }, 1024),
                              _createVNode(_component_v_divider, { class: "my-4" }),
                              _createElementVNode("div", _hoisted_6, [
                                _createVNode(_component_v_icon, { icon: "mdi-chart-box-outline" }),
                                _cache[26] || (_cache[26] = _createTextVNode("数值达标条件", -1))
                              ]),
                              _createVNode(_component_v_row, null, {
                                default: _withCtx(() => [
                                  _createVNode(_component_v_col, {
                                    cols: "6",
                                    md: "3"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.min_ratio,
                                        "onUpdate:modelValue": ($event) => rule.min_ratio = $event,
                                        modelModifiers: { number: true },
                                        type: "number",
                                        step: "0.1",
                                        label: "最小分享率",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "6",
                                    md: "3"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.max_ratio,
                                        "onUpdate:modelValue": ($event) => rule.max_ratio = $event,
                                        modelModifiers: { number: true },
                                        type: "number",
                                        step: "0.1",
                                        label: "最大分享率",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "6",
                                    md: "3"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.min_seeding_hours,
                                        "onUpdate:modelValue": ($event) => rule.min_seeding_hours = $event,
                                        modelModifiers: { number: true },
                                        type: "number",
                                        label: "最少做种小时",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "6",
                                    md: "3"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.min_added_hours,
                                        "onUpdate:modelValue": ($event) => rule.min_added_hours = $event,
                                        modelModifiers: { number: true },
                                        type: "number",
                                        label: "最少添加小时",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "6",
                                    md: "4"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.min_size_gb,
                                        "onUpdate:modelValue": ($event) => rule.min_size_gb = $event,
                                        modelModifiers: { number: true },
                                        type: "number",
                                        label: "最小体积 GB",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "6",
                                    md: "4"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.max_size_gb,
                                        "onUpdate:modelValue": ($event) => rule.max_size_gb = $event,
                                        modelModifiers: { number: true },
                                        type: "number",
                                        label: "最大体积 GB",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024),
                                  _createVNode(_component_v_col, {
                                    cols: "12",
                                    md: "4"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_text_field, {
                                        modelValue: rule.max_upspeed_kbps,
                                        "onUpdate:modelValue": ($event) => rule.max_upspeed_kbps = $event,
                                        modelModifiers: { number: true },
                                        type: "number",
                                        label: "最大上传 KB/s",
                                        hint: "例如 10 可筛选无人下载冷种",
                                        "persistent-hint": "",
                                        variant: "outlined",
                                        density: "compact"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                    ]),
                                    _: 2
                                  }, 1024)
                                ]),
                                _: 2
                              }, 1024),
                              _createElementVNode("div", _hoisted_7, [
                                _createVNode(_component_v_btn, {
                                  variant: "text",
                                  "prepend-icon": "mdi-content-copy",
                                  onClick: ($event) => duplicateRule(index)
                                }, {
                                  default: _withCtx(() => [..._cache[27] || (_cache[27] = [
                                    _createTextVNode("复制", -1)
                                  ])]),
                                  _: 1
                                }, 8, ["onClick"]),
                                _createVNode(_component_v_btn, {
                                  color: "error",
                                  variant: "text",
                                  "prepend-icon": "mdi-delete",
                                  onClick: ($event) => removeRule(index)
                                }, {
                                  default: _withCtx(() => [..._cache[28] || (_cache[28] = [
                                    _createTextVNode("删除规则", -1)
                                  ])]),
                                  _: 1
                                }, 8, ["onClick"])
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
                }))
              ]),
              _: 1
            }),
            _createVNode(_component_v_window_item, { value: "disk" }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card, {
                  variant: "outlined",
                  class: "pa-4"
                }, {
                  default: _withCtx(() => [
                    _createElementVNode("div", _hoisted_8, [
                      _createVNode(_component_v_avatar, {
                        color: "warning",
                        variant: "tonal"
                      }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_icon, { icon: "mdi-shield-half-full" })
                        ]),
                        _: 1
                      }),
                      _cache[29] || (_cache[29] = _createElementVNode("div", null, [
                        _createElementVNode("div", { class: "text-h6" }, "磁盘低水位应急保盘"),
                        _createElementVNode("div", { class: "text-body-2 text-medium-emphasis" }, "仅在空间不足时启动，仍强制要求已完成、已入库、无保护标签且达到最低保护时长。")
                      ], -1))
                    ]),
                    _createVNode(_component_v_switch, {
                      modelValue: config.value.disk_guard.enabled,
                      "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => config.value.disk_guard.enabled = $event),
                      color: "warning",
                      label: "启用磁盘低水位应急删种"
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_row, {
                      class: _normalizeClass({ "disabled-section": !config.value.disk_guard.enabled })
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_col, {
                          cols: "12",
                          md: "6"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_text_field, {
                              modelValue: config.value.disk_guard.free_space_threshold_gb,
                              "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => config.value.disk_guard.free_space_threshold_gb = $event),
                              modelModifiers: { number: true },
                              type: "number",
                              min: "0",
                              label: "触发阈值：剩余空间低于 GB",
                              variant: "outlined"
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          md: "6"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_text_field, {
                              modelValue: config.value.disk_guard.target_free_space_gb,
                              "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => config.value.disk_guard.target_free_space_gb = $event),
                              modelModifiers: { number: true },
                              type: "number",
                              min: "0",
                              label: "恢复目标：预计剩余空间达到 GB",
                              variant: "outlined"
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          md: "6"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_text_field, {
                              modelValue: config.value.disk_guard.min_protect_hours,
                              "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => config.value.disk_guard.min_protect_hours = $event),
                              modelModifiers: { number: true },
                              type: "number",
                              min: "0",
                              label: "最低做种保护时长（小时）",
                              variant: "outlined"
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          md: "6"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_select, {
                              modelValue: config.value.disk_guard.sort_by,
                              "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => config.value.disk_guard.sort_by = $event),
                              items: sortItems,
                              label: "淘汰排序策略",
                              variant: "outlined"
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, { cols: "12" }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: config.value.disk_guard.delete_files,
                              "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => config.value.disk_guard.delete_files = $event),
                              color: "error",
                              label: "应急淘汰时连同源文件删除（关闭仅移除任务）",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    }, 8, ["class"])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue"]),
        _createElementVNode("div", _hoisted_9, [
          _createVNode(_component_v_btn, {
            variant: "text",
            onClick: _cache[14] || (_cache[14] = ($event) => emit("close"))
          }, {
            default: _withCtx(() => [..._cache[30] || (_cache[30] = [
              _createTextVNode("取消", -1)
            ])]),
            _: 1
          }),
          _createVNode(_component_v_btn, {
            color: "primary",
            variant: "flat",
            "prepend-icon": "mdi-content-save",
            onClick: saveConfig
          }, {
            default: _withCtx(() => [..._cache[31] || (_cache[31] = [
              _createTextVNode("保存配置", -1)
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

const Config = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-435796f1"]]);

export { _export_sfc as _, Config as default };
