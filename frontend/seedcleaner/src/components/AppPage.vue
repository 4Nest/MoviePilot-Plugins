<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref, watch } from 'vue'
import Config from './Config.vue'
import DryRunPage from './DryRunPage.vue'
import {
  type CleanItem,
  type DownloaderOverview,
  type HostToast,
  type RuleTemplate,
  formatSingleLineTime,
} from '../types'

type ActivePage = 'overview' | 'preview'

const props = defineProps({
  api: { type: Object, default: () => ({}) },
  pluginId: { type: String, default: 'SeedCleaner' },
  navKey: { type: String, default: 'main' },
})
const emit = defineEmits(['action', 'switch', 'close'])
const hostToast = inject<HostToast | null>('moviepilot:toast', null)

function resolvePageFromNavKey(navKey?: string): ActivePage {
  return navKey === 'preview' || navKey === 'dry-run' ? 'preview' : 'overview'
}

function currentTimestamp(): string {
  const now = new Date()
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const activePage = ref<ActivePage>(resolvePageFromNavKey(props.navKey))
const loading = ref(false)
const working = ref<'dry' | 'run' | ''>('')
const config = ref<Record<string, any>>({ rules: [], disk_guard: {} })
const downloaders = ref<DownloaderOverview[]>([])
const collectionErrors = ref<string[]>([])
const preview = ref<Record<string, any> | null>(null)
const lastPreviewTime = ref('')
const history = ref<CleanItem[]>([])
const historyKeyword = ref('')
const templates = ref<RuleTemplate[]>([])

// 弹窗状态
const settingsDialog = ref(false)
const templatesDialog = ref(false)
const runDialog = ref(false)
const clearHistoryDialog = ref(false)
const regexDialog = ref(false)

const snackbar = reactive({ show: false, text: '', color: 'success' })
const regexForm = reactive({ pattern: '', text: '' })
const regexResult = ref<Record<string, any> | null>(null)
const regexTesting = ref(false)
let regexTimer: ReturnType<typeof setTimeout> | undefined
let regexGeneration = 0

watch(
  () => props.navKey,
  nextKey => {
    activePage.value = resolvePageFromNavKey(nextKey)
  },
)

const previewItems = computed<CleanItem[]>(() => preview.value?.candidates || [])
const totalRuleCount = computed(() => (config.value.rules || []).length)
const enabledRuleCount = computed(() => (config.value.rules || []).filter((rule: any) => rule.enabled).length)
const guardEnabled = computed(() => Boolean(config.value.disk_guard?.enabled))

const filteredHistory = computed<CleanItem[]>(() => {
  const kw = historyKeyword.value.trim().toLowerCase()
  if (!kw) return history.value
  return history.value.filter(item => {
    return (
      String(item.name || '').toLowerCase().includes(kw) ||
      String(item.rule_name || '').toLowerCase().includes(kw) ||
      String(item.downloader || '').toLowerCase().includes(kw)
    )
  })
})

const historyHeaders = [
  {
    title: '时间',
    key: 'time',
    width: '172px',
    minWidth: '164px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-nowrap col-time' },
  },
  {
    title: '状态',
    key: 'status',
    width: '86px',
    minWidth: '82px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-nowrap' },
  },
  {
    title: '种子名称',
    key: 'name',
    headerProps: { class: 'col-torrent-head' },
    cellProps: { class: 'col-torrent' },
  },
  {
    title: '下载器',
    key: 'downloader',
    width: '120px',
    minWidth: '108px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-nowrap' },
  },
  {
    title: '体积',
    key: 'size_gb',
    width: '104px',
    minWidth: '96px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-nowrap col-num' },
  },
  {
    title: '命中规则',
    key: 'rule_name',
    width: '156px',
    minWidth: '132px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-rule' },
  },
]

function notify(message: string, color: 'success' | 'error' | 'info' = 'success') {
  if (hostToast) {
    if (color === 'success') hostToast.success(message)
    else if (color === 'error') hostToast.error(message)
    else hostToast.info(message)
    return
  }
  snackbar.text = message
  snackbar.color = color
  snackbar.show = true
}

