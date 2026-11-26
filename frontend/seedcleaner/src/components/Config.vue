<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

interface CleanRuleForm {
  id: string
  name: string
  enabled: boolean
  downloaders: string[]
  delete_files: boolean
  require_transferred: boolean
  allow_incomplete: boolean
  max_delete_per_run: number
  metric_logic: 'all' | 'any'
  name_regex: string
  exclude_name_regex: string
  save_path_regex: string
  exclude_save_path_regex: string
  tracker_regex: string
  exclude_tracker_regex: string
  tracker_msg_regex: string
  category_regex: string
  tag_regex: string
  exclude_tag_regex: string
  states: string[]
  min_ratio: number | null
  max_ratio: number | null
  min_seeding_hours: number | null
  min_added_hours: number | null
  min_size_gb: number | null
  max_size_gb: number | null
  max_upspeed_kbps: number | null
}

interface PluginConfigForm {
  enabled: boolean
  cron: string
  notify: boolean
  protect_tags: string[]
  global_exclude_regex: string
  only_completed: boolean
  rules: CleanRuleForm[]
  disk_guard: {
    enabled: boolean
    free_space_threshold_gb: number
    target_free_space_gb: number
    min_protect_hours: number
    sort_by: string
    delete_files: boolean
  }
}

const props = defineProps({
  initialConfig: { type: Object, default: () => ({}) },
  api: { type: Object, default: () => ({}) },
  embedded: { type: Boolean, default: false },
  downloaderNames: { type: Array as () => string[], default: () => [] },
})
const emit = defineEmits(['save', 'close', 'switch', 'layout'])

const remoteDownloaders = ref<string[]>([])
const loadingDownloaders = ref(false)

async function fetchDownloaders() {
  const getter = (props.api as any)?.get
  if (typeof getter !== 'function') return
  loadingDownloaders.value = true
  try {
    const res = await getter('download/clients')
    const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
    const names = list
      .map((item: any) => (typeof item === 'string' ? item : item?.name))
      .map((name: any) => String(name || '').trim())
      .filter(Boolean)
    if (names.length > 0) {
      remoteDownloaders.value = Array.from(new Set(names))
      return
    }
    const settingRes = await getter('system/setting/Downloaders')
    const rawSetting = Array.isArray(settingRes)
      ? settingRes
      : Array.isArray(settingRes?.data?.value)
        ? settingRes.data.value
        : Array.isArray(settingRes?.data)
          ? settingRes.data
          : []
    const fallbackNames = rawSetting
      .filter((item: any) => item && item.enabled !== false)
      .map((item: any) => String(item.name || '').trim())
      .filter(Boolean)
    remoteDownloaders.value = Array.from(new Set(fallbackNames))
  } catch {
    // 忽略探测异常，保留父组件传入或规则已有的下载器列表
  } finally {
    loadingDownloaders.value = false
  }
}

onMounted(() => {
  if (!props.embedded) {
    emit('layout', { maxWidth: '64rem' })
  }
  void fetchDownloaders()
})

const stateItems = [
  { title: '做种中', value: 'seeding' },
  { title: '已暂停', value: 'paused' },
  { title: '做种停滞', value: 'stalled' },
  { title: '错误/死种', value: 'error' },
  { title: '下载中', value: 'downloading' },
  { title: '其他', value: 'other' },
]
const sortItems = [
  { title: '做种最久优先', value: 'oldest_seeding' },
  { title: '体积最大优先', value: 'largest_size' },
  { title: '上传最慢优先', value: 'lowest_upspeed' },
  { title: '分享率最高优先', value: 'highest_ratio' },
]
const activeTab = ref('general')

function defaultRule(): CleanRuleForm {
  return {
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: '新清理规则',
    enabled: true,
    downloaders: [],
    delete_files: true,
    require_transferred: true,
    allow_incomplete: false,
    max_delete_per_run: 0,
    metric_logic: 'all',
    name_regex: '',
    exclude_name_regex: '',
    save_path_regex: '',
    exclude_save_path_regex: '',
    tracker_regex: '',
    exclude_tracker_regex: '',
    tracker_msg_regex: '',
    category_regex: '',
    tag_regex: '',
    exclude_tag_regex: '',
    states: ['seeding', 'paused', 'stalled'],
    min_ratio: null,
    max_ratio: null,
    min_seeding_hours: null,
    min_added_hours: null,
    min_size_gb: null,
    max_size_gb: null,
    max_upspeed_kbps: null,
  }
}

function normalizeRule(raw: any, index: number): CleanRuleForm {
  return { ...defaultRule(), ...clone(raw), id: raw?.id || `rule_${index + 1}` }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? {}))
}

