<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  initialConfig: {
    type: Object,
    default: () => ({}),
  },
  api: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['save', 'close', 'switch'])

const enabled = ref(Boolean(props.initialConfig?.enabled ?? true))
const allowMode = ref<'all' | 'whitelist' | 'blacklist'>(props.initialConfig?.allow_mode || 'all')
const allowEmbyAdmin = ref(Boolean(props.initialConfig?.allow_emby_admin ?? true))
const whitelistText = ref(Array.isArray(props.initialConfig?.whitelist) ? props.initialConfig.whitelist.join(', ') : '')
const blacklistText = ref(Array.isArray(props.initialConfig?.blacklist) ? props.initialConfig.blacklist.join(', ') : '')
const allowedServersText = ref(
  Array.isArray(props.initialConfig?.allowed_servers) ? props.initialConfig.allowed_servers.join(', ') : '',
)

watch(
  () => props.initialConfig,
  next => {
    enabled.value = Boolean(next?.enabled ?? true)
    allowMode.value = next?.allow_mode || 'all'
    allowEmbyAdmin.value = Boolean(next?.allow_emby_admin ?? true)
    whitelistText.value = Array.isArray(next?.whitelist) ? next.whitelist.join(', ') : ''
    blacklistText.value = Array.isArray(next?.blacklist) ? next.blacklist.join(', ') : ''
    allowedServersText.value = Array.isArray(next?.allowed_servers) ? next.allowed_servers.join(', ') : ''
  },
  { deep: true },
)

function parseList(raw: string): string[] {
  return raw
    .replace(/\n/g, ',')
    .split(',')
    .map(item => item.trim())
    .filter((item, idx, arr) => Boolean(item) && arr.indexOf(item) === idx)
}

function handleSave() {
  emit('save', {
    enabled: enabled.value,
    allow_mode: allowMode.value,
    allow_emby_admin: allowEmbyAdmin.value,
    whitelist: parseList(whitelistText.value),
    blacklist: parseList(blacklistText.value),
    allowed_servers: parseList(allowedServersText.value),
  })
}
</script>

<template>
  <div class="pa-4 d-flex flex-column gap-3">
    <div class="text-h6 font-weight-bold mb-1">Emby 用户管理配置</div>
    <v-switch v-model="enabled" color="primary" label="启用插件与登录准入控制" hide-details />
    <v-switch
      v-model="allowEmbyAdmin"
      color="primary"
      label="允许 Emby 管理员账号作为普通订阅用户登录"
      hide-details
    />
    <v-select
      v-model="allowMode"
      :items="[
        { title: '全部允许', value: 'all' },
        { title: '白名单模式', value: 'whitelist' },
        { title: '黑名单模式', value: 'blacklist' },
      ]"
      item-title="title"
      item-value="value"
      label="登录准入模式"
      variant="outlined"
      density="compact"
    />
    <v-text-field
      v-model="allowedServersText"
      label="允许登录的 Emby 实例名称（多个用逗号分隔，留空表示全部）"
      variant="outlined"
      density="compact"
    />
    <v-textarea
      v-model="whitelistText"
      label="允许登录的白名单用户名（逗号或换行分隔）"
      variant="outlined"
      rows="2"
      density="compact"
    />
    <v-textarea
      v-model="blacklistText"
      label="禁止登录的黑名单用户名（逗号或换行分隔）"
      variant="outlined"
      rows="2"
      density="compact"
    />

    <div class="d-flex justify-end gap-2 mt-2">
      <v-btn variant="text" @click="emit('switch')">返回用户列表</v-btn>
      <v-btn variant="text" @click="emit('close')">关闭</v-btn>
      <v-btn color="primary" variant="flat" @click="handleSave">保存配置</v-btn>
    </div>
  </div>
</template>
