<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref } from 'vue'
import Config from './Config.vue'
import {
  type BridgeLogItem,
  type FailedUploadEvent,
  type HostToast,
  type QuickPathPair,
  formatBytes,
} from '../types'

type ActiveTab = 'overview' | 'failed' | 'share' | 'logs'

const props = defineProps({
  api: { type: Object, default: () => ({}) },
  pluginId: { type: String, default: 'MediaVaultBridge' },
  navKey: { type: String, default: 'main' },
})
const emit = defineEmits(['action', 'switch', 'close'])
const hostToast = inject<HostToast | null>('moviepilot:toast', null)

const activeTab = ref<ActiveTab>('overview')
const loading = ref(false)
const actionBusy = ref('')
const overview = ref<Record<string, any>>({})
const config = ref<Record<string, any>>({})
const failedEvents = ref<FailedUploadEvent[]>([])
const failedUploadRecords = ref<any[]>([])
const shareRecords = ref<any[]>([])
const logs = ref<BridgeLogItem[]>([])
const logKeyword = ref('')
const settingsDialog = ref(false)

const shareForm = reactive({
  share_url: '',
  receive_code: '',
  target_path: '',
  parsing: false,
  receiving: false,
  parsed: null as Record<string, any> | null,
})

const quickForm = reactive({
  source_dir: '',
  target_dir: '',
  storage: '115-default',
})
const selectedPairId = ref('')
const savePairDialog = ref(false)
const newPairName = ref('')
const savingPair = ref(false)

const savedPathPairs = computed<QuickPathPair[]>(() => {
  const list = config.value?.quick_path_pairs
  return Array.isArray(list) ? list : []
})

const allPathPairs = computed<QuickPathPair[]>(() => {
  const result: QuickPathPair[] = []
  const seen = new Set<string>()
  for (const item of savedPathPairs.value) {
    const key = `${item.source_dir}|${item.target_dir}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ ...item, auto: false })
    }
  }
  const suggested = Array.isArray(overview.value?.suggested_path_pairs)
    ? (overview.value.suggested_path_pairs as QuickPathPair[])
    : []
  for (const item of suggested) {
    const key = `${item.source_dir}|${item.target_dir}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ ...item, auto: true })
    }
  }
  return result
})

function selectPathPair(pair: QuickPathPair) {
  selectedPairId.value = pair.id
  quickForm.source_dir = pair.source_dir || ''
  quickForm.target_dir = pair.target_dir || ''
  quickForm.storage = pair.storage || config.value?.default_storage || '115-default'
}

function openSavePairDialog() {
  if (!quickForm.source_dir.trim() && !quickForm.target_dir.trim()) {
    notify('请先填写云盘源目录或 STRM 目标目录', 'warning')
    return
  }
  const guess = quickForm.source_dir.trim().split('/').filter(Boolean).pop() || '自定义路径'
  newPairName.value = guess
  savePairDialog.value = true
}

async function saveCurrentPathPair() {
  const name = newPairName.value.trim()
  const src = quickForm.source_dir.trim()
  const dst = quickForm.target_dir.trim()
  if (!name || (!src && !dst)) {
    notify('请填写名称和至少一个目录路径', 'warning')
    return
  }
  savingPair.value = true
  try {
    const nextPairs: QuickPathPair[] = [
      ...savedPathPairs.value,
      {
        id: `pair_${Date.now()}`,
        name,
        source_dir: src,
        target_dir: dst,
        storage: quickForm.storage || config.value?.default_storage || '115-default',
      },
    ]
    const res: any = await props.api.post(`plugin/${props.pluginId}/quick-paths`, {
      quick_path_pairs: nextPairs,
    })
    if (res?.success) {
      config.value = { ...config.value, quick_path_pairs: res.data || nextPairs }
      selectedPairId.value = nextPairs[nextPairs.length - 1].id
      savePairDialog.value = false
      notify('已保存为常用路径对', 'success')
    } else {
      notify(res?.message || '保存失败', 'error')
    }
  } catch (err: any) {
    notify(err?.message || '保存常用路径对异常', 'error')
  } finally {
    savingPair.value = false
  }
}