function defaultConfig(): PluginConfigForm {
  return {
    enabled: false,
    cron: '*/30 * * * *',
    notify: true,
    protect_tags: ['保种', '辅种', '勿删', 'keep'],
    global_exclude_regex: '',
    only_completed: true,
    rules: [],
    disk_guard: {
      enabled: false,
      free_space_threshold_gb: 50,
      target_free_space_gb: 100,
      min_protect_hours: 72,
      sort_by: 'oldest_seeding',
      delete_files: true,
    },
  }
}

function normalizeConfig(raw: any): PluginConfigForm {
  const base = defaultConfig()
  return {
    ...base,
    ...clone(raw),
    protect_tags: Array.isArray(raw?.protect_tags) ? [...raw.protect_tags] : base.protect_tags,
    rules: Array.isArray(raw?.rules) ? raw.rules.map(normalizeRule) : [],
    disk_guard: { ...base.disk_guard, ...(clone(raw?.disk_guard) || {}) },
  }
}

const config = ref<PluginConfigForm>(normalizeConfig(props.initialConfig))
watch(
  () => props.initialConfig,
  value => {
    config.value = normalizeConfig(value)
  },
  { deep: true },
)

const downloaderOptions = computed<string[]>(() => {
  const merged = new Set<string>()
  for (const name of props.downloaderNames || []) {
    const trimmed = String(name || '').trim()
    if (trimmed) merged.add(trimmed)
  }
  for (const name of remoteDownloaders.value) {
    if (name) merged.add(name)
  }
  for (const rule of config.value.rules || []) {
    for (const name of rule.downloaders || []) {
      const trimmed = String(name || '').trim()
      if (trimmed) merged.add(trimmed)
    }
  }
  return Array.from(merged)
})

function addRule() {
  config.value.rules.push(defaultRule())
  activeTab.value = 'rules'
}

function removeRule(index: number) {
  config.value.rules.splice(index, 1)
}

