import { importShared } from './__federation_fn_import-JrT3xvdd.js';
import Config, { _ as _export_sfc } from './__federation_expose_Config-BTY7e3Dd.js';

function formatSingleLineTime(value) {
  if (!value) return "-";
  return String(value).replace(/\s+/g, " ").trim();
}

const {defineComponent:_defineComponent$1} = await importShared('vue');

const {resolveComponent:_resolveComponent$1,createVNode:_createVNode$1,toDisplayString:_toDisplayString$1,createElementVNode:_createElementVNode$1,withCtx:_withCtx$1,unref:_unref$1,createTextVNode:_createTextVNode$1,openBlock:_openBlock$1,createBlock:_createBlock$1,createCommentVNode:_createCommentVNode$1,renderList:_renderList$1,Fragment:_Fragment$1,createElementBlock:_createElementBlock$1} = await importShared('vue');

const _hoisted_1$1 = { class: "dry-run-page" };
const _hoisted_2$1 = { class: "min-w-0" };
const _hoisted_3$1 = { class: "single-line-time" };
const _hoisted_4$1 = { class: "content-section" };
const _hoisted_5$1 = { class: "section-heading" };
const _hoisted_6$1 = { class: "heading-left" };
const _hoisted_7$1 = { class: "d-flex align-center flex-wrap ga-2" };
const _hoisted_8$1 = { class: "filter-grid" };
const _hoisted_9$1 = { class: "filter-summary" };
const _hoisted_10$1 = { class: "torrent-cell" };
const _hoisted_11$1 = ["title"];
const _hoisted_12$1 = { class: "nowrap-text" };
const _hoisted_13$1 = { class: "nowrap-num" };
const _hoisted_14$1 = { class: "nowrap-num" };
const _hoisted_15$1 = ["title"];
const _hoisted_16$1 = ["title"];
const _hoisted_17$1 = {
  key: 0,
  class: "empty-state"
};
const _hoisted_18$1 = {
  key: 1,
  class: "empty-state"
};
const _hoisted_19$1 = { class: "placeholder-body" };
const _hoisted_20$1 = { class: "d-flex flex-wrap ga-3 mt-4" };
const {computed: computed$1,ref: ref$1,watch: watch$1} = await importShared('vue');
const _sfc_main$1 = /* @__PURE__ */ _defineComponent$1({
  __name: "DryRunPage",
  props: {
    preview: {},
    lastRunAt: {},
    working: {},
    enabledRuleCount: {},
    guardEnabled: { type: Boolean }
  },
  emits: ["back", "dry-run", "open-settings", "open-templates", "open-regex"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const keyword = ref$1("");
    const selectedDownloader = ref$1("all");
    const selectedRule = ref$1("all");
    const previewItems = computed$1(() => props.preview?.candidates || []);
    const previewSize = computed$1(() => Number(props.preview?.total_size_gb || 0));
    const downloaderOptions = computed$1(() => {
      const names = Array.from(new Set(previewItems.value.map((item) => item.downloader).filter(Boolean)));
      return [{ title: "全部下载器", value: "all" }, ...names.map((name) => ({ title: name, value: name }))];
    });
    const ruleOptions = computed$1(() => {
      const names = Array.from(new Set(previewItems.value.map((item) => item.rule_name).filter(Boolean)));
      return [{ title: "全部命中规则", value: "all" }, ...names.map((name) => ({ title: name, value: name }))];
    });
    const matchedDownloaderCount = computed$1(() => {
      return new Set(previewItems.value.map((item) => item.downloader).filter(Boolean)).size;
    });
    watch$1(
      () => props.preview,
      () => {
        if (selectedDownloader.value !== "all" && !downloaderOptions.value.some((opt) => opt.value === selectedDownloader.value)) {
          selectedDownloader.value = "all";
        }
        if (selectedRule.value !== "all" && !ruleOptions.value.some((opt) => opt.value === selectedRule.value)) {
          selectedRule.value = "all";
        }
      }
    );
    const filteredItems = computed$1(() => {
      const term = keyword.value.trim().toLowerCase();
      return previewItems.value.filter((item) => {
        if (selectedDownloader.value !== "all" && item.downloader !== selectedDownloader.value) return false;
        if (selectedRule.value !== "all" && item.rule_name !== selectedRule.value) return false;
        if (!term) return true;
        return String(item.name || "").toLowerCase().includes(term) || String(item.rule_name || "").toLowerCase().includes(term) || String(item.reason || "").toLowerCase().includes(term) || String(item.downloader || "").toLowerCase().includes(term);
      });
    });
    const filteredSizeGb = computed$1(
      () => filteredItems.value.reduce((acc, item) => acc + Number(item.size_gb || 0), 0)
    );
    const hasActiveFilter = computed$1(
      () => Boolean(keyword.value.trim()) || selectedDownloader.value !== "all" || selectedRule.value !== "all"
    );
    function resetFilters() {
      keyword.value = "";
      selectedDownloader.value = "all";
      selectedRule.value = "all";
    }
    const previewHeaders = [
      {
        title: "种子",
        key: "name",
        headerProps: { class: "col-torrent-head" },
        cellProps: { class: "col-torrent" }
      },
      {
        title: "下载器",
        key: "downloader",
        width: "124px",
        minWidth: "110px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap" }
      },
      {
        title: "体积",
        key: "size_gb",
        width: "108px",
        minWidth: "100px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap col-num" }
      },
      {
        title: "分享率",
        key: "ratio",
        width: "90px",
        minWidth: "86px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap col-num" }
      },
      {
        title: "做种时长",
        key: "seeding_hours",
        width: "112px",
        minWidth: "104px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap col-num" }
      },
      {
        title: "命中规则",
        key: "rule_name",
        width: "164px",
        minWidth: "140px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-rule" }
      },
      {
        title: "命中原因",
        key: "reason",
        width: "270px",
        minWidth: "230px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-reason" }
      }
    ];
    return (_ctx, _cache) => {
      const _component_v_icon = _resolveComponent$1("v-icon");
      const _component_v_card = _resolveComponent$1("v-card");
      const _component_v_col = _resolveComponent$1("v-col");
      const _component_v_row = _resolveComponent$1("v-row");
      const _component_v_chip = _resolveComponent$1("v-chip");
      const _component_v_btn = _resolveComponent$1("v-btn");
      const _component_v_alert = _resolveComponent$1("v-alert");
      const _component_v_text_field = _resolveComponent$1("v-text-field");
      const _component_v_select = _resolveComponent$1("v-select");
      const _component_v_data_table = _resolveComponent$1("v-data-table");
      const _component_v_avatar = _resolveComponent$1("v-avatar");
      return _openBlock$1(), _createElementBlock$1("div", _hoisted_1$1, [
        _createVNode$1(_component_v_row, { class: "summary-row" }, {
          default: _withCtx$1(() => [
            _createVNode$1(_component_v_col, {
              cols: "6",
              md: "3"
            }, {
              default: _withCtx$1(() => [
                _createVNode$1(_component_v_card, {
                  class: "metric-card",
                  variant: "tonal"
                }, {
                  default: _withCtx$1(() => [
                    _createVNode$1(_component_v_icon, {
                      color: "info",
                      icon: "mdi-eye-check-outline"
                    }),
                    _createElementVNode$1("div", null, [
                      _createElementVNode$1("strong", null, _toDisplayString$1(__props.preview ? previewItems.value.length : "-"), 1),
                      _cache[8] || (_cache[8] = _createElementVNode$1("span", null, "命中种子", -1))
                    ])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createVNode$1(_component_v_col, {
              cols: "6",
              md: "3"
            }, {
              default: _withCtx$1(() => [
                _createVNode$1(_component_v_card, {
                  class: "metric-card",
                  variant: "tonal"
                }, {
                  default: _withCtx$1(() => [
                    _createVNode$1(_component_v_icon, {
                      color: "primary",
                      icon: "mdi-database-remove-outline"
                    }),
                    _createElementVNode$1("div", null, [
                      _createElementVNode$1("strong", null, _toDisplayString$1(__props.preview ? `${previewSize.value.toFixed(2)} GB` : "-"), 1),
                      _cache[9] || (_cache[9] = _createElementVNode$1("span", null, "预计释放空间", -1))
                    ])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createVNode$1(_component_v_col, {
              cols: "6",
              md: "3"
            }, {
              default: _withCtx$1(() => [
                _createVNode$1(_component_v_card, {
                  class: "metric-card",
                  variant: "tonal"
                }, {
                  default: _withCtx$1(() => [
                    _createVNode$1(_component_v_icon, {
                      color: "warning",
                      icon: "mdi-download-network-outline"
                    }),
                    _createElementVNode$1("div", null, [
                      _createElementVNode$1("strong", null, _toDisplayString$1(__props.preview ? matchedDownloaderCount.value : "-"), 1),
                      _createElementVNode$1("span", null, "涉及下载器（" + _toDisplayString$1(__props.enabledRuleCount) + " 规则" + _toDisplayString$1(__props.guardEnabled ? " + 保盘" : "") + "）", 1)
                    ])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createVNode$1(_component_v_col, {
              cols: "6",
              md: "3"
            }, {
              default: _withCtx$1(() => [
                _createVNode$1(_component_v_card, {
                  class: "metric-card",
                  variant: "tonal"
                }, {
                  default: _withCtx$1(() => [
                    _createVNode$1(_component_v_icon, {
                      color: "success",
                      icon: "mdi-clock-check-outline"
                    }),
                    _createElementVNode$1("div", _hoisted_2$1, [
                      _createElementVNode$1("strong", _hoisted_3$1, _toDisplayString$1(__props.lastRunAt ? _unref$1(formatSingleLineTime)(__props.lastRunAt) : "尚未执行"), 1),
                      _cache[10] || (_cache[10] = _createElementVNode$1("span", null, "最近预览时间", -1))
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
        _createElementVNode$1("section", _hoisted_4$1, [
          _createElementVNode$1("div", _hoisted_5$1, [
            _createElementVNode$1("div", _hoisted_6$1, [
              _createVNode$1(_component_v_icon, { icon: "mdi-test-tube" }),
              _cache[11] || (_cache[11] = _createElementVNode$1("span", null, "模拟干跑预览", -1)),
              __props.preview ? (_openBlock$1(), _createBlock$1(_component_v_chip, {
                key: 0,
                size: "small",
                color: "primary",
                variant: "tonal"
              }, {
                default: _withCtx$1(() => [
                  _createTextVNode$1(" 命中 " + _toDisplayString$1(previewItems.value.length) + " 项 · " + _toDisplayString$1(previewSize.value.toFixed(2)) + " GB ", 1)
                ]),
                _: 1
              })) : _createCommentVNode$1("", true),
              _cache[12] || (_cache[12] = _createElementVNode$1("span", { class: "text-caption text-medium-emphasis" }, "仅模拟规则匹配，不会执行任何删除操作", -1))
            ]),
            _createElementVNode$1("div", _hoisted_7$1, [
              _createVNode$1(_component_v_btn, {
                size: "small",
                variant: "text",
                "prepend-icon": "mdi-regex",
                onClick: _cache[0] || (_cache[0] = ($event) => emit("open-regex"))
              }, {
                default: _withCtx$1(() => [..._cache[13] || (_cache[13] = [
                  _createTextVNode$1("正则测试", -1)
                ])]),
                _: 1
              }),
              _createVNode$1(_component_v_btn, {
                size: "small",
                variant: "text",
                "prepend-icon": "mdi-view-grid-plus",
                onClick: _cache[1] || (_cache[1] = ($event) => emit("open-templates"))
              }, {
                default: _withCtx$1(() => [..._cache[14] || (_cache[14] = [
                  _createTextVNode$1("预设模板", -1)
                ])]),
                _: 1
              })
            ])
          ]),
          __props.preview?.errors?.length ? (_openBlock$1(), _createBlock$1(_component_v_alert, {
            key: 0,
            type: "warning",
            variant: "tonal",
            class: "mb-3"
          }, {
            default: _withCtx$1(() => [
              (_openBlock$1(true), _createElementBlock$1(_Fragment$1, null, _renderList$1(__props.preview.errors, (error) => {
                return _openBlock$1(), _createElementBlock$1("div", { key: error }, _toDisplayString$1(error), 1);
              }), 128))
            ]),
            _: 1
          })) : _createCommentVNode$1("", true),
          __props.preview && previewItems.value.length ? (_openBlock$1(), _createBlock$1(_component_v_card, {
            key: 1,
            variant: "outlined",
            class: "filter-bar mb-3"
          }, {
            default: _withCtx$1(() => [
              _createElementVNode$1("div", _hoisted_8$1, [
                _createVNode$1(_component_v_text_field, {
                  modelValue: keyword.value,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => keyword.value = $event),
                  density: "compact",
                  variant: "outlined",
                  "hide-details": "",
                  clearable: "",
                  "prepend-inner-icon": "mdi-magnify",
                  placeholder: "搜索种子名称、命中规则或原因...",
                  class: "filter-search"
                }, null, 8, ["modelValue"]),
                _createVNode$1(_component_v_select, {
                  modelValue: selectedDownloader.value,
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => selectedDownloader.value = $event),
                  items: downloaderOptions.value,
                  density: "compact",
                  variant: "outlined",
                  "hide-details": "",
                  class: "filter-select"
                }, null, 8, ["modelValue", "items"]),
                _createVNode$1(_component_v_select, {
                  modelValue: selectedRule.value,
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => selectedRule.value = $event),
                  items: ruleOptions.value,
                  density: "compact",
                  variant: "outlined",
                  "hide-details": "",
                  class: "filter-select"
                }, null, 8, ["modelValue", "items"]),
                _createElementVNode$1("div", _hoisted_9$1, [
                  _createElementVNode$1("span", null, [
                    _cache[15] || (_cache[15] = _createTextVNode$1(" 当前显示 ", -1)),
                    _createElementVNode$1("strong", null, _toDisplayString$1(filteredItems.value.length), 1),
                    _createTextVNode$1(" / " + _toDisplayString$1(previewItems.value.length) + " 项 （" + _toDisplayString$1(filteredSizeGb.value.toFixed(2)) + " GB） ", 1)
                  ]),
                  hasActiveFilter.value ? (_openBlock$1(), _createBlock$1(_component_v_btn, {
                    key: 0,
                    size: "x-small",
                    variant: "text",
                    color: "primary",
                    onClick: resetFilters
                  }, {
                    default: _withCtx$1(() => [..._cache[16] || (_cache[16] = [
                      _createTextVNode$1(" 重置筛选 ", -1)
                    ])]),
                    _: 1
                  })) : _createCommentVNode$1("", true)
                ])
              ])
            ]),
            _: 1
          })) : _createCommentVNode$1("", true),
          __props.preview ? (_openBlock$1(), _createBlock$1(_component_v_card, {
            key: 2,
            variant: "outlined",
            class: "table-card"
          }, {
            default: _withCtx$1(() => [
              _createVNode$1(_component_v_data_table, {
                headers: previewHeaders,
                items: filteredItems.value,
                "item-value": "hash",
                density: "comfortable",
                "items-per-page": 20,
                "items-per-page-options": [10, 20, 50, 100],
                hover: ""
              }, {
                "item.name": _withCtx$1(({ item }) => [
                  _createElementVNode$1("div", _hoisted_10$1, [
                    _createElementVNode$1("div", {
                      class: "torrent-name",
                      title: item.name
                    }, _toDisplayString$1(item.name), 9, _hoisted_11$1),
                    !item.delete_files ? (_openBlock$1(), _createBlock$1(_component_v_chip, {
                      key: 0,
                      size: "x-small",
                      variant: "tonal",
                      class: "keep-file-chip"
                    }, {
                      default: _withCtx$1(() => [..._cache[17] || (_cache[17] = [
                        _createTextVNode$1(" 保留源文件 ", -1)
                      ])]),
                      _: 1
                    })) : _createCommentVNode$1("", true)
                  ])
                ]),
                "item.downloader": _withCtx$1(({ item }) => [
                  _createElementVNode$1("span", _hoisted_12$1, _toDisplayString$1(item.downloader), 1)
                ]),
                "item.size_gb": _withCtx$1(({ item }) => [
                  _createElementVNode$1("span", _hoisted_13$1, _toDisplayString$1(Number(item.size_gb || 0).toFixed(2)) + " GB", 1)
                ]),
                "item.ratio": _withCtx$1(({ item }) => [
                  _createVNode$1(_component_v_chip, {
                    size: "small",
                    variant: "tonal",
                    class: "nowrap-num"
                  }, {
                    default: _withCtx$1(() => [
                      _createTextVNode$1(_toDisplayString$1(Number(item.ratio || 0).toFixed(2)), 1)
                    ]),
                    _: 2
                  }, 1024)
                ]),
                "item.seeding_hours": _withCtx$1(({ item }) => [
                  _createElementVNode$1("span", _hoisted_14$1, _toDisplayString$1(Number(item.seeding_hours || 0).toFixed(1)) + " h", 1)
                ]),
                "item.rule_name": _withCtx$1(({ item }) => [
                  _createElementVNode$1("span", {
                    class: "rule-name-text",
                    title: item.rule_name
                  }, _toDisplayString$1(item.rule_name), 9, _hoisted_15$1)
                ]),
                "item.reason": _withCtx$1(({ item }) => [
                  _createElementVNode$1("span", {
                    class: "reason-text",
                    title: item.reason
                  }, _toDisplayString$1(item.reason), 9, _hoisted_16$1)
                ]),
                "no-data": _withCtx$1(() => [
                  hasActiveFilter.value ? (_openBlock$1(), _createElementBlock$1("div", _hoisted_17$1, [
                    _createVNode$1(_component_v_icon, {
                      size: "40",
                      icon: "mdi-filter-off-outline",
                      color: "primary"
                    }),
                    _cache[19] || (_cache[19] = _createElementVNode$1("strong", null, "没有匹配筛选条件的候选种子", -1)),
                    _createVNode$1(_component_v_btn, {
                      size: "small",
                      variant: "tonal",
                      color: "primary",
                      onClick: resetFilters
                    }, {
                      default: _withCtx$1(() => [..._cache[18] || (_cache[18] = [
                        _createTextVNode$1("清空筛选条件", -1)
                      ])]),
                      _: 1
                    })
                  ])) : (_openBlock$1(), _createElementBlock$1("div", _hoisted_18$1, [
                    _createVNode$1(_component_v_icon, {
                      size: "44",
                      icon: "mdi-shield-check",
                      color: "success"
                    }),
                    _cache[20] || (_cache[20] = _createElementVNode$1("strong", null, "没有种子命中清理条件", -1)),
                    _cache[21] || (_cache[21] = _createElementVNode$1("span", null, "当前配置下所有做种任务均处于安全保留状态，无需删除。", -1))
                  ]))
                ]),
                _: 1
              }, 8, ["items"])
            ]),
            _: 1
          })) : (_openBlock$1(), _createBlock$1(_component_v_card, {
            key: 3,
            variant: "outlined",
            class: "preview-placeholder"
          }, {
            default: _withCtx$1(() => [
              _createVNode$1(_component_v_avatar, {
                size: "68",
                color: "primary",
                variant: "tonal"
              }, {
                default: _withCtx$1(() => [
                  _createVNode$1(_component_v_icon, {
                    size: "36",
                    icon: "mdi-clipboard-search-outline"
                  })
                ]),
                _: 1
              }),
              _createElementVNode$1("div", _hoisted_19$1, [
                _cache[25] || (_cache[25] = _createElementVNode$1("strong", null, "先模拟干跑，再安全清理", -1)),
                _cache[26] || (_cache[26] = _createElementVNode$1("p", null, " 干跑预览会实时读取全部启用下载器的任务快照，完整检验全局保护标签、入库锁、多维规则与低水位保盘策略，列出每个命中种子的体积、分享率、做种时长及具体原因，绝不会调用删除接口。 ", -1)),
                _createElementVNode$1("div", _hoisted_20$1, [
                  _createVNode$1(_component_v_btn, {
                    color: "primary",
                    "prepend-icon": "mdi-play-outline",
                    loading: __props.working === "dry",
                    onClick: _cache[5] || (_cache[5] = ($event) => emit("dry-run"))
                  }, {
                    default: _withCtx$1(() => [..._cache[22] || (_cache[22] = [
                      _createTextVNode$1(" 开始模拟干跑 ", -1)
                    ])]),
                    _: 1
                  }, 8, ["loading"]),
                  _createVNode$1(_component_v_btn, {
                    variant: "outlined",
                    "prepend-icon": "mdi-tune",
                    onClick: _cache[6] || (_cache[6] = ($event) => emit("open-settings"))
                  }, {
                    default: _withCtx$1(() => [..._cache[23] || (_cache[23] = [
                      _createTextVNode$1("调整清理规则", -1)
                    ])]),
                    _: 1
                  }),
                  _createVNode$1(_component_v_btn, {
                    variant: "text",
                    "prepend-icon": "mdi-arrow-left",
                    onClick: _cache[7] || (_cache[7] = ($event) => emit("back"))
                  }, {
                    default: _withCtx$1(() => [..._cache[24] || (_cache[24] = [
                      _createTextVNode$1("返回运行概览", -1)
                    ])]),
                    _: 1
                  })
                ])
              ])
            ]),
            _: 1
          }))
        ])
      ]);
    };
  }
});

const DryRunPage = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-0dedd986"]]);

const {defineComponent:_defineComponent} = await importShared('vue');

const {resolveComponent:_resolveComponent,openBlock:_openBlock,createBlock:_createBlock,createCommentVNode:_createCommentVNode,createVNode:_createVNode,withCtx:_withCtx,createElementVNode:_createElementVNode,normalizeClass:_normalizeClass,toDisplayString:_toDisplayString,createElementBlock:_createElementBlock,createTextVNode:_createTextVNode,renderList:_renderList,Fragment:_Fragment,unref:_unref} = await importShared('vue');

const _hoisted_1 = { class: "seed-page" };
const _hoisted_2 = { class: "hero-card" };
const _hoisted_3 = { class: "hero-main" };
const _hoisted_4 = { class: "hero-heading" };
const _hoisted_5 = {
  class: "page-switch",
  "aria-label": "保种管家页面切换"
};
const _hoisted_6 = {
  key: 0,
  class: "switch-badge"
};
const _hoisted_7 = { class: "hero-actions" };
const _hoisted_8 = { class: "content-section" };
const _hoisted_9 = { class: "section-heading" };
const _hoisted_10 = { class: "d-flex align-center justify-space-between mb-3" };
const _hoisted_11 = { class: "d-flex align-center ga-2" };
const _hoisted_12 = { class: "text-caption text-medium-emphasis" };
const _hoisted_13 = { class: "d-flex justify-space-between text-body-2 mb-1" };
const _hoisted_14 = { class: "downloader-stats" };
const _hoisted_15 = { class: "d-flex justify-space-between mt-3 text-caption text-medium-emphasis" };
const _hoisted_16 = { class: "content-section" };
const _hoisted_17 = { class: "section-heading" };
const _hoisted_18 = { class: "d-flex align-center flex-wrap ga-2" };
const _hoisted_19 = { class: "time-text" };
const _hoisted_20 = { class: "torrent-cell" };
const _hoisted_21 = ["title"];
const _hoisted_22 = ["title"];
const _hoisted_23 = { class: "nowrap-text" };
const _hoisted_24 = { class: "nowrap-num" };
const _hoisted_25 = ["title"];
const _hoisted_26 = { class: "empty-state compact" };
const _hoisted_27 = { class: "d-flex align-center ga-2 mb-2" };
const _hoisted_28 = {
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
    function resolvePageFromNavKey(navKey) {
      return navKey === "preview" || navKey === "dry-run" ? "preview" : "overview";
    }
    function currentTimestamp() {
      const now = /* @__PURE__ */ new Date();
      const pad = (num) => String(num).padStart(2, "0");
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }
    const activePage = ref(resolvePageFromNavKey(props.navKey));
    const loading = ref(false);
    const working = ref("");
    const config = ref({ rules: [], disk_guard: {} });
    const downloaders = ref([]);
    const collectionErrors = ref([]);
    const preview = ref(null);
    const lastPreviewTime = ref("");
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
    watch(
      () => props.navKey,
      (nextKey) => {
        activePage.value = resolvePageFromNavKey(nextKey);
      }
    );
    const previewItems = computed(() => preview.value?.candidates || []);
    const enabledRuleCount = computed(() => (config.value.rules || []).filter((rule) => rule.enabled).length);
    const guardEnabled = computed(() => Boolean(config.value.disk_guard?.enabled));
    const historyHeaders = [
      {
        title: "时间",
        key: "time",
        width: "188px",
        minWidth: "188px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap col-time" }
      },
      {
        title: "结果",
        key: "status",
        width: "88px",
        minWidth: "88px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap" }
      },
      {
        title: "种子",
        key: "name",
        headerProps: { class: "col-torrent-head" },
        cellProps: { class: "col-torrent" }
      },
      {
        title: "下载器",
        key: "downloader",
        width: "128px",
        minWidth: "112px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap" }
      },
      {
        title: "体积",
        key: "size_gb",
        width: "110px",
        minWidth: "102px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap col-num" }
      },
      {
        title: "规则",
        key: "rule_name",
        width: "168px",
        minWidth: "140px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-rule" }
      }
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
      activePage.value = "preview";
      working.value = "dry";
      try {
        const response = await props.api.post(`plugin/${props.pluginId}/dry-run`, {});
        preview.value = response?.data || { candidates: [], errors: [response?.message || "干跑失败"] };
        lastPreviewTime.value = currentTimestamp();
        if (response?.success) notify(`干跑完成：命中 ${preview.value.candidate_count || 0} 个种子`, "info");
        else notify(response?.message || "干跑失败", "error");
      } catch (error) {
        notify(responseMessage(error), "error");
      } finally {
        working.value = "";
      }
    }
    function openDryRunPage(autoRunIfEmpty = false) {
      activePage.value = "preview";
      if (autoRunIfEmpty && !preview.value && working.value !== "dry") {
        void dryRun();
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
        lastPreviewTime.value = "";
        activePage.value = "overview";
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
        if (generation === regexGeneration)
          regexResult.value = { valid: false, matched: false, error: responseMessage(error) };
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
            _createElementVNode("div", _hoisted_4, [
              _createVNode(_component_v_avatar, {
                size: "52",
                color: "primary",
                variant: "tonal"
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_icon, {
                    size: "28",
                    icon: "mdi-broom"
                  })
                ]),
                _: 1
              }),
              _cache[28] || (_cache[28] = _createElementVNode("div", null, [
                _createElementVNode("div", { class: "text-h5 font-weight-bold" }, "保种删种管家"),
                _createElementVNode("div", { class: "text-body-2 text-medium-emphasis" }, "安全规则 · 正则筛选 · 干跑预览 · 磁盘低水位保盘")
              ], -1))
            ]),
            _createElementVNode("nav", _hoisted_5, [
              _createElementVNode("button", {
                type: "button",
                class: _normalizeClass(["page-switch-btn", { active: activePage.value === "overview" }]),
                onClick: _cache[0] || (_cache[0] = ($event) => activePage.value = "overview")
              }, [
                _createVNode(_component_v_icon, {
                  size: "18",
                  icon: "mdi-view-dashboard-outline"
                }),
                _cache[29] || (_cache[29] = _createElementVNode("span", null, "运行概览", -1))
              ], 2),
              _createElementVNode("button", {
                type: "button",
                class: _normalizeClass(["page-switch-btn", { active: activePage.value === "preview" }]),
                onClick: _cache[1] || (_cache[1] = ($event) => openDryRunPage(false))
              }, [
                _createVNode(_component_v_icon, {
                  size: "18",
                  icon: "mdi-test-tube"
                }),
                _cache[30] || (_cache[30] = _createElementVNode("span", null, "干跑预览", -1)),
                preview.value ? (_openBlock(), _createElementBlock("span", _hoisted_6, _toDisplayString(previewItems.value.length), 1)) : _createCommentVNode("", true)
              ], 2)
            ])
          ]),
          _createElementVNode("div", _hoisted_7, [
            _createVNode(_component_v_btn, {
              variant: "text",
              icon: "mdi-refresh",
              loading: loading.value,
              title: "刷新数据",
              onClick: refreshAll
            }, null, 8, ["loading"]),
            _createVNode(_component_v_btn, {
              variant: "outlined",
              "prepend-icon": "mdi-tune",
              onClick: _cache[2] || (_cache[2] = ($event) => settingsDialog.value = true)
            }, {
              default: _withCtx(() => [..._cache[31] || (_cache[31] = [
                _createTextVNode("规则配置", -1)
              ])]),
              _: 1
            }),
            activePage.value === "overview" ? (_openBlock(), _createBlock(_component_v_btn, {
              key: 0,
              color: "primary",
              variant: "tonal",
              "prepend-icon": "mdi-eye-outline",
              loading: working.value === "dry",
              onClick: _cache[3] || (_cache[3] = ($event) => openDryRunPage(true))
            }, {
              default: _withCtx(() => [..._cache[32] || (_cache[32] = [
                _createTextVNode(" 干跑预览 ", -1)
              ])]),
              _: 1
            }, 8, ["loading"])) : (_openBlock(), _createBlock(_component_v_btn, {
              key: 1,
              color: "primary",
              variant: "tonal",
              "prepend-icon": "mdi-play-outline",
              loading: working.value === "dry",
              onClick: dryRun
            }, {
              default: _withCtx(() => [
                _createTextVNode(_toDisplayString(preview.value ? "重新干跑" : "开始干跑"), 1)
              ]),
              _: 1
            }, 8, ["loading"])),
            _createVNode(_component_v_btn, {
              color: "error",
              "prepend-icon": "mdi-play",
              loading: working.value === "run",
              onClick: _cache[4] || (_cache[4] = ($event) => runDialog.value = true)
            }, {
              default: _withCtx(() => [..._cache[33] || (_cache[33] = [
                _createTextVNode(" 立即清理 ", -1)
              ])]),
              _: 1
            }, 8, ["loading"])
          ])
        ]),
        activePage.value === "overview" ? (_openBlock(), _createElementBlock(_Fragment, { key: 1 }, [
          _createVNode(_component_v_row, { class: "summary-row" }, {
            default: _withCtx(() => [
              _createVNode(_component_v_col, {
                cols: "6",
                md: "3"
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_card, {
                    class: "metric-card clickable-card",
                    variant: "tonal",
                    onClick: _cache[5] || (_cache[5] = ($event) => settingsDialog.value = true)
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_icon, {
                        color: "primary",
                        icon: "mdi-format-list-checks"
                      }),
                      _createElementVNode("div", null, [
                        _createElementVNode("strong", null, _toDisplayString(enabledRuleCount.value), 1),
                        _cache[34] || (_cache[34] = _createElementVNode("span", null, "启用规则", -1))
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
                    class: "metric-card clickable-card",
                    variant: "tonal",
                    onClick: _cache[6] || (_cache[6] = ($event) => openDryRunPage(false))
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_icon, {
                        color: "info",
                        icon: "mdi-eye-check-outline"
                      }),
                      _createElementVNode("div", null, [
                        _createElementVNode("strong", null, _toDisplayString(preview.value ? previewItems.value.length : "进入预览"), 1),
                        _cache[35] || (_cache[35] = _createElementVNode("span", null, "干跑预览页面", -1))
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
                        _cache[36] || (_cache[36] = _createElementVNode("span", null, "低水位保盘", -1))
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
                        _cache[37] || (_cache[37] = _createElementVNode("span", null, "最近清理记录", -1))
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
          _createElementVNode("section", _hoisted_8, [
            _createElementVNode("div", _hoisted_9, [
              _createElementVNode("div", null, [
                _createVNode(_component_v_icon, { icon: "mdi-download-network-outline" }),
                _cache[38] || (_cache[38] = _createElementVNode("span", null, "下载器实时概况", -1))
              ]),
              _cache[39] || (_cache[39] = _createElementVNode("span", { class: "text-caption text-medium-emphasis" }, "磁盘空间按下载器接口或可访问保存路径计算", -1))
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
                          _createElementVNode("div", _hoisted_10, [
                            _createElementVNode("div", _hoisted_11, [
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
                                _createElementVNode("div", _hoisted_12, _toDisplayString(item.type), 1)
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
                          _createElementVNode("div", _hoisted_13, [
                            _cache[40] || (_cache[40] = _createElementVNode("span", null, "剩余空间", -1)),
                            _createElementVNode("strong", null, _toDisplayString(item.free_space_gb == null ? "不可用" : `${item.free_space_gb} GB`), 1)
                          ]),
                          _createVNode(_component_v_progress_linear, {
                            "model-value": freePercent(item),
                            color: item.low_space ? "error" : "primary",
                            height: "7",
                            rounded: "",
                            class: "mb-3"
                          }, null, 8, ["model-value", "color"]),
                          _createElementVNode("div", _hoisted_14, [
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
                          _createElementVNode("div", _hoisted_15, [
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
              default: _withCtx(() => [..._cache[41] || (_cache[41] = [
                _createTextVNode(" 未发现可用的 qBittorrent 或 Transmission 实例，请先在系统设置中启用下载器。 ", -1)
              ])]),
              _: 1
            }))
          ]),
          _createElementVNode("section", _hoisted_16, [
            _createElementVNode("div", _hoisted_17, [
              _createElementVNode("div", null, [
                _createVNode(_component_v_icon, { icon: "mdi-history" }),
                _cache[42] || (_cache[42] = _createElementVNode("span", null, "最近清理历史", -1))
              ]),
              _createElementVNode("div", _hoisted_18, [
                _createVNode(_component_v_btn, {
                  size: "small",
                  variant: "text",
                  "prepend-icon": "mdi-regex",
                  onClick: _cache[7] || (_cache[7] = ($event) => regexDialog.value = true)
                }, {
                  default: _withCtx(() => [..._cache[43] || (_cache[43] = [
                    _createTextVNode("正则测试", -1)
                  ])]),
                  _: 1
                }),
                _createVNode(_component_v_btn, {
                  size: "small",
                  variant: "text",
                  "prepend-icon": "mdi-view-grid-plus",
                  onClick: _cache[8] || (_cache[8] = ($event) => templatesDialog.value = true)
                }, {
                  default: _withCtx(() => [..._cache[44] || (_cache[44] = [
                    _createTextVNode(" 预设模板 ", -1)
                  ])]),
                  _: 1
                }),
                _createVNode(_component_v_btn, {
                  size: "small",
                  color: "error",
                  variant: "text",
                  "prepend-icon": "mdi-delete-sweep",
                  disabled: !history.value.length,
                  onClick: _cache[9] || (_cache[9] = ($event) => clearHistoryDialog.value = true)
                }, {
                  default: _withCtx(() => [..._cache[45] || (_cache[45] = [
                    _createTextVNode(" 清空历史 ", -1)
                  ])]),
                  _: 1
                }, 8, ["disabled"])
              ])
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
                  "items-per-page-options": [10, 20, 50, 100],
                  hover: ""
                }, {
                  "item.time": _withCtx(({ item }) => [
                    _createElementVNode("span", _hoisted_19, _toDisplayString(_unref(formatSingleLineTime)(item.time)), 1)
                  ]),
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
                    _createElementVNode("div", _hoisted_20, [
                      _createElementVNode("div", {
                        class: "torrent-name",
                        title: item.name
                      }, _toDisplayString(item.name), 9, _hoisted_21),
                      item.error ? (_openBlock(), _createElementBlock("div", {
                        key: 0,
                        class: "text-caption text-error text-truncate",
                        title: item.error
                      }, _toDisplayString(item.error), 9, _hoisted_22)) : _createCommentVNode("", true)
                    ])
                  ]),
                  "item.downloader": _withCtx(({ item }) => [
                    _createElementVNode("span", _hoisted_23, _toDisplayString(item.downloader), 1)
                  ]),
                  "item.size_gb": _withCtx(({ item }) => [
                    _createElementVNode("span", _hoisted_24, _toDisplayString(Number(item.size_gb || 0).toFixed(2)) + " GB", 1)
                  ]),
                  "item.rule_name": _withCtx(({ item }) => [
                    _createElementVNode("span", {
                      class: "rule-name-text",
                      title: item.rule_name
                    }, _toDisplayString(item.rule_name), 9, _hoisted_25)
                  ]),
                  "no-data": _withCtx(() => [
                    _createElementVNode("div", _hoisted_26, [
                      _createVNode(_component_v_icon, { icon: "mdi-history" }),
                      _cache[46] || (_cache[46] = _createElementVNode("span", null, "暂无清理历史", -1))
                    ])
                  ]),
                  _: 1
                }, 8, ["items"])
              ]),
              _: 1
            })
          ])
        ], 64)) : (_openBlock(), _createBlock(DryRunPage, {
          key: 2,
          preview: preview.value,
          "last-run-at": lastPreviewTime.value,
          working: working.value,
          "enabled-rule-count": enabledRuleCount.value,
          "guard-enabled": guardEnabled.value,
          onBack: _cache[10] || (_cache[10] = ($event) => activePage.value = "overview"),
          onDryRun: dryRun,
          onOpenSettings: _cache[11] || (_cache[11] = ($event) => settingsDialog.value = true),
          onOpenTemplates: _cache[12] || (_cache[12] = ($event) => templatesDialog.value = true),
          onOpenRegex: _cache[13] || (_cache[13] = ($event) => regexDialog.value = true)
        }, null, 8, ["preview", "last-run-at", "working", "enabled-rule-count", "guard-enabled"])),
        _createVNode(_component_v_dialog, {
          modelValue: settingsDialog.value,
          "onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => settingsDialog.value = $event),
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
                      _cache[47] || (_cache[47] = _createTextVNode("保种管家配置", -1))
                    ]),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      onClick: _cache[14] || (_cache[14] = ($event) => settingsDialog.value = false)
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
                      onClose: _cache[15] || (_cache[15] = ($event) => settingsDialog.value = false)
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
          "onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => templatesDialog.value = $event),
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
                    _cache[48] || (_cache[48] = _createTextVNode("一键导入高频规则模板 ", -1))
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_subtitle, { class: "px-4 pb-2 text-wrap" }, {
                  default: _withCtx(() => [..._cache[49] || (_cache[49] = [
                    _createTextVNode(" 导入后仍需保存配置并干跑确认。已存在的模板不会重复导入。 ", -1)
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
                                  _createElementVNode("div", _hoisted_27, [
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
                                    default: _withCtx(() => [..._cache[50] || (_cache[50] = [
                                      _createTextVNode(" 导入此模板 ", -1)
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
                      onClick: _cache[17] || (_cache[17] = ($event) => templatesDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[51] || (_cache[51] = [
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
          "onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => runDialog.value = $event),
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
                    _cache[52] || (_cache[52] = _createTextVNode("确认立即执行真实清理？", -1))
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, null, {
                  default: _withCtx(() => [..._cache[53] || (_cache[53] = [
                    _createTextVNode(" 本轮将按当前规则直接删除下载器任务，规则开启「连同源文件删除」时数据不可恢复。建议先进入「干跑预览」页面确认命中范围。 ", -1)
                  ])]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    _createVNode(_component_v_btn, {
                      onClick: _cache[19] || (_cache[19] = ($event) => runDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[54] || (_cache[54] = [
                        _createTextVNode("取消", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "error",
                      "prepend-icon": "mdi-delete",
                      onClick: executeCleanup
                    }, {
                      default: _withCtx(() => [..._cache[55] || (_cache[55] = [
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
          "onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => clearHistoryDialog.value = $event),
          "max-width": "420"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, null, {
                  default: _withCtx(() => [..._cache[56] || (_cache[56] = [
                    _createTextVNode("清空清理历史？", -1)
                  ])]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, null, {
                  default: _withCtx(() => [..._cache[57] || (_cache[57] = [
                    _createTextVNode("仅清空插件历史记录，不影响下载器或媒体库。", -1)
                  ])]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    _createVNode(_component_v_btn, {
                      onClick: _cache[21] || (_cache[21] = ($event) => clearHistoryDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[58] || (_cache[58] = [
                        _createTextVNode("取消", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "error",
                      onClick: clearHistory
                    }, {
                      default: _withCtx(() => [..._cache[59] || (_cache[59] = [
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
          "onUpdate:modelValue": _cache[26] || (_cache[26] = ($event) => regexDialog.value = $event),
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
                    _cache[60] || (_cache[60] = _createTextVNode("正则表达式实时测试", -1))
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
                      default: _withCtx(() => [..._cache[61] || (_cache[61] = [
                        _createTextVNode(" 后端使用 Python re.IGNORECASE，与规则引擎一致；输入后自动测试，无需保存。 ", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_textarea, {
                      modelValue: regexForm.pattern,
                      "onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => regexForm.pattern = $event),
                      label: "正则表达式",
                      rows: "2",
                      "auto-grow": "",
                      variant: "outlined",
                      placeholder: "unregistered|not registered|不存在"
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_textarea, {
                      modelValue: regexForm.text,
                      "onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => regexForm.text = $event),
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
                          _cache[62] || (_cache[62] = _createTextVNode(" 匹配成功：", -1)),
                          _createElementVNode("code", null, _toDisplayString(regexResult.value.match), 1),
                          regexResult.value.groups?.length ? (_openBlock(), _createElementBlock("div", _hoisted_28, "捕获组：" + _toDisplayString(regexResult.value.groups.join("、")), 1)) : _createCommentVNode("", true)
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
                      onClick: _cache[25] || (_cache[25] = ($event) => regexDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[63] || (_cache[63] = [
                        _createTextVNode("关闭", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "primary",
                      loading: regexTesting.value,
                      onClick: testRegex
                    }, {
                      default: _withCtx(() => [..._cache[64] || (_cache[64] = [
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
          "onUpdate:modelValue": _cache[27] || (_cache[27] = ($event) => snackbar.show = $event),
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

const AppPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-7ac76f86"]]);

export { AppPage as default };
