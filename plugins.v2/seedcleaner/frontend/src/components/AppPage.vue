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
const templates = ref<RuleTemplate[]>([])
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
const enabledRuleCount = computed(() => (config.value.rules || []).filter((rule: any) => rule.enabled).length)
const guardEnabled = computed(() => Boolean(config.value.disk_guard?.enabled))

const historyHeaders = [
  {
    title: '时间',
    key: 'time',
    width: '188px',
    minWidth: '188px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-nowrap col-time' },
  },
  {
    title: '结果',
    key: 'status',
    width: '88px',
    minWidth: '88px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-nowrap' },
  },
  {
    title: '种子',
    key: 'name',
    headerProps: { class: 'col-torrent-head' },
    cellProps: { class: 'col-torrent' },
  },
  {
    title: '下载器',
    key: 'downloader',
    width: '128px',
    minWidth: '112px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-nowrap' },
  },
  {
    title: '体积',
    key: 'size_gb',
    width: '110px',
    minWidth: '102px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-nowrap col-num' },
  },
  {
    title: '规则',
    key: 'rule_name',
    width: '168px',
    minWidth: '140px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-rule' },
  },
]

function notify(message: string, color: 'success' | 'error' | 'info' = 'success') {
  snackbar.text = message
  snackbar.color = color
  snackbar.show = true
  if (color === 'success') hostToast?.success(message)
  else if (color === 'error') hostToast?.error(message)
  else hostToast?.info(message)
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

onMounted(refreshAll)
</script>

<template>
  <div class="seed-page">
    <v-progress-linear v-if="loading" indeterminate color="primary" class="top-progress" />
    <header class="hero-card">
      <div class="hero-main">
        <div class="hero-heading">
          <v-avatar size="52" color="primary" variant="tonal"><v-icon size="28" icon="mdi-broom" /></v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">保种删种管家</div>
            <div class="text-body-2 text-medium-emphasis">安全规则 · 正则筛选 · 干跑预览 · 磁盘低水位保盘</div>
          </div>
        </div>
        <nav class="page-switch" aria-label="保种管家页面切换">
          <button
            type="button"
            class="page-switch-btn"
            :class="{ active: activePage === 'overview' }"
            @click="activePage = 'overview'"
          >
            <v-icon size="18" icon="mdi-view-dashboard-outline" />
            <span>运行概览</span>
          </button>
          <button
            type="button"
            class="page-switch-btn"
            :class="{ active: activePage === 'preview' }"
            @click="openDryRunPage(false)"
          >
            <v-icon size="18" icon="mdi-test-tube" />
            <span>干跑预览</span>
            <span v-if="preview" class="switch-badge">{{ previewItems.length }}</span>
          </button>
        </nav>
      </div>

      <div class="hero-actions">
        <v-btn variant="text" icon="mdi-refresh" :loading="loading" title="刷新数据" @click="refreshAll" />
        <v-btn variant="outlined" prepend-icon="mdi-tune" @click="settingsDialog = true">规则配置</v-btn>
        <v-btn
          v-if="activePage === 'overview'"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-eye-outline"
          :loading="working === 'dry'"
          @click="openDryRunPage(true)"
        >
          干跑预览
        </v-btn>
        <v-btn
          v-else
          color="primary"
          variant="tonal"
          prepend-icon="mdi-play-outline"
          :loading="working === 'dry'"
          @click="dryRun"
        >
          {{ preview ? '重新干跑' : '开始干跑' }}
        </v-btn>
        <v-btn color="error" prepend-icon="mdi-play" :loading="working === 'run'" @click="runDialog = true">
          立即清理
        </v-btn>
      </div>
    </header>

    <template v-if="activePage === 'overview'">
      <v-row class="summary-row">
        <v-col cols="6" md="3">
          <v-card class="metric-card clickable-card" variant="tonal" @click="settingsDialog = true">
            <v-icon color="primary" icon="mdi-format-list-checks" />
            <div>
              <strong>{{ enabledRuleCount }}</strong>
              <span>启用规则</span>
            </div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card class="metric-card clickable-card" variant="tonal" @click="openDryRunPage(false)">
            <v-icon color="info" icon="mdi-eye-check-outline" />
            <div>
              <strong>{{ preview ? previewItems.length : '进入预览' }}</strong>
              <span>干跑预览页面</span>
            </div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card class="metric-card" variant="tonal">
            <v-icon color="warning" icon="mdi-harddisk" />
            <div>
              <strong>{{ guardEnabled ? '已启用' : '未启用' }}</strong>
              <span>低水位保盘</span>
            </div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card class="metric-card" variant="tonal">
            <v-icon color="success" icon="mdi-history" />
            <div>
              <strong>{{ history.length }}</strong>
              <span>最近清理记录</span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-alert
        v-for="error in collectionErrors"
        :key="error"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ error }}
      </v-alert>

      <section class="content-section">
        <div class="section-heading">
          <div>
            <v-icon icon="mdi-download-network-outline" />
            <span>下载器实时概况</span>
          </div>
          <span class="text-caption text-medium-emphasis">磁盘空间按下载器接口或可访问保存路径计算</span>
        </div>
        <v-row v-if="downloaders.length">
          <v-col v-for="item in downloaders" :key="item.name" cols="12" md="6" xl="4">
            <v-card class="downloader-card" variant="outlined">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center ga-2">
                  <v-avatar
                    size="36"
                    :color="item.type === 'qbittorrent' ? 'primary' : 'deep-orange'"
                    variant="tonal"
                  >
                    <v-icon :icon="item.type === 'qbittorrent' ? 'mdi-qrcode' : 'mdi-transit-connection-variant'" />
                  </v-avatar>
                  <div>
                    <strong>{{ item.name }}</strong>
                    <div class="text-caption text-medium-emphasis">{{ item.type }}</div>
                  </div>
                </div>
                <v-chip :color="item.low_space ? 'error' : 'success'" size="small" variant="tonal">
                  {{ item.low_space ? '低水位' : '空间正常' }}
                </v-chip>
              </div>
              <div class="d-flex justify-space-between text-body-2 mb-1">
                <span>剩余空间</span>
                <strong>{{ item.free_space_gb == null ? '不可用' : `${item.free_space_gb} GB` }}</strong>
              </div>
              <v-progress-linear
                :model-value="freePercent(item)"
                :color="item.low_space ? 'error' : 'primary'"
                height="7"
                rounded
                class="mb-3"
              />
              <div class="downloader-stats">
                <span><v-icon size="16" icon="mdi-file-multiple-outline" />{{ item.torrent_count }} 任务</span>
                <span><v-icon size="16" icon="mdi-seed" />{{ item.seeding_count }} 做种</span>
                <span><v-icon size="16" icon="mdi-database-outline" />{{ item.total_size_gb }} GB</span>
              </div>
              <div class="d-flex justify-space-between mt-3 text-caption text-medium-emphasis">
                <span>↓ {{ formatSpeed(item.download_speed) }}</span>
                <span>↑ {{ formatSpeed(item.upload_speed) }}</span>
              </div>
            </v-card>
          </v-col>
        </v-row>
        <v-alert v-else type="info" variant="outlined" icon="mdi-information-outline">
          未发现可用的 qBittorrent 或 Transmission 实例，请先在系统设置中启用下载器。
        </v-alert>
      </section>

      <section class="content-section">
        <div class="section-heading">
          <div>
            <v-icon icon="mdi-history" />
            <span>最近清理历史</span>
          </div>
          <div class="d-flex align-center flex-wrap ga-2">
            <v-btn size="small" variant="text" prepend-icon="mdi-regex" @click="regexDialog = true">正则测试</v-btn>
            <v-btn size="small" variant="text" prepend-icon="mdi-view-grid-plus" @click="templatesDialog = true">
              预设模板
            </v-btn>
            <v-btn
              size="small"
              color="error"
              variant="text"
              prepend-icon="mdi-delete-sweep"
              :disabled="!history.length"
              @click="clearHistoryDialog = true"
            >
              清空历史
            </v-btn>
          </div>
        </div>
        <v-card variant="outlined" class="table-card">
          <v-data-table
            :headers="historyHeaders"
            :items="history"
            density="comfortable"
            :items-per-page="10"
            :items-per-page-options="[10, 20, 50, 100]"
            hover
          >
            <template #item.time="{ item }">
              <span class="time-text">{{ formatSingleLineTime(item.time) }}</span>
            </template>
            <template #item.status="{ item }">
              <v-chip :color="item.status === 'success' ? 'success' : 'error'" size="small" variant="tonal">
                {{ item.status === 'success' ? '成功' : '失败' }}
              </v-chip>
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
              <span class="nowrap-text">{{ item.downloader }}</span>
            </template>
            <template #item.size_gb="{ item }">
              <span class="nowrap-num">{{ Number(item.size_gb || 0).toFixed(2) }} GB</span>
            </template>
            <template #item.rule_name="{ item }">
              <span class="rule-name-text" :title="item.rule_name">{{ item.rule_name }}</span>
            </template>
            <template #no-data>
              <div class="empty-state compact">
                <v-icon icon="mdi-history" />
                <span>暂无清理历史</span>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </section>
    </template>

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
      @open-templates="templatesDialog = true"
      @open-regex="regexDialog = true"
    />

    <v-dialog v-model="settingsDialog" max-width="1180" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <span><v-icon icon="mdi-tune" class="mr-2" />保种管家配置</span>
          <v-btn icon="mdi-close" variant="text" @click="settingsDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <Config :initial-config="config" :api="props.api" @save="saveConfig" @close="settingsDialog = false" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="templatesDialog" max-width="900" scrollable>
      <v-card>
        <v-card-title class="pa-4">
          <v-icon icon="mdi-view-grid-plus" class="mr-2" />一键导入高频规则模板
        </v-card-title>
        <v-card-subtitle class="px-4 pb-2 text-wrap">
          导入后仍需保存配置并干跑确认。已存在的模板不会重复导入。
        </v-card-subtitle>
        <v-card-text>
          <v-row>
            <v-col v-for="template in templates" :key="template.id" cols="12" md="6">
              <v-card variant="outlined" class="template-card">
                <div class="d-flex align-center ga-2 mb-2">
                  <v-icon
                    color="primary"
                    :icon="
                      template.id === 'unregistered'
                        ? 'mdi-alert-octagon'
                        : template.id === 'cold_large'
                          ? 'mdi-snowflake'
                          : template.id === 'official_exclude'
                            ? 'mdi-shield-crown'
                            : 'mdi-medal'
                    "
                  />
                  <strong>{{ template.name }}</strong>
                </div>
                <p>{{ template.description }}</p>
                <v-btn
                  block
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-import"
                  @click="importTemplate(template)"
                >
                  导入此模板
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="templatesDialog = false">完成</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="runDialog" max-width="520">
      <v-card>
        <v-card-title class="text-error"><v-icon icon="mdi-alert" class="mr-2" />确认立即执行真实清理？</v-card-title>
        <v-card-text>
          本轮将按当前规则直接删除下载器任务，规则开启「连同源文件删除」时数据不可恢复。建议先进入「干跑预览」页面确认命中范围。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="runDialog = false">取消</v-btn>
          <v-btn color="error" prepend-icon="mdi-delete" @click="executeCleanup">确认真删</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="clearHistoryDialog" max-width="420">
      <v-card>
        <v-card-title>清空清理历史？</v-card-title>
        <v-card-text>仅清空插件历史记录，不影响下载器或媒体库。</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="clearHistoryDialog = false">取消</v-btn>
          <v-btn color="error" @click="clearHistory">确认清空</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="regexDialog" max-width="760">
      <v-card>
        <v-card-title class="pa-4"><v-icon icon="mdi-regex" class="mr-2" />正则表达式实时测试</v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            后端使用 Python re.IGNORECASE，与规则引擎一致；输入后自动测试，无需保存。
          </v-alert>
          <v-textarea
            v-model="regexForm.pattern"
            label="正则表达式"
            rows="2"
            auto-grow
            variant="outlined"
            placeholder="unregistered|not registered|不存在"
          />
          <v-textarea
            v-model="regexForm.text"
            label="待测试文本"
            rows="4"
            auto-grow
            variant="outlined"
            placeholder="Tracker 返回：Unregistered torrent"
            class="mt-3"
          />
          <v-progress-linear v-if="regexTesting" indeterminate color="primary" class="my-2" />
          <v-alert
            v-if="regexResult"
            :type="!regexResult.valid ? 'error' : regexResult.matched ? 'success' : 'warning'"
            variant="tonal"
            class="mt-4"
          >
            <template v-if="!regexResult.valid">非法正则：{{ regexResult.error }}</template>
            <template v-else-if="regexResult.matched">
              匹配成功：<code>{{ regexResult.match }}</code>
              <div v-if="regexResult.groups?.length" class="mt-1">捕获组：{{ regexResult.groups.join('、') }}</div>
            </template>
            <template v-else>表达式合法，但未匹配待测文本。</template>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="regexDialog = false">关闭</v-btn>
          <v-btn color="primary" :loading="regexTesting" @click="testRegex">立即测试</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<style scoped>
