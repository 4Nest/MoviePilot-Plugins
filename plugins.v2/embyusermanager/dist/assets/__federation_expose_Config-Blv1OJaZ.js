import { importShared } from './__federation_fn_import-JrT3xvdd.js';

const {defineComponent:_defineComponent} = await importShared('vue');

const {createElementVNode:_createElementVNode,resolveComponent:_resolveComponent,createVNode:_createVNode,createTextVNode:_createTextVNode,withCtx:_withCtx,openBlock:_openBlock,createElementBlock:_createElementBlock} = await importShared('vue');

const _hoisted_1 = { class: "pa-4 d-flex flex-column gap-3" };
const _hoisted_2 = { class: "d-flex justify-end gap-2 mt-2" };
const {ref,watch} = await importShared('vue');

const _sfc_main = /* @__PURE__ */ _defineComponent({
  __name: "Config",
  props: {
    initialConfig: {
      type: Object,
      default: () => ({})
    },
    api: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ["save", "close", "switch"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const enabled = ref(Boolean(props.initialConfig?.enabled ?? true));
    const allowMode = ref(props.initialConfig?.allow_mode || "all");
    const allowEmbyAdmin = ref(Boolean(props.initialConfig?.allow_emby_admin ?? true));
    const whitelistText = ref(Array.isArray(props.initialConfig?.whitelist) ? props.initialConfig.whitelist.join(", ") : "");
    const blacklistText = ref(Array.isArray(props.initialConfig?.blacklist) ? props.initialConfig.blacklist.join(", ") : "");
    const allowedServersText = ref(
      Array.isArray(props.initialConfig?.allowed_servers) ? props.initialConfig.allowed_servers.join(", ") : ""
    );
    watch(
      () => props.initialConfig,
      (next) => {
        enabled.value = Boolean(next?.enabled ?? true);
        allowMode.value = next?.allow_mode || "all";
        allowEmbyAdmin.value = Boolean(next?.allow_emby_admin ?? true);
        whitelistText.value = Array.isArray(next?.whitelist) ? next.whitelist.join(", ") : "";
        blacklistText.value = Array.isArray(next?.blacklist) ? next.blacklist.join(", ") : "";
        allowedServersText.value = Array.isArray(next?.allowed_servers) ? next.allowed_servers.join(", ") : "";
      },
      { deep: true }
    );
    function parseList(raw) {
      return raw.replace(/\n/g, ",").split(",").map((item) => item.trim()).filter((item, idx, arr) => Boolean(item) && arr.indexOf(item) === idx);
    }
    function handleSave() {
      emit("save", {
        enabled: enabled.value,
        allow_mode: allowMode.value,
        allow_emby_admin: allowEmbyAdmin.value,
        whitelist: parseList(whitelistText.value),
        blacklist: parseList(blacklistText.value),
        allowed_servers: parseList(allowedServersText.value)
      });
    }
    return (_ctx, _cache) => {
      const _component_v_switch = _resolveComponent("v-switch");
      const _component_v_select = _resolveComponent("v-select");
      const _component_v_text_field = _resolveComponent("v-text-field");
      const _component_v_textarea = _resolveComponent("v-textarea");
      const _component_v_btn = _resolveComponent("v-btn");
      return _openBlock(), _createElementBlock("div", _hoisted_1, [
        _cache[11] || (_cache[11] = _createElementVNode("div", { class: "text-h6 font-weight-bold mb-1" }, "Emby 用户管理配置", -1)),
        _createVNode(_component_v_switch, {
          modelValue: enabled.value,
          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => enabled.value = $event),
          color: "primary",
          label: "启用插件与登录准入控制",
          "hide-details": ""
        }, null, 8, ["modelValue"]),
        _createVNode(_component_v_switch, {
          modelValue: allowEmbyAdmin.value,
          "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => allowEmbyAdmin.value = $event),
          color: "primary",
          label: "允许 Emby 管理员账号作为普通订阅用户登录",
          "hide-details": ""
        }, null, 8, ["modelValue"]),
        _createVNode(_component_v_select, {
          modelValue: allowMode.value,
          "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => allowMode.value = $event),
          items: [
            { title: "全部允许", value: "all" },
            { title: "白名单模式", value: "whitelist" },
            { title: "黑名单模式", value: "blacklist" }
          ],
          "item-title": "title",
          "item-value": "value",
          label: "登录准入模式",
          variant: "outlined",
          density: "compact"
        }, null, 8, ["modelValue"]),
        _createVNode(_component_v_text_field, {
          modelValue: allowedServersText.value,
          "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => allowedServersText.value = $event),
          label: "允许登录的 Emby 实例名称（多个用逗号分隔，留空表示全部）",
          variant: "outlined",
          density: "compact"
        }, null, 8, ["modelValue"]),
        _createVNode(_component_v_textarea, {
          modelValue: whitelistText.value,
          "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => whitelistText.value = $event),
          label: "允许登录的白名单用户名（逗号或换行分隔）",
          variant: "outlined",
          rows: "2",
          density: "compact"
        }, null, 8, ["modelValue"]),
        _createVNode(_component_v_textarea, {
          modelValue: blacklistText.value,
          "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => blacklistText.value = $event),
          label: "禁止登录的黑名单用户名（逗号或换行分隔）",
          variant: "outlined",
          rows: "2",
          density: "compact"
        }, null, 8, ["modelValue"]),
        _createElementVNode("div", _hoisted_2, [
          _createVNode(_component_v_btn, {
            variant: "text",
            onClick: _cache[6] || (_cache[6] = ($event) => emit("switch"))
          }, {
            default: _withCtx(() => [..._cache[8] || (_cache[8] = [
              _createTextVNode("返回用户列表", -1)
            ])]),
            _: 1
          }),
          _createVNode(_component_v_btn, {
            variant: "text",
            onClick: _cache[7] || (_cache[7] = ($event) => emit("close"))
          }, {
            default: _withCtx(() => [..._cache[9] || (_cache[9] = [
              _createTextVNode("关闭", -1)
            ])]),
            _: 1
          }),
          _createVNode(_component_v_btn, {
            color: "primary",
            variant: "flat",
            onClick: handleSave
          }, {
            default: _withCtx(() => [..._cache[10] || (_cache[10] = [
              _createTextVNode("保存配置", -1)
            ])]),
            _: 1
          })
        ])
      ]);
    };
  }
});

export { _sfc_main as default };