async function removeSavedPathPair(id: string) {
  const nextPairs = savedPathPairs.value.filter(item => item.id !== id)
  try {
    const res: any = await props.api.post(`plugin/${props.pluginId}/quick-paths`, {
      quick_path_pairs: nextPairs,
    })
    if (res?.success) {
      config.value = { ...config.value, quick_path_pairs: res.data || nextPairs }
      if (selectedPairId.value === id) {
        selectedPairId.value = ''
      }
      notify('已移除常用路径对', 'success')
    }
  } catch (err: any) {
    notify(err?.message || '移除失败', 'error')
  }
}

const snackbar = reactive({ show: false, text: '', color: 'success' })

function notify(text: string, color: 'success' | 'error' | 'warning' | 'info' = 'success') {
  if (hostToast && typeof hostToast[color] === 'function') {
    hostToast[color]?.(text)
    return
  }
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

const isConnected = computed(() => Boolean(overview.value?.connected))
const todayUpload = computed(() => overview.value?.today_upload || {})
const strmStats = computed(() => overview.value?.strm_stats || {})
const retryableEvents = computed(() =>
  failedEvents.value.filter(ev => ev.retry_category === 'retryable' || ev.retry_category === 'clear_lock_retry'),
)
const manualConfirmEvents = computed(() =>
  failedEvents.value.filter(ev => ev.retry_category === 'manual_confirm'),
)

const filteredLogs = computed(() => {
  const kw = logKeyword.value.trim().toLowerCase()
  if (!kw) return logs.value
  return logs.value.filter(
    item =>
      String(item.summary || '').toLowerCase().includes(kw) ||
      String(item.detail || '').toLowerCase().includes(kw) ||
      String(item.category || '').toLowerCase().includes(kw),
  )
})

async function loadOverview() {
  if (!props.api?.get) return
  loading.value = true
  try {
    const res: any = await props.api.get(`plugin/${props.pluginId}/overview`)
    if (res?.success && res.data) {
      overview.value = res.data
      if (res.data.config) {
        config.value = res.data.config
        if (!quickForm.source_dir && !quickForm.target_dir) {
          if (allPathPairs.value.length > 0) {
            selectPathPair(allPathPairs.value[0])
          } else if (res.data.config.path_mappings?.[0]) {
            quickForm.source_dir = res.data.config.path_mappings[0].mv_cloud_prefix || ''
            quickForm.target_dir = res.data.config.path_mappings[0].mv_strm_prefix || ''
          }
        }
        if (!shareForm.target_path && res.data.config.share_transfer?.default_target_path) {
          shareForm.target_path = res.data.config.share_transfer.default_target_path
        }
      }
    }
  } catch (err: any) {
    notify(err?.message || '加载 MediaVault 概览失败', 'error')
  } finally {
    loading.value = false
  }
}

async function loadFailedUploads() {
  if (!props.api?.get) return
  loading.value = true
  try {
    const res: any = await props.api.get(`plugin/${props.pluginId}/failed-uploads`)
    if (res?.success && res.data) {
      failedEvents.value = res.data.items || []
      failedUploadRecords.value = res.data.upload_records || []
    } else if (res?.message) {
      notify(res.message, 'warning')
    }
  } catch (err: any) {
    notify(err?.message || '获取失败上传任务失败', 'error')
  } finally {
    loading.value = false
  }
}

async function loadShareRecords() {
  if (!props.api?.get) return
  try {
    const res: any = await props.api.get(`plugin/${props.pluginId}/share/records`)
    if (res?.success && res.data) {
      shareRecords.value = res.data.items || res.data.records || []
    }
  } catch {
    // 忽略次要记录加载失败
  }
}

async function loadLogs() {
  if (!props.api?.get) return
  try {
    const res: any = await props.api.get(`plugin/${props.pluginId}/logs`)
    if (res?.success) {
      logs.value = res.data || []
    }
  } catch {
    // 忽略日志加载失败
  }
}

async function refreshAll() {
  await Promise.all([loadOverview(), loadFailedUploads(), loadShareRecords(), loadLogs()])
}

async function retrySingle(ev: FailedUploadEvent, force = false, clearAttempts = false) {
  actionBusy.value = `retry_${ev.id}`
  try {
    const res: any = await props.api.post(`plugin/${props.pluginId}/retry-uploads`, {
      event_ids: [ev.id],
      force,
      clear_attempts: clearAttempts,
    })
    if (res?.success) {
      notify(res.message || '已提交重试', 'success')
      await Promise.all([loadFailedUploads(), loadOverview(), loadLogs()])
    } else {
      notify(res?.message || '重试失败', 'error')
    }
  } catch (err: any) {
    notify(err?.message || '重试请求异常', 'error')
  } finally {
    actionBusy.value = ''
  }
}

async function retryAllSafe(clearAttempts = false) {
  if (!retryableEvents.value.length) {
    notify('当前没有可自动重试的失败项', 'info')
    return
  }
  actionBusy.value = clearAttempts ? 'retry_clear_all' : 'retry_safe'
  try {
    const res: any = await props.api.post(`plugin/${props.pluginId}/retry-uploads`, {
      event_ids: retryableEvents.value.map(ev => ev.id),
      force: clearAttempts,
      clear_attempts: clearAttempts,
    })
    if (res?.success) {
      notify(res.message || '已批量提交重试', 'success')
      await Promise.all([loadFailedUploads(), loadOverview(), loadLogs()])
    } else {
      notify(res?.message || '批量重试失败', 'error')
    }
  } catch (err: any) {
    notify(err?.message || '批量重试异常', 'error')
  } finally {
    actionBusy.value = ''
  }
}

async function triggerAction(action: string, extra: Record<string, any> = {}) {
  actionBusy.value = action
  try {
    const res: any = await props.api.post(`plugin/${props.pluginId}/actions/trigger`, {
      action,
      ...extra,
    })
    if (res?.success) {
      notify(res.message || '操作已触发', 'success')
      await Promise.all([loadOverview(), loadLogs()])
    } else {
      notify(res?.message || '操作失败', 'error')
    }
  } catch (err: any) {
    notify(err?.message || '触发操作异常', 'error')
  } finally {
    actionBusy.value = ''
  }
}

async function parseShare() {
  if (!shareForm.share_url.trim()) {
    notify('请输入 115 分享链接', 'warning')
    return
  }
  shareForm.parsing = true
  shareForm.parsed = null
  try {
    const res: any = await props.api.post(`plugin/${props.pluginId}/share/parse`, {
      share_url: shareForm.share_url.trim(),
    })
    if (res?.success) {
      shareForm.parsed = res.data || {}
      notify('分享链接解析成功', 'success')
    } else {
      notify(res?.message || '解析失败', 'error')
    }
  } catch (err: any) {
    notify(err?.message || '解析请求异常', 'error')
  } finally {
    shareForm.parsing = false
  }
}

async function receiveShare() {
  if (!shareForm.share_url.trim()) {
    notify('请输入 115 分享链接', 'warning')
    return
  }
  shareForm.receiving = true
  try {
    const res: any = await props.api.post(`plugin/${props.pluginId}/share/receive`, {
      share_url: shareForm.share_url.trim(),
      receive_code: shareForm.receive_code.trim(),
      target_path: shareForm.target_path.trim(),
    })
    if (res?.success) {
      notify(res.message || '已提交转存', 'success')
      shareForm.share_url = ''
      shareForm.receive_code = ''
      shareForm.parsed = null
      await Promise.all([loadShareRecords(), loadLogs()])
    } else {
      notify(res?.message || '转存失败', 'error')
    }
  } catch (err: any) {
    notify(err?.message || '转存请求异常', 'error')
  } finally {
    shareForm.receiving = false
  }
}

async function clearLogs() {
  try {
    const res: any = await props.api.post(`plugin/${props.pluginId}/logs/clear`, {})
    if (res?.success) {
      logs.value = []
      notify('联动日志已清空', 'success')
    }
  } catch (err: any) {
    notify(err?.message || '清空失败', 'error')
  }
}

async function handleSaveConfig(newCfg: Record<string, any>) {
  try {
    const res: any = await props.api.post(`plugin/${props.pluginId}/config`, newCfg)
    if (res?.success) {
      config.value = res.data || newCfg
      settingsDialog.value = false
      notify('配置已保存并生效', 'success')
      await refreshAll()
    } else {
      notify(res?.message || '保存配置失败', 'error')
    }
  } catch (err: any) {
    notify(err?.message || '保存配置异常', 'error')
  }
}

onMounted(() => {
  refreshAll()
})
</script>

<template>
  <div class="mv-page">
    <div class="mv-header">
      <div>
        <div class="mv-title">
          <VIcon icon="mdi-cloud-upload" size="22" color="primary" />
          <span>MediaVault 联动管家</span>
          <VChip
            size="x-small"
            variant="tonal"
            :color="isConnected ? 'success' : 'warning'"
          >
            {{ isConnected ? `已连接 ${overview.health?.version || ''}` : '未连接' }}
          </VChip>
        </div>
        <div class="mv-subtitle">
          115 上传失败智能重试、入库精准 STRM/刮削、删片清理、Emby 后处理与分享链直连转存
        </div>
      </div>

      <div class="mv-header__actions">
        <VBtn
          size="small"
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="refreshAll"
        >
          刷新
        </VBtn>
        <VBtn
          size="small"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-cog"
          @click="settingsDialog = true"
        >
          联动配置
        </VBtn>
      </div>
    </div>

    <div class="mv-pills">
      <button
        type="button"
        class="mv-pill"
        :class="{ 'is-active': activeTab === 'overview' }"
        @click="activeTab = 'overview'"
      >
        <VIcon icon="mdi-server" size="16" />
        总览与运维
      </button>
      <button
        type="button"
        class="mv-pill"
        :class="{ 'is-active': activeTab === 'failed' }"
        @click="activeTab = 'failed'"
      >
        <VIcon icon="mdi-restart" size="16" />
        上传失败重试
        <span v-if="failedEvents.length" class="mv-pill__badge">{{ failedEvents.length }}</span>
      </button>
      <button
        type="button"
        class="mv-pill"
        :class="{ 'is-active': activeTab === 'share' }"
        @click="activeTab = 'share'"
      >
        <VIcon icon="mdi-share-variant" size="16" />
        115 分享转存
      </button>
      <button
        type="button"
        class="mv-pill"
        :class="{ 'is-active': activeTab === 'logs' }"
        @click="activeTab = 'logs'"
      >
        <VIcon icon="mdi-history" size="16" />
        联动日志
      </button>
    </div>

    <!-- Tab 1: 总览与运维 -->
    <template v-if="activeTab === 'overview'">
      <VRow dense class="mv-stats-grid">
        <VCol cols="12" sm="6" md="3">
          <div class="mv-card">
            <div class="mv-card__label">今日 115 上传</div>
            <div class="mv-card__value">{{ todayUpload.count ?? 0 }}</div>
            <div class="mv-card__meta">
              秒传 {{ todayUpload.instant_count ?? 0 }} · {{ formatBytes(todayUpload.bytes) }}
            </div>
          </div>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <div class="mv-card">
            <div class="mv-card__label">待处理上传失败</div>
            <div class="mv-card__value" :class="failedEvents.length ? 'text-error' : 'text-success'">
              {{ failedEvents.length }}
            </div>
            <div class="mv-card__meta">
              可安全重试 {{ retryableEvents.length }} · 需核对 {{ manualConfirmEvents.length }}
            </div>
          </div>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <div class="mv-card">
            <div class="mv-card__label">STRM 索引总数</div>
            <div class="mv-card__value">{{ strmStats.total ?? 0 }}</div>
            <div class="mv-card__meta">
              {{ overview.strm_gen_status?.running ? 'STRM 生成中...' : '当前空闲' }}
            </div>
          </div>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <div class="mv-card">
            <div class="mv-card__label">Emby 增强统计</div>
            <div class="mv-card__value">{{ overview.emby?.mediainfo?.backed_up ?? 0 }}</div>
            <div class="mv-card__meta">
              MediaInfo 待补 {{ overview.emby?.mediainfo?.pending ?? 0 }} · 缩略图 {{ overview.emby?.thumbnail?.done ?? 0 }}
            </div>
          </div>
        </VCol>
      </VRow>

      <!-- 目录级运维：常用路径对 + 4项目录动作 -->
      <div class="mv-card mt-3">
        <div class="mv-ops-head">
          <div>
            <div class="mv-section-title">目录级快捷运维</div>
            <div class="mv-subtitle">点击常用路径对一键切换（自动合并 MediaVault 启用监控规则），或微调后存为常用</div>
          </div>
          <VBtn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-plus"
            @click="openSavePairDialog"
          >
            存为常用
          </VBtn>
        </div>

        <div v-if="allPathPairs.length" class="mv-pair-strip mt-3">
          <div
            v-for="pair in allPathPairs"
            :key="pair.id"
            class="mv-pair-chip"
            :class="{ 'is-active': selectedPairId === pair.id }"
            @click="selectPathPair(pair)"
          >
            <div class="mv-pair-chip__top">
              <VIcon icon="mdi-folder-outline" size="15" />
              <span class="mv-pair-chip__name">{{ pair.name }}</span>
              <span v-if="pair.auto" class="mv-pair-chip__tag">MV</span>
              <button
                v-else
                type="button"
                class="mv-pair-chip__del"
                title="移除常用路径对"
                @click.stop="removeSavedPathPair(pair.id)"
              >
                <VIcon icon="mdi-close" size="13" />
              </button>
            </div>
            <div class="mv-pair-chip__path">
              {{ pair.source_dir || '-' }} → {{ pair.target_dir || '默认 STRM' }}
            </div>
          </div>
        </div>

        <VRow dense class="mt-3">
          <VCol cols="12" md="6">
            <VTextField
              v-model="quickForm.source_dir"
              label="云盘源目录（115 网盘路径）"
              placeholder="/media"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="selectedPairId = ''"
            />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField
              v-model="quickForm.target_dir"
              label="STRM 目标目录（本地 STRM 路径）"
              placeholder="/media/strm"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="selectedPairId = ''"
            />
          </VCol>
        </VRow>

        <div class="mv-tile-grid mt-3">
          <button
            type="button"
            class="mv-tile"
            :disabled="actionBusy === 'strm_generate'"
            @click="triggerAction('strm_generate', { source_dir: quickForm.source_dir, target_dir: quickForm.target_dir, storage: quickForm.storage })"
          >
            <div class="mv-tile__icon">
              <VIcon icon="mdi-folder-outline" size="18" color="primary" />
            </div>
            <div class="mv-tile__body">
              <div class="mv-tile__title">{{ actionBusy === 'strm_generate' ? '生成中...' : '增量生成 STRM' }}</div>
              <div class="mv-tile__desc">按当前云盘源目录生成到 STRM 目标目录</div>
            </div>
          </button>

          <button
            type="button"
            class="mv-tile"
            :disabled="actionBusy === 'scrape'"
            @click="triggerAction('scrape', { target_dir: quickForm.target_dir || quickForm.source_dir })"
          >
            <div class="mv-tile__icon">
              <VIcon icon="mdi-auto-fix" size="18" color="primary" />
            </div>
            <div class="mv-tile__body">
              <div class="mv-tile__title">{{ actionBusy === 'scrape' ? '刮削中...' : '目录刮削' }}</div>
              <div class="mv-tile__desc">补齐当前 STRM 目录的元数据与图片</div>
            </div>
          </button>

          <button
            type="button"
            class="mv-tile"
            :disabled="actionBusy === 'cleanup_scan'"
            @click="triggerAction('cleanup_scan', { source_dir: quickForm.source_dir, target_dir: quickForm.target_dir, storage: quickForm.storage })"
          >
            <div class="mv-tile__icon">
              <VIcon icon="mdi-broom" size="18" />
            </div>
            <div class="mv-tile__body">
              <div class="mv-tile__title">{{ actionBusy === 'cleanup_scan' ? '扫描中...' : '失效 STRM 扫描' }}</div>
              <div class="mv-tile__desc">比对云盘与 STRM 目录检测失效索引</div>
            </div>
          </button>

          <button
            type="button"
            class="mv-tile"
            :disabled="actionBusy === 'orphan_scan'"
            @click="triggerAction('orphan_scan', { source_dir: quickForm.source_dir, storage: quickForm.storage })"
          >
            <div class="mv-tile__icon">
              <VIcon icon="mdi-database" size="18" />
            </div>
            <div class="mv-tile__body">
              <div class="mv-tile__title">{{ actionBusy === 'orphan_scan' ? '扫描中...' : '孤立索引扫描' }}</div>
              <div class="mv-tile__desc">排查当前云盘目录中的孤立记录</div>
            </div>
          </button>
        </div>
      </div>

      <!-- 全局同步与 Emby 增强 -->
      <VRow dense class="mt-3">
        <VCol cols="12" md="5">
          <div class="mv-card mv-card--full">
            <div class="mv-section-title">监控与 115 维护</div>
            <div class="mv-subtitle">无需路径参数，作用于整个 MediaVault 实例</div>
            <div class="mv-action-grid mt-3">
              <VBtn
                size="small"
                variant="tonal"
                color="primary"
                prepend-icon="mdi-play"
                :loading="actionBusy === 'monitor_sync'"
                @click="triggerAction('monitor_sync')"
              >
                监控增量同步
              </VBtn>
              <VBtn
                size="small"
                variant="tonal"
                prepend-icon="mdi-broom"
                :loading="actionBusy === 'clear_115_attempts'"
                @click="triggerAction('clear_115_attempts')"
              >
                清理 115 锁文件 (.json)
              </VBtn>
            </div>
          </div>
        </VCol>
        <VCol cols="12" md="7">
          <div class="mv-card mv-card--full">
            <div class="mv-section-title">Emby 增强后处理</div>
            <div class="mv-subtitle">针对缺失项增量提取，或一键重试失败任务</div>
            <div class="mv-action-grid mt-3">
              <VBtn
                size="small"
                variant="tonal"
                prepend-icon="mdi-filmstrip"
                :loading="actionBusy === 'emby_mediainfo'"
                @click="triggerAction('emby_mediainfo')"
              >
                提取 MediaInfo
              </VBtn>
              <VBtn
                size="small"
                variant="text"
                prepend-icon="mdi-restart"
                :loading="actionBusy === 'emby_mediainfo_retry'"
                @click="triggerAction('emby_mediainfo_retry')"
              >
                重试失败
              </VBtn>
              <VBtn
                size="small"
                variant="tonal"
                prepend-icon="mdi-image"
                :loading="actionBusy === 'emby_thumbnail'"
                @click="triggerAction('emby_thumbnail')"
              >
                生成缩略图
              </VBtn>
              <VBtn
                size="small"
                variant="text"
                prepend-icon="mdi-restart"
                :loading="actionBusy === 'emby_thumbnail_retry'"
                @click="triggerAction('emby_thumbnail_retry')"
              >
                重试失败
              </VBtn>
              <VBtn
                size="small"
                variant="tonal"
                prepend-icon="mdi-tune"
                :loading="actionBusy === 'emby_intro_skip'"
                @click="triggerAction('emby_intro_skip')"
              >
                片头片尾检测
              </VBtn>
            </div>
          </div>
        </VCol>
      </VRow>
    </template>

    <!-- Tab 2: 115 上传失败重试 -->
    <template v-else-if="activeTab === 'failed'">
      <div class="mv-table-card">
        <div class="mv-table-head">
          <div>
            <div class="mv-section-title">115 监控上传失败队列</div>
            <div class="mv-subtitle">
              绿色标签为可安全重试项；橙色标签命中“勿重复上传/请先核对云盘文件”等保护词，自动巡检会跳过，可核对后手动强制重试。
            </div>
          </div>
          <div class="d-flex flex-wrap ga-2">
            <VBtn
              size="small"
              variant="tonal"
              prepend-icon="mdi-broom"
              :loading="actionBusy === 'clear_115_attempts'"
              @click="triggerAction('clear_115_attempts')"
            >
              清理 115 锁文件 (.json)
            </VBtn>
            <VBtn
              size="small"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-restart"
              :loading="actionBusy === 'retry_clear_all'"
              :disabled="!retryableEvents.length"
              @click="retryAllSafe(true)"
            >
              清锁并批量重传 ({{ retryableEvents.length }})
            </VBtn>
          </div>
        </div>

        <div v-if="!failedEvents.length" class="mv-empty-box">
          <VIcon icon="mdi-check-circle" size="30" color="success" />
          <div>当前没有失败的 115 上传任务</div>
        </div>

        <VTable v-else density="comfortable">
          <thead>
            <tr>
              <th>ID</th>
              <th>文件名 / 目标路径</th>
              <th>分类</th>
              <th>失败原因</th>
              <th>自动次数</th>
              <th class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ev in failedEvents" :key="ev.id">
              <td class="text-no-wrap">#{{ ev.id }}</td>
              <td>
                <div class="font-weight-medium">{{ ev.file_name || '-' }}</div>
                <div class="text-caption text-medium-emphasis">{{ ev.dest_path || ev.file_path }}</div>
              </td>
              <td class="text-no-wrap">
                <VChip
                  size="x-small"
                  variant="tonal"
                  :color="ev.retry_category === 'retryable' ? 'success' : ev.retry_category === 'clear_lock_retry' ? 'info' : 'warning'"
                >
                  {{ ev.retry_category === 'retryable' ? '可安全重试' : ev.retry_category === 'clear_lock_retry' ? '清锁可重传' : '需人工核对' }}
                </VChip>
              </td>
              <td class="mv-err-cell">{{ ev.error || ev.message || '-' }}</td>
              <td class="text-no-wrap">{{ ev.auto_attempts }}</td>
              <td class="text-right text-no-wrap">
                <VBtn
                  size="x-small"
                  variant="tonal"
                  color="primary"
                  :loading="actionBusy === `retry_${ev.id}`"
                  @click="retrySingle(ev, true, true)"
                >
                  清锁重传
                </VBtn>
                <VBtn
                  size="x-small"
                  variant="text"
                  class="ml-1"
                  :loading="actionBusy === `retry_${ev.id}`"
                  @click="retrySingle(ev, false, false)"
                >
                  普通重试
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </div>
    </template>

    <!-- Tab 3: 115 分享转存 -->
    <template v-else-if="activeTab === 'share'">
      <div class="mv-card">
        <div class="mv-section-title">115 分享链接直连转存</div>
        <VRow dense class="mt-2">
          <VCol cols="12" md="6">
            <VTextField
              v-model="shareForm.share_url"
              label="115 分享链接"
              placeholder="https://115cdn.com/s/..."
              variant="outlined"
              density="compact"
              hide-details
            />
          </VCol>
          <VCol cols="6" md="2">
            <VTextField
              v-model="shareForm.receive_code"
              label="访问码(可选)"
              placeholder="4位访问码"
              variant="outlined"
              density="compact"
              hide-details
            />
          </VCol>
          <VCol cols="6" md="4">
            <VTextField
              v-model="shareForm.target_path"
              label="目标网盘目录(可选)"
              placeholder="/media/Inbox"
              variant="outlined"
              density="compact"
              hide-details
            />
          </VCol>
        </VRow>
        <div class="d-flex ga-2 mt-3">
          <VBtn
            size="small"
            variant="tonal"
            prepend-icon="mdi-magnify"
            :loading="shareForm.parsing"
            @click="parseShare"
          >
            解析链接
          </VBtn>
          <VBtn
            size="small"
            variant="flat"
            color="primary"
            prepend-icon="mdi-send"
            :loading="shareForm.receiving"
            @click="receiveShare"
          >
            立即转存到 115
          </VBtn>
        </div>

        <div v-if="shareForm.parsed" class="mv-parsed-box mt-3">
          <div class="font-weight-medium">解析结果：{{ shareForm.parsed.title || shareForm.parsed.share_title || '已解析' }}</div>
          <div class="text-caption text-medium-emphasis">
            文件数：{{ shareForm.parsed.count ?? shareForm.parsed.file_count ?? '-' }}
          </div>
        </div>
      </div>

      <div class="mv-table-card mt-3">
        <div class="mv-table-head">
          <div class="mv-section-title">最近转存记录</div>
        </div>
        <div v-if="!shareRecords.length" class="mv-empty-box">
          <VIcon icon="mdi-link-variant" size="28" />
          <div>暂无分享转存记录</div>
        </div>
        <VTable v-else density="comfortable">
          <thead>
            <tr>
              <th>时间</th>
              <th>标题 / 链接</th>
              <th>目标目录</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rec, idx) in shareRecords" :key="rec.id || idx">
              <td class="text-no-wrap">{{ rec.created_at || '-' }}</td>
              <td>{{ rec.title || rec.share_title || rec.share_url || '-' }}</td>
              <td>{{ rec.target_path || '-' }}</td>
              <td>
                <VChip size="x-small" variant="tonal" :color="rec.status === 'failed' ? 'error' : 'success'">
                  {{ rec.status || 'done' }}
                </VChip>
              </td>
            </tr>
          </tbody>
        </VTable>
      </div>
    </template>

    <!-- Tab 4: 联动日志 -->
    <template v-else>
      <div class="mv-table-card">
        <div class="mv-table-head">
          <div class="mv-section-title">联动执行日志</div>
          <div class="d-flex ga-2 align-center">
            <VTextField
              v-model="logKeyword"
              placeholder="过滤关键词"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              style="width: 200px"
            />
            <VBtn size="small" variant="text" color="error" prepend-icon="mdi-delete" @click="clearLogs">
              清空
            </VBtn>
          </div>
        </div>

        <div v-if="!filteredLogs.length" class="mv-empty-box">
          <VIcon icon="mdi-history" size="28" />
          <div>暂无联动日志</div>
        </div>
        <VTable v-else density="comfortable">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>状态</th>
              <th>摘要</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredLogs" :key="item.id">
              <td class="text-no-wrap">{{ item.time }}</td>
              <td class="text-no-wrap">{{ item.category }}</td>
              <td class="text-no-wrap">
                <VChip
                  size="x-small"
                  variant="tonal"
                  :color="item.status === 'error' ? 'error' : item.status === 'warning' ? 'warning' : 'success'"
                >
                  {{ item.status }}
                </VChip>
              </td>
              <td>{{ item.summary }}</td>
              <td class="mv-err-cell">{{ item.detail || '-' }}</td>
            </tr>
          </tbody>
        </VTable>
      </div>
    </template>

    <!-- 存为常用路径对弹窗 -->
    <VDialog v-model="savePairDialog" max-width="440">
      <VCard class="mv-dialog">
        <div class="mv-dialog__header">
          <div class="d-flex align-center ga-2">
            <VIcon icon="mdi-folder-outline" size="18" color="primary" />
            <span class="font-weight-semibold">保存为常用路径对</span>
          </div>
          <VBtn icon="mdi-close" size="small" variant="text" @click="savePairDialog = false" />
        </div>
        <VCardText class="pa-4">
          <VTextField
            v-model="newPairName"
            label="路径对别名（如：全库 / 日番 / 电影）"
            variant="outlined"
            density="compact"
            hide-details="auto"
          />
          <div class="text-caption text-medium-emphasis mt-3">
            云盘源目录：{{ quickForm.source_dir || '-' }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            STRM 目标目录：{{ quickForm.target_dir || '-' }}
          </div>
          <div class="d-flex justify-end ga-2 mt-4">
            <VBtn size="small" variant="text" @click="savePairDialog = false">取消</VBtn>
            <VBtn size="small" color="primary" variant="flat" :loading="savingPair" @click="saveCurrentPathPair">
              保存
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- 联动配置弹窗 -->
    <VDialog v-model="settingsDialog" max-width="920" scrollable>
      <VCard class="mv-dialog">
        <div class="mv-dialog__header">
          <div class="d-flex align-center ga-2">
            <VIcon icon="mdi-cog" size="18" color="primary" />
            <span class="font-weight-semibold">MediaVault 联动配置</span>
          </div>
          <VBtn icon="mdi-close" size="small" variant="text" @click="settingsDialog = false" />
        </div>
        <VCardText class="pa-4">
          <Config
            :initial-config="config"
            :api="props.api"
            :plugin-id="props.pluginId"
            embedded
            @save="handleSaveConfig"
            @close="settingsDialog = false"
          />
        </VCardText>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>

<style scoped>
.mv-page {
  width: 100%;
  max-width: none;
  padding: 2px 0 16px;
}

.mv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}

