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
const subscribeApprovalEnabled = ref(Boolean(props.initialConfig?.subscribe_approval_enabled ?? false))
const approvalNotifyTelegram = ref(Boolean(props.initialConfig?.approval_notify_telegram ?? true))
const approvalTgChatId = ref(String(props.initialConfig?.approval_tg_chat_id ?? ''))
const approvalBypassText = ref(
  Array.isArray(props.initialConfig?.approval_bypass_users) ? props.initialConfig.approval_bypass_users.join(', ') : '',
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
    subscribeApprovalEnabled.value = Boolean(next?.subscribe_approval_enabled ?? false)
    approvalNotifyTelegram.value = Boolean(next?.approval_notify_telegram ?? true)
    approvalTgChatId.value = String(next?.approval_tg_chat_id ?? '')
    approvalBypassText.value = Array.isArray(next?.approval_bypass_users)
      ? next.approval_bypass_users.join(', ')
      : ''
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
    subscribe_approval_enabled: subscribeApprovalEnabled.value,
    approval_notify_telegram: approvalNotifyTelegram.value,
    approval_tg_chat_id: approvalTgChatId.value.trim(),
    approval_bypass_users: parseList(approvalBypassText.value),
  })
}
</script>

<template>
  <div class="emby-config">
    <div class="emby-config__header">
      <div class="emby-config__title">
        <v-icon icon="mdi-account-cog-outline" size="20" color="primary" />
        <span>Emby 用户管理配置</span>
      </div>
      <v-btn icon="mdi-close" variant="text" size="small" rounded="lg" @click="emit('close')" />
    </div>

    <div class="emby-config__body">
      <div class="emby-config__section-label">登录准入控制</div>
      <div class="emby-settings-group">
        <div class="emby-settings-row">
          <div class="emby-settings-row__meta">
            <div class="emby-settings-row__title">启用登录准入控制</div>
            <div class="emby-settings-row__desc">拦截并校验通过 Emby 凭据发起的 MoviePilot 登录请求</div>
          </div>
          <v-switch v-model="enabled" color="primary" inset density="compact" hide-details />
        </div>
        <div class="emby-settings-row">
          <div class="emby-settings-row__meta">
            <div class="emby-settings-row__title">允许 Emby 管理员作为订阅用户登录</div>
            <div class="emby-settings-row__desc">关闭后仅非管理员 Emby 账号可通过准入同步</div>
          </div>
          <v-switch v-model="allowEmbyAdmin" color="primary" inset density="compact" hide-details />
        </div>
      </div>

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
        hide-details="auto"
      />
      <v-text-field
        v-model="allowedServersText"
        label="允许登录的 Emby 实例名称（多个用逗号分隔，留空表示全部）"
        variant="outlined"
        density="compact"
        hide-details="auto"
      />
      <v-textarea
        v-model="whitelistText"
        label="允许登录的白名单用户名（逗号或换行分隔）"
        variant="outlined"
        rows="2"
        density="compact"
        hide-details="auto"
      />
      <v-textarea
        v-model="blacklistText"
        label="禁止登录的黑名单用户名（逗号或换行分隔）"
        variant="outlined"
        rows="2"
        density="compact"
        hide-details="auto"
      />

      <div class="emby-config__section-label mt-1">普通用户订阅审批</div>
      <div class="emby-settings-group">
        <div class="emby-settings-row">
          <div class="emby-settings-row__meta">
            <div class="emby-settings-row__title">开启订阅审批</div>
            <div class="emby-settings-row__desc">普通用户添加订阅时先进入待审队列，审批通过后才提交到 MoviePilot</div>
          </div>
          <v-switch v-model="subscribeApprovalEnabled" color="primary" inset density="compact" hide-details />
        </div>
        <div class="emby-settings-row">
          <div class="emby-settings-row__meta">
            <div class="emby-settings-row__title">推送 Telegram 审批卡片</div>
            <div class="emby-settings-row__desc">发送带海报、简介与「通过并提交 MP / 标记手动入库 / 拒绝申请」按钮通知</div>
          </div>
          <v-switch v-model="approvalNotifyTelegram" color="primary" inset density="compact" hide-details />
        </div>
      </div>

      <v-text-field
        v-model="approvalTgChatId"
        label="审批通知 Telegram Chat ID（可选，留空走系统默认通知会话）"
        variant="outlined"
        density="compact"
        hide-details="auto"
      />
      <v-textarea
        v-model="approvalBypassText"
        label="免审批直通用户名单（逗号或换行分隔，名单内用户订阅直接提交 MP）"
        variant="outlined"
        rows="2"
        density="compact"
        hide-details="auto"
      />
    </div>

    <div class="emby-config__footer">
      <v-btn
        size="small"
        variant="outlined"
        rounded="lg"
        prepend-icon="mdi-database-eye-outline"
        @click="emit('switch')"
      >
        查看用户与审批
      </v-btn>
      <v-spacer />
      <v-btn size="small" variant="text" rounded="lg" @click="emit('close')">取消</v-btn>
      <v-btn size="small" color="primary" variant="flat" rounded="lg" @click="handleSave">保存</v-btn>
    </div>
  </div>
</template>

<style scoped>
.emby-config {
  display: flex;
  flex-direction: column;
  color: rgb(var(--v-theme-on-surface));
  background-color: rgb(var(--v-theme-surface));
}

.emby-config :deep(.v-field) {
  border-radius: 8px;
}

.emby-config__header {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  height: 50px;
  padding: 0 18px;
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.emby-config__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.emby-config__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
}

.emby-config__section-label {
  color: rgb(var(--v-theme-primary));
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.emby-settings-group {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.085);
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  overflow: hidden;
}

.emby-settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 14px;
}

.emby-settings-row + .emby-settings-row {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.065);
}

.emby-settings-row__meta {
  min-width: 0;
  flex: 1 1 auto;
}

.emby-settings-row__title {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.35;
}

.emby-settings-row__desc {
  margin-top: 2px;
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-size: 12px;
  line-height: 1.4;
}

.emby-config__footer {
  position: sticky;
  bottom: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px 12px;
  background-color: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
