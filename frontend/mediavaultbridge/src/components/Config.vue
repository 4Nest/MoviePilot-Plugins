<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import type { PathMappingItem } from '../types'

interface PluginConfigForm {
  enabled: boolean
  mv_url: string
  mv_api_key: string
  timeout: number
  notify: boolean
  default_storage: string
  default_emby_slug: string
  debounce_seconds: number
  path_mappings: PathMappingItem[]
  upload_retry: {
    enabled: boolean
    cron: string
    max_retries: number
    cooldown_minutes: number
    force_retry: boolean
    skip_keywords_regex: string
    notify_on_retry: boolean
    notify_on_manual_required: boolean
  }
  transfer_hooks: {
    enabled: boolean
    trigger_monitor_sync: boolean
    trigger_strm_generate: boolean
    strm_overwrite: boolean
    trigger_scrape: boolean
  }
  delete_hooks: {
    enabled: boolean
    trigger_cleanup_scan: boolean
    trigger_orphan_scan: boolean
  }
  emby_hooks: {
    enabled: boolean
    run_mediainfo: boolean
    run_thumbnail: boolean
    run_intro_skip: boolean
  }
  share_transfer: {
    enabled: boolean
    listen_user_message: boolean
    default_target_path: string
    trigger_strm_after: boolean
  }
}

const props = defineProps({
  initialConfig: { type: Object, default: () => ({}) },
  api: { type: Object, default: () => ({}) },
  pluginId: { type: String, default: 'MediaVaultBridge' },
  embedded: { type: Boolean, default: false },
})
const emit = defineEmits(['save', 'close', 'switch', 'layout'])

onMounted(() => {
  if (!props.embedded) {
    emit('layout', { maxWidth: '64rem' })
  }
})

function defaultConfig(): PluginConfigForm {
  return {
    enabled: false,
    mv_url: 'http://192.168.2.110:7811',
    mv_api_key: '',
    timeout: 20,
    notify: true,
    default_storage: '115-default',
    default_emby_slug: 'emby-default',
    debounce_seconds: 30,
    path_mappings: [
      {
        mp_prefix: '/media/link',
        mv_cloud_prefix: '/media',
        mv_strm_prefix: '',
        storage: '115-default',
        enabled: true,
      },
    ],
    upload_retry: {
      enabled: true,
      cron: '*/15 * * * *',
      max_retries: 3,
      cooldown_minutes: 15,
      force_retry: false,
      skip_keywords_regex: '勿重复上传|请先核对云盘文件|已接受上传请求|风控|空间不足|capacity|quota|permission denied',
      notify_on_retry: true,
      notify_on_manual_required: true,
    },
    transfer_hooks: {
      enabled: true,
      trigger_monitor_sync: true,
      trigger_strm_generate: false,
      strm_overwrite: false,
      trigger_scrape: false,
    },
    delete_hooks: {
      enabled: true,
      trigger_cleanup_scan: true,
      trigger_orphan_scan: false,
    },
    emby_hooks: {
      enabled: false,
      run_mediainfo: true,
      run_thumbnail: false,
      run_intro_skip: false,
    },
    share_transfer: {
      enabled: true,
      listen_user_message: true,
      default_target_path: '',
      trigger_strm_after: false,
    },
  }
}

function mergeInitial(raw: any): PluginConfigForm {
  const base = defaultConfig()
  if (!raw || typeof raw !== 'object') return base
  return {
    ...base,
    ...raw,
    path_mappings: Array.isArray(raw.path_mappings)
      ? raw.path_mappings.map((m: any) => ({
          mp_prefix: String(m?.mp_prefix || ''),
          mv_cloud_prefix: String(m?.mv_cloud_prefix || ''),
          mv_strm_prefix: String(m?.mv_strm_prefix || ''),
          storage: String(m?.storage || '115-default'),
          enabled: m?.enabled !== false,
        }))
      : base.path_mappings,
    upload_retry: { ...base.upload_retry, ...(raw.upload_retry || {}) },
    transfer_hooks: { ...base.transfer_hooks, ...(raw.transfer_hooks || {}) },
    delete_hooks: { ...base.delete_hooks, ...(raw.delete_hooks || {}) },
    emby_hooks: { ...base.emby_hooks, ...(raw.emby_hooks || {}) },
    share_transfer: { ...base.share_transfer, ...(raw.share_transfer || {}) },
  }
}

