import { importShared } from './__federation_fn_import-JrT3xvdd.js';
import { _ as _export_sfc } from './_plugin-vue_export-helper-pcqpp-6-.js';

const {defineComponent:_defineComponent} = await importShared('vue');

const {resolveComponent:_resolveComponent,createVNode:_createVNode,createElementVNode:_createElementVNode,createTextVNode:_createTextVNode,withCtx:_withCtx,openBlock:_openBlock,createElementBlock:_createElementBlock} = await importShared('vue');

const _hoisted_1 = { class: "emby-config" };
const _hoisted_2 = { class: "emby-config__header" };
const _hoisted_3 = { class: "emby-config__title" };
const _hoisted_4 = { class: "emby-config__body" };
const _hoisted_5 = { class: "emby-settings-group" };
const _hoisted_6 = { class: "emby-settings-row" };
const _hoisted_7 = { class: "emby-settings-row" };
const _hoisted_8 = { class: "emby-config__footer" };
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
      const _component_v_icon = _resolveComponent("v-icon");
      const _component_v_btn = _resolveComponent("v-btn");
      const _component_v_switch = _resolveComponent("v-switch");
      const _component_v_select = _resolveComponent("v-select");
      const _component_v_text_field = _resolveComponent("v-text-field");
      const _component_v_textarea = _resolveComponent("v-textarea");
      const _component_v_spacer = _resolveComponent("v-spacer");
      return _openBlock(), _createElementBlock("div", _hoisted_1, [
        _createElementVNode("div", _hoisted_2, [
          _createElementVNode("div", _hoisted_3, [
            _createVNode(_component_v_icon, {
              icon: "mdi-account-cog-outline",
              size: "20",
              color: "primary"
            }),
            _cache[9] || (_cache[9] = _createElementVNode("span", null, "Emby 用户管理配置", -1))
          ]),
          _createVNode(_component_v_btn, {
            icon: "mdi-close",
            variant: "text",
            size: "small",
            rounded: "lg",
            onClick: _cache[0] || (_cache[0] = ($event) => emit("close"))
          })
        ]),
        _createElementVNode("div", _hoisted_4, [
          _createElementVNode("div", _hoisted_5, [
            _createElementVNode("div", _hoisted_6, [
              _cache[10] || (_cache[10] = _createElementVNode("div", { class: "emby-settings-row__meta" }, [
                _createElementVNode("div", { class: "emby-settings-row__title" }, "启用插件与登录准入控制"),
                _createElementVNode("div", { class: "emby-settings-row__desc" }, "拦截并校验通过 Emby 凭据发起的 MoviePilot 登录请求")
              ], -1)),
              _createVNode(_component_v_switch, {
                modelValue: enabled.value,
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => enabled.value = $event),
                color: "primary",
                inset: "",
                density: "compact",
                "hide-details": ""
              }, null, 8, ["modelValue"])
            ]),
            _createElementVNode("div", _hoisted_7, [
              _cache[11] || (_cache[11] = _createElementVNode("div", { class: "emby-settings-row__meta" }, [
                _createElementVNode("div", { class: "emby-settings-row__title" }, "允许 Emby 管理员作为订阅用户登录"),
                _createElementVNode("div", { class: "emby-settings-row__desc" }, "关闭后仅非管理员 Emby 账号可通过准入同步")
              ], -1)),
              _createVNode(_component_v_switch, {
                modelValue: allowEmbyAdmin.value,
                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => allowEmbyAdmin.value = $event),
                color: "primary",
                inset: "",
                density: "compact",
                "hide-details": ""
              }, null, 8, ["modelValue"])
            ])
          ]),
          _createVNode(_component_v_select, {
            modelValue: allowMode.value,
            "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => allowMode.value = $event),
            items: [
              { title: "全部允许", value: "all" },
              { title: "白名单模式", value: "whitelist" },
              { title: "黑名单模式", value: "blacklist" }
            ],
            "item-title": "title",
            "item-value": "value",
            label: "登录准入模式",
            variant: "outlined",
            density: "compact",
            "hide-details": "auto"
          }, null, 8, ["modelValue"]),
          _createVNode(_component_v_text_field, {
            modelValue: allowedServersText.value,
            "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => allowedServersText.value = $event),
            label: "允许登录的 Emby 实例名称（多个用逗号分隔，留空表示全部）",
            variant: "outlined",
            density: "compact",
            "hide-details": "auto"
          }, null, 8, ["modelValue"]),
          _createVNode(_component_v_textarea, {
            modelValue: whitelistText.value,
            "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => whitelistText.value = $event),
            label: "允许登录的白名单用户名（逗号或换行分隔）",
            variant: "outlined",
            rows: "2",
            density: "compact",
            "hide-details": "auto"
          }, null, 8, ["modelValue"]),
          _createVNode(_component_v_textarea, {
            modelValue: blacklistText.value,
            "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => blacklistText.value = $event),
            label: "禁止登录的黑名单用户名（逗号或换行分隔）",
            variant: "outlined",
            rows: "2",
            density: "compact",
            "hide-details": "auto"
          }, null, 8, ["modelValue"])
        ]),
        _createElementVNode("div", _hoisted_8, [
          _createVNode(_component_v_btn, {
            size: "small",
            variant: "outlined",
            rounded: "lg",
            "prepend-icon": "mdi-database-eye-outline",
            onClick: _cache[7] || (_cache[7] = ($event) => emit("switch"))
          }, {
            default: _withCtx(() => [..._cache[12] || (_cache[12] = [
              _createTextVNode(" 查看用户数据 ", -1)
            ])]),
            _: 1
          }),
          _createVNode(_component_v_spacer),
          _createVNode(_component_v_btn, {
            size: "small",
            variant: "text",
            rounded: "lg",
            onClick: _cache[8] || (_cache[8] = ($event) => emit("close"))
          }, {
            default: _withCtx(() => [..._cache[13] || (_cache[13] = [
              _createTextVNode("取消", -1)
            ])]),
            _: 1
          }),
          _createVNode(_component_v_btn, {
            size: "small",
            color: "primary",
            variant: "flat",
            rounded: "lg",
            onClick: handleSave
          }, {
            default: _withCtx(() => [..._cache[14] || (_cache[14] = [
              _createTextVNode("保存", -1)
            ])]),
            _: 1
          })
        ])
      ]);
    };
  }
});

const Config = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-d4d18665"]]);

export { Config as default };