function duplicateRule(index: number) {
  const copy = normalizeRule(config.value.rules[index], index)
  copy.id = `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  copy.name = `${copy.name}（副本）`
  config.value.rules.splice(index + 1, 0, copy)
}

function saveConfig() {
  emit('save', clone(config.value))
}
</script>

<template>
  <div class="seed-config">
    <div v-if="!props.embedded" class="seed-config__header">
      <div class="seed-config__title">
        <v-icon icon="mdi-tune" size="20" color="primary" />
        <span>保种管家配置</span>
      </div>
      <v-btn icon="mdi-close" variant="text" size="small" rounded="lg" @click="emit('close')" />
    </div>

    <div class="seed-config__body">
      <v-alert type="warning" variant="tonal" density="compact" rounded="lg" class="text-caption mb-3">
        默认强制校验「已完成 + 已入库」，保护标签与全局排除始终优先生效；修改规则后建议先执行干跑预览。
      </v-alert>

      <v-tabs v-model="activeTab" color="primary" density="compact" class="mb-3" show-arrows>
        <v-tab value="general" prepend-icon="mdi-tune">全局与调度</v-tab>
        <v-tab value="rules" prepend-icon="mdi-format-list-checks">
          清理规则
          <v-chip size="x-small" class="ml-2" variant="tonal">{{ config.rules.length }}</v-chip>
        </v-tab>
        <v-tab value="disk" prepend-icon="mdi-harddisk">低水位保盘</v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <v-window-item value="general">
          <div class="seed-section-card mb-4">
            <div class="seed-section-card__head">
              <v-icon icon="mdi-toggle-switch-outline" size="16" color="primary" />
              <span>运行开关</span>
            </div>
            <div class="seed-toggle-grid">
              <div class="seed-toggle-tile" :class="{ 'is-active': config.enabled }">
                <div class="seed-toggle-tile__top">
                  <span class="seed-toggle-tile__title">启用定时巡检</span>
                  <v-switch v-model="config.enabled" color="primary" inset density="compact" hide-details />
                </div>
                <div class="seed-toggle-tile__desc">按 Cron 周期扫描已启用下载器的做种任务并执行淘汰策略</div>
              </div>

              <div class="seed-toggle-tile" :class="{ 'is-active': config.notify }">
                <div class="seed-toggle-tile__top">
                  <span class="seed-toggle-tile__title">清理汇总通知</span>
                  <v-switch v-model="config.notify" color="primary" inset density="compact" hide-details />
                </div>
                <div class="seed-toggle-tile__desc">有种子被移除时通过系统通知渠道推送统计报告</div>
              </div>

              <div class="seed-toggle-tile" :class="{ 'is-active': config.only_completed }">
                <div class="seed-toggle-tile__top">
                  <span class="seed-toggle-tile__title">仅清理已完成</span>
                  <v-switch v-model="config.only_completed" color="primary" inset density="compact" hide-details />
                </div>
                <div class="seed-toggle-tile__desc">强制跳过下载中或未完成进度 100% 的种子</div>
              </div>
            </div>
          </div>

          <div class="seed-section-card">
            <div class="seed-section-card__head">
              <v-icon icon="mdi-shield-lock-outline" size="16" color="primary" />
              <span>调度与全局保护</span>
            </div>
            <v-row dense class="seed-form-grid">
              <v-col cols="12" md="5">
                <v-text-field
                  v-model="config.cron"
                  label="巡检 Cron（例如 */30 * * * *）"
                  prepend-inner-icon="mdi-clock-outline"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="7">
                <v-text-field
                  v-model="config.global_exclude_regex"
                  label="全局排除名称正则（大小写不敏感）"
                  placeholder="例如：-(HDArea|EPiC|WiKi|FRDS)$"
                  prepend-inner-icon="mdi-regex"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12" class="mt-2">
                <v-combobox
                  v-model="config.protect_tags"
                  multiple
                  chips
                  closable-chips
                  label="全局保护标签（回车添加，命中永不删除）"
                  prepend-inner-icon="mdi-tag-multiple-outline"
                  variant="outlined"
                  density="compact"
                  hide-details
                >
                  <template #chip="{ props: chipProps, item }">
                    <v-chip
                      v-bind="chipProps"
                      size="small"
                      color="primary"
                      variant="tonal"
                      label
                      class="seed-tag-chip"
                    >
                      {{ item.raw }}
                    </v-chip>
                  </template>
                </v-combobox>
              </v-col>
            </v-row>
          </div>
        </v-window-item>

        <v-window-item value="rules">
          <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
            <span class="text-caption text-medium-emphasis">
              规则自上而下匹配，同一种子只命中一次；数值条件支持 AND / OR 切换。
            </span>
            <v-btn size="small" color="primary" variant="tonal" rounded="lg" prepend-icon="mdi-plus" @click="addRule">
              添加规则
            </v-btn>
          </div>

          <div v-if="!config.rules.length" class="seed-empty-rules">
            <v-icon icon="mdi-format-list-checks" size="30" class="text-medium-emphasis mb-1" />
            <div class="text-body-2 font-weight-medium">暂无清理规则</div>
            <div class="text-caption text-medium-emphasis">可点击右上角「添加规则」，或在页面中导入预设模板</div>
          </div>

          <v-expansion-panels v-else multiple variant="accordion">
            <v-expansion-panel v-for="(rule, index) in config.rules" :key="rule.id" class="seed-rule-panel">
              <v-expansion-panel-title class="py-2">
                <div class="d-flex align-center ga-2 flex-wrap">
                  <v-icon size="18" :color="rule.enabled ? 'success' : 'disabled'">
                    {{ rule.enabled ? 'mdi-check-circle' : 'mdi-pause-circle' }}
                  </v-icon>
                  <span class="font-weight-medium text-body-2">{{ index + 1 }}. {{ rule.name }}</span>
                  <span class="seed-mini-chip">
                    {{ rule.metric_logic === 'any' ? '任一达标 OR' : '全部满足 AND' }}
                  </span>
                  <span v-if="rule.require_transferred" class="seed-mini-chip is-success">入库锁</span>
                  <span v-if="!rule.delete_files" class="seed-mini-chip is-info">保留源文件</span>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row dense class="pt-1">
                  <v-col cols="12" md="5">
                    <v-text-field v-model="rule.name" label="规则名称" variant="outlined" density="compact" hide-details />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="rule.downloaders"
                      :items="downloaderOptions"
                      :loading="loadingDownloaders"
                      multiple
                      chips
                      closable-chips
                      clearable
                      no-data-text="暂无已启用下载器"
                      label="限定下载器（空为全部）"
                      variant="outlined"
                      density="compact"
                      hide-details
                    >
                      <template #chip="{ props: chipProps, item }">
                        <v-chip
                          v-bind="chipProps"
                          size="x-small"
                          color="primary"
                          variant="tonal"
                          label
                        >
                          {{ item.raw }}
                        </v-chip>
                      </template>
                    </v-select>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model.number="rule.max_delete_per_run"
                      type="number"
                      min="0"
                      label="单轮上限（0 不限）"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>

                <v-row dense class="mt-2">
                  <v-col cols="6" md="3">
                    <v-switch v-model="rule.enabled" color="primary" density="compact" label="启用规则" hide-details />
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-switch
                      v-model="rule.delete_files"
                      color="error"
                      density="compact"
                      label="连同源文件删除"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-switch
                      v-model="rule.require_transferred"
                      color="primary"
                      density="compact"
                      label="仅已整理入库"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-switch
                      v-model="rule.allow_incomplete"
                      color="primary"
                      density="compact"
                      label="允许未完成任务"
                      hide-details
                    />
                  </v-col>
                </v-row>

                <v-row dense class="mt-2">
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="rule.states"
                      :items="stateItems"
                      multiple
                      chips
                      label="允许状态（空为不限）"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-btn-toggle
                      v-model="rule.metric_logic"
                      mandatory
                      density="compact"
                      color="primary"
                      variant="outlined"
                      rounded="lg"
                      divided
                      class="w-100"
                    >
                      <v-btn value="all" size="small" class="flex-1-1">数值全部满足 AND</v-btn>
                      <v-btn value="any" size="small" class="flex-1-1">任一数值达标 OR</v-btn>
                    </v-btn-toggle>
                  </v-col>
                </v-row>

                <div class="seed-subhead mt-4 mb-2">
                  <v-icon icon="mdi-regex" size="16" />
                  <span>正则匹配条件</span>
                </div>
                <v-row dense>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="rule.name_regex"
                      label="种子名称包含正则"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="rule.exclude_name_regex"
                      label="种子名称排除正则"
                      placeholder="-(HDArea|EPiC|WiKi|FRDS)$"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="6" class="mt-2">
                    <v-text-field
                      v-model="rule.save_path_regex"
                      label="保存路径包含正则"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="6" class="mt-2">
                    <v-text-field
                      v-model="rule.exclude_save_path_regex"
                      label="保存路径排除正则"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="6" class="mt-2">
                    <v-text-field
                      v-model="rule.tracker_regex"
                      label="Tracker 包含正则"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="6" class="mt-2">
                    <v-text-field
                      v-model="rule.exclude_tracker_regex"
                      label="Tracker 排除正则"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" class="mt-2">
                    <v-text-field
                      v-model="rule.tracker_msg_regex"
                      label="Tracker 状态/报错正则"
                      placeholder="unregistered|not registered|torrent not found|deleted|banned|不存在|已删除"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="4" class="mt-2">
                    <v-text-field
                      v-model="rule.category_regex"
                      label="分类正则"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="4" class="mt-2">
                    <v-text-field
                      v-model="rule.tag_regex"
                      label="标签包含正则"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="4" class="mt-2">
                    <v-text-field
                      v-model="rule.exclude_tag_regex"
                      label="标签排除正则"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>

                <div class="seed-subhead mt-4 mb-2">
                  <v-icon icon="mdi-chart-box-outline" size="16" />
                  <span>数值达标条件</span>
                </div>
                <v-row dense>
                  <v-col cols="6" md="3">
                    <v-text-field
                      v-model.number="rule.min_ratio"
                      type="number"
                      step="0.1"
                      label="最小分享率"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-text-field
                      v-model.number="rule.max_ratio"
                      type="number"
                      step="0.1"
                      label="最大分享率"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-text-field
                      v-model.number="rule.min_seeding_hours"
                      type="number"
                      label="最少做种小时"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-text-field
                      v-model.number="rule.min_added_hours"
                      type="number"
                      label="最少添加小时"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4" class="mt-2">
                    <v-text-field
                      v-model.number="rule.min_size_gb"
                      type="number"
                      label="最小体积 GB"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4" class="mt-2">
                    <v-text-field
                      v-model.number="rule.max_size_gb"
                      type="number"
                      label="最大体积 GB"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="4" class="mt-2">
                    <v-text-field
                      v-model.number="rule.max_upspeed_kbps"
                      type="number"
                      label="最大上传 KB/s（筛冷种）"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>

                <div class="d-flex justify-end ga-2 mt-3">
                  <v-btn size="small" variant="text" rounded="lg" prepend-icon="mdi-content-copy" @click="duplicateRule(index)">
                    复制规则
                  </v-btn>
                  <v-btn
                    size="small"
                    color="error"
                    variant="text"
                    rounded="lg"
                    prepend-icon="mdi-delete-outline"
                    @click="removeRule(index)"
                  >
                    删除规则
                  </v-btn>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-window-item>

        <v-window-item value="disk">
          <div class="seed-panel-box">
            <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
              <div class="d-flex align-center ga-2">
                <v-icon icon="mdi-shield-half-full" color="warning" size="20" />
                <div>
                  <div class="text-subtitle-2 font-weight-bold">磁盘低水位应急保盘</div>
                  <div class="text-caption text-medium-emphasis">
                    仅在剩余空间低于阈值时启动，仍强制校验已完成、已入库、无保护标签与最低保护时长。
                  </div>
                </div>
              </div>
              <v-switch
                v-model="config.disk_guard.enabled"
                color="primary"
                density="compact"
                label="启用保盘"
                hide-details
              />
            </div>

            <v-row dense :class="{ 'disabled-section': !config.disk_guard.enabled }">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="config.disk_guard.free_space_threshold_gb"
                  type="number"
                  min="0"
                  label="触发阈值：剩余空间低于 GB"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="config.disk_guard.target_free_space_gb"
                  type="number"
                  min="0"
                  label="恢复目标：预计剩余空间达到 GB"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="6" class="mt-2">
                <v-text-field
                  v-model.number="config.disk_guard.min_protect_hours"
                  type="number"
                  min="0"
                  label="最低做种保护时长（小时）"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="6" class="mt-2">
                <v-select
                  v-model="config.disk_guard.sort_by"
                  :items="sortItems"
                  label="淘汰排序策略"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12" class="mt-2">
                <v-switch
                  v-model="config.disk_guard.delete_files"
                  color="error"
                  density="compact"
                  label="应急淘汰时连同源文件删除（关闭则仅移除任务）"
                  hide-details
                />
              </v-col>
            </v-row>
          </div>
        </v-window-item>
      </v-window>
    </div>

    <div class="seed-config__footer">
      <v-btn
        v-if="!props.embedded"
        size="small"
        variant="outlined"
        rounded="lg"
        prepend-icon="mdi-database-eye-outline"
        @click="emit('switch')"
      >
        查看数据
      </v-btn>
      <v-spacer />
      <v-btn size="small" variant="text" rounded="lg" @click="emit('close')">取消</v-btn>
      <v-btn size="small" color="primary" variant="flat" rounded="lg" @click="saveConfig">保存</v-btn>
    </div>
  </div>
</template>

<style scoped>
.seed-config {
  display: flex;
  flex-direction: column;
  color: rgb(var(--v-theme-on-surface));
  background-color: rgb(var(--v-theme-surface));
}

.seed-section-card {
  padding: 14px 16px 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.seed-section-card__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  color: rgba(var(--v-theme-on-surface), 0.88);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.seed-toggle-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.seed-toggle-tile {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 11px 12px 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.16s ease, background-color 0.16s ease;
}

.seed-toggle-tile.is-active {
  border-color: rgba(var(--v-theme-primary), 0.32);
  background: rgba(var(--v-theme-primary), 0.04);
}

.seed-toggle-tile__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.seed-toggle-tile__top :deep(.v-switch) {
  flex: 0 0 auto;
}

.seed-toggle-tile__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
}

.seed-toggle-tile__desc {
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 11.5px;
  line-height: 1.45;
}

.seed-tag-chip {
  font-weight: 500;
}

@media (max-width: 760px) {
  .seed-toggle-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.seed-config :deep(.v-field) {
  border-radius: 8px;
}

.seed-config__header {
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

.seed-config__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.seed-config__body {
  padding: 16px 18px;
}

.seed-panel-box {
  padding: 14px 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  transition: border-color 0.16s ease;
}

.seed-panel-box:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.15);
}

.seed-empty-rules {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  text-align: center;
}

.seed-rule-panel {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
  border-radius: 12px !important;
  box-shadow: none !important;
  overflow: hidden;
}

.seed-rule-panel + .seed-rule-panel {
  margin-top: 8px;
}

.seed-rule-panel::after {
  display: none;
}

.seed-mini-chip {
  padding: 1px 7px;
  border-radius: 5px;
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 11px;
  font-weight: 600;
}

.seed-mini-chip.is-success {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}

.seed-mini-chip.is-info {
  background: rgba(var(--v-theme-info), 0.12);
  color: rgb(var(--v-theme-info));
}

.seed-subhead {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgb(var(--v-theme-primary));
  font-size: 13px;
  font-weight: 600;
}

.seed-config__footer {
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

.disabled-section {
  opacity: 0.52;
  pointer-events: none;
}

.flex-1-1 {
  flex: 1 1 0;
}

@media (max-width: 600px) {
  .seed-config__body {
    padding: 14px;
  }

  .seed-config__footer {
    padding: 12px 14px calc(12px + env(safe-area-inset-bottom));
  }
}
</style>
