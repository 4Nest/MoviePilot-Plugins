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
    if (
      selectedDownloader.value !== 'all' &&
      !downloaderOptions.value.some(opt => opt.value === selectedDownloader.value)
    ) {
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
    title: '分享率',
    key: 'ratio',
    width: '86px',
    minWidth: '80px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-nowrap col-num' },
  },
  {
    title: '做种时长',
    key: 'seeding_hours',
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
  {
    title: '命中原因',
    key: 'reason',
    width: '260px',
    minWidth: '220px',
    headerProps: { class: 'col-nowrap' },
    cellProps: { class: 'col-reason' },
  },
]
</script>

<template>
  <div class="dry-view">
    <v-alert v-if="preview?.errors?.length" type="warning" variant="tonal" density="compact" rounded="lg" class="mb-3">
      <div v-for="error in preview.errors" :key="error">{{ error }}</div>
    </v-alert>

    <!-- 已执行干跑：紧凑摘要条 + 过滤栏 + 候选表 -->
    <template v-if="preview">
      <div class="dry-summary-bar">
        <div class="dry-summary-tags">
          <span class="dry-badge is-primary">
            <v-icon icon="mdi-eye-check-outline" size="14" />
            命中 <strong>{{ previewItems.length }}</strong> 项
          </span>
          <span class="dry-badge is-info">
            <v-icon icon="mdi-database-remove-outline" size="14" />
            预计释放 <strong>{{ previewSize.toFixed(2) }} GB</strong>
          </span>
          <span class="dry-badge">
            <v-icon icon="mdi-download-network-outline" size="14" />
            涉及 {{ matchedDownloaderCount }} 个下载器 · {{ enabledRuleCount }} 规则{{ guardEnabled ? ' + 保盘' : '' }}
          </span>
          <span v-if="lastRunAt" class="dry-badge is-muted">
            <v-icon icon="mdi-clock-check-outline" size="13" />
            {{ formatSingleLineTime(lastRunAt) }}
          </span>
        </div>

        <span class="dry-safe-hint">
          <v-icon icon="mdi-shield-check-outline" size="14" />
          仅模拟匹配，不执行删除
        </span>
      </div>

      <div v-if="previewItems.length" class="dry-filter-row">
        <v-text-field
          v-model="keyword"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          placeholder="搜索种子名称、规则或命中原因..."
          class="dry-search"
        />
        <v-select
          v-model="selectedDownloader"
          :items="downloaderOptions"
          density="compact"
          variant="outlined"
          hide-details
          class="dry-select"
        />
        <v-select
          v-model="selectedRule"
          :items="ruleOptions"
          density="compact"
          variant="outlined"
          hide-details
          class="dry-select"
        />
        <div class="dry-filter-meta">
          <span>
            显示 <strong>{{ filteredItems.length }}</strong> / {{ previewItems.length }}
            （{{ filteredSizeGb.toFixed(2) }} GB）
          </span>
          <v-btn v-if="hasActiveFilter" size="x-small" variant="tonal" rounded="lg" color="primary" @click="resetFilters">
            重置
          </v-btn>
        </div>
      </div>

      <div class="dry-table-card">
        <v-data-table
          :headers="previewHeaders"
          :items="filteredItems"
          item-value="hash"
          density="compact"
          :items-per-page="20"
          :items-per-page-options="[10, 20, 50, 100]"
          hover
        >
          <template #item.name="{ item }">
            <div class="torrent-cell">
              <span class="torrent-name" :title="item.name">{{ item.name }}</span>
              <span v-if="!item.delete_files" class="keep-chip">仅删任务</span>
            </div>
          </template>
          <template #item.downloader="{ item }">
            <span class="nowrap-text text-medium-emphasis">{{ item.downloader }}</span>
          </template>
          <template #item.size_gb="{ item }">
            <span class="nowrap-num">{{ Number(item.size_gb || 0).toFixed(2) }} GB</span>
          </template>
          <template #item.ratio="{ item }">
            <span class="ratio-pill">{{ Number(item.ratio || 0).toFixed(2) }}</span>
          </template>
          <template #item.seeding_hours="{ item }">
            <span class="nowrap-num text-medium-emphasis">{{ Number(item.seeding_hours || 0).toFixed(1) }} h</span>
          </template>
          <template #item.rule_name="{ item }">
            <span class="rule-name-text" :title="item.rule_name">{{ item.rule_name }}</span>
          </template>
          <template #item.reason="{ item }">
            <span class="reason-text" :title="item.reason">{{ item.reason }}</span>
          </template>
          <template #no-data>
            <div v-if="hasActiveFilter" class="dry-inline-empty">
              <v-icon size="32" icon="mdi-filter-off-outline" class="text-medium-emphasis" />
              <div class="text-body-2 font-weight-medium">没有匹配当前筛选条件的候选种子</div>
              <v-btn size="small" variant="tonal" rounded="lg" color="primary" @click="resetFilters">
                重置筛选
              </v-btn>
            </div>
            <div v-else class="dry-inline-empty">
              <v-icon size="34" icon="mdi-shield-check" color="success" />
              <div class="text-subtitle-2 font-weight-bold">没有种子命中清理条件</div>
              <div class="text-caption text-medium-emphasis">当前所有做种任务均处于安全保留状态</div>
            </div>
          </template>
        </v-data-table>
      </div>
    </template>

    <!-- 尚未执行干跑：统一扁平紧凑引导框 -->
    <div v-else class="dry-empty-box">
      <v-icon icon="mdi-clipboard-search-outline" size="38" class="mb-2 text-primary" />
      <div class="text-subtitle-1 font-weight-bold">先模拟干跑，再执行清理</div>
      <div class="text-body-2 text-medium-emphasis mt-1 mb-4 dry-empty-desc">
        实时扫描已启用下载器的任务快照，完整校验保护标签、入库锁、多维规则与低水位保盘策略，不会调用删除接口。
      </div>
      <div class="d-flex flex-wrap justify-center ga-2">
        <v-btn
          size="small"
          color="primary"
          variant="flat"
          rounded="lg"
          class="px-4"
          prepend-icon="mdi-play-outline"
          :loading="working === 'dry'"
          @click="emit('dry-run')"
        >
          开始模拟干跑
        </v-btn>
        <v-btn
          size="small"
          variant="outlined"
          rounded="lg"
          class="px-4"
          prepend-icon="mdi-tune"
          @click="emit('open-settings')"
        >
          规则配置
        </v-btn>
        <v-btn
          size="small"
          variant="text"
          rounded="lg"
          prepend-icon="mdi-arrow-left"
          @click="emit('back')"
        >
          返回概览
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dry-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dry-view :deep(.v-field) {
  border-radius: 8px;
}