const form = ref<PluginConfigForm>(mergeInitial(props.initialConfig))
const activeTab = ref<'base' | 'retry' | 'hooks' | 'emby_share'>('base')
const testing = ref(false)
const testResult = reactive<{ ok: boolean | null; msg: string }>({ ok: null, msg: '' })

watch(
  () => props.initialConfig,
  next => {
    form.value = mergeInitial(next)
  },
  { deep: true },
)

function addMapping() {
  form.value.path_mappings.push({
    mp_prefix: '',
    mv_cloud_prefix: '',
    mv_strm_prefix: '',
    storage: form.value.default_storage || '115-default',
    enabled: true,
  })
}

function removeMapping(idx: number) {
  form.value.path_mappings.splice(idx, 1)
}

async function testConnection() {
  if (!props.api?.post) return
  testing.value = true
  testResult.ok = null
  testResult.msg = ''
  try {
    const res: any = await props.api.post(`plugin/${props.pluginId}/test`, {
      mv_url: form.value.mv_url,
      mv_api_key: form.value.mv_api_key,
      timeout: form.value.timeout,
    })
    testResult.ok = Boolean(res?.success)
    testResult.msg = res?.message || (testResult.ok ? '连接成功' : '连接失败')
  } catch (err: any) {
    testResult.ok = false
    testResult.msg = err?.message || '连接测试失败'
  } finally {
    testing.value = false
  }
}

function submit() {
  emit('save', JSON.parse(JSON.stringify(form.value)))
}
</script>