.seed-page {
  padding: 20px;
  max-width: 1680px;
  margin: 0 auto;
  color: rgb(var(--v-theme-on-background));
}

.top-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
}

.hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding: 20px 24px;
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  border-radius: 18px;
  background: linear-gradient(
    125deg,
    rgba(var(--v-theme-primary), 0.13),
    rgba(var(--v-theme-surface), 0.85) 56%,
    rgba(var(--v-theme-info), 0.08)
  );
  box-shadow: 0 8px 30px rgba(var(--v-theme-on-surface), 0.05);
}

.hero-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.hero-heading,
.hero-actions,
.section-heading > div {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-actions {
  flex-wrap: wrap;
}

.page-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.page-switch-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.page-switch-btn:hover {
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.page-switch-btn.active {
  color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.switch-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(var(--v-theme-primary), 0.16);
  color: rgb(var(--v-theme-primary));
  font-variant-numeric: tabular-nums;
}

.summary-row {
  margin-top: 8px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  height: 100%;
}

.clickable-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.clickable-card:hover {
  transform: translateY(-1px);
}

.metric-card > .v-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.metric-card div {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.metric-card strong {
  font-size: 20px;
  line-height: 1.25;
  white-space: nowrap;
}

.metric-card span {
  font-size: 12px;
  opacity: 0.68;
  margin-top: 3px;
  white-space: nowrap;
}

.content-section {
  margin-top: 26px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.section-heading > div > .v-icon {
  color: rgb(var(--v-theme-primary));
}

.section-heading > div > span {
  font-weight: 650;
  font-size: 17px;
}

.downloader-card {
  height: 100%;
  padding: 17px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
}

.downloader-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.downloader-stats span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.table-card {
  overflow: hidden;
  border-radius: 12px;
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
    min-width: 320px;
    max-width: 520px;
  }
}

.time-text {
  display: inline-block;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.nowrap-text {
  white-space: nowrap;
}

.nowrap-num {
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
  font-weight: 500;
}

.rule-name-text {
  display: block;
  max-width: 168px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.empty-state strong {
  color: rgb(var(--v-theme-on-surface));
}

.empty-state.compact {
  min-height: 100px;
  flex-direction: row;
}

.template-card {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.template-card p {
  flex: 1;
  min-height: 44px;
  font-size: 13px;
  line-height: 1.55;
  color: rgba(var(--v-theme-on-surface), 0.68);
}

@media (max-width: 700px) {
  .seed-page {
    padding: 12px;
  }

  .hero-card {
    padding: 17px;
  }

  .hero-main,
  .page-switch {
    width: 100%;
  }

  .page-switch-btn {
    flex: 1;
    justify-content: center;
  }

  .hero-actions {
    width: 100%;
  }

  .hero-actions .v-btn {
    flex: 1;
  }
}
</style>
