import { importShared } from './__federation_fn_import-JrT3xvdd.js';
import Config, { _ as _export_sfc } from './__federation_expose_Config-CPZjCExW.js';

function formatSingleLineTime(value) {
  if (!value) return "-";
  return String(value).replace(/\s+/g, " ").trim();
}

const {defineComponent:_defineComponent$1} = await importShared('vue');

const {renderList:_renderList$1,Fragment:_Fragment$1,openBlock:_openBlock$1,createElementBlock:_createElementBlock$1,toDisplayString:_toDisplayString$1,resolveComponent:_resolveComponent$1,withCtx:_withCtx$1,createBlock:_createBlock$1,createCommentVNode:_createCommentVNode$1,createVNode:_createVNode$1,createElementVNode:_createElementVNode$1,createTextVNode:_createTextVNode$1,unref:_unref$1} = await importShared('vue');

const _hoisted_1$1 = { class: "dry-view" };
const _hoisted_2$1 = { class: "dry-summary-bar" };
const _hoisted_3$1 = { class: "dry-summary-tags" };
const _hoisted_4$1 = { class: "dry-badge is-primary" };
const _hoisted_5$1 = { class: "dry-badge is-info" };
const _hoisted_6$1 = { class: "dry-badge" };
const _hoisted_7$1 = {
  key: 0,
  class: "dry-badge is-muted"
};
const _hoisted_8$1 = { class: "dry-safe-hint" };
const _hoisted_9$1 = {
  key: 0,
  class: "dry-filter-row"
};
const _hoisted_10$1 = { class: "dry-filter-meta" };
const _hoisted_11$1 = { class: "dry-table-card" };
const _hoisted_12$1 = { class: "torrent-cell" };
const _hoisted_13$1 = ["title"];
const _hoisted_14$1 = {
  key: 0,
  class: "keep-chip"
};
const _hoisted_15$1 = { class: "nowrap-text text-medium-emphasis" };
const _hoisted_16$1 = { class: "nowrap-num" };
const _hoisted_17$1 = { class: "ratio-pill" };
const _hoisted_18$1 = { class: "nowrap-num text-medium-emphasis" };
const _hoisted_19$1 = ["title"];
const _hoisted_20$1 = ["title"];
const _hoisted_21$1 = {
  key: 0,
  class: "dry-inline-empty"
};
const _hoisted_22$1 = {
  key: 1,
  class: "dry-inline-empty"
};
const _hoisted_23$1 = {
  key: 2,
  class: "dry-empty-box"
};
const _hoisted_24$1 = { class: "d-flex flex-wrap justify-center ga-2" };
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
  emits: ["back", "dry-run", "open-settings"],
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
        title: "种子名称",
        key: "name",
        headerProps: { class: "col-torrent-head" },
        cellProps: { class: "col-torrent" }
      },
      {
        title: "下载器",
        key: "downloader",
        width: "120px",
        minWidth: "108px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap" }
      },
      {
        title: "体积",
        key: "size_gb",
        width: "104px",
        minWidth: "96px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap col-num" }
      },
      {
        title: "分享率",
        key: "ratio",
        width: "86px",
        minWidth: "80px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap col-num" }
      },
      {
        title: "做种时长",
        key: "seeding_hours",
        width: "104px",
        minWidth: "96px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap col-num" }
      },
      {
        title: "命中规则",
        key: "rule_name",
        width: "156px",
        minWidth: "132px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-rule" }
      },
      {
        title: "命中原因",
        key: "reason",
        width: "260px",
        minWidth: "220px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-reason" }
      }
    ];
    return (_ctx, _cache) => {
      const _component_v_alert = _resolveComponent$1("v-alert");
      const _component_v_icon = _resolveComponent$1("v-icon");
      const _component_v_text_field = _resolveComponent$1("v-text-field");
      const _component_v_select = _resolveComponent$1("v-select");
      const _component_v_btn = _resolveComponent$1("v-btn");
      const _component_v_data_table = _resolveComponent$1("v-data-table");
      return _openBlock$1(), _createElementBlock$1("div", _hoisted_1$1, [
        __props.preview?.errors?.length ? (_openBlock$1(), _createBlock$1(_component_v_alert, {
          key: 0,
          type: "warning",
          variant: "tonal",
          density: "compact",
          rounded: "lg",
          class: "mb-3"
        }, {
          default: _withCtx$1(() => [
            (_openBlock$1(true), _createElementBlock$1(_Fragment$1, null, _renderList$1(__props.preview.errors, (error) => {
              return _openBlock$1(), _createElementBlock$1("div", { key: error }, _toDisplayString$1(error), 1);
            }), 128))
          ]),
          _: 1
        })) : _createCommentVNode$1("", true),
        __props.preview ? (_openBlock$1(), _createElementBlock$1(_Fragment$1, { key: 1 }, [
          _createElementVNode$1("div", _hoisted_2$1, [
            _createElementVNode$1("div", _hoisted_3$1, [
              _createElementVNode$1("span", _hoisted_4$1, [
                _createVNode$1(_component_v_icon, {
                  icon: "mdi-eye-check-outline",
                  size: "14"
                }),
                _cache[6] || (_cache[6] = _createTextVNode$1(" 命中 ", -1)),
                _createElementVNode$1("strong", null, _toDisplayString$1(previewItems.value.length), 1),
                _cache[7] || (_cache[7] = _createTextVNode$1(" 项 ", -1))
              ]),
              _createElementVNode$1("span", _hoisted_5$1, [
                _createVNode$1(_component_v_icon, {
                  icon: "mdi-database-remove-outline",
                  size: "14"
                }),
                _cache[8] || (_cache[8] = _createTextVNode$1(" 预计释放 ", -1)),
                _createElementVNode$1("strong", null, _toDisplayString$1(previewSize.value.toFixed(2)) + " GB", 1)
              ]),
              _createElementVNode$1("span", _hoisted_6$1, [
                _createVNode$1(_component_v_icon, {
                  icon: "mdi-download-network-outline",
                  size: "14"
                }),
                _createTextVNode$1(" 涉及 " + _toDisplayString$1(matchedDownloaderCount.value) + " 个下载器 · " + _toDisplayString$1(__props.enabledRuleCount) + " 规则" + _toDisplayString$1(__props.guardEnabled ? " + 保盘" : ""), 1)
              ]),
              __props.lastRunAt ? (_openBlock$1(), _createElementBlock$1("span", _hoisted_7$1, [
                _createVNode$1(_component_v_icon, {
                  icon: "mdi-clock-check-outline",
                  size: "13"
                }),
                _createTextVNode$1(" " + _toDisplayString$1(_unref$1(formatSingleLineTime)(__props.lastRunAt)), 1)
              ])) : _createCommentVNode$1("", true)
            ]),
            _createElementVNode$1("span", _hoisted_8$1, [
              _createVNode$1(_component_v_icon, {
                icon: "mdi-shield-check-outline",
                size: "14"
              }),
              _cache[9] || (_cache[9] = _createTextVNode$1(" 仅模拟匹配，不执行删除 ", -1))
            ])
          ]),
          previewItems.value.length ? (_openBlock$1(), _createElementBlock$1("div", _hoisted_9$1, [
            _createVNode$1(_component_v_text_field, {
              modelValue: keyword.value,
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => keyword.value = $event),
              density: "compact",
              variant: "outlined",
              "hide-details": "",
              clearable: "",
              "prepend-inner-icon": "mdi-magnify",
              placeholder: "搜索种子名称、规则或命中原因...",
              class: "dry-search"
            }, null, 8, ["modelValue"]),
            _createVNode$1(_component_v_select, {
              modelValue: selectedDownloader.value,
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => selectedDownloader.value = $event),
              items: downloaderOptions.value,
              density: "compact",
              variant: "outlined",
              "hide-details": "",
              class: "dry-select"
            }, null, 8, ["modelValue", "items"]),
            _createVNode$1(_component_v_select, {
              modelValue: selectedRule.value,
              "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => selectedRule.value = $event),
              items: ruleOptions.value,
              density: "compact",
              variant: "outlined",
              "hide-details": "",
              class: "dry-select"
            }, null, 8, ["modelValue", "items"]),
            _createElementVNode$1("div", _hoisted_10$1, [
              _createElementVNode$1("span", null, [
                _cache[10] || (_cache[10] = _createTextVNode$1(" 显示 ", -1)),
                _createElementVNode$1("strong", null, _toDisplayString$1(filteredItems.value.length), 1),
                _createTextVNode$1(" / " + _toDisplayString$1(previewItems.value.length) + " （" + _toDisplayString$1(filteredSizeGb.value.toFixed(2)) + " GB） ", 1)
              ]),
              hasActiveFilter.value ? (_openBlock$1(), _createBlock$1(_component_v_btn, {
                key: 0,
                size: "x-small",
                variant: "tonal",
                rounded: "lg",
                color: "primary",
                onClick: resetFilters
              }, {
                default: _withCtx$1(() => [..._cache[11] || (_cache[11] = [
                  _createTextVNode$1(" 重置 ", -1)
                ])]),
                _: 1
              })) : _createCommentVNode$1("", true)
            ])
          ])) : _createCommentVNode$1("", true),
          _createElementVNode$1("div", _hoisted_11$1, [
            _createVNode$1(_component_v_data_table, {
              headers: previewHeaders,
              items: filteredItems.value,
              "item-value": "hash",
              density: "compact",
              "items-per-page": 20,
              "items-per-page-options": [10, 20, 50, 100],
              hover: ""
            }, {
              "item.name": _withCtx$1(({ item }) => [
                _createElementVNode$1("div", _hoisted_12$1, [
                  _createElementVNode$1("span", {
                    class: "torrent-name",
                    title: item.name
                  }, _toDisplayString$1(item.name), 9, _hoisted_13$1),
                  !item.delete_files ? (_openBlock$1(), _createElementBlock$1("span", _hoisted_14$1, "仅删任务")) : _createCommentVNode$1("", true)
                ])
              ]),
              "item.downloader": _withCtx$1(({ item }) => [
                _createElementVNode$1("span", _hoisted_15$1, _toDisplayString$1(item.downloader), 1)
              ]),
              "item.size_gb": _withCtx$1(({ item }) => [
                _createElementVNode$1("span", _hoisted_16$1, _toDisplayString$1(Number(item.size_gb || 0).toFixed(2)) + " GB", 1)
              ]),
              "item.ratio": _withCtx$1(({ item }) => [
                _createElementVNode$1("span", _hoisted_17$1, _toDisplayString$1(Number(item.ratio || 0).toFixed(2)), 1)
              ]),
              "item.seeding_hours": _withCtx$1(({ item }) => [
                _createElementVNode$1("span", _hoisted_18$1, _toDisplayString$1(Number(item.seeding_hours || 0).toFixed(1)) + " h", 1)
              ]),
              "item.rule_name": _withCtx$1(({ item }) => [
                _createElementVNode$1("span", {
                  class: "rule-name-text",
                  title: item.rule_name
                }, _toDisplayString$1(item.rule_name), 9, _hoisted_19$1)
              ]),
              "item.reason": _withCtx$1(({ item }) => [
                _createElementVNode$1("span", {
                  class: "reason-text",
                  title: item.reason
                }, _toDisplayString$1(item.reason), 9, _hoisted_20$1)
              ]),
              "no-data": _withCtx$1(() => [
                hasActiveFilter.value ? (_openBlock$1(), _createElementBlock$1("div", _hoisted_21$1, [
                  _createVNode$1(_component_v_icon, {
                    size: "32",
                    icon: "mdi-filter-off-outline",
                    class: "text-medium-emphasis"
                  }),
                  _cache[13] || (_cache[13] = _createElementVNode$1("div", { class: "text-body-2 font-weight-medium" }, "没有匹配当前筛选条件的候选种子", -1)),
                  _createVNode$1(_component_v_btn, {
                    size: "small",
                    variant: "tonal",
                    rounded: "lg",
                    color: "primary",
                    onClick: resetFilters
                  }, {
                    default: _withCtx$1(() => [..._cache[12] || (_cache[12] = [
                      _createTextVNode$1(" 重置筛选 ", -1)
                    ])]),
                    _: 1
                  })
                ])) : (_openBlock$1(), _createElementBlock$1("div", _hoisted_22$1, [
                  _createVNode$1(_component_v_icon, {
                    size: "34",
                    icon: "mdi-shield-check",
                    color: "success"
                  }),
                  _cache[14] || (_cache[14] = _createElementVNode$1("div", { class: "text-subtitle-2 font-weight-bold" }, "没有种子命中清理条件", -1)),
                  _cache[15] || (_cache[15] = _createElementVNode$1("div", { class: "text-caption text-medium-emphasis" }, "当前所有做种任务均处于安全保留状态", -1))
                ]))
              ]),
              _: 1
            }, 8, ["items"])
          ])
        ], 64)) : (_openBlock$1(), _createElementBlock$1("div", _hoisted_23$1, [
          _createVNode$1(_component_v_icon, {
            icon: "mdi-clipboard-search-outline",
            size: "38",
            class: "mb-2 text-primary"
          }),
          _cache[19] || (_cache[19] = _createElementVNode$1("div", { class: "text-subtitle-1 font-weight-bold" }, "先模拟干跑，再执行清理", -1)),
          _cache[20] || (_cache[20] = _createElementVNode$1("div", { class: "text-body-2 text-medium-emphasis mt-1 mb-4 dry-empty-desc" }, " 实时扫描已启用下载器的任务快照，完整校验保护标签、入库锁、多维规则与低水位保盘策略，不会调用删除接口。 ", -1)),
          _createElementVNode$1("div", _hoisted_24$1, [
            _createVNode$1(_component_v_btn, {
              size: "small",
              color: "primary",
              variant: "flat",
              rounded: "lg",
              class: "px-4",
              "prepend-icon": "mdi-play-outline",
              loading: __props.working === "dry",
              onClick: _cache[3] || (_cache[3] = ($event) => emit("dry-run"))
            }, {
              default: _withCtx$1(() => [..._cache[16] || (_cache[16] = [
                _createTextVNode$1(" 开始模拟干跑 ", -1)
              ])]),
              _: 1
            }, 8, ["loading"]),
            _createVNode$1(_component_v_btn, {
              size: "small",
              variant: "outlined",
              rounded: "lg",
              class: "px-4",
              "prepend-icon": "mdi-tune",
              onClick: _cache[4] || (_cache[4] = ($event) => emit("open-settings"))
            }, {
              default: _withCtx$1(() => [..._cache[17] || (_cache[17] = [
                _createTextVNode$1(" 规则配置 ", -1)
              ])]),
              _: 1
            }),
            _createVNode$1(_component_v_btn, {
              size: "small",
              variant: "text",
              rounded: "lg",
              "prepend-icon": "mdi-arrow-left",
              onClick: _cache[5] || (_cache[5] = ($event) => emit("back"))
            }, {
              default: _withCtx$1(() => [..._cache[18] || (_cache[18] = [
                _createTextVNode$1(" 返回概览 ", -1)
              ])]),
              _: 1
            })
          ])
        ]))
      ]);
    };
  }
});