.dry-summary-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.16s ease;
}

.dry-summary-bar:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.15);
}

.dry-summary-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.dry-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgba(var(--v-theme-on-surface), 0.78);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.dry-badge.is-primary {
  border-color: rgba(var(--v-theme-primary), 0.2);
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.dry-badge.is-info {
  border-color: rgba(var(--v-theme-info), 0.2);
  background: rgba(var(--v-theme-info), 0.1);
  color: rgb(var(--v-theme-info));
}

.dry-badge.is-muted {
  border-color: transparent;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.54);
}

.dry-safe-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgb(var(--v-theme-success));
  font-size: 12px;
  font-weight: 500;
}

.dry-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.dry-search {
  flex: 1 1 260px;
  min-width: 200px;
}

.dry-select {
  flex: 0 1 180px;
  min-width: 150px;
}

.dry-filter-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dry-table-card {
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.16s ease;
}

.dry-table-card:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.15);
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
    min-width: 320px;
    max-width: 540px;
  }
}

.torrent-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  width: 100%;
}

.torrent-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
}

.keep-chip {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(var(--v-theme-info), 0.14);
  color: rgb(var(--v-theme-info));
  font-size: 10.5px;
  font-weight: 600;
}

.ratio-pill {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  font-size: 11.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.nowrap-text {
  white-space: nowrap;
  font-size: 12.5px;
}

.nowrap-num {
  white-space: nowrap;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}

.rule-name-text {
  display: block;
  max-width: 156px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
}

.reason-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 260px;
  white-space: normal;
  line-height: 1.4;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.68);
}

.dry-inline-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 36px 20px;
}

.dry-empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 44px 20px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  text-align: center;
  transition: border-color 0.16s ease;
}

.dry-empty-box:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.15);
}

.dry-empty-desc {
  max-width: 560px;
}

@media (max-width: 700px) {
  .dry-filter-meta {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