function responseMessage(error: any): string {
  return error?.response?.data?.message || error?.message || '请求失败，请检查后端日志'
}

async function loadConfig() {
  if (!props.api?.get) return
  try {
    const response = await props.api.get(`plugin/${props.pluginId}/config`)
    if (response?.success && response.data) config.value = response.data
  } catch (error) {
    notify(responseMessage(error), 'error')
  }
}

async function loadOverview() {
  if (!props.api?.get) return
  try {
    const response = await props.api.get(`plugin/${props.pluginId}/overview`)
    if (response?.success) {
      downloaders.value = response.data?.downloaders || []
      collectionErrors.value = response.data?.errors || []
    }
  } catch (error) {
    notify(responseMessage(error), 'error')
  }
}

async function loadHistory() {
  if (!props.api?.get) return
  try {
    const response = await props.api.get(`plugin/${props.pluginId}/history`)
    if (response?.success) history.value = response.data || []
  } catch (error) {
    notify(responseMessage(error), 'error')
  }
}

async function loadTemplates() {
  if (!props.api?.get) return
  try {
    const response = await props.api.get(`plugin/${props.pluginId}/templates`)
    if (response?.success) templates.value = response.data || []
  } catch (error) {
    notify(responseMessage(error), 'error')
  }
}

async function refreshAll() {
  loading.value = true
  await Promise.all([loadConfig(), loadOverview(), loadHistory(), loadTemplates()])
  loading.value = false
}

async function saveConfig(nextConfig: Record<string, any>) {
  try {
    const response = await props.api.post(`plugin/${props.pluginId}/config`, nextConfig)
    if (!response?.success) throw new Error(response?.message || '配置保存失败')
    config.value = response.data || nextConfig
    settingsDialog.value = false
    notify('配置已保存')
    emit('action')
  } catch (error) {
    notify(responseMessage(error), 'error')
  }
}

async function dryRun() {
  activePage.value = 'preview'
  working.value = 'dry'
  try {
    const response = await props.api.post(`plugin/${props.pluginId}/dry-run`, {})
    preview.value = response?.data || { candidates: [], errors: [response?.message || '干跑失败'] }
    lastPreviewTime.value = currentTimestamp()
    if (response?.success) notify(`干跑完成：命中 ${preview.value.candidate_count || 0} 个种子`, 'info')
    else notify(response?.message || '干跑失败', 'error')
  } catch (error) {
    notify(responseMessage(error), 'error')
  } finally {
    working.value = ''
  }
}

function openDryRunPage(autoRunIfEmpty = false) {
  activePage.value = 'preview'
  if (autoRunIfEmpty && !preview.value && working.value !== 'dry') {
    void dryRun()
  }
}

async function executeCleanup() {
  working.value = 'run'
  runDialog.value = false
  try {
    const response = await props.api.post(`plugin/${props.pluginId}/run`, {})
    if (!response?.success) throw new Error(response?.message || '清理失败')
    const deleted = response.data?.deleted?.length || 0
    const failed = response.data?.failed?.length || 0
    notify(`清理完成：成功 ${deleted}，失败 ${failed}`, failed ? 'info' : 'success')
    preview.value = null
    lastPreviewTime.value = ''
    activePage.value = 'overview'
    await Promise.all([loadOverview(), loadHistory()])
    emit('action')
  } catch (error) {
    notify(responseMessage(error), 'error')
  } finally {
    working.value = ''
  }
}

async function importTemplate(template: RuleTemplate) {
  try {
    const response = await props.api.post(`plugin/${props.pluginId}/templates/import`, { id: template.id })
    if (!response?.success) throw new Error(response?.message || '模板导入失败')
    config.value = response.data || config.value
    notify(response.message || `已导入「${template.name}」`)
    emit('action')
  } catch (error) {
    notify(responseMessage(error), 'error')
  }
}

