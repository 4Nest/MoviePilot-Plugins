<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type CleanItem, formatSingleLineTime } from '../types'

const props = defineProps<{
  preview: Record<string, any> | null
  lastRunAt: string
  working: 'dry' | 'run' | ''
  enabledRuleCount: number
  guardEnabled: boolean
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'dry-run'): void
  (e: 'open-settings'): void
  (e: 'open-templates'): void
  (e: 'open-regex'): void
}>()

const keyword = ref('')
const selectedDownloader = ref('all')
const selectedRule = ref('all')

const previewItems = computed<CleanItem[]>(() => props.preview?.candidates || [])
const previewSize = computed(() => Number(props.preview?.total_size_gb || 0))

const downloaderOptions = computed(() => {
  const names = Array.from(new Set(previewItems.value.map(item => item.downloader).filter(Boolean)))
  return [{ title: '全部下载器', value: 'all' }, ...names.map(name => ({ title: name, value: name }))]
})

const ruleOptions = computed(() => {
  const names = Array.from(new Set(previewItems.value.map(item => item.rule_name).filter(Boolean)))
  return [{ title: '全部命中规则', value: 'all' }, ...names.map(name => ({ title: name, value: name }))]
})

const matchedDownloaderCount = computed(() => {
  return new Set(previewItems.value.map(item => item.downloader).filter(Boolean)).size
})

watch(
  () => props.preview,
  () => {
    if (selectedDownloader.value !== 'all' && !downloaderOptions.value.some(opt => opt.value === selectedDownloader.value)) {
      selectedDownloader.value = 'all'
    }
    if (selectedRule.value !== 'all' && !ruleOptions.value.some(opt => opt.value === selectedRule.value)) {
      selectedRule.value = 'all'
    }
  },
)

const filteredItems = computed<CleanItem[]>(() => {
  const term = keyword.value.trim().toLowerCase()
  return previewItems.value.filter(item => {
    if (selectedDownloader.value !== 'all' && item.downloader !== selectedDownloader.value) return false
    if (selectedRule.value !== 'all' && item.rule_name !== selectedRule.value) return false
    if (!term) return true
    return (
      String(item.name || '').toLowerCase().includes(term) ||
      String(item.rule_name || '').toLowerCase().includes(term) ||
      String(item.reason || '').toLowerCase().includes(term) ||
      String(item.downloader || '').toLowerCase().includes(term)
    )
  })
})

const filteredSizeGb = computed(() =>
  filteredItems.value.reduce((acc, item) => acc + Number(item.size_gb || 0), 0),
)

const hasActiveFilter = computed(
  () => Boolean(keyword.value.trim()) || selectedDownloader.value !== 'all' || selectedRule.value !== 'all',
)

function resetFilters() {
  keyword.value = ''
  selectedDownloader.value = 'all'
  selectedRule.value = 'all'
}

const previewHeaders = [
  {
    title: '种子',
    key: 'name',
    headerProps: { class: 'col-torrent-head' },
    cellProps: { class: 'col-torrent' },
  },
  {
    title: '下载器',
    key: 'downloader',
    width: '124px',
    minWidth: '110px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-nowrap' },
  },
  {
    title: '体积',
    key: 'size_gb',
    width: '108px',
    minWidth: '100px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-nowrap col-num' },
  },
  {
    title: '分享率',
    key: 'ratio',
    width: '90px',
    minWidth: '86px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-nowrap col-num' },
  },
  {
    title: '做种时长',
    key: 'seeding_hours',
    width: '112px',
    minWidth: '104px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-nowrap col-num' },
  },
  {
    title: '命中规则',
    key: 'rule_name',
    width: '164px',
    minWidth: '140px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-rule' },
  },
  {
    title: '命中原因',
    key: 'reason',
    width: '270px',
    minWidth: '230px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-reason' },
  },
]
</script>

