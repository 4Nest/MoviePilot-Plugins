import { importShared } from './__federation_fn_import-JrT3xvdd.js';

const {defineComponent:_defineComponent} = await importShared('vue');

const {resolveComponent:_resolveComponent,createVNode:_createVNode,createElementVNode:_createElementVNode,openBlock:_openBlock,createElementBlock:_createElementBlock,createCommentVNode:_createCommentVNode,createTextVNode:_createTextVNode,withCtx:_withCtx,toDisplayString:_toDisplayString,normalizeClass:_normalizeClass,mergeProps:_mergeProps,renderList:_renderList,Fragment:_Fragment,createBlock:_createBlock} = await importShared('vue');

const _hoisted_1 = { class: "seed-config" };
const _hoisted_2 = {
  key: 0,
  class: "seed-config__header"
};
const _hoisted_3 = { class: "seed-config__title" };
const _hoisted_4 = { class: "seed-config__body" };
const _hoisted_5 = { class: "seed-section-card mb-4" };
const _hoisted_6 = { class: "seed-section-card__head" };
const _hoisted_7 = { class: "seed-toggle-grid" };
const _hoisted_8 = { class: "seed-toggle-tile__top" };
const _hoisted_9 = { class: "seed-toggle-tile__top" };
const _hoisted_10 = { class: "seed-toggle-tile__top" };
const _hoisted_11 = { class: "seed-section-card" };
const _hoisted_12 = { class: "seed-section-card__head" };
const _hoisted_13 = { class: "d-flex align-center justify-space-between mb-3 flex-wrap ga-2" };
const _hoisted_14 = {
  key: 0,
  class: "seed-empty-rules"
};
const _hoisted_15 = { class: "d-flex align-center ga-2 flex-wrap" };
const _hoisted_16 = { class: "font-weight-medium text-body-2" };
const _hoisted_17 = { class: "seed-mini-chip" };
const _hoisted_18 = {
  key: 0,
  class: "seed-mini-chip is-success"
};
const _hoisted_19 = {
  key: 1,
  class: "seed-mini-chip is-info"
};
const _hoisted_20 = { class: "seed-subhead mt-4 mb-2" };
const _hoisted_21 = { class: "seed-subhead mt-4 mb-2" };
const _hoisted_22 = { class: "d-flex justify-end ga-2 mt-3" };
const _hoisted_23 = { class: "seed-panel-box" };
const _hoisted_24 = { class: "d-flex align-center justify-space-between flex-wrap ga-2 mb-3" };
const _hoisted_25 = { class: "d-flex align-center ga-2" };
const _hoisted_26 = { class: "seed-config__footer" };
const {computed,onMounted,ref,watch} = await importShared('vue');

