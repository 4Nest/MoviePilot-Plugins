import { importShared } from './__federation_fn_import-JrT3xvdd.js';
import AppPage from './__federation_expose_AppPage-DeqKdjy1.js';

const {defineComponent:_defineComponent} = await importShared('vue');

const {openBlock:_openBlock,createBlock:_createBlock} = await importShared('vue');
const _sfc_main = /* @__PURE__ */ _defineComponent({
  __name: "Page",
  props: {
    api: { type: Object, default: () => ({}) },
    pluginId: { type: String, default: "SeedCleaner" }
  },
  emits: ["action", "switch", "close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    return (_ctx, _cache) => {
      return _openBlock(), _createBlock(AppPage, {
        api: props.api,
        "plugin-id": props.pluginId,
        onAction: _cache[0] || (_cache[0] = ($event) => emit("action")),
        onSwitch: _cache[1] || (_cache[1] = ($event) => emit("switch")),
        onClose: _cache[2] || (_cache[2] = ($event) => emit("close"))
      }, null, 8, ["api", "plugin-id"]);
    };
  }
});

export { _sfc_main as default };