<template>
  <div class="dry-run-page">
    <v-row class="summary-row">
      <v-col cols="6" md="3">
        <v-card class="metric-card" variant="tonal">
          <v-icon color="info" icon="mdi-eye-check-outline" />
          <div>
            <strong>{{ preview ? previewItems.length : '-' }}</strong>
            <span>命中种子</span>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="metric-card" variant="tonal">
          <v-icon color="primary" icon="mdi-database-remove-outline" />
          <div>
            <strong>{{ preview ? `${previewSize.toFixed(2)} GB` : '-' }}</strong>
            <span>预计释放空间</span>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="metric-card" variant="tonal">
          <v-icon color="warning" icon="mdi-download-network-outline" />
          <div>
            <strong>{{ preview ? matchedDownloaderCount : '-' }}</strong>
            <span>涉及下载器（{{ enabledRuleCount }} 规则{{ guardEnabled ? ' + 保盘' : '' }}）</span>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="metric-card" variant="tonal">
          <v-icon color="success" icon="mdi-clock-check-outline" />
          <div class="min-w-0">
            <strong class="single-line-time">{{ lastRunAt ? formatSingleLineTime(lastRunAt) : '尚未执行' }}</strong>
            <span>最近预览时间</span>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <section class="content-section">
      <div class="section-heading">
        <div class="heading-left">
          <v-icon icon="mdi-test-tube" />
          <span>模拟干跑预览</span>
          <v-chip v-if="preview" size="small" color="primary" variant="tonal">
            命中 {{ previewItems.length }} 项 · {{ previewSize.toFixed(2) }} GB
          </v-chip>
          <span class="text-caption text-medium-emphasis">仅模拟规则匹配，不会执行任何删除操作</span>
        </div>
        <div class="d-flex align-center flex-wrap ga-2">
          <v-btn size="small" variant="text" prepend-icon="mdi-regex" @click="emit('open-regex')">正则测试</v-btn>
          <v-btn size="small" variant="text" prepend-icon="mdi-view-grid-plus" @click="emit('open-templates')">预设模板</v-btn>
        </div>
      </div>

      <v-alert v-if="preview?.errors?.length" type="warning" variant="tonal" class="mb-3">
        <div v-for="error in preview.errors" :key="error">{{ error }}</div>
      </v-alert>

      <v-card v-if="preview && previewItems.length" variant="outlined" class="filter-bar mb-3">
        <div class="filter-grid">
          <v-text-field
            v-model="keyword"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            prepend-inner-icon="mdi-magnify"
            placeholder="搜索种子名称、命中规则或原因..."
            class="filter-search"
          />
          <v-select
            v-model="selectedDownloader"
            :items="downloaderOptions"
            density="compact"
            variant="outlined"
            hide-details
            class="filter-select"
          />
          <v-select
            v-model="selectedRule"
            :items="ruleOptions"
            density="compact"
            variant="outlined"
            hide-details
            class="filter-select"
          />
          <div class="filter-summary">
            <span>
              当前显示 <strong>{{ filteredItems.length }}</strong> / {{ previewItems.length }} 项
              （{{ filteredSizeGb.toFixed(2) }} GB）
            </span>
            <v-btn v-if="hasActiveFilter" size="x-small" variant="text" color="primary" @click="resetFilters">
              重置筛选
            </v-btn>
          </div>
        </div>
      </v-card>

      <v-card v-if="preview" variant="outlined" class="table-card">
        <v-data-table
          :headers="previewHeaders"
          :items="filteredItems"
          item-value="hash"
          density="comfortable"
          :items-per-page="20"
          :items-per-page-options="[10, 20, 50, 100]"
          hover
        >
          <template #item.name="{ item }">
            <div class="torrent-cell">
              <div class="torrent-name" :title="item.name">{{ item.name }}</div>
              <v-chip v-if="!item.delete_files" size="x-small" variant="tonal" class="keep-file-chip">
                保留源文件
              </v-chip>
            </div>
          </template>
          <template #item.downloader="{ item }">
            <span class="nowrap-text">{{ item.downloader }}</span>
          </template>
          <template #item.size_gb="{ item }">
            <span class="nowrap-num">{{ Number(item.size_gb || 0).toFixed(2) }} GB</span>
          </template>
          <template #item.ratio="{ item }">
            <v-chip size="small" variant="tonal" class="nowrap-num">{{ Number(item.ratio || 0).toFixed(2) }}</v-chip>
          </template>
          <template #item.seeding_hours="{ item }">
            <span class="nowrap-num">{{ Number(item.seeding_hours || 0).toFixed(1) }} h</span>
          </template>
          <template #item.rule_name="{ item }">
            <span class="rule-name-text" :title="item.rule_name">{{ item.rule_name }}</span>
          </template>
          <template #item.reason="{ item }">
            <span class="reason-text" :title="item.reason">{{ item.reason }}</span>
          </template>
          <template #no-data>
            <div v-if="hasActiveFilter" class="empty-state">
              <v-icon size="40" icon="mdi-filter-off-outline" color="primary" />
              <strong>没有匹配筛选条件的候选种子</strong>
              <v-btn size="small" variant="tonal" color="primary" @click="resetFilters">清空筛选条件</v-btn>
            </div>
            <div v-else class="empty-state">
              <v-icon size="44" icon="mdi-shield-check" color="success" />
              <strong>没有种子命中清理条件</strong>
              <span>当前配置下所有做种任务均处于安全保留状态，无需删除。</span>
            </div>
          </template>
        </v-data-table>
      </v-card>

      <v-card v-else variant="outlined" class="preview-placeholder">
        <v-avatar size="68" color="primary" variant="tonal">
          <v-icon size="36" icon="mdi-clipboard-search-outline" />
        </v-avatar>
        <div class="placeholder-body">
          <strong>先模拟干跑，再安全清理</strong>
          <p>
            干跑预览会实时读取全部启用下载器的任务快照，完整检验全局保护标签、入库锁、多维规则与低水位保盘策略，列出每个命中种子的体积、分享率、做种时长及具体原因，绝不会调用删除接口。
          </p>
          <div class="d-flex flex-wrap ga-3 mt-4">
            <v-btn color="primary" prepend-icon="mdi-play-outline" :loading="working === 'dry'" @click="emit('dry-run')">
              开始模拟干跑
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-tune" @click="emit('open-settings')">调整清理规则</v-btn>
            <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="emit('back')">返回运行概览</v-btn>
          </div>
        </div>
      </v-card>
    </section>
  </div>