async function clearHistory() {
  try {
    const response = await props.api.delete(`plugin/${props.pluginId}/history`)
    if (!response?.success) throw new Error(response?.message || '清空失败')
    history.value = []
    clearHistoryDialog.value = false
    notify('清理历史已清空')
  } catch (error) {
    notify(responseMessage(error), 'error')
  }
}

async function testRegex() {
  if (!regexForm.pattern) {
    regexResult.value = null
    return
  }
  const generation = ++regexGeneration
  regexTesting.value = true
  try {
    const response = await props.api.post(`plugin/${props.pluginId}/regex/test`, { ...regexForm })
    if (generation === regexGeneration) regexResult.value = response?.data || { valid: false, error: response?.message }
  } catch (error) {
    if (generation === regexGeneration)
      regexResult.value = { valid: false, matched: false, error: responseMessage(error) }
  } finally {
    if (generation === regexGeneration) regexTesting.value = false
  }
}

watch(
  () => [regexForm.pattern, regexForm.text, regexDialog.value],
  () => {
    if (regexTimer) clearTimeout(regexTimer)
    if (regexDialog.value && regexForm.pattern) regexTimer = setTimeout(testRegex, 350)
  },
)

function formatSpeed(bytes: number): string {
  if (!bytes) return '0 B/s'
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB/s`
  return `${(bytes / 1024).toFixed(1)} KB/s`
}

function freePercent(item: DownloaderOverview): number {
  if (!item.total_space_gb || item.free_space_gb == null) return 0
  return Math.max(0, Math.min(100, (item.free_space_gb / item.total_space_gb) * 100))
}

function templateIcon(id: string): string {
  if (id === 'unregistered') return 'mdi-alert-octagon'
  if (id === 'cold_large') return 'mdi-snowflake'
  if (id === 'official_exclude') return 'mdi-shield-crown'
  return 'mdi-medal'
}

onMounted(refreshAll)
</script>

<template>
  <div class="seed-page">
    <!-- 1. 紧凑顶部标题与主操作栏（对齐 EmbyUserManager） -->
    <header class="seed-topbar">
      <div class="seed-topbar__left">
        <div class="seed-topbar__icon">
          <v-icon icon="mdi-broom" size="22" />
        </div>
        <div class="seed-topbar__heading">
          <div class="seed-topbar__title-row">
            <h2>保种删种管家</h2>
            <button
              type="button"
              class="seed-tag seed-tag--clickable"
              :class="config.enabled ? 'is-active' : 'is-muted'"
              @click="settingsDialog = true"
            >
              <v-icon :icon="config.enabled ? 'mdi-clock-check-outline' : 'mdi-clock-outline'" size="13" />
              {{ config.enabled ? `巡检：${config.cron || '已启用'}` : '巡检已关闭' }}
            </button>
            <button type="button" class="seed-tag seed-tag--clickable" @click="settingsDialog = true">
              <v-icon icon="mdi-format-list-checks" size="13" />
              规则 {{ enabledRuleCount }}/{{ totalRuleCount }}
            </button>
            <button
              type="button"
              class="seed-tag seed-tag--clickable"
              :class="guardEnabled ? 'is-warning' : 'is-muted'"
              @click="settingsDialog = true"
            >
              <v-icon icon="mdi-harddisk" size="13" />
              {{ guardEnabled ? `保盘：<${config.disk_guard?.free_space_threshold_gb ?? 50}GB` : '保盘未启用' }}
            </button>
          </div>
        </div>
      </div>

      <div class="seed-topbar__actions">
        <v-btn
          icon="mdi-refresh"
          variant="text"
          size="small"
          rounded="lg"
          aria-label="刷新数据"
          :loading="loading"
          @click="refreshAll"
        />
        <v-btn
          size="small"
          variant="outlined"
          rounded="lg"
          prepend-icon="mdi-tune"
          @click="settingsDialog = true"
        >
          规则配置
        </v-btn>
        <v-btn
          v-if="activePage === 'overview'"
          size="small"
          color="primary"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-eye-outline"
          :loading="working === 'dry'"
          @click="openDryRunPage(true)"
        >
          干跑预览
        </v-btn>
        <v-btn
          v-else
          size="small"
          color="primary"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-play-outline"
          :loading="working === 'dry'"
          @click="dryRun"
        >
          {{ preview ? '重新干跑' : '开始干跑' }}
        </v-btn>
        <v-btn
          size="small"
          color="error"
          variant="tonal"
          rounded="lg"
          prepend-icon="mdi-play"
          :loading="working === 'run'"
          @click="runDialog = true"
        >
          立即清理
        </v-btn>
      </div>
    </header>

    <!-- 2. 一体化视图分段切换与辅助工具条 -->
    <section class="seed-toolbar">
      <div class="seed-toolbar__left">
        <div class="seed-pills" role="group" aria-label="保种管家视图切换">
          <button
            type="button"
            class="seed-pill"
            :class="{ 'is-active': activePage === 'overview' }"
            @click="activePage = 'overview'"
          >
            <v-icon icon="mdi-view-dashboard-outline" size="15" />
            <span>运行概览</span>
            <strong>{{ downloaders.length }}</strong>
          </button>
          <button
            type="button"
            class="seed-pill"
            :class="{ 'is-active': activePage === 'preview' }"
            @click="openDryRunPage(false)"
          >
            <v-icon icon="mdi-test-tube" size="15" />
            <span>干跑预览</span>
            <strong v-if="preview">{{ previewItems.length }}</strong>
          </button>
        </div>

        <span class="seed-counter">
          <v-icon icon="mdi-history" size="14" />
          记录 {{ history.length }}
        </span>
      </div>

      <div class="seed-subactions">
        <v-btn
          size="x-small"
          variant="tonal"
          rounded="lg"
          class="px-3"
          prepend-icon="mdi-regex"
          @click="regexDialog = true"
        >
          正则测试
        </v-btn>
        <v-btn
          size="x-small"
          variant="tonal"
          rounded="lg"
          class="px-3"
          prepend-icon="mdi-view-grid-plus"
          @click="templatesDialog = true"
        >
          预设模板
        </v-btn>
      </div>
    </section>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" rounded />

    <!-- 3A. 运行概览视图 -->
    <template v-if="activePage === 'overview'">
      <v-alert
        v-for="error in collectionErrors"
        :key="error"
        type="error"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="mb-3"
      >
        {{ error }}
      </v-alert>

      <!-- 下载器紧凑三段式卡片网格 -->
      <section class="seed-section">
        <div class="seed-section__head">
          <div class="seed-section__title">
            <v-icon icon="mdi-download-network-outline" size="18" color="primary" />
            <span>下载器实时概况</span>
          </div>
          <span class="text-caption text-medium-emphasis">空间按下载器接口或可访问路径实时读取</span>
        </div>

        <div v-if="downloaders.length" class="seed-dl-grid">
          <article v-for="item in downloaders" :key="item.name" class="seed-dl-card">
            <!-- 上段：图标、名称、类型徽标、空间状态胶囊 -->
            <div class="seed-dl-card__head">
              <div class="seed-dl-card__avatar" :class="item.type === 'qbittorrent' ? 'is-qb' : 'is-tr'">
                <v-icon
                  :icon="item.type === 'qbittorrent' ? 'mdi-qrcode' : 'mdi-transit-connection-variant'"
                  size="19"
                />
              </div>

              <div class="seed-dl-card__identity">
                <div class="seed-dl-card__name-line">
                  <span class="seed-dl-card__name" :title="item.name">{{ item.name }}</span>
                  <span class="seed-chip">{{ item.type }}</span>
                </div>
                <div class="seed-dl-card__meta">
                  剩余 {{ item.free_space_gb == null ? '不可用' : `${item.free_space_gb} GB` }}
                  <template v-if="item.total_space_gb"> / 共 {{ item.total_space_gb }} GB</template>
                </div>
              </div>

              <span class="seed-status" :class="item.low_space ? 'is-error' : 'is-success'">
                <i />{{ item.low_space ? '低水位' : '空间正常' }}
              </span>
            </div>

            <!-- 中段：紧凑磁盘进度条 -->
            <v-progress-linear
              :model-value="freePercent(item)"
              :color="item.low_space ? 'error' : 'primary'"
              height="6"
              rounded
            />

            <!-- 下段：做种指标与实时速率底栏 -->
            <div class="seed-dl-card__stats">
              <div class="seed-dl-card__counts">
                <span>
                  <v-icon size="13" icon="mdi-file-multiple-outline" />
                  任务 <b>{{ item.torrent_count }}</b>
                </span>
                <span class="seed-dot">·</span>
                <span>
                  <v-icon size="13" icon="mdi-seed" />
                  做种 <b>{{ item.seeding_count }}</b>
                </span>
                <span class="seed-dot">·</span>
                <span>
                  <b>{{ item.total_size_gb }}</b> GB
                </span>
              </div>

              <div class="seed-dl-card__speed">
                <span>↓ {{ formatSpeed(item.download_speed) }}</span>
                <span>↑ {{ formatSpeed(item.upload_speed) }}</span>
              </div>
            </div>
          </article>
        </div>

        <div v-else-if="!loading" class="seed-empty-box">
          <v-icon icon="mdi-information-outline" size="34" class="mb-2 text-medium-emphasis" />
          <div class="text-subtitle-2 font-weight-bold">未发现可用下载器</div>
          <div class="text-caption text-medium-emphasis mt-1">
            请先在系统设置中启用 qBittorrent 或 Transmission 实例
          </div>
        </div>
      </section>

      <!-- 最近清理历史 -->
      <section class="seed-section">
        <div class="seed-section__head">
          <div class="seed-section__title">
            <v-icon icon="mdi-history" size="18" color="primary" />
            <span>最近清理历史</span>
          </div>

          <div class="d-flex align-center flex-wrap ga-2">
            <v-text-field
              v-if="history.length > 0"
              v-model="historyKeyword"
              class="seed-history-search"
              prepend-inner-icon="mdi-magnify"
              placeholder="筛选种子或规则..."
              density="compact"
              variant="outlined"
              hide-details
              clearable
            />
            <v-btn
              v-if="history.length > 0"
              size="x-small"
              color="error"
              variant="tonal"
              rounded="lg"
              class="px-3"
              prepend-icon="mdi-delete-sweep"
              @click="clearHistoryDialog = true"
            >
              清空历史
            </v-btn>
          </div>
        </div>

        <div class="seed-table-card">
          <v-data-table
            :headers="historyHeaders"
            :items="filteredHistory"
            density="compact"
            :items-per-page="10"
            :items-per-page-options="[10, 20, 50, 100]"
            hover
          >
            <template #item.time="{ item }">
              <span class="time-text text-medium-emphasis">{{ formatSingleLineTime(item.time) }}</span>
            </template>
            <template #item.status="{ item }">
              <span class="seed-status" :class="item.status === 'success' ? 'is-success' : 'is-error'">
                <i />{{ item.status === 'success' ? '成功' : '失败' }}
              </span>
            </template>
            <template #item.name="{ item }">
              <div class="torrent-cell">
                <div class="torrent-name" :title="item.name">{{ item.name }}</div>
                <div v-if="item.error" class="text-caption text-error text-truncate" :title="item.error">
                  {{ item.error }}
                </div>
              </div>
            </template>
            <template #item.downloader="{ item }">
              <span class="nowrap-text text-medium-emphasis">{{ item.downloader }}</span>
            </template>
            <template #item.size_gb="{ item }">
              <span class="nowrap-num">{{ Number(item.size_gb || 0).toFixed(2) }} GB</span>
            </template>
            <template #item.rule_name="{ item }">
              <span class="rule-name-text" :title="item.rule_name">{{ item.rule_name }}</span>
            </template>
            <template #no-data>
              <div class="seed-table-empty">
                <v-icon icon="mdi-history" size="22" class="text-medium-emphasis" />
                <span>{{ historyKeyword ? '未匹配到相关历史记录' : '暂无清理历史记录' }}</span>
              </div>
            </template>
          </v-data-table>
        </div>
      </section>
    </template>

    <!-- 3B. 干跑预览视图 -->
    <DryRunPage
      v-else
      :preview="preview"
      :last-run-at="lastPreviewTime"
      :working="working"
      :enabled-rule-count="enabledRuleCount"
      :guard-enabled="guardEnabled"
      @back="activePage = 'overview'"
      @dry-run="dryRun"
      @open-settings="settingsDialog = true"
    />

    <!-- 规则配置弹窗 -->
    <v-dialog v-model="settingsDialog" max-width="1024" scrollable>
      <v-card class="seed-dialog">
        <v-card-title class="seed-dialog__header">
          <span class="d-flex align-center ga-2">
            <v-icon icon="mdi-tune" size="20" color="primary" />
            <span>保种管家配置</span>
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" rounded="lg" @click="settingsDialog = false" />
        </v-card-title>
        <v-card-text class="pa-0">
          <Config
            :initial-config="config"
            :api="props.api"
            :embedded="true"
            @save="saveConfig"
            @close="settingsDialog = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 预设模板导入弹窗 -->
    <v-dialog v-model="templatesDialog" max-width="760" scrollable>
      <v-card class="seed-dialog">
        <v-card-title class="seed-dialog__header">
          <span class="d-flex align-center ga-2">
            <v-icon icon="mdi-view-grid-plus" size="20" color="primary" />
            <span>导入高频规则模板</span>
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" rounded="lg" @click="templatesDialog = false" />
        </v-card-title>
        <v-card-text class="seed-dialog__body">
          <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">
            已存在的同名模板不会重复导入；导入后建议先执行「干跑预览」确认命中范围。
          </v-alert>
          <div class="seed-tpl-grid">
            <div v-for="template in templates" :key="template.id" class="seed-tpl-card">
              <div class="d-flex align-center ga-2 mb-1">
                <v-icon size="18" color="primary" :icon="templateIcon(template.id)" />
                <strong class="text-body-2">{{ template.name }}</strong>
              </div>
              <p class="seed-tpl-desc">{{ template.description }}</p>
              <v-btn
                block
                size="small"
                color="primary"
                variant="tonal"
                rounded="lg"
                prepend-icon="mdi-import"
                @click="importTemplate(template)"
              >
                导入此模板
              </v-btn>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="seed-dialog__footer">
          <v-spacer />
          <v-btn color="primary" variant="flat" rounded="lg" class="px-5" @click="templatesDialog = false">完成</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 确认立即清理弹窗 -->
    <v-dialog v-model="runDialog" max-width="460">
      <v-card class="seed-dialog">
        <v-card-title class="seed-dialog__header text-error">
          <span class="d-flex align-center ga-2">
            <v-icon icon="mdi-alert" size="20" color="error" />
            <span>确认立即执行真实清理？</span>
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" rounded="lg" @click="runDialog = false" />
        </v-card-title>
        <v-card-text class="seed-dialog__body">
          <div class="text-body-2 text-medium-emphasis">
            将按当前启用规则直接删除命中的下载器任务；开启「连同源文件删除」的规则所删数据不可恢复。建议执行前先通过「干跑预览」核对命中列表。
          </div>
        </v-card-text>
        <v-card-actions class="seed-dialog__footer">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="runDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" class="px-5" prepend-icon="mdi-delete" @click="executeCleanup">
            确认清理
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 清空清理历史确认弹窗 -->
    <v-dialog v-model="clearHistoryDialog" max-width="420">
      <v-card class="seed-dialog">
        <v-card-title class="seed-dialog__header text-error">
          <span class="d-flex align-center ga-2">
            <v-icon icon="mdi-delete-sweep" size="20" color="error" />
            <span>清空清理历史</span>
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" rounded="lg" @click="clearHistoryDialog = false" />
        </v-card-title>
        <v-card-text class="seed-dialog__body">
          <div class="text-body-2 text-medium-emphasis">仅清空插件内的历史审计记录，不影响下载器任务或媒体库文件。</div>
        </v-card-text>
        <v-card-actions class="seed-dialog__footer">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="clearHistoryDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" class="px-5" @click="clearHistory">确认清空</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 正则表达式实时测试弹窗 -->
    <v-dialog v-model="regexDialog" max-width="640" scrollable>
      <v-card class="seed-dialog">
        <v-card-title class="seed-dialog__header">
          <span class="d-flex align-center ga-2">
            <v-icon icon="mdi-regex" size="20" color="primary" />
            <span>正则表达式实时测试</span>
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" rounded="lg" @click="regexDialog = false" />
        </v-card-title>
        <v-card-text class="seed-dialog__body">
          <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">
            后端使用 Python <code>re.IGNORECASE</code> 引擎，与实际清理规则完全一致；输入即自动测试。
          </v-alert>
          <v-textarea
            v-model="regexForm.pattern"
            label="正则表达式"
            rows="2"
            auto-grow
            density="compact"
            variant="outlined"
            hide-details
            placeholder="unregistered|not registered|不存在"
          />
          <v-textarea
            v-model="regexForm.text"
            label="待测试文本"
            rows="3"
            auto-grow
            density="compact"
            variant="outlined"
            hide-details
            placeholder="Tracker 返回：Unregistered torrent"
          />
          <v-progress-linear v-if="regexTesting" indeterminate color="primary" rounded />
          <v-alert
            v-if="regexResult"
            :type="!regexResult.valid ? 'error' : regexResult.matched ? 'success' : 'warning'"
            variant="tonal"
            density="compact"
            rounded="lg"
            class="text-body-2"
          >
            <template v-if="!regexResult.valid">非法正则：{{ regexResult.error }}</template>
            <template v-else-if="regexResult.matched">
              匹配成功：<code>{{ regexResult.match }}</code>
              <div v-if="regexResult.groups?.length" class="text-caption mt-1">
                捕获组：{{ regexResult.groups.join('、') }}
              </div>
            </template>
            <template v-else>表达式合法，但未命中待测文本。</template>
          </v-alert>
        </v-card-text>
        <v-card-actions class="seed-dialog__footer">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="regexDialog = false">关闭</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" class="px-5" :loading="regexTesting" @click="testRegex">
            立即测试
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<style scoped>
.seed-page {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 2px 0 16px;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

.seed-page :deep(.v-field) {
  border-radius: 8px;
}

/* 1. 紧凑顶栏（对齐 EmbyUserManager） */
.seed-topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.seed-topbar__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.seed-topbar__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-primary), 0.16);
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.seed-topbar__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.seed-topbar h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
}

.seed-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 999px;
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 11.5px;
  font-weight: 500;
}

.seed-tag--clickable {
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.seed-tag--clickable:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.16);
}

.seed-tag.is-active {
  border-color: rgba(var(--v-theme-success), 0.24);
  background: rgba(var(--v-theme-success), 0.09);
  color: rgb(var(--v-theme-success));
}

.seed-tag.is-warning {
  border-color: rgba(var(--v-theme-warning), 0.26);
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
}

.seed-topbar__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

/* 2. IDE 分段视图切换器与辅助工具条 */
.seed-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.seed-toolbar__left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.seed-pills {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 9px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.seed-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.64);
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.35;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.seed-pill strong {
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.66);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.45;
  font-variant-numeric: tabular-nums;
}

.seed-pill:hover {
  color: rgba(var(--v-theme-on-surface), 0.88);
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.seed-pill.is-active {
  border-color: rgba(var(--v-theme-on-surface), 0.1);
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-weight: 600;
}

.seed-pill.is-active :deep(.v-icon) {
  color: rgb(var(--v-theme-primary));
}

.seed-pill.is-active strong {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.seed-counter {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  color: rgba(var(--v-theme-on-surface), 0.76);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.seed-counter :deep(.v-icon) {
  color: rgb(var(--v-theme-info));
}

.seed-subactions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

/* 3. 内容分区与下载器卡片网格 */
.seed-section + .seed-section {
  margin-top: 18px;
}

.seed-section__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.seed-section__title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 14.5px;
  font-weight: 700;
}

.seed-dl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 12px;
}

.seed-dl-card {
  display: flex;
  flex-direction: column;
  padding: 14px 15px 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  box-shadow: none;
  gap: 11px;
  transition: border-color 0.16s ease;
}

.seed-dl-card:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.16);
  box-shadow: none;
}

.seed-dl-card__head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.seed-dl-card__avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 8px;
}

.seed-dl-card__avatar.is-qb {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.seed-dl-card__avatar.is-tr {
  background: rgba(var(--v-theme-warning), 0.13);
  color: rgb(var(--v-theme-warning));
}

.seed-dl-card__identity {
  flex: 1;
  min-width: 0;
}

.seed-dl-card__name-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.seed-dl-card__name {
  overflow: hidden;
  max-width: 160px;
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seed-chip {
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.4;
}

.seed-dl-card__meta {
  margin-top: 2px;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.seed-status {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.seed-status i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.seed-status.is-success {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}

.seed-status.is-error {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

.seed-dl-card__stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  font-size: 12px;
}

.seed-dl-card__counts {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.seed-dl-card__counts span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.seed-dl-card__counts b {
  font-variant-numeric: tabular-nums;
}

.seed-dot {
  opacity: 0.45;
}

.seed-dl-card__speed {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

/* 空状态与历史表格 */
.seed-empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 20px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  text-align: center;
  transition: border-color 0.16s ease;
}

.seed-empty-box:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.15);
}

.seed-history-search {
  width: 210px;
  max-width: 100%;
}

.seed-table-card {
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.16s ease;
}

.seed-table-card:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.15);
}

:deep(th.col-nowrap),
:deep(td.col-nowrap) {
  white-space: nowrap;
}

:deep(td.col-num),
:deep(td.col-time) {
  font-variant-numeric: tabular-nums;
}

@media (min-width: 960px) {
  :deep(td.col-torrent) {
    width: 100%;
    max-width: 0;
  }
}

@media (max-width: 959px) {
  :deep(td.col-torrent),
  :deep(th.col-torrent-head) {
    width: auto;
    min-width: 300px;
    max-width: 500px;
  }
}

.time-text {
  display: inline-block;
  font-size: 12px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.nowrap-text {
  font-size: 12.5px;
  white-space: nowrap;
}

.nowrap-num {
  font-size: 12.5px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.torrent-cell {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
}

.torrent-name {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
}

.rule-name-text {
  display: block;
  max-width: 156px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
}

.seed-table-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 88px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 13px;
}

/* 模板网格与统一弹窗样式（对齐 EmbyUserManager .emby-dialog 14px + 50px 顶栏） */
.seed-tpl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 12px;
}

.seed-tpl-card {
  display: flex;
  flex-direction: column;
  padding: 13px 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.16s ease;
}

.seed-tpl-card:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.16);
}

.seed-tpl-desc {
  flex: 1;
  margin: 4px 0 12px;
  color: rgba(var(--v-theme-on-surface), 0.66);
  font-size: 12.5px;
  line-height: 1.5;
}

.seed-dialog {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgb(var(--v-theme-surface));
  box-shadow: none !important;
  overflow: hidden;
}

.seed-dialog :deep(.v-field) {
  border-radius: 8px;
}

.seed-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  height: 50px;
  padding: 0 18px;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.seed-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
}

.seed-dialog__footer {
  padding: 10px 18px 12px;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

@media (max-width: 600px) {
  .seed-page {
    padding: 4px 4px 14px;
  }

  .seed-history-search {
    width: 100%;
  }
}
</style>