.mv-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.mv-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.mv-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mv-pills {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 3px;
  border-radius: 9px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  margin-bottom: 14px;
}

.mv-pill {
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

.mv-pill.is-active {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.mv-pill__badge {
  padding: 0 6px;
  border-radius: 6px;
  font-size: 11px;
  background: rgba(var(--v-theme-error), 0.14);
  color: rgb(var(--v-theme-error));
}

.mv-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.mv-card__label {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.mv-card__value {
  margin-top: 4px;
  font-size: 24px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.mv-card__meta {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.56);
}

.mv-section-title {
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.mv-action-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mv-card--full {
  height: 100%;
}

.mv-ops-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.mv-pair-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mv-pair-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 170px;
  max-width: 300px;
  padding: 8px 11px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.mv-pair-chip:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
}

.mv-pair-chip.is-active {
  background: rgba(var(--v-theme-primary), 0.08);
  border-color: rgba(var(--v-theme-primary), 0.45);
}

.mv-pair-chip__top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mv-pair-chip__name {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mv-pair-chip__tag {
  margin-left: auto;
  padding: 0 5px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.mv-pair-chip__del {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.5);
  cursor: pointer;
}

.mv-pair-chip__del:hover {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

.mv-pair-chip__path {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.58);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mv-tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
}

.mv-tile {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.mv-tile:hover:not(:disabled) {
  border-color: rgba(var(--v-theme-primary), 0.35);
  background: rgba(var(--v-theme-primary), 0.04);
}

.mv-tile:disabled {
  opacity: 0.6;
  cursor: wait;
}

.mv-tile__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  flex-shrink: 0;
}

.mv-tile__body {
  min-width: 0;
}

.mv-tile__title {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.mv-tile__desc {
  margin-top: 2px;
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.mv-table-card {
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
}

.mv-table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.mv-empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 36px 16px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.58);
  margin: 14px;
}

.mv-err-cell {
  max-width: 340px;
  font-size: 12px;
  word-break: break-word;
}

.mv-parsed-box {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.mv-dialog {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.mv-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
