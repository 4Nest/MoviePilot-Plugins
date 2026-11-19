import { importShared } from './__federation_fn_import-JrT3xvdd.js';
import Config, { _ as _export_sfc } from './__federation_expose_Config-CXb-NGeu.js';

function formatBytes(bytes) {
  const num = Number(bytes || 0);
  if (!Number.isFinite(num) || num <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let val = num;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx += 1;
  }
  return `${val.toFixed(val >= 100 ? 0 : 2)} ${units[idx]}`;
}

const {defineComponent:_defineComponent} = await importShared('vue');

const {resolveComponent:_resolveComponent,createVNode:_createVNode,createElementVNode:_createElementVNode,toDisplayString:_toDisplayString,createTextVNode:_createTextVNode,withCtx:_withCtx,normalizeClass:_normalizeClass,openBlock:_openBlock,createElementBlock:_createElementBlock,createCommentVNode:_createCommentVNode,unref:_unref,renderList:_renderList,Fragment:_Fragment,withModifiers:_withModifiers,createBlock:_createBlock} = await importShared('vue');

const _hoisted_1 = { class: "mv-page" };
const _hoisted_2 = { class: "mv-header" };
const _hoisted_3 = { class: "mv-title" };
const _hoisted_4 = { class: "mv-header__actions" };
const _hoisted_5 = { class: "mv-pills" };
const _hoisted_6 = {
  key: 0,
  class: "mv-pill__badge"
};
const _hoisted_7 = { class: "mv-card" };
const _hoisted_8 = { class: "mv-card__value" };
const _hoisted_9 = { class: "mv-card__meta" };
const _hoisted_10 = { class: "mv-card" };
const _hoisted_11 = { class: "mv-card__meta" };
const _hoisted_12 = { class: "mv-card" };
const _hoisted_13 = { class: "mv-card__value" };
const _hoisted_14 = { class: "mv-card__meta" };
const _hoisted_15 = { class: "mv-card" };
const _hoisted_16 = { class: "mv-card__value" };
const _hoisted_17 = { class: "mv-card__meta" };
const _hoisted_18 = { class: "mv-card mt-3" };
const _hoisted_19 = { class: "mv-ops-head" };
const _hoisted_20 = {
  key: 0,
  class: "mv-pair-strip mt-3"
};
const _hoisted_21 = ["onClick"];
const _hoisted_22 = { class: "mv-pair-chip__top" };
const _hoisted_23 = { class: "mv-pair-chip__name" };
const _hoisted_24 = {
  key: 0,
  class: "mv-pair-chip__tag"
};
const _hoisted_25 = ["onClick"];
const _hoisted_26 = { class: "mv-pair-chip__path" };
const _hoisted_27 = { class: "mv-tile-grid mt-3" };
const _hoisted_28 = ["disabled"];
const _hoisted_29 = { class: "mv-tile__icon" };
const _hoisted_30 = { class: "mv-tile__body" };
const _hoisted_31 = { class: "mv-tile__title" };
const _hoisted_32 = ["disabled"];
const _hoisted_33 = { class: "mv-tile__icon" };
const _hoisted_34 = { class: "mv-tile__body" };
const _hoisted_35 = { class: "mv-tile__title" };
const _hoisted_36 = ["disabled"];
const _hoisted_37 = { class: "mv-tile__icon" };
const _hoisted_38 = { class: "mv-tile__body" };
const _hoisted_39 = { class: "mv-tile__title" };
const _hoisted_40 = ["disabled"];
const _hoisted_41 = { class: "mv-tile__icon" };
const _hoisted_42 = { class: "mv-tile__body" };
const _hoisted_43 = { class: "mv-tile__title" };
const _hoisted_44 = { class: "mv-card mv-card--full" };
const _hoisted_45 = { class: "mv-action-grid mt-3" };
const _hoisted_46 = { class: "mv-card mv-card--full" };
const _hoisted_47 = { class: "mv-action-grid mt-3" };
const _hoisted_48 = {
  key: 1,
  class: "mv-table-card"
};
const _hoisted_49 = { class: "mv-table-head" };
const _hoisted_50 = { class: "d-flex flex-wrap ga-2" };
const _hoisted_51 = {
  key: 0,
  class: "mv-empty-box"
};
const _hoisted_52 = { class: "text-no-wrap" };
const _hoisted_53 = { class: "font-weight-medium" };
const _hoisted_54 = { class: "text-caption text-medium-emphasis" };
const _hoisted_55 = { class: "text-no-wrap" };
const _hoisted_56 = { class: "mv-err-cell" };
const _hoisted_57 = { class: "text-no-wrap" };
const _hoisted_58 = { class: "text-right text-no-wrap" };
const _hoisted_59 = { class: "mv-card" };
const _hoisted_60 = { class: "d-flex ga-2 mt-3" };
const _hoisted_61 = {
  key: 0,
  class: "mv-parsed-box mt-3"
};
const _hoisted_62 = { class: "font-weight-medium" };
const _hoisted_63 = { class: "text-caption text-medium-emphasis" };
const _hoisted_64 = { class: "mv-table-card mt-3" };
const _hoisted_65 = {
  key: 0,
  class: "mv-empty-box"
};
const _hoisted_66 = { class: "text-no-wrap" };
const _hoisted_67 = {
  key: 3,
  class: "mv-table-card"
};
const _hoisted_68 = { class: "mv-table-head" };
const _hoisted_69 = { class: "d-flex ga-2 align-center" };
const _hoisted_70 = {
  key: 0,
  class: "mv-empty-box"
};
const _hoisted_71 = { class: "text-no-wrap" };
const _hoisted_72 = { class: "text-no-wrap" };
const _hoisted_73 = { class: "text-no-wrap" };
const _hoisted_74 = { class: "mv-err-cell" };
const _hoisted_75 = { class: "mv-dialog__header" };
const _hoisted_76 = { class: "d-flex align-center ga-2" };
const _hoisted_77 = { class: "text-caption text-medium-emphasis mt-3" };
const _hoisted_78 = { class: "text-caption text-medium-emphasis mt-1" };
const _hoisted_79 = { class: "d-flex justify-end ga-2 mt-4" };
const _hoisted_80 = { class: "mv-dialog__header" };
const _hoisted_81 = { class: "d-flex align-center ga-2" };
const {computed,inject,onMounted,reactive,ref} = await importShared('vue');
const _sfc_main = /* @__PURE__ */ _defineComponent({
  __name: "AppPage",
  props: {
    api: { type: Object, default: () => ({}) },
    pluginId: { type: String, default: "MediaVaultBridge" },
    navKey: { type: String, default: "main" }
  },
  emits: ["action", "switch", "close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const hostToast = inject("moviepilot:toast", null);
    const activeTab = ref("overview");
    const loading = ref(false);
    const actionBusy = ref("");
    const overview = ref({});
    const config = ref({});
    const failedEvents = ref([]);
    const failedUploadRecords = ref([]);
    const shareRecords = ref([]);
    const logs = ref([]);
    const logKeyword = ref("");
    const settingsDialog = ref(false);
    const shareForm = reactive({
      share_url: "",
      receive_code: "",
      target_path: "",
      parsing: false,
      receiving: false,
      parsed: null
    });
    const quickForm = reactive({
      source_dir: "",
      target_dir: "",
      storage: "115-default"
    });
    const selectedPairId = ref("");
    const savePairDialog = ref(false);
    const newPairName = ref("");
    const savingPair = ref(false);
    const savedPathPairs = computed(() => {
      const list = config.value?.quick_path_pairs;
      return Array.isArray(list) ? list : [];
    });
    const allPathPairs = computed(() => {
      const result = [];
      const seen = /* @__PURE__ */ new Set();
      for (const item of savedPathPairs.value) {
        const key = `${item.source_dir}|${item.target_dir}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ ...item, auto: false });
        }
      }
      const suggested = Array.isArray(overview.value?.suggested_path_pairs) ? overview.value.suggested_path_pairs : [];
      for (const item of suggested) {
        const key = `${item.source_dir}|${item.target_dir}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ ...item, auto: true });
        }
      }
      return result;
    });
    function selectPathPair(pair) {
      selectedPairId.value = pair.id;
      quickForm.source_dir = pair.source_dir || "";
      quickForm.target_dir = pair.target_dir || "";
      quickForm.storage = pair.storage || config.value?.default_storage || "115-default";
    }
    function openSavePairDialog() {
      if (!quickForm.source_dir.trim() && !quickForm.target_dir.trim()) {
        notify("请先填写云盘源目录或 STRM 目标目录", "warning");
        return;
      }
      const guess = quickForm.source_dir.trim().split("/").filter(Boolean).pop() || "自定义路径";
      newPairName.value = guess;
      savePairDialog.value = true;
    }
    async function saveCurrentPathPair() {
      const name = newPairName.value.trim();
      const src = quickForm.source_dir.trim();
      const dst = quickForm.target_dir.trim();
      if (!name || !src && !dst) {
        notify("请填写名称和至少一个目录路径", "warning");
        return;
      }
      savingPair.value = true;
      try {
        const nextPairs = [
          ...savedPathPairs.value,
          {
            id: `pair_${Date.now()}`,
            name,
            source_dir: src,
            target_dir: dst,
            storage: quickForm.storage || config.value?.default_storage || "115-default"
          }
        ];
        const res = await props.api.post(`plugin/${props.pluginId}/quick-paths`, {
          quick_path_pairs: nextPairs
        });
        if (res?.success) {
          config.value = { ...config.value, quick_path_pairs: res.data || nextPairs };
          selectedPairId.value = nextPairs[nextPairs.length - 1].id;
          savePairDialog.value = false;
          notify("已保存为常用路径对", "success");
        } else {
          notify(res?.message || "保存失败", "error");
        }
      } catch (err) {
        notify(err?.message || "保存常用路径对异常", "error");
      } finally {
        savingPair.value = false;
      }
    }
    async function removeSavedPathPair(id) {
      const nextPairs = savedPathPairs.value.filter((item) => item.id !== id);
      try {
        const res = await props.api.post(`plugin/${props.pluginId}/quick-paths`, {
          quick_path_pairs: nextPairs
        });
        if (res?.success) {
          config.value = { ...config.value, quick_path_pairs: res.data || nextPairs };
          if (selectedPairId.value === id) {
            selectedPairId.value = "";
          }
          notify("已移除常用路径对", "success");
        }
      } catch (err) {
        notify(err?.message || "移除失败", "error");
      }
    }
    const snackbar = reactive({ show: false, text: "", color: "success" });
    function notify(text, color = "success") {
      if (hostToast && typeof hostToast[color] === "function") {
        hostToast[color]?.(text);
        return;
      }
      snackbar.text = text;
      snackbar.color = color;
      snackbar.show = true;
    }
    const isConnected = computed(() => Boolean(overview.value?.connected));
    const todayUpload = computed(() => overview.value?.today_upload || {});
    const strmStats = computed(() => overview.value?.strm_stats || {});
    const retryableEvents = computed(
      () => failedEvents.value.filter((ev) => ev.retry_category === "retryable" || ev.retry_category === "clear_lock_retry")
    );
    const manualConfirmEvents = computed(
      () => failedEvents.value.filter((ev) => ev.retry_category === "manual_confirm")
    );
    const filteredLogs = computed(() => {
      const kw = logKeyword.value.trim().toLowerCase();
      if (!kw) return logs.value;
      return logs.value.filter(
        (item) => String(item.summary || "").toLowerCase().includes(kw) || String(item.detail || "").toLowerCase().includes(kw) || String(item.category || "").toLowerCase().includes(kw)
      );
    });
    async function loadOverview() {
      if (!props.api?.get) return;
      loading.value = true;
      try {
        const res = await props.api.get(`plugin/${props.pluginId}/overview`);
        if (res?.success && res.data) {
          overview.value = res.data;
          if (res.data.config) {
            config.value = res.data.config;
            if (!quickForm.source_dir && !quickForm.target_dir) {
              if (allPathPairs.value.length > 0) {
                selectPathPair(allPathPairs.value[0]);
              } else if (res.data.config.path_mappings?.[0]) {
                quickForm.source_dir = res.data.config.path_mappings[0].mv_cloud_prefix || "";
                quickForm.target_dir = res.data.config.path_mappings[0].mv_strm_prefix || "";
              }
            }
            if (!shareForm.target_path && res.data.config.share_transfer?.default_target_path) {
              shareForm.target_path = res.data.config.share_transfer.default_target_path;
            }
          }
        }
      } catch (err) {
        notify(err?.message || "加载 MediaVault 概览失败", "error");
      } finally {
        loading.value = false;
      }
    }
    async function loadFailedUploads() {
      if (!props.api?.get) return;
      loading.value = true;
      try {
        const res = await props.api.get(`plugin/${props.pluginId}/failed-uploads`);
        if (res?.success && res.data) {
          failedEvents.value = res.data.items || [];
          failedUploadRecords.value = res.data.upload_records || [];
        } else if (res?.message) {
          notify(res.message, "warning");
        }
      } catch (err) {
        notify(err?.message || "获取失败上传任务失败", "error");
      } finally {
        loading.value = false;
      }
    }
    async function loadShareRecords() {
      if (!props.api?.get) return;
      try {
        const res = await props.api.get(`plugin/${props.pluginId}/share/records`);
        if (res?.success && res.data) {
          shareRecords.value = res.data.items || res.data.records || [];
        }
      } catch {
      }
    }
    async function loadLogs() {
      if (!props.api?.get) return;
      try {
        const res = await props.api.get(`plugin/${props.pluginId}/logs`);
        if (res?.success) {
          logs.value = res.data || [];
        }
      } catch {
      }
    }
    async function refreshAll() {
      await Promise.all([loadOverview(), loadFailedUploads(), loadShareRecords(), loadLogs()]);
    }
    async function retrySingle(ev, force = false, clearAttempts = false) {
      actionBusy.value = `retry_${ev.id}`;
      try {
        const res = await props.api.post(`plugin/${props.pluginId}/retry-uploads`, {
          event_ids: [ev.id],
          force,
          clear_attempts: clearAttempts
        });
        if (res?.success) {
          notify(res.message || "已提交重试", "success");
          await Promise.all([loadFailedUploads(), loadOverview(), loadLogs()]);
        } else {
          notify(res?.message || "重试失败", "error");
        }
      } catch (err) {
        notify(err?.message || "重试请求异常", "error");
      } finally {
        actionBusy.value = "";
      }
    }
    async function retryAllSafe(clearAttempts = false) {
      if (!retryableEvents.value.length) {
        notify("当前没有可自动重试的失败项", "info");
        return;
      }
      actionBusy.value = clearAttempts ? "retry_clear_all" : "retry_safe";
      try {
        const res = await props.api.post(`plugin/${props.pluginId}/retry-uploads`, {
          event_ids: retryableEvents.value.map((ev) => ev.id),
          force: clearAttempts,
          clear_attempts: clearAttempts
        });
        if (res?.success) {
          notify(res.message || "已批量提交重试", "success");
          await Promise.all([loadFailedUploads(), loadOverview(), loadLogs()]);
        } else {
          notify(res?.message || "批量重试失败", "error");
        }
      } catch (err) {
        notify(err?.message || "批量重试异常", "error");
      } finally {
        actionBusy.value = "";
      }
    }
    async function triggerAction(action, extra = {}) {
      actionBusy.value = action;
      try {
        const res = await props.api.post(`plugin/${props.pluginId}/actions/trigger`, {
          action,
          ...extra
        });
        if (res?.success) {
          notify(res.message || "操作已触发", "success");
          await Promise.all([loadOverview(), loadLogs()]);
        } else {
          notify(res?.message || "操作失败", "error");
        }
      } catch (err) {
        notify(err?.message || "触发操作异常", "error");
      } finally {
        actionBusy.value = "";
      }
    }
    async function parseShare() {
      if (!shareForm.share_url.trim()) {
        notify("请输入 115 分享链接", "warning");
        return;
      }
      shareForm.parsing = true;
      shareForm.parsed = null;
      try {
        const res = await props.api.post(`plugin/${props.pluginId}/share/parse`, {
          share_url: shareForm.share_url.trim()
        });
        if (res?.success) {
          shareForm.parsed = res.data || {};
          notify("分享链接解析成功", "success");
        } else {
          notify(res?.message || "解析失败", "error");
        }
      } catch (err) {
        notify(err?.message || "解析请求异常", "error");
      } finally {
        shareForm.parsing = false;
      }
    }
    async function receiveShare() {
      if (!shareForm.share_url.trim()) {
        notify("请输入 115 分享链接", "warning");
        return;
      }
      shareForm.receiving = true;
      try {
        const res = await props.api.post(`plugin/${props.pluginId}/share/receive`, {
          share_url: shareForm.share_url.trim(),
          receive_code: shareForm.receive_code.trim(),
          target_path: shareForm.target_path.trim()
        });
        if (res?.success) {
          notify(res.message || "已提交转存", "success");
          shareForm.share_url = "";
          shareForm.receive_code = "";
          shareForm.parsed = null;
          await Promise.all([loadShareRecords(), loadLogs()]);
        } else {
          notify(res?.message || "转存失败", "error");
        }
      } catch (err) {
        notify(err?.message || "转存请求异常", "error");
      } finally {
        shareForm.receiving = false;
      }
    }
    async function clearLogs() {
      try {
        const res = await props.api.post(`plugin/${props.pluginId}/logs/clear`, {});
        if (res?.success) {
          logs.value = [];
          notify("联动日志已清空", "success");
        }
      } catch (err) {
        notify(err?.message || "清空失败", "error");
      }
    }
    async function handleSaveConfig(newCfg) {
      try {
        const res = await props.api.post(`plugin/${props.pluginId}/config`, newCfg);
        if (res?.success) {
          config.value = res.data || newCfg;
          settingsDialog.value = false;
          notify("配置已保存并生效", "success");
          await refreshAll();
        } else {
          notify(res?.message || "保存配置失败", "error");
        }
      } catch (err) {
        notify(err?.message || "保存配置异常", "error");
      }
    }
    onMounted(() => {
      refreshAll();
    });
    return (_ctx, _cache) => {
      const _component_VIcon = _resolveComponent("VIcon");
      const _component_VChip = _resolveComponent("VChip");
      const _component_VBtn = _resolveComponent("VBtn");
      const _component_VCol = _resolveComponent("VCol");
      const _component_VRow = _resolveComponent("VRow");
      const _component_VTextField = _resolveComponent("VTextField");
      const _component_VTable = _resolveComponent("VTable");
      const _component_VCardText = _resolveComponent("VCardText");
      const _component_VCard = _resolveComponent("VCard");
      const _component_VDialog = _resolveComponent("VDialog");
      const _component_VSnackbar = _resolveComponent("VSnackbar");
      return _openBlock(), _createElementBlock("div", _hoisted_1, [
        _createElementVNode("div", _hoisted_2, [
          _createElementVNode("div", null, [
            _createElementVNode("div", _hoisted_3, [
              _createVNode(_component_VIcon, {
                icon: "mdi-cloud-upload",
                size: "22",
                color: "primary"
              }),
              _cache[34] || (_cache[34] = _createElementVNode("span", null, "MediaVault 联动管家", -1)),
              _createVNode(_component_VChip, {
                size: "x-small",
                variant: "tonal",
                color: isConnected.value ? "success" : "warning"
              }, {
                default: _withCtx(() => [
                  _createTextVNode(_toDisplayString(isConnected.value ? `已连接 ${overview.value.health?.version || ""}` : "未连接"), 1)
                ]),
                _: 1
              }, 8, ["color"])
            ]),
            _cache[35] || (_cache[35] = _createElementVNode("div", { class: "mv-subtitle" }, " 115 上传失败智能重试、入库精准 STRM/刮削、删片清理、Emby 后处理与分享链直连转存 ", -1))
          ]),
          _createElementVNode("div", _hoisted_4, [
            _createVNode(_component_VBtn, {
              size: "small",
              variant: "tonal",
              "prepend-icon": "mdi-refresh",
              loading: loading.value,
              onClick: refreshAll
            }, {
              default: _withCtx(() => [..._cache[36] || (_cache[36] = [
                _createTextVNode(" 刷新 ", -1)
              ])]),
              _: 1
            }, 8, ["loading"]),
            _createVNode(_component_VBtn, {
              size: "small",
              variant: "tonal",
              color: "primary",
              "prepend-icon": "mdi-cog",
              onClick: _cache[0] || (_cache[0] = ($event) => settingsDialog.value = true)
            }, {
              default: _withCtx(() => [..._cache[37] || (_cache[37] = [
                _createTextVNode(" 联动配置 ", -1)
              ])]),
              _: 1
            })
          ])
        ]),
        _createElementVNode("div", _hoisted_5, [
          _createElementVNode("button", {
            type: "button",
            class: _normalizeClass(["mv-pill", { "is-active": activeTab.value === "overview" }]),
            onClick: _cache[1] || (_cache[1] = ($event) => activeTab.value = "overview")
          }, [
            _createVNode(_component_VIcon, {
              icon: "mdi-server",
              size: "16"
            }),
            _cache[38] || (_cache[38] = _createTextVNode(" 总览与运维 ", -1))
          ], 2),
          _createElementVNode("button", {
            type: "button",
            class: _normalizeClass(["mv-pill", { "is-active": activeTab.value === "failed" }]),
            onClick: _cache[2] || (_cache[2] = ($event) => activeTab.value = "failed")
          }, [
            _createVNode(_component_VIcon, {
              icon: "mdi-restart",
              size: "16"
            }),
            _cache[39] || (_cache[39] = _createTextVNode(" 上传失败重试 ", -1)),
            failedEvents.value.length ? (_openBlock(), _createElementBlock("span", _hoisted_6, _toDisplayString(failedEvents.value.length), 1)) : _createCommentVNode("", true)
          ], 2),
          _createElementVNode("button", {
            type: "button",
            class: _normalizeClass(["mv-pill", { "is-active": activeTab.value === "share" }]),
            onClick: _cache[3] || (_cache[3] = ($event) => activeTab.value = "share")
          }, [
            _createVNode(_component_VIcon, {
              icon: "mdi-share-variant",
              size: "16"
            }),
            _cache[40] || (_cache[40] = _createTextVNode(" 115 分享转存 ", -1))
          ], 2),
          _createElementVNode("button", {
            type: "button",
            class: _normalizeClass(["mv-pill", { "is-active": activeTab.value === "logs" }]),
            onClick: _cache[4] || (_cache[4] = ($event) => activeTab.value = "logs")
          }, [
            _createVNode(_component_VIcon, {
              icon: "mdi-history",
              size: "16"
            }),
            _cache[41] || (_cache[41] = _createTextVNode(" 联动日志 ", -1))
          ], 2)
        ]),
        activeTab.value === "overview" ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
          _createVNode(_component_VRow, {
            dense: "",
            class: "mv-stats-grid"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_VCol, {
                cols: "12",
                sm: "6",
                md: "3"
              }, {
                default: _withCtx(() => [
                  _createElementVNode("div", _hoisted_7, [
                    _cache[42] || (_cache[42] = _createElementVNode("div", { class: "mv-card__label" }, "今日 115 上传", -1)),
                    _createElementVNode("div", _hoisted_8, _toDisplayString(todayUpload.value.count ?? 0), 1),
                    _createElementVNode("div", _hoisted_9, " 秒传 " + _toDisplayString(todayUpload.value.instant_count ?? 0) + " · " + _toDisplayString(_unref(formatBytes)(todayUpload.value.bytes)), 1)
                  ])
                ]),
                _: 1
              }),
              _createVNode(_component_VCol, {
                cols: "12",
                sm: "6",
                md: "3"
              }, {
                default: _withCtx(() => [
                  _createElementVNode("div", _hoisted_10, [
                    _cache[43] || (_cache[43] = _createElementVNode("div", { class: "mv-card__label" }, "待处理上传失败", -1)),
                    _createElementVNode("div", {
                      class: _normalizeClass(["mv-card__value", failedEvents.value.length ? "text-error" : "text-success"])
                    }, _toDisplayString(failedEvents.value.length), 3),
                    _createElementVNode("div", _hoisted_11, " 可安全重试 " + _toDisplayString(retryableEvents.value.length) + " · 需核对 " + _toDisplayString(manualConfirmEvents.value.length), 1)
                  ])
                ]),
                _: 1
              }),
              _createVNode(_component_VCol, {
                cols: "12",
                sm: "6",
                md: "3"
              }, {
                default: _withCtx(() => [
                  _createElementVNode("div", _hoisted_12, [
                    _cache[44] || (_cache[44] = _createElementVNode("div", { class: "mv-card__label" }, "STRM 索引总数", -1)),
                    _createElementVNode("div", _hoisted_13, _toDisplayString(strmStats.value.total ?? 0), 1),
                    _createElementVNode("div", _hoisted_14, _toDisplayString(overview.value.strm_gen_status?.running ? "STRM 生成中..." : "当前空闲"), 1)
                  ])
                ]),
                _: 1
              }),
              _createVNode(_component_VCol, {
                cols: "12",
                sm: "6",
                md: "3"
              }, {
                default: _withCtx(() => [
                  _createElementVNode("div", _hoisted_15, [
                    _cache[45] || (_cache[45] = _createElementVNode("div", { class: "mv-card__label" }, "Emby 增强统计", -1)),
                    _createElementVNode("div", _hoisted_16, _toDisplayString(overview.value.emby?.mediainfo?.backed_up ?? 0), 1),
                    _createElementVNode("div", _hoisted_17, " MediaInfo 待补 " + _toDisplayString(overview.value.emby?.mediainfo?.pending ?? 0) + " · 缩略图 " + _toDisplayString(overview.value.emby?.thumbnail?.done ?? 0), 1)
                  ])
                ]),
                _: 1
              })
            ]),
            _: 1
          }),
          _createElementVNode("div", _hoisted_18, [
            _createElementVNode("div", _hoisted_19, [
              _cache[47] || (_cache[47] = _createElementVNode("div", null, [
                _createElementVNode("div", { class: "mv-section-title" }, "目录级快捷运维"),
                _createElementVNode("div", { class: "mv-subtitle" }, "点击常用路径对一键切换（自动合并 MediaVault 启用监控规则），或微调后存为常用")
              ], -1)),
              _createVNode(_component_VBtn, {
                size: "small",
                variant: "tonal",
                color: "primary",
                "prepend-icon": "mdi-plus",
                onClick: openSavePairDialog
              }, {
                default: _withCtx(() => [..._cache[46] || (_cache[46] = [
                  _createTextVNode(" 存为常用 ", -1)
                ])]),
                _: 1
              })
            ]),
            allPathPairs.value.length ? (_openBlock(), _createElementBlock("div", _hoisted_20, [
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(allPathPairs.value, (pair) => {
                return _openBlock(), _createElementBlock("div", {
                  key: pair.id,
                  class: _normalizeClass(["mv-pair-chip", { "is-active": selectedPairId.value === pair.id }]),
                  onClick: ($event) => selectPathPair(pair)
                }, [
                  _createElementVNode("div", _hoisted_22, [
                    _createVNode(_component_VIcon, {
                      icon: "mdi-folder-outline",
                      size: "15"
                    }),
                    _createElementVNode("span", _hoisted_23, _toDisplayString(pair.name), 1),
                    pair.auto ? (_openBlock(), _createElementBlock("span", _hoisted_24, "MV")) : (_openBlock(), _createElementBlock("button", {
                      key: 1,
                      type: "button",
                      class: "mv-pair-chip__del",
                      title: "移除常用路径对",
                      onClick: _withModifiers(($event) => removeSavedPathPair(pair.id), ["stop"])
                    }, [
                      _createVNode(_component_VIcon, {
                        icon: "mdi-close",
                        size: "13"
                      })
                    ], 8, _hoisted_25))
                  ]),
                  _createElementVNode("div", _hoisted_26, _toDisplayString(pair.source_dir || "-") + " → " + _toDisplayString(pair.target_dir || "默认 STRM"), 1)
                ], 10, _hoisted_21);
              }), 128))
            ])) : _createCommentVNode("", true),
            _createVNode(_component_VRow, {
              dense: "",
              class: "mt-3"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_VCol, {
                  cols: "12",
                  md: "6"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VTextField, {
                      modelValue: quickForm.source_dir,
                      "onUpdate:modelValue": [
                        _cache[5] || (_cache[5] = ($event) => quickForm.source_dir = $event),
                        _cache[6] || (_cache[6] = ($event) => selectedPairId.value = "")
                      ],
                      label: "云盘源目录（115 网盘路径）",
                      placeholder: "/media",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": ""
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
                      modelValue: quickForm.target_dir,
                      "onUpdate:modelValue": [
                        _cache[7] || (_cache[7] = ($event) => quickForm.target_dir = $event),
                        _cache[8] || (_cache[8] = ($event) => selectedPairId.value = "")
                      ],
                      label: "STRM 目标目录（本地 STRM 路径）",
                      placeholder: "/media/strm",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": ""
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createElementVNode("div", _hoisted_27, [
              _createElementVNode("button", {
                type: "button",
                class: "mv-tile",
                disabled: actionBusy.value === "strm_generate",
                onClick: _cache[9] || (_cache[9] = ($event) => triggerAction("strm_generate", { source_dir: quickForm.source_dir, target_dir: quickForm.target_dir, storage: quickForm.storage }))
              }, [
                _createElementVNode("div", _hoisted_29, [
                  _createVNode(_component_VIcon, {
                    icon: "mdi-folder-outline",
                    size: "18",
                    color: "primary"
                  })
                ]),
                _createElementVNode("div", _hoisted_30, [
                  _createElementVNode("div", _hoisted_31, _toDisplayString(actionBusy.value === "strm_generate" ? "生成中..." : "增量生成 STRM"), 1),
                  _cache[48] || (_cache[48] = _createElementVNode("div", { class: "mv-tile__desc" }, "按当前云盘源目录生成到 STRM 目标目录", -1))
                ])
              ], 8, _hoisted_28),
              _createElementVNode("button", {
                type: "button",
                class: "mv-tile",
                disabled: actionBusy.value === "scrape",
                onClick: _cache[10] || (_cache[10] = ($event) => triggerAction("scrape", { target_dir: quickForm.target_dir || quickForm.source_dir }))
              }, [
                _createElementVNode("div", _hoisted_33, [
                  _createVNode(_component_VIcon, {
                    icon: "mdi-auto-fix",
                    size: "18",
                    color: "primary"
                  })
                ]),
                _createElementVNode("div", _hoisted_34, [
                  _createElementVNode("div", _hoisted_35, _toDisplayString(actionBusy.value === "scrape" ? "刮削中..." : "目录刮削"), 1),
                  _cache[49] || (_cache[49] = _createElementVNode("div", { class: "mv-tile__desc" }, "补齐当前 STRM 目录的元数据与图片", -1))
                ])
              ], 8, _hoisted_32),
              _createElementVNode("button", {
                type: "button",
                class: "mv-tile",
                disabled: actionBusy.value === "cleanup_scan",
                onClick: _cache[11] || (_cache[11] = ($event) => triggerAction("cleanup_scan", { source_dir: quickForm.source_dir, target_dir: quickForm.target_dir, storage: quickForm.storage }))
              }, [
                _createElementVNode("div", _hoisted_37, [
                  _createVNode(_component_VIcon, {
                    icon: "mdi-broom",
                    size: "18"
                  })
                ]),
                _createElementVNode("div", _hoisted_38, [
                  _createElementVNode("div", _hoisted_39, _toDisplayString(actionBusy.value === "cleanup_scan" ? "扫描中..." : "失效 STRM 扫描"), 1),
                  _cache[50] || (_cache[50] = _createElementVNode("div", { class: "mv-tile__desc" }, "比对云盘与 STRM 目录检测失效索引", -1))
                ])
              ], 8, _hoisted_36),
              _createElementVNode("button", {
                type: "button",
                class: "mv-tile",
                disabled: actionBusy.value === "orphan_scan",
                onClick: _cache[12] || (_cache[12] = ($event) => triggerAction("orphan_scan", { source_dir: quickForm.source_dir, storage: quickForm.storage }))
              }, [
                _createElementVNode("div", _hoisted_41, [
                  _createVNode(_component_VIcon, {
                    icon: "mdi-database",
                    size: "18"
                  })
                ]),
                _createElementVNode("div", _hoisted_42, [
                  _createElementVNode("div", _hoisted_43, _toDisplayString(actionBusy.value === "orphan_scan" ? "扫描中..." : "孤立索引扫描"), 1),
                  _cache[51] || (_cache[51] = _createElementVNode("div", { class: "mv-tile__desc" }, "排查当前云盘目录中的孤立记录", -1))
                ])
              ], 8, _hoisted_40)
            ])
          ]),
          _createVNode(_component_VRow, {
            dense: "",
            class: "mt-3"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_VCol, {
                cols: "12",
                md: "5"
              }, {
                default: _withCtx(() => [
                  _createElementVNode("div", _hoisted_44, [
                    _cache[54] || (_cache[54] = _createElementVNode("div", { class: "mv-section-title" }, "监控与 115 维护", -1)),
                    _cache[55] || (_cache[55] = _createElementVNode("div", { class: "mv-subtitle" }, "无需路径参数，作用于整个 MediaVault 实例", -1)),
                    _createElementVNode("div", _hoisted_45, [
                      _createVNode(_component_VBtn, {
                        size: "small",
                        variant: "tonal",
                        color: "primary",
                        "prepend-icon": "mdi-play",
                        loading: actionBusy.value === "monitor_sync",
                        onClick: _cache[13] || (_cache[13] = ($event) => triggerAction("monitor_sync"))
                      }, {
                        default: _withCtx(() => [..._cache[52] || (_cache[52] = [
                          _createTextVNode(" 监控增量同步 ", -1)
                        ])]),
                        _: 1
                      }, 8, ["loading"]),
                      _createVNode(_component_VBtn, {
                        size: "small",
                        variant: "tonal",
                        "prepend-icon": "mdi-broom",
                        loading: actionBusy.value === "clear_115_attempts",
                        onClick: _cache[14] || (_cache[14] = ($event) => triggerAction("clear_115_attempts"))
                      }, {
                        default: _withCtx(() => [..._cache[53] || (_cache[53] = [
                          _createTextVNode(" 清理 115 锁文件 (.json) ", -1)
                        ])]),
                        _: 1
                      }, 8, ["loading"])
                    ])
                  ])
                ]),
                _: 1
              }),
              _createVNode(_component_VCol, {
                cols: "12",
                md: "7"
              }, {
                default: _withCtx(() => [
                  _createElementVNode("div", _hoisted_46, [
                    _cache[61] || (_cache[61] = _createElementVNode("div", { class: "mv-section-title" }, "Emby 增强后处理", -1)),
                    _cache[62] || (_cache[62] = _createElementVNode("div", { class: "mv-subtitle" }, "针对缺失项增量提取，或一键重试失败任务", -1)),
                    _createElementVNode("div", _hoisted_47, [
                      _createVNode(_component_VBtn, {
                        size: "small",
                        variant: "tonal",
                        "prepend-icon": "mdi-filmstrip",
                        loading: actionBusy.value === "emby_mediainfo",
                        onClick: _cache[15] || (_cache[15] = ($event) => triggerAction("emby_mediainfo"))
                      }, {
                        default: _withCtx(() => [..._cache[56] || (_cache[56] = [
                          _createTextVNode(" 提取 MediaInfo ", -1)
                        ])]),
                        _: 1
                      }, 8, ["loading"]),
                      _createVNode(_component_VBtn, {
                        size: "small",
                        variant: "text",
                        "prepend-icon": "mdi-restart",
                        loading: actionBusy.value === "emby_mediainfo_retry",
                        onClick: _cache[16] || (_cache[16] = ($event) => triggerAction("emby_mediainfo_retry"))
                      }, {
                        default: _withCtx(() => [..._cache[57] || (_cache[57] = [
                          _createTextVNode(" 重试失败 ", -1)
                        ])]),
                        _: 1
                      }, 8, ["loading"]),
                      _createVNode(_component_VBtn, {
                        size: "small",
                        variant: "tonal",
                        "prepend-icon": "mdi-image",
                        loading: actionBusy.value === "emby_thumbnail",
                        onClick: _cache[17] || (_cache[17] = ($event) => triggerAction("emby_thumbnail"))
                      }, {
                        default: _withCtx(() => [..._cache[58] || (_cache[58] = [
                          _createTextVNode(" 生成缩略图 ", -1)
                        ])]),
                        _: 1
                      }, 8, ["loading"]),
                      _createVNode(_component_VBtn, {
                        size: "small",
                        variant: "text",
                        "prepend-icon": "mdi-restart",
                        loading: actionBusy.value === "emby_thumbnail_retry",
                        onClick: _cache[18] || (_cache[18] = ($event) => triggerAction("emby_thumbnail_retry"))
                      }, {
                        default: _withCtx(() => [..._cache[59] || (_cache[59] = [
                          _createTextVNode(" 重试失败 ", -1)
                        ])]),
                        _: 1
                      }, 8, ["loading"]),
                      _createVNode(_component_VBtn, {
                        size: "small",
                        variant: "tonal",
                        "prepend-icon": "mdi-tune",
                        loading: actionBusy.value === "emby_intro_skip",
                        onClick: _cache[19] || (_cache[19] = ($event) => triggerAction("emby_intro_skip"))
                      }, {
                        default: _withCtx(() => [..._cache[60] || (_cache[60] = [
                          _createTextVNode(" 片头片尾检测 ", -1)
                        ])]),
                        _: 1
                      }, 8, ["loading"])
                    ])
                  ])
                ]),
                _: 1
              })
            ]),
            _: 1
          })
        ], 64)) : activeTab.value === "failed" ? (_openBlock(), _createElementBlock("div", _hoisted_48, [
          _createElementVNode("div", _hoisted_49, [
            _cache[64] || (_cache[64] = _createElementVNode("div", null, [
              _createElementVNode("div", { class: "mv-section-title" }, "115 监控上传失败队列"),
              _createElementVNode("div", { class: "mv-subtitle" }, " 绿色标签为可安全重试项；橙色标签命中“勿重复上传/请先核对云盘文件”等保护词，自动巡检会跳过，可核对后手动强制重试。 ")
            ], -1)),
            _createElementVNode("div", _hoisted_50, [
              _createVNode(_component_VBtn, {
                size: "small",
                variant: "tonal",
                "prepend-icon": "mdi-broom",
                loading: actionBusy.value === "clear_115_attempts",
                onClick: _cache[20] || (_cache[20] = ($event) => triggerAction("clear_115_attempts"))
              }, {
                default: _withCtx(() => [..._cache[63] || (_cache[63] = [
                  _createTextVNode(" 清理 115 锁文件 (.json) ", -1)
                ])]),
                _: 1
              }, 8, ["loading"]),
              _createVNode(_component_VBtn, {
                size: "small",
                variant: "tonal",
                color: "primary",
                "prepend-icon": "mdi-restart",
                loading: actionBusy.value === "retry_clear_all",
                disabled: !retryableEvents.value.length,
                onClick: _cache[21] || (_cache[21] = ($event) => retryAllSafe(true))
              }, {
                default: _withCtx(() => [
                  _createTextVNode(" 清锁并批量重传 (" + _toDisplayString(retryableEvents.value.length) + ") ", 1)
                ]),
                _: 1
              }, 8, ["loading", "disabled"])
            ])
          ]),
          !failedEvents.value.length ? (_openBlock(), _createElementBlock("div", _hoisted_51, [
            _createVNode(_component_VIcon, {
              icon: "mdi-check-circle",
              size: "30",
              color: "success"
            }),
            _cache[65] || (_cache[65] = _createElementVNode("div", null, "当前没有失败的 115 上传任务", -1))
          ])) : (_openBlock(), _createBlock(_component_VTable, {
            key: 1,
            density: "comfortable"
          }, {
            default: _withCtx(() => [
              _cache[68] || (_cache[68] = _createElementVNode("thead", null, [
                _createElementVNode("tr", null, [
                  _createElementVNode("th", null, "ID"),
                  _createElementVNode("th", null, "文件名 / 目标路径"),
                  _createElementVNode("th", null, "分类"),
                  _createElementVNode("th", null, "失败原因"),
                  _createElementVNode("th", null, "自动次数"),
                  _createElementVNode("th", { class: "text-right" }, "操作")
                ])
              ], -1)),
              _createElementVNode("tbody", null, [
                (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(failedEvents.value, (ev) => {
                  return _openBlock(), _createElementBlock("tr", {
                    key: ev.id
                  }, [
                    _createElementVNode("td", _hoisted_52, "#" + _toDisplayString(ev.id), 1),
                    _createElementVNode("td", null, [
                      _createElementVNode("div", _hoisted_53, _toDisplayString(ev.file_name || "-"), 1),
                      _createElementVNode("div", _hoisted_54, _toDisplayString(ev.dest_path || ev.file_path), 1)
                    ]),
                    _createElementVNode("td", _hoisted_55, [
                      _createVNode(_component_VChip, {
                        size: "x-small",
                        variant: "tonal",
                        color: ev.retry_category === "retryable" ? "success" : ev.retry_category === "clear_lock_retry" ? "info" : "warning"
                      }, {
                        default: _withCtx(() => [
                          _createTextVNode(_toDisplayString(ev.retry_category === "retryable" ? "可安全重试" : ev.retry_category === "clear_lock_retry" ? "清锁可重传" : "需人工核对"), 1)
                        ]),
                        _: 2
                      }, 1032, ["color"])
                    ]),
                    _createElementVNode("td", _hoisted_56, _toDisplayString(ev.error || ev.message || "-"), 1),
                    _createElementVNode("td", _hoisted_57, _toDisplayString(ev.auto_attempts), 1),
                    _createElementVNode("td", _hoisted_58, [
                      _createVNode(_component_VBtn, {
                        size: "x-small",
                        variant: "tonal",
                        color: "primary",
                        loading: actionBusy.value === `retry_${ev.id}`,
                        onClick: ($event) => retrySingle(ev, true, true)
                      }, {
                        default: _withCtx(() => [..._cache[66] || (_cache[66] = [
                          _createTextVNode(" 清锁重传 ", -1)
                        ])]),
                        _: 1
                      }, 8, ["loading", "onClick"]),
                      _createVNode(_component_VBtn, {
                        size: "x-small",
                        variant: "text",
                        class: "ml-1",
                        loading: actionBusy.value === `retry_${ev.id}`,
                        onClick: ($event) => retrySingle(ev, false, false)
                      }, {
                        default: _withCtx(() => [..._cache[67] || (_cache[67] = [
                          _createTextVNode(" 普通重试 ", -1)
                        ])]),
                        _: 1
                      }, 8, ["loading", "onClick"])
                    ])
                  ]);
                }), 128))
              ])
            ]),
            _: 1
          }))
        ])) : activeTab.value === "share" ? (_openBlock(), _createElementBlock(_Fragment, { key: 2 }, [
          _createElementVNode("div", _hoisted_59, [
            _cache[71] || (_cache[71] = _createElementVNode("div", { class: "mv-section-title" }, "115 分享链接直连转存", -1)),
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
                      modelValue: shareForm.share_url,
                      "onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => shareForm.share_url = $event),
                      label: "115 分享链接",
                      placeholder: "https://115cdn.com/s/...",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": ""
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
                      modelValue: shareForm.receive_code,
                      "onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => shareForm.receive_code = $event),
                      label: "访问码(可选)",
                      placeholder: "4位访问码",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": ""
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
                      modelValue: shareForm.target_path,
                      "onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => shareForm.target_path = $event),
                      label: "目标网盘目录(可选)",
                      placeholder: "/media/Inbox",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": ""
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            _createElementVNode("div", _hoisted_60, [
              _createVNode(_component_VBtn, {
                size: "small",
                variant: "tonal",
                "prepend-icon": "mdi-magnify",
                loading: shareForm.parsing,
                onClick: parseShare
              }, {
                default: _withCtx(() => [..._cache[69] || (_cache[69] = [
                  _createTextVNode(" 解析链接 ", -1)
                ])]),
                _: 1
              }, 8, ["loading"]),
              _createVNode(_component_VBtn, {
                size: "small",
                variant: "flat",
                color: "primary",
                "prepend-icon": "mdi-send",
                loading: shareForm.receiving,
                onClick: receiveShare
              }, {
                default: _withCtx(() => [..._cache[70] || (_cache[70] = [
                  _createTextVNode(" 立即转存到 115 ", -1)
                ])]),
                _: 1
              }, 8, ["loading"])
            ]),
            shareForm.parsed ? (_openBlock(), _createElementBlock("div", _hoisted_61, [
              _createElementVNode("div", _hoisted_62, "解析结果：" + _toDisplayString(shareForm.parsed.title || shareForm.parsed.share_title || "已解析"), 1),
              _createElementVNode("div", _hoisted_63, " 文件数：" + _toDisplayString(shareForm.parsed.count ?? shareForm.parsed.file_count ?? "-"), 1)
            ])) : _createCommentVNode("", true)
          ]),
          _createElementVNode("div", _hoisted_64, [
            _cache[74] || (_cache[74] = _createElementVNode("div", { class: "mv-table-head" }, [
              _createElementVNode("div", { class: "mv-section-title" }, "最近转存记录")
            ], -1)),
            !shareRecords.value.length ? (_openBlock(), _createElementBlock("div", _hoisted_65, [
              _createVNode(_component_VIcon, {
                icon: "mdi-link-variant",
                size: "28"
              }),
              _cache[72] || (_cache[72] = _createElementVNode("div", null, "暂无分享转存记录", -1))
            ])) : (_openBlock(), _createBlock(_component_VTable, {
              key: 1,
              density: "comfortable"
            }, {
              default: _withCtx(() => [
                _cache[73] || (_cache[73] = _createElementVNode("thead", null, [
                  _createElementVNode("tr", null, [
                    _createElementVNode("th", null, "时间"),
                    _createElementVNode("th", null, "标题 / 链接"),
                    _createElementVNode("th", null, "目标目录"),
                    _createElementVNode("th", null, "状态")
                  ])
                ], -1)),
                _createElementVNode("tbody", null, [
                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(shareRecords.value, (rec, idx) => {
                    return _openBlock(), _createElementBlock("tr", {
                      key: rec.id || idx
                    }, [
                      _createElementVNode("td", _hoisted_66, _toDisplayString(rec.created_at || "-"), 1),
                      _createElementVNode("td", null, _toDisplayString(rec.title || rec.share_title || rec.share_url || "-"), 1),
                      _createElementVNode("td", null, _toDisplayString(rec.target_path || "-"), 1),
                      _createElementVNode("td", null, [
                        _createVNode(_component_VChip, {
                          size: "x-small",
                          variant: "tonal",
                          color: rec.status === "failed" ? "error" : "success"
                        }, {
                          default: _withCtx(() => [
                            _createTextVNode(_toDisplayString(rec.status || "done"), 1)
                          ]),
                          _: 2
                        }, 1032, ["color"])
                      ])
                    ]);
                  }), 128))
                ])
              ]),
              _: 1
            }))
          ])
        ], 64)) : (_openBlock(), _createElementBlock("div", _hoisted_67, [
          _createElementVNode("div", _hoisted_68, [
            _cache[76] || (_cache[76] = _createElementVNode("div", { class: "mv-section-title" }, "联动执行日志", -1)),
            _createElementVNode("div", _hoisted_69, [
              _createVNode(_component_VTextField, {
                modelValue: logKeyword.value,
                "onUpdate:modelValue": _cache[25] || (_cache[25] = ($event) => logKeyword.value = $event),
                placeholder: "过滤关键词",
                "prepend-inner-icon": "mdi-magnify",
                variant: "outlined",
                density: "compact",
                "hide-details": "",
                style: { "width": "200px" }
              }, null, 8, ["modelValue"]),
              _createVNode(_component_VBtn, {
                size: "small",
                variant: "text",
                color: "error",
                "prepend-icon": "mdi-delete",
                onClick: clearLogs
              }, {
                default: _withCtx(() => [..._cache[75] || (_cache[75] = [
                  _createTextVNode(" 清空 ", -1)
                ])]),
                _: 1
              })
            ])
          ]),
          !filteredLogs.value.length ? (_openBlock(), _createElementBlock("div", _hoisted_70, [
            _createVNode(_component_VIcon, {
              icon: "mdi-history",
              size: "28"
            }),
            _cache[77] || (_cache[77] = _createElementVNode("div", null, "暂无联动日志", -1))
          ])) : (_openBlock(), _createBlock(_component_VTable, {
            key: 1,
            density: "comfortable"
          }, {
            default: _withCtx(() => [
              _cache[78] || (_cache[78] = _createElementVNode("thead", null, [
                _createElementVNode("tr", null, [
                  _createElementVNode("th", null, "时间"),
                  _createElementVNode("th", null, "类型"),
                  _createElementVNode("th", null, "状态"),
                  _createElementVNode("th", null, "摘要"),
                  _createElementVNode("th", null, "详情")
                ])
              ], -1)),
              _createElementVNode("tbody", null, [
                (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(filteredLogs.value, (item) => {
                  return _openBlock(), _createElementBlock("tr", {
                    key: item.id
                  }, [
                    _createElementVNode("td", _hoisted_71, _toDisplayString(item.time), 1),
                    _createElementVNode("td", _hoisted_72, _toDisplayString(item.category), 1),
                    _createElementVNode("td", _hoisted_73, [
                      _createVNode(_component_VChip, {
                        size: "x-small",
                        variant: "tonal",
                        color: item.status === "error" ? "error" : item.status === "warning" ? "warning" : "success"
                      }, {
                        default: _withCtx(() => [
                          _createTextVNode(_toDisplayString(item.status), 1)
                        ]),
                        _: 2
                      }, 1032, ["color"])
                    ]),
                    _createElementVNode("td", null, _toDisplayString(item.summary), 1),
                    _createElementVNode("td", _hoisted_74, _toDisplayString(item.detail || "-"), 1)
                  ]);
                }), 128))
              ])
            ]),
            _: 1
          }))
        ])),
        _createVNode(_component_VDialog, {
          modelValue: savePairDialog.value,
          "onUpdate:modelValue": _cache[29] || (_cache[29] = ($event) => savePairDialog.value = $event),
          "max-width": "440"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_VCard, { class: "mv-dialog" }, {
              default: _withCtx(() => [
                _createElementVNode("div", _hoisted_75, [
                  _createElementVNode("div", _hoisted_76, [
                    _createVNode(_component_VIcon, {
                      icon: "mdi-folder-outline",
                      size: "18",
                      color: "primary"
                    }),
                    _cache[79] || (_cache[79] = _createElementVNode("span", { class: "font-weight-semibold" }, "保存为常用路径对", -1))
                  ]),
                  _createVNode(_component_VBtn, {
                    icon: "mdi-close",
                    size: "small",
                    variant: "text",
                    onClick: _cache[26] || (_cache[26] = ($event) => savePairDialog.value = false)
                  })
                ]),
                _createVNode(_component_VCardText, { class: "pa-4" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_VTextField, {
                      modelValue: newPairName.value,
                      "onUpdate:modelValue": _cache[27] || (_cache[27] = ($event) => newPairName.value = $event),
                      label: "路径对别名（如：全库 / 日番 / 电影）",
                      variant: "outlined",
                      density: "compact",
                      "hide-details": "auto"
                    }, null, 8, ["modelValue"]),
                    _createElementVNode("div", _hoisted_77, " 云盘源目录：" + _toDisplayString(quickForm.source_dir || "-"), 1),
                    _createElementVNode("div", _hoisted_78, " STRM 目标目录：" + _toDisplayString(quickForm.target_dir || "-"), 1),
                    _createElementVNode("div", _hoisted_79, [
                      _createVNode(_component_VBtn, {
                        size: "small",
                        variant: "text",
                        onClick: _cache[28] || (_cache[28] = ($event) => savePairDialog.value = false)
                      }, {
                        default: _withCtx(() => [..._cache[80] || (_cache[80] = [
                          _createTextVNode("取消", -1)
                        ])]),
                        _: 1
                      }),
                      _createVNode(_component_VBtn, {
                        size: "small",
                        color: "primary",
                        variant: "flat",
                        loading: savingPair.value,
                        onClick: saveCurrentPathPair
                      }, {
                        default: _withCtx(() => [..._cache[81] || (_cache[81] = [
                          _createTextVNode(" 保存 ", -1)
                        ])]),
                        _: 1
                      }, 8, ["loading"])
                    ])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue"]),
        _createVNode(_component_VDialog, {
          modelValue: settingsDialog.value,
          "onUpdate:modelValue": _cache[32] || (_cache[32] = ($event) => settingsDialog.value = $event),
          "max-width": "920",
          scrollable: ""
        }, {
          default: _withCtx(() => [
            _createVNode(_component_VCard, { class: "mv-dialog" }, {
              default: _withCtx(() => [
                _createElementVNode("div", _hoisted_80, [
                  _createElementVNode("div", _hoisted_81, [
                    _createVNode(_component_VIcon, {
                      icon: "mdi-cog",
                      size: "18",
                      color: "primary"
                    }),
                    _cache[82] || (_cache[82] = _createElementVNode("span", { class: "font-weight-semibold" }, "MediaVault 联动配置", -1))
                  ]),
                  _createVNode(_component_VBtn, {
                    icon: "mdi-close",
                    size: "small",
                    variant: "text",
                    onClick: _cache[30] || (_cache[30] = ($event) => settingsDialog.value = false)
                  })
                ]),
                _createVNode(_component_VCardText, { class: "pa-4" }, {
                  default: _withCtx(() => [
                    _createVNode(Config, {
                      "initial-config": config.value,
                      api: props.api,
                      "plugin-id": props.pluginId,
                      embedded: "",
                      onSave: handleSaveConfig,
                      onClose: _cache[31] || (_cache[31] = ($event) => settingsDialog.value = false)
                    }, null, 8, ["initial-config", "api", "plugin-id"])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue"]),
        _createVNode(_component_VSnackbar, {
          modelValue: snackbar.show,
          "onUpdate:modelValue": _cache[33] || (_cache[33] = ($event) => snackbar.show = $event),
          color: snackbar.color,
          timeout: 3e3
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

const AppPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-d2879172"]]);

export { AppPage as default };