const DryRunPage = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-8417be80"]]);

const {defineComponent:_defineComponent} = await importShared('vue');

const {resolveComponent:_resolveComponent,createVNode:_createVNode,createElementVNode:_createElementVNode,toDisplayString:_toDisplayString,createTextVNode:_createTextVNode,normalizeClass:_normalizeClass,withCtx:_withCtx,openBlock:_openBlock,createBlock:_createBlock,createCommentVNode:_createCommentVNode,createElementBlock:_createElementBlock,renderList:_renderList,Fragment:_Fragment,unref:_unref} = await importShared('vue');

const _hoisted_1 = { class: "seed-page" };
const _hoisted_2 = { class: "seed-topbar" };
const _hoisted_3 = { class: "seed-topbar__left" };
const _hoisted_4 = { class: "seed-topbar__icon" };
const _hoisted_5 = { class: "seed-topbar__heading" };
const _hoisted_6 = { class: "seed-topbar__title-row" };
const _hoisted_7 = { class: "seed-topbar__actions" };
const _hoisted_8 = { class: "seed-toolbar" };
const _hoisted_9 = { class: "seed-toolbar__left" };
const _hoisted_10 = {
  class: "seed-pills",
  role: "group",
  "aria-label": "保种管家视图切换"
};
const _hoisted_11 = { key: 0 };
const _hoisted_12 = { class: "seed-counter" };
const _hoisted_13 = { class: "seed-subactions" };
const _hoisted_14 = { class: "seed-section" };
const _hoisted_15 = { class: "seed-section__head" };
const _hoisted_16 = { class: "seed-section__title" };
const _hoisted_17 = {
  key: 0,
  class: "seed-dl-grid"
};
const _hoisted_18 = { class: "seed-dl-card__head" };
const _hoisted_19 = { class: "seed-dl-card__identity" };
const _hoisted_20 = { class: "seed-dl-card__name-line" };
const _hoisted_21 = ["title"];
const _hoisted_22 = { class: "seed-chip" };
const _hoisted_23 = { class: "seed-dl-card__meta" };
const _hoisted_24 = { class: "seed-dl-card__stats" };
const _hoisted_25 = { class: "seed-dl-card__counts" };
const _hoisted_26 = { class: "seed-dl-card__speed" };
const _hoisted_27 = {
  key: 1,
  class: "seed-empty-box"
};
const _hoisted_28 = { class: "seed-section" };
const _hoisted_29 = { class: "seed-section__head" };
const _hoisted_30 = { class: "seed-section__title" };
const _hoisted_31 = { class: "d-flex align-center flex-wrap ga-2" };
const _hoisted_32 = { class: "seed-table-card" };
const _hoisted_33 = { class: "time-text text-medium-emphasis" };
const _hoisted_34 = { class: "torrent-cell" };
const _hoisted_35 = ["title"];
const _hoisted_36 = ["title"];
const _hoisted_37 = { class: "nowrap-text text-medium-emphasis" };
const _hoisted_38 = { class: "nowrap-num" };
const _hoisted_39 = ["title"];
const _hoisted_40 = { class: "seed-table-empty" };
const _hoisted_41 = { class: "d-flex align-center ga-2" };
const _hoisted_42 = { class: "d-flex align-center ga-2" };
const _hoisted_43 = { class: "seed-tpl-grid" };
const _hoisted_44 = { class: "d-flex align-center ga-2 mb-1" };
const _hoisted_45 = { class: "text-body-2" };
const _hoisted_46 = { class: "seed-tpl-desc" };
const _hoisted_47 = { class: "d-flex align-center ga-2" };
const _hoisted_48 = { class: "d-flex align-center ga-2" };
const _hoisted_49 = { class: "d-flex align-center ga-2" };
const _hoisted_50 = {
  key: 0,
  class: "text-caption mt-1"
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
    const historyKeyword = ref("");
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
    const totalRuleCount = computed(() => (config.value.rules || []).length);
    const enabledRuleCount = computed(() => (config.value.rules || []).filter((rule) => rule.enabled).length);
    const guardEnabled = computed(() => Boolean(config.value.disk_guard?.enabled));
    const filteredHistory = computed(() => {
      const kw = historyKeyword.value.trim().toLowerCase();
      if (!kw) return history.value;
      return history.value.filter((item) => {
        return String(item.name || "").toLowerCase().includes(kw) || String(item.rule_name || "").toLowerCase().includes(kw) || String(item.downloader || "").toLowerCase().includes(kw);
      });
    });
    const historyHeaders = [
      {
        title: "时间",
        key: "time",
        width: "172px",
        minWidth: "164px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap col-time" }
      },
      {
        title: "状态",
        key: "status",
        width: "86px",
        minWidth: "82px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap" }
      },
      {
        title: "种子名称",
        key: "name",
        headerProps: { class: "col-torrent-head" },
        cellProps: { class: "col-torrent" }
      },
      {
        title: "下载器",
        key: "downloader",
        width: "120px",
        minWidth: "108px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap" }
      },
      {
        title: "体积",
        key: "size_gb",
        width: "104px",
        minWidth: "96px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-nowrap col-num" }
      },
      {
        title: "命中规则",
        key: "rule_name",
        width: "156px",
        minWidth: "132px",
        headerProps: { class: "col-nowrap" },
        cellProps: { class: "col-rule" }
      }
    ];
    function notify(message, color = "success") {
      if (hostToast) {
        if (color === "success") hostToast.success(message);
        else if (color === "error") hostToast.error(message);
        else hostToast.info(message);
        return;
      }
      snackbar.text = message;
      snackbar.color = color;
      snackbar.show = true;
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
    function templateIcon(id) {
      if (id === "unregistered") return "mdi-alert-octagon";
      if (id === "cold_large") return "mdi-snowflake";
      if (id === "official_exclude") return "mdi-shield-crown";
      return "mdi-medal";
    }
    onMounted(refreshAll);
    return (_ctx, _cache) => {
      const _component_v_icon = _resolveComponent("v-icon");
      const _component_v_btn = _resolveComponent("v-btn");
      const _component_v_progress_linear = _resolveComponent("v-progress-linear");
      const _component_v_alert = _resolveComponent("v-alert");
      const _component_v_text_field = _resolveComponent("v-text-field");
      const _component_v_data_table = _resolveComponent("v-data-table");
      const _component_v_card_title = _resolveComponent("v-card-title");
      const _component_v_card_text = _resolveComponent("v-card-text");
      const _component_v_card = _resolveComponent("v-card");
      const _component_v_dialog = _resolveComponent("v-dialog");
      const _component_v_spacer = _resolveComponent("v-spacer");
      const _component_v_card_actions = _resolveComponent("v-card-actions");
      const _component_v_textarea = _resolveComponent("v-textarea");
      const _component_v_snackbar = _resolveComponent("v-snackbar");
      return _openBlock(), _createElementBlock("div", _hoisted_1, [
        _createElementVNode("header", _hoisted_2, [
          _createElementVNode("div", _hoisted_3, [
            _createElementVNode("div", _hoisted_4, [
              _createVNode(_component_v_icon, {
                icon: "mdi-broom",
                size: "22"
              })
            ]),
            _createElementVNode("div", _hoisted_5, [
              _createElementVNode("div", _hoisted_6, [
                _cache[32] || (_cache[32] = _createElementVNode("h2", null, "保种删种管家", -1)),
                _createElementVNode("button", {
                  type: "button",
                  class: _normalizeClass(["seed-tag seed-tag--clickable", config.value.enabled ? "is-active" : "is-muted"]),
                  onClick: _cache[0] || (_cache[0] = ($event) => settingsDialog.value = true)
                }, [
                  _createVNode(_component_v_icon, {
                    icon: config.value.enabled ? "mdi-clock-check-outline" : "mdi-clock-outline",
                    size: "13"
                  }, null, 8, ["icon"]),
                  _createTextVNode(" " + _toDisplayString(config.value.enabled ? `巡检：${config.value.cron || "已启用"}` : "巡检已关闭"), 1)
                ], 2),
                _createElementVNode("button", {
                  type: "button",
                  class: "seed-tag seed-tag--clickable",
                  onClick: _cache[1] || (_cache[1] = ($event) => settingsDialog.value = true)
                }, [
                  _createVNode(_component_v_icon, {
                    icon: "mdi-format-list-checks",
                    size: "13"
                  }),
                  _createTextVNode(" 规则 " + _toDisplayString(enabledRuleCount.value) + "/" + _toDisplayString(totalRuleCount.value), 1)
                ]),
                _createElementVNode("button", {
                  type: "button",
                  class: _normalizeClass(["seed-tag seed-tag--clickable", guardEnabled.value ? "is-warning" : "is-muted"]),
                  onClick: _cache[2] || (_cache[2] = ($event) => settingsDialog.value = true)
                }, [
                  _createVNode(_component_v_icon, {
                    icon: "mdi-harddisk",
                    size: "13"
                  }),
                  _createTextVNode(" " + _toDisplayString(guardEnabled.value ? `保盘：<${config.value.disk_guard?.free_space_threshold_gb ?? 50}GB` : "保盘未启用"), 1)
                ], 2)
              ])
            ])
          ]),
          _createElementVNode("div", _hoisted_7, [
            _createVNode(_component_v_btn, {
              icon: "mdi-refresh",
              variant: "text",
              size: "small",
              rounded: "lg",
              "aria-label": "刷新数据",
              loading: loading.value,
              onClick: refreshAll
            }, null, 8, ["loading"]),
            _createVNode(_component_v_btn, {
              size: "small",
              variant: "outlined",
              rounded: "lg",
              "prepend-icon": "mdi-tune",
              onClick: _cache[3] || (_cache[3] = ($event) => settingsDialog.value = true)
            }, {
              default: _withCtx(() => [..._cache[33] || (_cache[33] = [
                _createTextVNode(" 规则配置 ", -1)
              ])]),
              _: 1
            }),
            activePage.value === "overview" ? (_openBlock(), _createBlock(_component_v_btn, {
              key: 0,
              size: "small",
              color: "primary",
              variant: "flat",
              rounded: "lg",
              "prepend-icon": "mdi-eye-outline",
              loading: working.value === "dry",
              onClick: _cache[4] || (_cache[4] = ($event) => openDryRunPage(true))
            }, {
              default: _withCtx(() => [..._cache[34] || (_cache[34] = [
                _createTextVNode(" 干跑预览 ", -1)
              ])]),
              _: 1
            }, 8, ["loading"])) : (_openBlock(), _createBlock(_component_v_btn, {
              key: 1,
              size: "small",
              color: "primary",
              variant: "flat",
              rounded: "lg",
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
              size: "small",
              color: "error",
              variant: "tonal",
              rounded: "lg",
              "prepend-icon": "mdi-play",
              loading: working.value === "run",
              onClick: _cache[5] || (_cache[5] = ($event) => runDialog.value = true)
            }, {
              default: _withCtx(() => [..._cache[35] || (_cache[35] = [
                _createTextVNode(" 立即清理 ", -1)
              ])]),
              _: 1
            }, 8, ["loading"])
          ])
        ]),
        _createElementVNode("section", _hoisted_8, [
          _createElementVNode("div", _hoisted_9, [
            _createElementVNode("div", _hoisted_10, [
              _createElementVNode("button", {
                type: "button",
                class: _normalizeClass(["seed-pill", { "is-active": activePage.value === "overview" }]),
                onClick: _cache[6] || (_cache[6] = ($event) => activePage.value = "overview")
              }, [
                _createVNode(_component_v_icon, {
                  icon: "mdi-view-dashboard-outline",
                  size: "15"
                }),
                _cache[36] || (_cache[36] = _createElementVNode("span", null, "运行概览", -1)),
                _createElementVNode("strong", null, _toDisplayString(downloaders.value.length), 1)
              ], 2),
              _createElementVNode("button", {
                type: "button",
                class: _normalizeClass(["seed-pill", { "is-active": activePage.value === "preview" }]),
                onClick: _cache[7] || (_cache[7] = ($event) => openDryRunPage(false))
              }, [
                _createVNode(_component_v_icon, {
                  icon: "mdi-test-tube",
                  size: "15"
                }),
                _cache[37] || (_cache[37] = _createElementVNode("span", null, "干跑预览", -1)),
                preview.value ? (_openBlock(), _createElementBlock("strong", _hoisted_11, _toDisplayString(previewItems.value.length), 1)) : _createCommentVNode("", true)
              ], 2)
            ]),
            _createElementVNode("span", _hoisted_12, [
              _createVNode(_component_v_icon, {
                icon: "mdi-history",
                size: "14"
              }),
              _createTextVNode(" 记录 " + _toDisplayString(history.value.length), 1)
            ])
          ]),
          _createElementVNode("div", _hoisted_13, [
            _createVNode(_component_v_btn, {
              size: "x-small",
              variant: "tonal",
              rounded: "lg",
              class: "px-3",
              "prepend-icon": "mdi-regex",
              onClick: _cache[8] || (_cache[8] = ($event) => regexDialog.value = true)
            }, {
              default: _withCtx(() => [..._cache[38] || (_cache[38] = [
                _createTextVNode(" 正则测试 ", -1)
              ])]),
              _: 1
            }),
            _createVNode(_component_v_btn, {
              size: "x-small",
              variant: "tonal",
              rounded: "lg",
              class: "px-3",
              "prepend-icon": "mdi-view-grid-plus",
              onClick: _cache[9] || (_cache[9] = ($event) => templatesDialog.value = true)
            }, {
              default: _withCtx(() => [..._cache[39] || (_cache[39] = [
                _createTextVNode(" 预设模板 ", -1)
              ])]),
              _: 1
            })
          ])
        ]),
        loading.value ? (_openBlock(), _createBlock(_component_v_progress_linear, {
          key: 0,
          indeterminate: "",
          color: "primary",
          class: "mb-3",
          rounded: ""
        })) : _createCommentVNode("", true),
        activePage.value === "overview" ? (_openBlock(), _createElementBlock(_Fragment, { key: 1 }, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(collectionErrors.value, (error) => {
            return _openBlock(), _createBlock(_component_v_alert, {
              key: error,
              type: "error",
              variant: "tonal",
              density: "compact",
              rounded: "lg",
              class: "mb-3"
            }, {
              default: _withCtx(() => [
                _createTextVNode(_toDisplayString(error), 1)
              ]),
              _: 2
            }, 1024);
          }), 128)),
          _createElementVNode("section", _hoisted_14, [
            _createElementVNode("div", _hoisted_15, [
              _createElementVNode("div", _hoisted_16, [
                _createVNode(_component_v_icon, {
                  icon: "mdi-download-network-outline",
                  size: "18",
                  color: "primary"
                }),
                _cache[40] || (_cache[40] = _createElementVNode("span", null, "下载器实时概况", -1))
              ]),
              _cache[41] || (_cache[41] = _createElementVNode("span", { class: "text-caption text-medium-emphasis" }, "空间按下载器接口或可访问路径实时读取", -1))
            ]),
            downloaders.value.length ? (_openBlock(), _createElementBlock("div", _hoisted_17, [
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(downloaders.value, (item) => {
                return _openBlock(), _createElementBlock("article", {
                  key: item.name,
                  class: "seed-dl-card"
                }, [
                  _createElementVNode("div", _hoisted_18, [
                    _createElementVNode("div", {
                      class: _normalizeClass(["seed-dl-card__avatar", item.type === "qbittorrent" ? "is-qb" : "is-tr"])
                    }, [
                      _createVNode(_component_v_icon, {
                        icon: item.type === "qbittorrent" ? "mdi-qrcode" : "mdi-transit-connection-variant",
                        size: "19"
                      }, null, 8, ["icon"])
                    ], 2),
                    _createElementVNode("div", _hoisted_19, [
                      _createElementVNode("div", _hoisted_20, [
                        _createElementVNode("span", {
                          class: "seed-dl-card__name",
                          title: item.name
                        }, _toDisplayString(item.name), 9, _hoisted_21),
                        _createElementVNode("span", _hoisted_22, _toDisplayString(item.type), 1)
                      ]),
                      _createElementVNode("div", _hoisted_23, [
                        _createTextVNode(" 剩余 " + _toDisplayString(item.free_space_gb == null ? "不可用" : `${item.free_space_gb} GB`) + " ", 1),
                        item.total_space_gb ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                          _createTextVNode(" / 共 " + _toDisplayString(item.total_space_gb) + " GB", 1)
                        ], 64)) : _createCommentVNode("", true)
                      ])
                    ]),
                    _createElementVNode("span", {
                      class: _normalizeClass(["seed-status", item.low_space ? "is-error" : "is-success"])
                    }, [
                      _cache[42] || (_cache[42] = _createElementVNode("i", null, null, -1)),
                      _createTextVNode(_toDisplayString(item.low_space ? "低水位" : "空间正常"), 1)
                    ], 2)
                  ]),
                  _createVNode(_component_v_progress_linear, {
                    "model-value": freePercent(item),
                    color: item.low_space ? "error" : "primary",
                    height: "6",
                    rounded: ""
                  }, null, 8, ["model-value", "color"]),
                  _createElementVNode("div", _hoisted_24, [
                    _createElementVNode("div", _hoisted_25, [
                      _createElementVNode("span", null, [
                        _createVNode(_component_v_icon, {
                          size: "13",
                          icon: "mdi-file-multiple-outline"
                        }),
                        _cache[43] || (_cache[43] = _createTextVNode(" 任务 ", -1)),
                        _createElementVNode("b", null, _toDisplayString(item.torrent_count), 1)
                      ]),
                      _cache[46] || (_cache[46] = _createElementVNode("span", { class: "seed-dot" }, "·", -1)),
                      _createElementVNode("span", null, [
                        _createVNode(_component_v_icon, {
                          size: "13",
                          icon: "mdi-seed"
                        }),
                        _cache[44] || (_cache[44] = _createTextVNode(" 做种 ", -1)),
                        _createElementVNode("b", null, _toDisplayString(item.seeding_count), 1)
                      ]),
                      _cache[47] || (_cache[47] = _createElementVNode("span", { class: "seed-dot" }, "·", -1)),
                      _createElementVNode("span", null, [
                        _createElementVNode("b", null, _toDisplayString(item.total_size_gb), 1),
                        _cache[45] || (_cache[45] = _createTextVNode(" GB ", -1))
                      ])
                    ]),
                    _createElementVNode("div", _hoisted_26, [
                      _createElementVNode("span", null, "↓ " + _toDisplayString(formatSpeed(item.download_speed)), 1),
                      _createElementVNode("span", null, "↑ " + _toDisplayString(formatSpeed(item.upload_speed)), 1)
                    ])
                  ])
                ]);
              }), 128))
            ])) : !loading.value ? (_openBlock(), _createElementBlock("div", _hoisted_27, [
              _createVNode(_component_v_icon, {
                icon: "mdi-information-outline",
                size: "34",
                class: "mb-2 text-medium-emphasis"
              }),
              _cache[48] || (_cache[48] = _createElementVNode("div", { class: "text-subtitle-2 font-weight-bold" }, "未发现可用下载器", -1)),
              _cache[49] || (_cache[49] = _createElementVNode("div", { class: "text-caption text-medium-emphasis mt-1" }, " 请先在系统设置中启用 qBittorrent 或 Transmission 实例 ", -1))
            ])) : _createCommentVNode("", true)
          ]),
          _createElementVNode("section", _hoisted_28, [
            _createElementVNode("div", _hoisted_29, [
              _createElementVNode("div", _hoisted_30, [
                _createVNode(_component_v_icon, {
                  icon: "mdi-history",
                  size: "18",
                  color: "primary"
                }),
                _cache[50] || (_cache[50] = _createElementVNode("span", null, "最近清理历史", -1))
              ]),
              _createElementVNode("div", _hoisted_31, [
                history.value.length > 0 ? (_openBlock(), _createBlock(_component_v_text_field, {
                  key: 0,
                  modelValue: historyKeyword.value,
                  "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => historyKeyword.value = $event),
                  class: "seed-history-search",
                  "prepend-inner-icon": "mdi-magnify",
                  placeholder: "筛选种子或规则...",
                  density: "compact",
                  variant: "outlined",
                  "hide-details": "",
                  clearable: ""
                }, null, 8, ["modelValue"])) : _createCommentVNode("", true),
                history.value.length > 0 ? (_openBlock(), _createBlock(_component_v_btn, {
                  key: 1,
                  size: "x-small",
                  color: "error",
                  variant: "tonal",
                  rounded: "lg",
                  class: "px-3",
                  "prepend-icon": "mdi-delete-sweep",
                  onClick: _cache[11] || (_cache[11] = ($event) => clearHistoryDialog.value = true)
                }, {
                  default: _withCtx(() => [..._cache[51] || (_cache[51] = [
                    _createTextVNode(" 清空历史 ", -1)
                  ])]),
                  _: 1
                })) : _createCommentVNode("", true)
              ])
            ]),
            _createElementVNode("div", _hoisted_32, [
              _createVNode(_component_v_data_table, {
                headers: historyHeaders,
                items: filteredHistory.value,
                density: "compact",
                "items-per-page": 10,
                "items-per-page-options": [10, 20, 50, 100],
                hover: ""
              }, {
                "item.time": _withCtx(({ item }) => [
                  _createElementVNode("span", _hoisted_33, _toDisplayString(_unref(formatSingleLineTime)(item.time)), 1)
                ]),
                "item.status": _withCtx(({ item }) => [
                  _createElementVNode("span", {
                    class: _normalizeClass(["seed-status", item.status === "success" ? "is-success" : "is-error"])
                  }, [
                    _cache[52] || (_cache[52] = _createElementVNode("i", null, null, -1)),
                    _createTextVNode(_toDisplayString(item.status === "success" ? "成功" : "失败"), 1)
                  ], 2)
                ]),
                "item.name": _withCtx(({ item }) => [
                  _createElementVNode("div", _hoisted_34, [
                    _createElementVNode("div", {
                      class: "torrent-name",
                      title: item.name
                    }, _toDisplayString(item.name), 9, _hoisted_35),
                    item.error ? (_openBlock(), _createElementBlock("div", {
                      key: 0,
                      class: "text-caption text-error text-truncate",
                      title: item.error
                    }, _toDisplayString(item.error), 9, _hoisted_36)) : _createCommentVNode("", true)
                  ])
                ]),
                "item.downloader": _withCtx(({ item }) => [
                  _createElementVNode("span", _hoisted_37, _toDisplayString(item.downloader), 1)
                ]),
                "item.size_gb": _withCtx(({ item }) => [
                  _createElementVNode("span", _hoisted_38, _toDisplayString(Number(item.size_gb || 0).toFixed(2)) + " GB", 1)
                ]),
                "item.rule_name": _withCtx(({ item }) => [
                  _createElementVNode("span", {
                    class: "rule-name-text",
                    title: item.rule_name
                  }, _toDisplayString(item.rule_name), 9, _hoisted_39)
                ]),
                "no-data": _withCtx(() => [
                  _createElementVNode("div", _hoisted_40, [
                    _createVNode(_component_v_icon, {
                      icon: "mdi-history",
                      size: "22",
                      class: "text-medium-emphasis"
                    }),
                    _createElementVNode("span", null, _toDisplayString(historyKeyword.value ? "未匹配到相关历史记录" : "暂无清理历史记录"), 1)
                  ])
                ]),
                _: 1
              }, 8, ["items"])
            ])
          ])
        ], 64)) : (_openBlock(), _createBlock(DryRunPage, {
          key: 2,
          preview: preview.value,
          "last-run-at": lastPreviewTime.value,
          working: working.value,
          "enabled-rule-count": enabledRuleCount.value,
          "guard-enabled": guardEnabled.value,
          onBack: _cache[12] || (_cache[12] = ($event) => activePage.value = "overview"),
          onDryRun: dryRun,
          onOpenSettings: _cache[13] || (_cache[13] = ($event) => settingsDialog.value = true)
        }, null, 8, ["preview", "last-run-at", "working", "enabled-rule-count", "guard-enabled"])),
        _createVNode(_component_v_dialog, {
          modelValue: settingsDialog.value,
          "onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => settingsDialog.value = $event),
          "max-width": "1024",
          scrollable: ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, { class: "seed-dialog" }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "seed-dialog__header" }, {
                  default: _withCtx(() => [
                    _createElementVNode("span", _hoisted_41, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-tune",
                        size: "20",
                        color: "primary"
                      }),
                      _cache[53] || (_cache[53] = _createElementVNode("span", null, "保种管家配置", -1))
                    ]),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      rounded: "lg",
                      onClick: _cache[14] || (_cache[14] = ($event) => settingsDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, { class: "pa-0" }, {
                  default: _withCtx(() => [
                    _createVNode(Config, {
                      "initial-config": config.value,
                      api: props.api,
                      embedded: true,
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
          "onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => templatesDialog.value = $event),
          "max-width": "760",
          scrollable: ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, { class: "seed-dialog" }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "seed-dialog__header" }, {
                  default: _withCtx(() => [
                    _createElementVNode("span", _hoisted_42, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-view-grid-plus",
                        size: "20",
                        color: "primary"
                      }),
                      _cache[54] || (_cache[54] = _createElementVNode("span", null, "导入高频规则模板", -1))
                    ]),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      rounded: "lg",
                      onClick: _cache[17] || (_cache[17] = ($event) => templatesDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, { class: "seed-dialog__body" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_alert, {
                      type: "info",
                      variant: "tonal",
                      density: "compact",
                      rounded: "lg",
                      class: "text-caption"
                    }, {
                      default: _withCtx(() => [..._cache[55] || (_cache[55] = [
                        _createTextVNode(" 已存在的同名模板不会重复导入；导入后建议先执行「干跑预览」确认命中范围。 ", -1)
                      ])]),
                      _: 1
                    }),
                    _createElementVNode("div", _hoisted_43, [
                      (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(templates.value, (template) => {
                        return _openBlock(), _createElementBlock("div", {
                          key: template.id,
                          class: "seed-tpl-card"
                        }, [
                          _createElementVNode("div", _hoisted_44, [
                            _createVNode(_component_v_icon, {
                              size: "18",
                              color: "primary",
                              icon: templateIcon(template.id)
                            }, null, 8, ["icon"]),
                            _createElementVNode("strong", _hoisted_45, _toDisplayString(template.name), 1)
                          ]),
                          _createElementVNode("p", _hoisted_46, _toDisplayString(template.description), 1),
                          _createVNode(_component_v_btn, {
                            block: "",
                            size: "small",
                            color: "primary",
                            variant: "tonal",
                            rounded: "lg",
                            "prepend-icon": "mdi-import",
                            onClick: ($event) => importTemplate(template)
                          }, {
                            default: _withCtx(() => [..._cache[56] || (_cache[56] = [
                              _createTextVNode(" 导入此模板 ", -1)
                            ])]),
                            _: 1
                          }, 8, ["onClick"])
                        ]);
                      }), 128))
                    ])
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, { class: "seed-dialog__footer" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    _createVNode(_component_v_btn, {
                      color: "primary",
                      variant: "flat",
                      rounded: "lg",
                      class: "px-5",
                      onClick: _cache[18] || (_cache[18] = ($event) => templatesDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[57] || (_cache[57] = [
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
          "onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => runDialog.value = $event),
          "max-width": "460"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, { class: "seed-dialog" }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "seed-dialog__header text-error" }, {
                  default: _withCtx(() => [
                    _createElementVNode("span", _hoisted_47, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-alert",
                        size: "20",
                        color: "error"
                      }),
                      _cache[58] || (_cache[58] = _createElementVNode("span", null, "确认立即执行真实清理？", -1))
                    ]),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      rounded: "lg",
                      onClick: _cache[20] || (_cache[20] = ($event) => runDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, { class: "seed-dialog__body" }, {
                  default: _withCtx(() => [..._cache[59] || (_cache[59] = [
                    _createElementVNode("div", { class: "text-body-2 text-medium-emphasis" }, " 将按当前启用规则直接删除命中的下载器任务；开启「连同源文件删除」的规则所删数据不可恢复。建议执行前先通过「干跑预览」核对命中列表。 ", -1)
                  ])]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, { class: "seed-dialog__footer" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    _createVNode(_component_v_btn, {
                      variant: "text",
                      rounded: "lg",
                      onClick: _cache[21] || (_cache[21] = ($event) => runDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[60] || (_cache[60] = [
                        _createTextVNode("取消", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "error",
                      variant: "flat",
                      rounded: "lg",
                      class: "px-5",
                      "prepend-icon": "mdi-delete",
                      onClick: executeCleanup
                    }, {
                      default: _withCtx(() => [..._cache[61] || (_cache[61] = [
                        _createTextVNode(" 确认清理 ", -1)
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
          "onUpdate:modelValue": _cache[25] || (_cache[25] = ($event) => clearHistoryDialog.value = $event),
          "max-width": "420"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, { class: "seed-dialog" }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "seed-dialog__header text-error" }, {
                  default: _withCtx(() => [
                    _createElementVNode("span", _hoisted_48, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-delete-sweep",
                        size: "20",
                        color: "error"
                      }),
                      _cache[62] || (_cache[62] = _createElementVNode("span", null, "清空清理历史", -1))
                    ]),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      rounded: "lg",
                      onClick: _cache[23] || (_cache[23] = ($event) => clearHistoryDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, { class: "seed-dialog__body" }, {
                  default: _withCtx(() => [..._cache[63] || (_cache[63] = [
                    _createElementVNode("div", { class: "text-body-2 text-medium-emphasis" }, "仅清空插件内的历史审计记录，不影响下载器任务或媒体库文件。", -1)
                  ])]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, { class: "seed-dialog__footer" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    _createVNode(_component_v_btn, {
                      variant: "text",
                      rounded: "lg",
                      onClick: _cache[24] || (_cache[24] = ($event) => clearHistoryDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[64] || (_cache[64] = [
                        _createTextVNode("取消", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "error",
                      variant: "flat",
                      rounded: "lg",
                      class: "px-5",
                      onClick: clearHistory
                    }, {
                      default: _withCtx(() => [..._cache[65] || (_cache[65] = [
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
          "onUpdate:modelValue": _cache[30] || (_cache[30] = ($event) => regexDialog.value = $event),
          "max-width": "640",
          scrollable: ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_card, { class: "seed-dialog" }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "seed-dialog__header" }, {
                  default: _withCtx(() => [
                    _createElementVNode("span", _hoisted_49, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-regex",
                        size: "20",
                        color: "primary"
                      }),
                      _cache[66] || (_cache[66] = _createElementVNode("span", null, "正则表达式实时测试", -1))
                    ]),
                    _createVNode(_component_v_btn, {
                      icon: "mdi-close",
                      variant: "text",
                      size: "small",
                      rounded: "lg",
                      onClick: _cache[26] || (_cache[26] = ($event) => regexDialog.value = false)
                    })
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_text, { class: "seed-dialog__body" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_alert, {
                      type: "info",
                      variant: "tonal",
                      density: "compact",
                      rounded: "lg",
                      class: "text-caption"
                    }, {
                      default: _withCtx(() => [..._cache[67] || (_cache[67] = [
                        _createTextVNode(" 后端使用 Python ", -1),
                        _createElementVNode("code", null, "re.IGNORECASE", -1),
                        _createTextVNode(" 引擎，与实际清理规则完全一致；输入即自动测试。 ", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_textarea, {
                      modelValue: regexForm.pattern,
                      "onUpdate:modelValue": _cache[27] || (_cache[27] = ($event) => regexForm.pattern = $event),
                      label: "正则表达式",
                      rows: "2",
                      "auto-grow": "",
                      density: "compact",
                      variant: "outlined",
                      "hide-details": "",
                      placeholder: "unregistered|not registered|不存在"
                    }, null, 8, ["modelValue"]),
                    _createVNode(_component_v_textarea, {
                      modelValue: regexForm.text,
                      "onUpdate:modelValue": _cache[28] || (_cache[28] = ($event) => regexForm.text = $event),
                      label: "待测试文本",
                      rows: "3",
                      "auto-grow": "",
                      density: "compact",
                      variant: "outlined",
                      "hide-details": "",
                      placeholder: "Tracker 返回：Unregistered torrent"
                    }, null, 8, ["modelValue"]),
                    regexTesting.value ? (_openBlock(), _createBlock(_component_v_progress_linear, {
                      key: 0,
                      indeterminate: "",
                      color: "primary",
                      rounded: ""
                    })) : _createCommentVNode("", true),
                    regexResult.value ? (_openBlock(), _createBlock(_component_v_alert, {
                      key: 1,
                      type: !regexResult.value.valid ? "error" : regexResult.value.matched ? "success" : "warning",
                      variant: "tonal",
                      density: "compact",
                      rounded: "lg",
                      class: "text-body-2"
                    }, {
                      default: _withCtx(() => [
                        !regexResult.value.valid ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                          _createTextVNode("非法正则：" + _toDisplayString(regexResult.value.error), 1)
                        ], 64)) : regexResult.value.matched ? (_openBlock(), _createElementBlock(_Fragment, { key: 1 }, [
                          _cache[68] || (_cache[68] = _createTextVNode(" 匹配成功：", -1)),
                          _createElementVNode("code", null, _toDisplayString(regexResult.value.match), 1),
                          regexResult.value.groups?.length ? (_openBlock(), _createElementBlock("div", _hoisted_50, " 捕获组：" + _toDisplayString(regexResult.value.groups.join("、")), 1)) : _createCommentVNode("", true)
                        ], 64)) : (_openBlock(), _createElementBlock(_Fragment, { key: 2 }, [
                          _createTextVNode("表达式合法，但未命中待测文本。")
                        ], 64))
                      ]),
                      _: 1
                    }, 8, ["type"])) : _createCommentVNode("", true)
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_card_actions, { class: "seed-dialog__footer" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_spacer),
                    _createVNode(_component_v_btn, {
                      variant: "text",
                      rounded: "lg",
                      onClick: _cache[29] || (_cache[29] = ($event) => regexDialog.value = false)
                    }, {
                      default: _withCtx(() => [..._cache[69] || (_cache[69] = [
                        _createTextVNode("关闭", -1)
                      ])]),
                      _: 1
                    }),
                    _createVNode(_component_v_btn, {
                      color: "primary",
                      variant: "flat",
                      rounded: "lg",
                      class: "px-5",
                      loading: regexTesting.value,
                      onClick: testRegex
                    }, {
                      default: _withCtx(() => [..._cache[70] || (_cache[70] = [
                        _createTextVNode(" 立即测试 ", -1)
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
          "onUpdate:modelValue": _cache[31] || (_cache[31] = ($event) => snackbar.show = $event),
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

const AppPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-68295eef"]]);

export { AppPage as default };