</template>

<style scoped>
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
  font-size: 18px;
  line-height: 1.25;
}

.single-line-time {
  font-size: 15px !important;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-card span {
  font-size: 12px;
  opacity: 0.68;
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-section {
  margin-top: 24px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.heading-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.heading-left > .v-icon {
  color: rgb(var(--v-theme-primary));
}

.heading-left > span:first-of-type {
  font-weight: 650;
  font-size: 17px;
}

.filter-bar {
  padding: 12px 14px;
  border-radius: 12px;
}

.filter-grid {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-search {
  flex: 1 1 280px;
  min-width: 220px;
}

.filter-select {
  flex: 0 1 190px;
  min-width: 155px;
}

.filter-summary {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.72);
  white-space: nowrap;
}

.table-card {
  overflow: hidden;
  border-radius: 12px;
}

:deep(th.col-nowrap),
:deep(td.col-nowrap) {
  white-space: nowrap;
}

:deep(td.col-num) {
  font-variant-numeric: tabular-nums;
}

@media (min-width: 1180px) {
  :deep(td.col-torrent) {
    width: 100%;
    max-width: 0;
  }
}

@media (max-width: 1179px) {
  :deep(td.col-torrent),
  :deep(th.col-torrent-head) {
    width: auto;
    min-width: 340px;
    max-width: 560px;
  }
}

.torrent-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
}

.torrent-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.keep-file-chip {
  flex-shrink: 0;
}

.nowrap-text {
  white-space: nowrap;
}

.nowrap-num {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.rule-name-text {
  display: block;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reason-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 280px;
  white-space: normal;
  line-height: 1.45;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.75);
}

.preview-placeholder {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  padding: 36px 32px;
  border-style: dashed;
  border-radius: 16px;
}

.placeholder-body {
  flex: 1 1 360px;
  max-width: 720px;
}

.placeholder-body strong {
  font-size: 18px;
}

.placeholder-body p {
  margin: 8px 0 0;
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 13.5px;
  line-height: 1.65;
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  color: rgba(var(--v-theme-on-surface), 0.68);
}

.empty-state strong {
  color: rgb(var(--v-theme-on-surface));
}

@media (max-width: 700px) {
  .preview-placeholder {
    padding: 22px 18px;
  }

  .filter-summary {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
