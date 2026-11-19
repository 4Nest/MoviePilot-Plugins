<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref } from 'vue'
import Config from './Config.vue'
import {
  type BridgeLogItem,
  type FailedUploadEvent,
  type HostToast,
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
})

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
  failedEvents.value.filter(ev => ev.retry_category === 'retryable'),
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
        if (!quickForm.source_dir && res.data.config.path_mappings?.[0]) {
          quickForm.source_dir = res.data.config.path_mappings[0].mv_cloud_prefix || ''
          quickForm.target_dir = res.data.config.path_mappings[0].mv_strm_prefix || ''
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

async function retrySingle(ev: FailedUploadEvent, force = false) {
  actionBusy.value = `retry_${ev.id}`
  try {
    const res: any = await props.api.post(`plugin/${props.pluginId}/retry-uploads`, {
      event_ids: [ev.id],
      force,
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

async function retryAllSafe() {
  if (!retryableEvents.value.length) {
    notify('当前没有可安全自动重试的失败项', 'info')
    return
  }
  actionBusy.value = 'retry_safe'
  try {
    const res: any = await props.api.post(`plugin/${props.pluginId}/retry-uploads`, {
      event_ids: retryableEvents.value.map(ev => ev.id),
      force: false,
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

      <div class="mv-card mt-3">
        <div class="mv-section-title">快捷运维触发</div>
        <VRow dense class="mt-2">
          <VCol cols="12" md="6">
            <VTextField
              v-model="quickForm.source_dir"
              label="云盘源目录（用于增量 STRM / 孤立索引扫描）"
              placeholder="/media"
              variant="outlined"
              density="compact"
              hide-details
            />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField
              v-model="quickForm.target_dir"
              label="STRM 目标目录（用于增量 STRM / 目录刮削 / 清理扫描）"
              placeholder="/strm"
              variant="outlined"
              density="compact"
              hide-details
            />
          </VCol>
        </VRow>

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
            color="primary"
            prepend-icon="mdi-folder-outline"
            :loading="actionBusy === 'strm_generate'"
            @click="triggerAction('strm_generate', { source_dir: quickForm.source_dir, target_dir: quickForm.target_dir })"
          >
            增量生成 STRM
          </VBtn>
          <VBtn
            size="small"
            variant="tonal"
            prepend-icon="mdi-auto-fix"
            :loading="actionBusy === 'scrape'"
            @click="triggerAction('scrape', { target_dir: quickForm.target_dir || quickForm.source_dir })"
          >
            目录刮削
          </VBtn>
          <VBtn
            size="small"
            variant="tonal"
            prepend-icon="mdi-broom"
            :loading="actionBusy === 'cleanup_scan'"
            @click="triggerAction('cleanup_scan', { source_dir: quickForm.source_dir, target_dir: quickForm.target_dir })"
          >
            失效 STRM 扫描
          </VBtn>
          <VBtn
            size="small"
            variant="tonal"
            prepend-icon="mdi-database"
            :loading="actionBusy === 'orphan_scan'"
            @click="triggerAction('orphan_scan', { source_dir: quickForm.source_dir })"
          >
            孤立索引扫描
          </VBtn>
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
            variant="tonal"
            prepend-icon="mdi-image"
            :loading="actionBusy === 'emby_thumbnail'"
            @click="triggerAction('emby_thumbnail')"
          >
            生成缩略图
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
          <div class="d-flex ga-2">
            <VBtn
              size="small"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-restart"
              :loading="actionBusy === 'retry_safe'"
              :disabled="!retryableEvents.length"
              @click="retryAllSafe"
            >
              批量重试安全项 ({{ retryableEvents.length }})
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
                  :color="ev.retry_category === 'retryable' ? 'success' : 'warning'"
                >
                  {{ ev.retry_category === 'retryable' ? '可安全重试' : '需人工核对' }}
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
                  @click="retrySingle(ev, false)"
                >
                  重试
                </VBtn>
                <VBtn
                  size="x-small"
                  variant="text"
                  color="warning"
                  class="ml-1"
                  :loading="actionBusy === `retry_${ev.id}`"
                  @click="retrySingle(ev, true)"
                >
                  强制重试
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