const _sfc_main = /* @__PURE__ */ _defineComponent({
  __name: "Config",
  props: {
    initialConfig: { type: Object, default: () => ({}) },
    api: { type: Object, default: () => ({}) },
    embedded: { type: Boolean, default: false },
    downloaderNames: { type: Array, default: () => [] }
  },
  emits: ["save", "close", "switch", "layout"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const remoteDownloaders = ref([]);
    const loadingDownloaders = ref(false);
    async function fetchDownloaders() {
      const getter = props.api?.get;
      if (typeof getter !== "function") return;
      loadingDownloaders.value = true;
      try {
        const res = await getter("download/clients");
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        const names = list.map((item) => typeof item === "string" ? item : item?.name).map((name) => String(name || "").trim()).filter(Boolean);
        if (names.length > 0) {
          remoteDownloaders.value = Array.from(new Set(names));
          return;
        }
        const settingRes = await getter("system/setting/Downloaders");
        const rawSetting = Array.isArray(settingRes) ? settingRes : Array.isArray(settingRes?.data?.value) ? settingRes.data.value : Array.isArray(settingRes?.data) ? settingRes.data : [];
        const fallbackNames = rawSetting.filter((item) => item && item.enabled !== false).map((item) => String(item.name || "").trim()).filter(Boolean);
        remoteDownloaders.value = Array.from(new Set(fallbackNames));
      } catch {
      } finally {
        loadingDownloaders.value = false;
      }
    }
    onMounted(() => {
      if (!props.embedded) {
        emit("layout", { maxWidth: "64rem" });
      }
      void fetchDownloaders();
    });
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
    const downloaderOptions = computed(() => {
      const merged = /* @__PURE__ */ new Set();
      for (const name of props.downloaderNames || []) {
        const trimmed = String(name || "").trim();
        if (trimmed) merged.add(trimmed);
      }
      for (const name of remoteDownloaders.value) {
        if (name) merged.add(name);
      }
      for (const rule of config.value.rules || []) {
        for (const name of rule.downloaders || []) {
          const trimmed = String(name || "").trim();
          if (trimmed) merged.add(trimmed);
        }
      }
      return Array.from(merged);
    });
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
      const _component_v_icon = _resolveComponent("v-icon");
      const _component_v_btn = _resolveComponent("v-btn");
      const _component_v_alert = _resolveComponent("v-alert");
      const _component_v_tab = _resolveComponent("v-tab");
      const _component_v_chip = _resolveComponent("v-chip");
      const _component_v_tabs = _resolveComponent("v-tabs");
      const _component_v_switch = _resolveComponent("v-switch");
      const _component_v_text_field = _resolveComponent("v-text-field");
      const _component_v_col = _resolveComponent("v-col");
      const _component_v_combobox = _resolveComponent("v-combobox");
      const _component_v_row = _resolveComponent("v-row");
      const _component_v_window_item = _resolveComponent("v-window-item");
      const _component_v_expansion_panel_title = _resolveComponent("v-expansion-panel-title");
      const _component_v_select = _resolveComponent("v-select");
      const _component_v_btn_toggle = _resolveComponent("v-btn-toggle");
      const _component_v_expansion_panel_text = _resolveComponent("v-expansion-panel-text");
      const _component_v_expansion_panel = _resolveComponent("v-expansion-panel");
      const _component_v_expansion_panels = _resolveComponent("v-expansion-panels");
      const _component_v_window = _resolveComponent("v-window");
      const _component_v_spacer = _resolveComponent("v-spacer");
      return _openBlock(), _createElementBlock("div", _hoisted_1, [
        !props.embedded ? (_openBlock(), _createElementBlock("div", _hoisted_2, [
          _createElementVNode("div", _hoisted_3, [
            _createVNode(_component_v_icon, {
              icon: "mdi-tune",
              size: "20",
              color: "primary"
            }),
            _cache[17] || (_cache[17] = _createElementVNode("span", null, "保种管家配置", -1))
          ]),
          _createVNode(_component_v_btn, {
            icon: "mdi-close",
            variant: "text",
            size: "small",
            rounded: "lg",
            onClick: _cache[0] || (_cache[0] = ($event) => emit("close"))
          })
        ])) : _createCommentVNode("", true),
        _createElementVNode("div", _hoisted_4, [
          _createVNode(_component_v_alert, {
            type: "warning",
            variant: "tonal",
            density: "compact",
            rounded: "lg",
            class: "text-caption mb-3"
          }, {
            default: _withCtx(() => [..._cache[18] || (_cache[18] = [
              _createTextVNode(" 默认强制校验「已完成 + 已入库」，保护标签与全局排除始终优先生效；修改规则后建议先执行干跑预览。 ", -1)
            ])]),
            _: 1
          }),
          _createVNode(_component_v_tabs, {
            modelValue: activeTab.value,
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => activeTab.value = $event),
            color: "primary",
            density: "compact",
            class: "mb-3",
            "show-arrows": ""
          }, {
            default: _withCtx(() => [
              _createVNode(_component_v_tab, {
                value: "general",
                "prepend-icon": "mdi-tune"
              }, {
                default: _withCtx(() => [..._cache[19] || (_cache[19] = [
                  _createTextVNode("全局与调度", -1)
                ])]),
                _: 1
              }),
              _createVNode(_component_v_tab, {
                value: "rules",
                "prepend-icon": "mdi-format-list-checks"
              }, {
                default: _withCtx(() => [
                  _cache[20] || (_cache[20] = _createTextVNode(" 清理规则 ", -1)),
                  _createVNode(_component_v_chip, {
                    size: "x-small",
                    class: "ml-2",
                    variant: "tonal"
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
                default: _withCtx(() => [..._cache[21] || (_cache[21] = [
                  _createTextVNode("低水位保盘", -1)
                ])]),
                _: 1
              })
            ]),
            _: 1
          }, 8, ["modelValue"]),
          _createVNode(_component_v_window, {
            modelValue: activeTab.value,
            "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => activeTab.value = $event)
          }, {
            default: _withCtx(() => [
              _createVNode(_component_v_window_item, { value: "general" }, {
                default: _withCtx(() => [
                  _createElementVNode("div", _hoisted_5, [
                    _createElementVNode("div", _hoisted_6, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-toggle-switch-outline",
                        size: "16",
                        color: "primary"
                      }),
                      _cache[22] || (_cache[22] = _createElementVNode("span", null, "运行开关", -1))
                    ]),
                    _createElementVNode("div", _hoisted_7, [
                      _createElementVNode("div", {
                        class: _normalizeClass(["seed-toggle-tile", { "is-active": config.value.enabled }])
                      }, [
                        _createElementVNode("div", _hoisted_8, [
                          _cache[23] || (_cache[23] = _createElementVNode("span", { class: "seed-toggle-tile__title" }, "启用定时巡检", -1)),
                          _createVNode(_component_v_switch, {
                            modelValue: config.value.enabled,
                            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => config.value.enabled = $event),
                            color: "primary",
                            inset: "",
                            density: "compact",
                            "hide-details": ""
                          }, null, 8, ["modelValue"])
                        ]),
                        _cache[24] || (_cache[24] = _createElementVNode("div", { class: "seed-toggle-tile__desc" }, "按 Cron 周期扫描已启用下载器的做种任务并执行淘汰策略", -1))
                      ], 2),
                      _createElementVNode("div", {
                        class: _normalizeClass(["seed-toggle-tile", { "is-active": config.value.notify }])
                      }, [
                        _createElementVNode("div", _hoisted_9, [
                          _cache[25] || (_cache[25] = _createElementVNode("span", { class: "seed-toggle-tile__title" }, "清理汇总通知", -1)),
                          _createVNode(_component_v_switch, {
                            modelValue: config.value.notify,
                            "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => config.value.notify = $event),
                            color: "primary",
                            inset: "",
                            density: "compact",
                            "hide-details": ""
                          }, null, 8, ["modelValue"])
                        ]),
                        _cache[26] || (_cache[26] = _createElementVNode("div", { class: "seed-toggle-tile__desc" }, "有种子被移除时通过系统通知渠道推送统计报告", -1))
                      ], 2),
                      _createElementVNode("div", {
                        class: _normalizeClass(["seed-toggle-tile", { "is-active": config.value.only_completed }])
                      }, [
                        _createElementVNode("div", _hoisted_10, [
                          _cache[27] || (_cache[27] = _createElementVNode("span", { class: "seed-toggle-tile__title" }, "仅清理已完成", -1)),
                          _createVNode(_component_v_switch, {
                            modelValue: config.value.only_completed,
                            "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => config.value.only_completed = $event),
                            color: "primary",
                            inset: "",
                            density: "compact",
                            "hide-details": ""
                          }, null, 8, ["modelValue"])
                        ]),
                        _cache[28] || (_cache[28] = _createElementVNode("div", { class: "seed-toggle-tile__desc" }, "强制跳过下载中或未完成进度 100% 的种子", -1))
                      ], 2)
                    ])
                  ]),
                  _createElementVNode("div", _hoisted_11, [
                    _createElementVNode("div", _hoisted_12, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-shield-lock-outline",
                        size: "16",
                        color: "primary"
                      }),
                      _cache[29] || (_cache[29] = _createElementVNode("span", null, "调度与全局保护", -1))
                    ]),
                    _createVNode(_component_v_row, {
                      dense: "",
                      class: "seed-form-grid"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_col, {
                          cols: "12",
                          md: "5"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_text_field, {
                              modelValue: config.value.cron,
                              "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => config.value.cron = $event),
                              label: "巡检 Cron（例如 */30 * * * *）",
                              "prepend-inner-icon": "mdi-clock-outline",
                              variant: "outlined",
                              density: "compact",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          md: "7"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_text_field, {
                              modelValue: config.value.global_exclude_regex,
                              "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => config.value.global_exclude_regex = $event),
                              label: "全局排除名称正则（大小写不敏感）",
                              placeholder: "例如：-(HDArea|EPiC|WiKi|FRDS)$",
                              "prepend-inner-icon": "mdi-regex",
                              variant: "outlined",
                              density: "compact",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          class: "mt-2"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_combobox, {
                              modelValue: config.value.protect_tags,
                              "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => config.value.protect_tags = $event),
                              multiple: "",
                              chips: "",
                              "closable-chips": "",
                              label: "全局保护标签（回车添加，命中永不删除）",
                              "prepend-inner-icon": "mdi-tag-multiple-outline",
                              variant: "outlined",
                              density: "compact",
                              "hide-details": ""
                            }, {
                              chip: _withCtx(({ props: chipProps, item }) => [
                                _createVNode(_component_v_chip, _mergeProps(chipProps, {
                                  size: "small",
                                  color: "primary",
                                  variant: "tonal",
                                  label: "",
                                  class: "seed-tag-chip"
                                }), {
                                  default: _withCtx(() => [
                                    _createTextVNode(_toDisplayString(item.raw), 1)
                                  ]),
                                  _: 2
                                }, 1040)
                              ]),
                              _: 1
                            }, 8, ["modelValue"])
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    })
                  ])
                ]),
                _: 1
              }),
              _createVNode(_component_v_window_item, { value: "rules" }, {
                default: _withCtx(() => [
                  _createElementVNode("div", _hoisted_13, [
                    _cache[31] || (_cache[31] = _createElementVNode("span", { class: "text-caption text-medium-emphasis" }, " 规则自上而下匹配，同一种子只命中一次；数值条件支持 AND / OR 切换。 ", -1)),
                    _createVNode(_component_v_btn, {
                      size: "small",
                      color: "primary",
                      variant: "tonal",
                      rounded: "lg",
                      "prepend-icon": "mdi-plus",
                      onClick: addRule
                    }, {
                      default: _withCtx(() => [..._cache[30] || (_cache[30] = [
                        _createTextVNode(" 添加规则 ", -1)
                      ])]),
                      _: 1
                    })
                  ]),
                  !config.value.rules.length ? (_openBlock(), _createElementBlock("div", _hoisted_14, [
                    _createVNode(_component_v_icon, {
                      icon: "mdi-format-list-checks",
                      size: "30",
                      class: "text-medium-emphasis mb-1"
                    }),
                    _cache[32] || (_cache[32] = _createElementVNode("div", { class: "text-body-2 font-weight-medium" }, "暂无清理规则", -1)),
                    _cache[33] || (_cache[33] = _createElementVNode("div", { class: "text-caption text-medium-emphasis" }, "可点击右上角「添加规则」，或在页面中导入预设模板", -1))
                  ])) : (_openBlock(), _createBlock(_component_v_expansion_panels, {
                    key: 1,
                    multiple: "",
                    variant: "accordion"
                  }, {
                    default: _withCtx(() => [
                      (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(config.value.rules, (rule, index) => {
                        return _openBlock(), _createBlock(_component_v_expansion_panel, {
                          key: rule.id,
                          class: "seed-rule-panel"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_expansion_panel_title, { class: "py-2" }, {
                              default: _withCtx(() => [
                                _createElementVNode("div", _hoisted_15, [
                                  _createVNode(_component_v_icon, {
                                    size: "18",
                                    color: rule.enabled ? "success" : "disabled"
                                  }, {
                                    default: _withCtx(() => [
                                      _createTextVNode(_toDisplayString(rule.enabled ? "mdi-check-circle" : "mdi-pause-circle"), 1)
                                    ]),
                                    _: 2
                                  }, 1032, ["color"]),
                                  _createElementVNode("span", _hoisted_16, _toDisplayString(index + 1) + ". " + _toDisplayString(rule.name), 1),
                                  _createElementVNode("span", _hoisted_17, _toDisplayString(rule.metric_logic === "any" ? "任一达标 OR" : "全部满足 AND"), 1),
                                  rule.require_transferred ? (_openBlock(), _createElementBlock("span", _hoisted_18, "入库锁")) : _createCommentVNode("", true),
                                  !rule.delete_files ? (_openBlock(), _createElementBlock("span", _hoisted_19, "保留源文件")) : _createCommentVNode("", true)
                                ])
                              ]),
                              _: 2
                            }, 1024),
                            _createVNode(_component_v_expansion_panel_text, null, {
                              default: _withCtx(() => [
                                _createVNode(_component_v_row, {
                                  dense: "",
                                  class: "pt-1"
                                }, {
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
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024),
                                    _createVNode(_component_v_col, {
                                      cols: "12",
                                      md: "4"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_select, {
                                          modelValue: rule.downloaders,
                                          "onUpdate:modelValue": ($event) => rule.downloaders = $event,
                                          items: downloaderOptions.value,
                                          loading: loadingDownloaders.value,
                                          multiple: "",
                                          chips: "",
                                          "closable-chips": "",
                                          clearable: "",
                                          "no-data-text": "暂无已启用下载器",
                                          label: "限定下载器（空为全部）",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, {
                                          chip: _withCtx(({ props: chipProps, item }) => [
                                            _createVNode(_component_v_chip, _mergeProps({ ref_for: true }, chipProps, {
                                              size: "x-small",
                                              color: "primary",
                                              variant: "tonal",
                                              label: ""
                                            }), {
                                              default: _withCtx(() => [
                                                _createTextVNode(_toDisplayString(item.raw), 1)
                                              ]),
                                              _: 2
                                            }, 1040)
                                          ]),
                                          _: 1
                                        }, 8, ["modelValue", "onUpdate:modelValue", "items", "loading"])
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
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024)
                                  ]),
                                  _: 2
                                }, 1024),
                                _createVNode(_component_v_row, {
                                  dense: "",
                                  class: "mt-2"
                                }, {
                                  default: _withCtx(() => [
                                    _createVNode(_component_v_col, {
                                      cols: "6",
                                      md: "3"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_switch, {
                                          modelValue: rule.enabled,
                                          "onUpdate:modelValue": ($event) => rule.enabled = $event,
                                          color: "primary",
                                          density: "compact",
                                          label: "启用规则",
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
                                          density: "compact",
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
                                          color: "primary",
                                          density: "compact",
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
                                          color: "primary",
                                          density: "compact",
                                          label: "允许未完成任务",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024)
                                  ]),
                                  _: 2
                                }, 1024),
                                _createVNode(_component_v_row, {
                                  dense: "",
                                  class: "mt-2"
                                }, {
                                  default: _withCtx(() => [
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
                                          density: "compact",
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
                                        _createVNode(_component_v_btn_toggle, {
                                          modelValue: rule.metric_logic,
                                          "onUpdate:modelValue": ($event) => rule.metric_logic = $event,
                                          mandatory: "",
                                          density: "compact",
                                          color: "primary",
                                          variant: "outlined",
                                          rounded: "lg",
                                          divided: "",
                                          class: "w-100"
                                        }, {
                                          default: _withCtx(() => [
                                            _createVNode(_component_v_btn, {
                                              value: "all",
                                              size: "small",
                                              class: "flex-1-1"
                                            }, {
                                              default: _withCtx(() => [..._cache[34] || (_cache[34] = [
                                                _createTextVNode("数值全部满足 AND", -1)
                                              ])]),
                                              _: 1
                                            }),
                                            _createVNode(_component_v_btn, {
                                              value: "any",
                                              size: "small",
                                              class: "flex-1-1"
                                            }, {
                                              default: _withCtx(() => [..._cache[35] || (_cache[35] = [
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
                                _createElementVNode("div", _hoisted_20, [
                                  _createVNode(_component_v_icon, {
                                    icon: "mdi-regex",
                                    size: "16"
                                  }),
                                  _cache[36] || (_cache[36] = _createElementVNode("span", null, "正则匹配条件", -1))
                                ]),
                                _createVNode(_component_v_row, { dense: "" }, {
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
                                          density: "compact",
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
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.exclude_name_regex,
                                          "onUpdate:modelValue": ($event) => rule.exclude_name_regex = $event,
                                          label: "种子名称排除正则",
                                          placeholder: "-(HDArea|EPiC|WiKi|FRDS)$",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024),
                                    _createVNode(_component_v_col, {
                                      cols: "12",
                                      md: "6",
                                      class: "mt-2"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.save_path_regex,
                                          "onUpdate:modelValue": ($event) => rule.save_path_regex = $event,
                                          label: "保存路径包含正则",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024),
                                    _createVNode(_component_v_col, {
                                      cols: "12",
                                      md: "6",
                                      class: "mt-2"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.exclude_save_path_regex,
                                          "onUpdate:modelValue": ($event) => rule.exclude_save_path_regex = $event,
                                          label: "保存路径排除正则",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024),
                                    _createVNode(_component_v_col, {
                                      cols: "12",
                                      md: "6",
                                      class: "mt-2"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.tracker_regex,
                                          "onUpdate:modelValue": ($event) => rule.tracker_regex = $event,
                                          label: "Tracker 包含正则",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024),
                                    _createVNode(_component_v_col, {
                                      cols: "12",
                                      md: "6",
                                      class: "mt-2"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.exclude_tracker_regex,
                                          "onUpdate:modelValue": ($event) => rule.exclude_tracker_regex = $event,
                                          label: "Tracker 排除正则",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024),
                                    _createVNode(_component_v_col, {
                                      cols: "12",
                                      class: "mt-2"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.tracker_msg_regex,
                                          "onUpdate:modelValue": ($event) => rule.tracker_msg_regex = $event,
                                          label: "Tracker 状态/报错正则",
                                          placeholder: "unregistered|not registered|torrent not found|deleted|banned|不存在|已删除",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024),
                                    _createVNode(_component_v_col, {
                                      cols: "12",
                                      md: "4",
                                      class: "mt-2"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.category_regex,
                                          "onUpdate:modelValue": ($event) => rule.category_regex = $event,
                                          label: "分类正则",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024),
                                    _createVNode(_component_v_col, {
                                      cols: "12",
                                      md: "4",
                                      class: "mt-2"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.tag_regex,
                                          "onUpdate:modelValue": ($event) => rule.tag_regex = $event,
                                          label: "标签包含正则",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024),
                                    _createVNode(_component_v_col, {
                                      cols: "12",
                                      md: "4",
                                      class: "mt-2"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.exclude_tag_regex,
                                          "onUpdate:modelValue": ($event) => rule.exclude_tag_regex = $event,
                                          label: "标签排除正则",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024)
                                  ]),
                                  _: 2
                                }, 1024),
                                _createElementVNode("div", _hoisted_21, [
                                  _createVNode(_component_v_icon, {
                                    icon: "mdi-chart-box-outline",
                                    size: "16"
                                  }),
                                  _cache[37] || (_cache[37] = _createElementVNode("span", null, "数值达标条件", -1))
                                ]),
                                _createVNode(_component_v_row, { dense: "" }, {
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
                                          density: "compact",
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
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.max_ratio,
                                          "onUpdate:modelValue": ($event) => rule.max_ratio = $event,
                                          modelModifiers: { number: true },
                                          type: "number",
                                          step: "0.1",
                                          label: "最大分享率",
                                          variant: "outlined",
                                          density: "compact",
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
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.min_seeding_hours,
                                          "onUpdate:modelValue": ($event) => rule.min_seeding_hours = $event,
                                          modelModifiers: { number: true },
                                          type: "number",
                                          label: "最少做种小时",
                                          variant: "outlined",
                                          density: "compact",
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
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.min_added_hours,
                                          "onUpdate:modelValue": ($event) => rule.min_added_hours = $event,
                                          modelModifiers: { number: true },
                                          type: "number",
                                          label: "最少添加小时",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024),
                                    _createVNode(_component_v_col, {
                                      cols: "6",
                                      md: "4",
                                      class: "mt-2"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.min_size_gb,
                                          "onUpdate:modelValue": ($event) => rule.min_size_gb = $event,
                                          modelModifiers: { number: true },
                                          type: "number",
                                          label: "最小体积 GB",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024),
                                    _createVNode(_component_v_col, {
                                      cols: "6",
                                      md: "4",
                                      class: "mt-2"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.max_size_gb,
                                          "onUpdate:modelValue": ($event) => rule.max_size_gb = $event,
                                          modelModifiers: { number: true },
                                          type: "number",
                                          label: "最大体积 GB",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024),
                                    _createVNode(_component_v_col, {
                                      cols: "12",
                                      md: "4",
                                      class: "mt-2"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_text_field, {
                                          modelValue: rule.max_upspeed_kbps,
                                          "onUpdate:modelValue": ($event) => rule.max_upspeed_kbps = $event,
                                          modelModifiers: { number: true },
                                          type: "number",
                                          label: "最大上传 KB/s（筛冷种）",
                                          variant: "outlined",
                                          density: "compact",
                                          "hide-details": ""
                                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                                      ]),
                                      _: 2
                                    }, 1024)
                                  ]),
                                  _: 2
                                }, 1024),
                                _createElementVNode("div", _hoisted_22, [
                                  _createVNode(_component_v_btn, {
                                    size: "small",
                                    variant: "text",
                                    rounded: "lg",
                                    "prepend-icon": "mdi-content-copy",
                                    onClick: ($event) => duplicateRule(index)
                                  }, {
                                    default: _withCtx(() => [..._cache[38] || (_cache[38] = [
                                      _createTextVNode(" 复制规则 ", -1)
                                    ])]),
                                    _: 1
                                  }, 8, ["onClick"]),
                                  _createVNode(_component_v_btn, {
                                    size: "small",
                                    color: "error",
                                    variant: "text",
                                    rounded: "lg",
                                    "prepend-icon": "mdi-delete-outline",
                                    onClick: ($event) => removeRule(index)
                                  }, {
                                    default: _withCtx(() => [..._cache[39] || (_cache[39] = [
                                      _createTextVNode(" 删除规则 ", -1)
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
                  _createElementVNode("div", _hoisted_23, [
                    _createElementVNode("div", _hoisted_24, [
                      _createElementVNode("div", _hoisted_25, [
                        _createVNode(_component_v_icon, {
                          icon: "mdi-shield-half-full",
                          color: "warning",
                          size: "20"
                        }),
                        _cache[40] || (_cache[40] = _createElementVNode("div", null, [
                          _createElementVNode("div", { class: "text-subtitle-2 font-weight-bold" }, "磁盘低水位应急保盘"),
                          _createElementVNode("div", { class: "text-caption text-medium-emphasis" }, " 仅在剩余空间低于阈值时启动，仍强制校验已完成、已入库、无保护标签与最低保护时长。 ")
                        ], -1))
                      ]),
                      _createVNode(_component_v_switch, {
                        modelValue: config.value.disk_guard.enabled,
                        "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => config.value.disk_guard.enabled = $event),
                        color: "primary",
                        density: "compact",
                        label: "启用保盘",
                        "hide-details": ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _createVNode(_component_v_row, {
                      dense: "",
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
                              "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => config.value.disk_guard.free_space_threshold_gb = $event),
                              modelModifiers: { number: true },
                              type: "number",
                              min: "0",
                              label: "触发阈值：剩余空间低于 GB",
                              variant: "outlined",
                              density: "compact",
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
                              modelValue: config.value.disk_guard.target_free_space_gb,
                              "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => config.value.disk_guard.target_free_space_gb = $event),
                              modelModifiers: { number: true },
                              type: "number",
                              min: "0",
                              label: "恢复目标：预计剩余空间达到 GB",
                              variant: "outlined",
                              density: "compact",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          md: "6",
                          class: "mt-2"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_text_field, {
                              modelValue: config.value.disk_guard.min_protect_hours,
                              "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => config.value.disk_guard.min_protect_hours = $event),
                              modelModifiers: { number: true },
                              type: "number",
                              min: "0",
                              label: "最低做种保护时长（小时）",
                              variant: "outlined",
                              density: "compact",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          md: "6",
                          class: "mt-2"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_select, {
                              modelValue: config.value.disk_guard.sort_by,
                              "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => config.value.disk_guard.sort_by = $event),
                              items: sortItems,
                              label: "淘汰排序策略",
                              variant: "outlined",
                              density: "compact",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        _createVNode(_component_v_col, {
                          cols: "12",
                          class: "mt-2"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_switch, {
                              modelValue: config.value.disk_guard.delete_files,
                              "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => config.value.disk_guard.delete_files = $event),
                              color: "error",
                              density: "compact",
                              label: "应急淘汰时连同源文件删除（关闭则仅移除任务）",
                              "hide-details": ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    }, 8, ["class"])
                  ])
                ]),
                _: 1
              })
            ]),
            _: 1
          }, 8, ["modelValue"])
        ]),
        _createElementVNode("div", _hoisted_26, [
          !props.embedded ? (_openBlock(), _createBlock(_component_v_btn, {
            key: 0,
            size: "small",
            variant: "outlined",
            rounded: "lg",
            "prepend-icon": "mdi-database-eye-outline",
            onClick: _cache[15] || (_cache[15] = ($event) => emit("switch"))
          }, {
            default: _withCtx(() => [..._cache[41] || (_cache[41] = [
              _createTextVNode(" 查看数据 ", -1)
            ])]),
            _: 1
          })) : _createCommentVNode("", true),
          _createVNode(_component_v_spacer),
          _createVNode(_component_v_btn, {
            size: "small",
            variant: "text",
            rounded: "lg",
            onClick: _cache[16] || (_cache[16] = ($event) => emit("close"))
          }, {
            default: _withCtx(() => [..._cache[42] || (_cache[42] = [
              _createTextVNode("取消", -1)
            ])]),
            _: 1
          }),
          _createVNode(_component_v_btn, {
            size: "small",
            color: "primary",
            variant: "flat",
            rounded: "lg",
            onClick: saveConfig
          }, {
            default: _withCtx(() => [..._cache[43] || (_cache[43] = [
              _createTextVNode("保存", -1)
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

const Config = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-2e0e6ee8"]]);

export { _export_sfc as _, Config as default };