<template>
  <div class="mv-cfg">
    <div class="mv-cfg__tabs">
      <button
        type="button"
        class="mv-cfg__tab"
        :class="{ 'is-active': activeTab === 'base' }"
        @click="activeTab = 'base'"
      >
        <VIcon icon="mdi-server" size="16" />
        连接与路径
      </button>
      <button
        type="button"
        class="mv-cfg__tab"
        :class="{ 'is-active': activeTab === 'retry' }"
        @click="activeTab = 'retry'"
      >
        <VIcon icon="mdi-restart" size="16" />
        115 失败重试
      </button>
      <button
        type="button"
        class="mv-cfg__tab"
        :class="{ 'is-active': activeTab === 'hooks' }"
        @click="activeTab = 'hooks'"
      >
        <VIcon icon="mdi-auto-fix" size="16" />
        入库与清理联动
      </button>
      <button
        type="button"
        class="mv-cfg__tab"
        :class="{ 'is-active': activeTab === 'emby_share' }"
        @click="activeTab = 'emby_share'"
      >
        <VIcon icon="mdi-share-variant" size="16" />
        Emby 与分享转存
      </button>
    </div>

    <div v-if="activeTab === 'base'" class="mv-cfg__panel">
      <div class="mv-cfg__section">
        <div class="mv-cfg__row">
          <VSwitch v-model="form.enabled" label="启用 MediaVault 联动管家" color="primary" hide-details density="compact" />
          <VSwitch v-model="form.notify" label="发送联动与异常通知" color="primary" hide-details density="compact" />
        </div>
        <VRow dense class="mt-2">
          <VCol cols="12" md="6">
            <VTextField
              v-model="form.mv_url"
              label="MediaVault 服务地址"
              placeholder="http://192.168.2.110:7811"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField
              v-model="form.mv_api_key"
              label="API Key (X-API-Key)"
              type="password"
              placeholder="在 MediaVault 系统设置中生成的 API Key"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField
              v-model="form.default_storage"
              label="默认 115 存储标识"
              placeholder="115-default"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField
              v-model="form.default_emby_slug"
              label="默认 Emby 实例标识"
              placeholder="emby-default"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </VCol>
          <VCol cols="6" md="2">
            <VTextField
              v-model.number="form.debounce_seconds"
              label="防抖秒数"
              type="number"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </VCol>
          <VCol cols="6" md="2">
            <VTextField
              v-model.number="form.timeout"
              label="超时(秒)"
              type="number"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </VCol>
        </VRow>

        <div class="mv-cfg__test-bar">
          <VBtn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-shield-check"
            :loading="testing"
            @click="testConnection"
          >
            测试连接
          </VBtn>
          <span
            v-if="testResult.msg"
            class="mv-cfg__test-msg"
            :class="testResult.ok ? 'text-success' : 'text-error'"
          >
            {{ testResult.msg }}
          </span>
        </div>
      </div>

      <div class="mv-cfg__section">
        <div class="mv-cfg__section-head">
          <div>
            <div class="mv-cfg__section-title">路径映射规则（MP 路径 → MediaVault 云盘 / STRM 路径）</div>
            <div class="mv-cfg__section-desc">入库或删片时按最长前缀自动换算目标云盘目录与 STRM 目录。</div>
          </div>
          <VBtn size="small" variant="tonal" prepend-icon="mdi-plus" @click="addMapping">
            新增映射
          </VBtn>
        </div>

        <div v-for="(item, idx) in form.path_mappings" :key="idx" class="mv-cfg__map-row">
          <VRow dense align="center">
            <VCol cols="12" md="3">
              <VTextField
                v-model="item.mp_prefix"
                label="MP 路径前缀"
                placeholder="/media/link"
                variant="outlined"
                density="compact"
                hide-details
              />
            </VCol>
            <VCol cols="12" md="3">
              <VTextField
                v-model="item.mv_cloud_prefix"
                label="MV 云盘前缀"
                placeholder="/media"
                variant="outlined"
                density="compact"
                hide-details
              />
            </VCol>
            <VCol cols="12" md="3">
              <VTextField
                v-model="item.mv_strm_prefix"
                label="MV STRM 前缀（可选）"
                placeholder="/strm"
                variant="outlined"
                density="compact"
                hide-details
              />
            </VCol>
            <VCol cols="8" md="2">
              <VTextField
                v-model="item.storage"
                label="存储"
                placeholder="115-default"
                variant="outlined"
                density="compact"
                hide-details
              />
            </VCol>
            <VCol cols="4" md="1" class="d-flex justify-end">
              <VBtn icon="mdi-delete" size="small" variant="text" color="error" @click="removeMapping(idx)" />
            </VCol>
          </VRow>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'retry'" class="mv-cfg__panel">
      <div class="mv-cfg__section">
        <div class="mv-cfg__section-title">115 上传失败自动巡检与重试</div>
        <div class="mv-cfg__section-desc">
          定时拉取 MediaVault 目录监控失败事件；对普通网络/超时失败按次数与冷却自动重试，命中“勿重复上传/请先核对云盘文件”等关键词时自动跳过并通知人工核对。
        </div>
        <div class="mv-cfg__row mt-3">
          <VSwitch v-model="form.upload_retry.enabled" label="启用定时巡检自动重试" color="primary" hide-details density="compact" />
          <VSwitch v-model="form.upload_retry.force_retry" label="自动重试时附加 force=true" color="warning" hide-details density="compact" />
        </div>
        <VRow dense class="mt-2">
          <VCol cols="12" md="4">
            <VTextField
              v-model="form.upload_retry.cron"
              label="巡检 Cron 表达式"
              placeholder="*/15 * * * *"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </VCol>
          <VCol cols="6" md="4">
            <VTextField
              v-model.number="form.upload_retry.max_retries"
              label="单任务最大自动重试次数"
              type="number"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </VCol>
          <VCol cols="6" md="4">
            <VTextField
              v-model.number="form.upload_retry.cooldown_minutes"
              label="同任务重试冷却(分钟)"
              type="number"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </VCol>
          <VCol cols="12" class="mt-2">
            <VTextarea
              v-model="form.upload_retry.skip_keywords_regex"
              label="跳过自动重试的错误信息正则（命中则标为需人工核对）"
              rows="2"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </VCol>
        </VRow>
        <div class="mv-cfg__row mt-3">
          <VSwitch v-model="form.upload_retry.notify_on_retry" label="自动重试成功时发送通知" color="primary" hide-details density="compact" />
          <VSwitch v-model="form.upload_retry.notify_on_manual_required" label="发现需人工核对失败项时告警（单条仅推一次）" color="primary" hide-details density="compact" />
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'hooks'" class="mv-cfg__panel">
      <div class="mv-cfg__section">
        <div class="mv-cfg__section-title">媒体入库事件联动（TransferComplete 防抖聚合）</div>
        <div class="mv-cfg__row mt-2">
          <VSwitch v-model="form.transfer_hooks.enabled" label="启用入库联动" color="primary" hide-details density="compact" />
          <VSwitch v-model="form.transfer_hooks.trigger_monitor_sync" label="触发目录监控增量同步" color="primary" hide-details density="compact" />
          <VSwitch v-model="form.transfer_hooks.trigger_strm_generate" label="按映射目录触发增量 STRM 生成" color="primary" hide-details density="compact" />
          <VSwitch v-model="form.transfer_hooks.strm_overwrite" label="覆盖已有 STRM" color="warning" hide-details density="compact" />
          <VSwitch v-model="form.transfer_hooks.trigger_scrape" label="触发目录刮削" color="primary" hide-details density="compact" />
        </div>
      </div>

      <div class="mv-cfg__section">
        <div class="mv-cfg__section-title">删片 / 洗版清理联动（HistoryDeleted）</div>
        <div class="mv-cfg__section-desc">默认仅触发安全扫描，不自动删除网盘或 STRM 文件，避免误删。</div>
        <div class="mv-cfg__row mt-2">
          <VSwitch v-model="form.delete_hooks.enabled" label="启用删片联动" color="primary" hide-details density="compact" />
          <VSwitch v-model="form.delete_hooks.trigger_cleanup_scan" label="触发失效 STRM 清理扫描" color="primary" hide-details density="compact" />
          <VSwitch v-model="form.delete_hooks.trigger_orphan_scan" label="触发网盘孤立索引扫描" color="primary" hide-details density="compact" />
        </div>
      </div>
    </div>

    <div v-else class="mv-cfg__panel">
      <div class="mv-cfg__section">
        <div class="mv-cfg__section-title">Emby 增强后处理（入库聚合后自动触发）</div>
        <div class="mv-cfg__row mt-2">
          <VSwitch v-model="form.emby_hooks.enabled" label="启用 Emby 后处理联动" color="primary" hide-details density="compact" />
          <VSwitch v-model="form.emby_hooks.run_mediainfo" label="提取缺失 MediaInfo" color="primary" hide-details density="compact" />
          <VSwitch v-model="form.emby_hooks.run_thumbnail" label="生成缺失缩略图" color="primary" hide-details density="compact" />
          <VSwitch v-model="form.emby_hooks.run_intro_skip" label="检测缺失片头片尾" color="primary" hide-details density="compact" />
        </div>
      </div>

      <div class="mv-cfg__section">
        <div class="mv-cfg__section-title">115 分享链直连转存</div>
        <div class="mv-cfg__row mt-2">
          <VSwitch v-model="form.share_transfer.enabled" label="启用分享链转存" color="primary" hide-details density="compact" />
          <VSwitch v-model="form.share_transfer.listen_user_message" label="监听 MP 消息通道中的 115 分享链接自动转存" color="primary" hide-details density="compact" />
        </div>
        <VRow dense class="mt-2">
          <VCol cols="12" md="8">
            <VTextField
              v-model="form.share_transfer.default_target_path"
              label="默认转存网盘目录（留空使用 MediaVault 默认路径）"
              placeholder="/media/Inbox"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </VCol>
        </VRow>
      </div>
    </div>

    <div class="mv-cfg__footer">
      <VBtn v-if="!embedded" variant="text" @click="emit('close')">取消</VBtn>
      <VBtn color="primary" variant="flat" prepend-icon="mdi-check" @click="submit">
        保存配置
      </VBtn>
    </div>
  </div>
</template>

<style scoped>
.mv-cfg {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mv-cfg__tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 3px;
  border-radius: 9px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  align-self: flex-start;
}

.mv-cfg__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.mv-cfg__tab.is-active {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.mv-cfg__panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mv-cfg__section {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.mv-cfg__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.mv-cfg__section-title {
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.mv-cfg__section-desc {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.mv-cfg__row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.mv-cfg__test-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.mv-cfg__test-msg {
  font-size: 13px;
}

.mv-cfg__map-row {
  padding: 10px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  margin-top: 8px;
}

.mv-cfg__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}
</style>
