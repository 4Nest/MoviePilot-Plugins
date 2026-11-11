<script setup lang="ts">
import { ref, watch } from 'vue'

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
})
const emit = defineEmits(['save', 'close', 'switch'])

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
    <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
      所有规则默认要求「已完成 + 已整理入库」。请先干跑预览，确认真删范围；保护标签与全局排除始终优先生效。
    </v-alert>
    <v-tabs v-model="activeTab" color="primary" class="mb-4" show-arrows>
      <v-tab value="general" prepend-icon="mdi-tune">全局与调度</v-tab>
      <v-tab value="rules" prepend-icon="mdi-format-list-checks">
        清理规则
        <v-chip size="x-small" class="ml-2">{{ config.rules.length }}</v-chip>
      </v-tab>
      <v-tab value="disk" prepend-icon="mdi-harddisk">低水位保盘</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item value="general">
        <v-card variant="outlined" class="pa-4">
          <v-row>
            <v-col cols="12" md="4"><v-switch v-model="config.enabled" color="primary" label="启用插件与定时巡检" hide-details /></v-col>
            <v-col cols="12" md="4"><v-switch v-model="config.notify" color="primary" label="清理后发送汇总通知" hide-details /></v-col>
            <v-col cols="12" md="4"><v-switch v-model="config.only_completed" color="primary" label="全局仅清理已完成任务" hide-details /></v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="config.cron" label="巡检 Cron" hint="默认每 30 分钟；例如 */30 * * * *" persistent-hint variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-combobox v-model="config.protect_tags" multiple chips closable-chips label="全局保护标签" hint="输入后回车；保种、辅种、勿删、keep 永不删除" persistent-hint variant="outlined" />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="config.global_exclude_regex" label="全局排除名称正则（大小写不敏感）" placeholder="例如：-(HDArea|EPiC|WiKi|FRDS)$" variant="outlined" />
            </v-col>
          </v-row>
        </v-card>
      </v-window-item>

      <v-window-item value="rules">
        <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
          <div class="text-body-2 text-medium-emphasis">规则自上而下匹配，同一种子只命中一次；数值条件可选全部满足或任一达标。</div>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="addRule">添加规则</v-btn>
        </div>
        <v-alert v-if="!config.rules.length" type="info" variant="tonal">暂无规则。可添加空白规则，或在主页面导入四个预设模板。</v-alert>
        <v-expansion-panels v-else multiple variant="accordion">
          <v-expansion-panel v-for="(rule, index) in config.rules" :key="rule.id">
            <v-expansion-panel-title>
              <div class="d-flex align-center ga-3 flex-wrap">
                <v-icon :color="rule.enabled ? 'success' : 'disabled'">{{ rule.enabled ? 'mdi-check-circle' : 'mdi-pause-circle' }}</v-icon>
                <span class="font-weight-medium">{{ index + 1 }}. {{ rule.name }}</span>
                <v-chip size="x-small" variant="tonal">{{ rule.metric_logic === 'any' ? '任一数值达标' : '全部数值满足' }}</v-chip>
                <v-chip v-if="rule.require_transferred" size="x-small" color="success" variant="tonal">入库锁</v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12" md="5"><v-text-field v-model="rule.name" label="规则名称" variant="outlined" density="compact" /></v-col>
                <v-col cols="12" md="4">
                  <v-combobox v-model="rule.downloaders" multiple chips closable-chips label="限定下载器（空为全部）" variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" md="3"><v-text-field v-model.number="rule.max_delete_per_run" type="number" min="0" label="单轮上限（0 不限）" variant="outlined" density="compact" /></v-col>
                <v-col cols="6" md="3"><v-switch v-model="rule.enabled" color="primary" label="启用" hide-details /></v-col>
                <v-col cols="6" md="3"><v-switch v-model="rule.delete_files" color="error" label="连同源文件删除" hide-details /></v-col>
                <v-col cols="6" md="3"><v-switch v-model="rule.require_transferred" color="success" label="仅已整理入库" hide-details /></v-col>
                <v-col cols="6" md="3"><v-switch v-model="rule.allow_incomplete" color="warning" label="允许未完成任务" hide-details /></v-col>
                <v-col cols="12" md="6">
                  <v-select v-model="rule.states" :items="stateItems" multiple chips label="允许状态（空为不限）" variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-btn-toggle v-model="rule.metric_logic" mandatory color="primary" variant="outlined" divided class="w-100">
                    <v-btn value="all" class="flex-1-1">数值全部满足 AND</v-btn>
                    <v-btn value="any" class="flex-1-1">任一数值达标 OR</v-btn>
                  </v-btn-toggle>
                </v-col>
              </v-row>

              <v-divider class="my-4" />
              <div class="section-title"><v-icon icon="mdi-regex" />正则条件</div>
              <v-row>
                <v-col cols="12" md="6"><v-text-field v-model="rule.name_regex" label="种子名称包含正则" variant="outlined" density="compact" /></v-col>
                <v-col cols="12" md="6"><v-text-field v-model="rule.exclude_name_regex" label="种子名称排除正则" placeholder="-(HDArea|EPiC|WiKi|FRDS)$" variant="outlined" density="compact" /></v-col>
                <v-col cols="12" md="6"><v-text-field v-model="rule.save_path_regex" label="保存路径包含正则" variant="outlined" density="compact" /></v-col>
                <v-col cols="12" md="6"><v-text-field v-model="rule.exclude_save_path_regex" label="保存路径排除正则" variant="outlined" density="compact" /></v-col>
                <v-col cols="12" md="6"><v-text-field v-model="rule.tracker_regex" label="Tracker 包含正则" variant="outlined" density="compact" /></v-col>
                <v-col cols="12" md="6"><v-text-field v-model="rule.exclude_tracker_regex" label="Tracker 排除正则" variant="outlined" density="compact" /></v-col>
                <v-col cols="12"><v-text-field v-model="rule.tracker_msg_regex" label="Tracker 状态/报错正则" placeholder="unregistered|not registered|torrent not found|deleted|banned|不存在|已删除" variant="outlined" density="compact" /></v-col>
                <v-col cols="12" md="4"><v-text-field v-model="rule.category_regex" label="分类正则" variant="outlined" density="compact" /></v-col>
                <v-col cols="12" md="4"><v-text-field v-model="rule.tag_regex" label="标签包含正则" variant="outlined" density="compact" /></v-col>
                <v-col cols="12" md="4"><v-text-field v-model="rule.exclude_tag_regex" label="标签排除正则" variant="outlined" density="compact" /></v-col>
              </v-row>

              <v-divider class="my-4" />
              <div class="section-title"><v-icon icon="mdi-chart-box-outline" />数值达标条件</div>
              <v-row>
                <v-col cols="6" md="3"><v-text-field v-model.number="rule.min_ratio" type="number" step="0.1" label="最小分享率" variant="outlined" density="compact" /></v-col>
                <v-col cols="6" md="3"><v-text-field v-model.number="rule.max_ratio" type="number" step="0.1" label="最大分享率" variant="outlined" density="compact" /></v-col>
                <v-col cols="6" md="3"><v-text-field v-model.number="rule.min_seeding_hours" type="number" label="最少做种小时" variant="outlined" density="compact" /></v-col>
                <v-col cols="6" md="3"><v-text-field v-model.number="rule.min_added_hours" type="number" label="最少添加小时" variant="outlined" density="compact" /></v-col>
                <v-col cols="6" md="4"><v-text-field v-model.number="rule.min_size_gb" type="number" label="最小体积 GB" variant="outlined" density="compact" /></v-col>
                <v-col cols="6" md="4"><v-text-field v-model.number="rule.max_size_gb" type="number" label="最大体积 GB" variant="outlined" density="compact" /></v-col>
                <v-col cols="12" md="4"><v-text-field v-model.number="rule.max_upspeed_kbps" type="number" label="最大上传 KB/s" hint="例如 10 可筛选无人下载冷种" persistent-hint variant="outlined" density="compact" /></v-col>
              </v-row>
              <div class="d-flex justify-end ga-2 mt-3">
                <v-btn variant="text" prepend-icon="mdi-content-copy" @click="duplicateRule(index)">复制</v-btn>
                <v-btn color="error" variant="text" prepend-icon="mdi-delete" @click="removeRule(index)">删除规则</v-btn>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-window-item>

      <v-window-item value="disk">
        <v-card variant="outlined" class="pa-4">
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar color="warning" variant="tonal"><v-icon icon="mdi-shield-half-full" /></v-avatar>
            <div><div class="text-h6">磁盘低水位应急保盘</div><div class="text-body-2 text-medium-emphasis">仅在空间不足时启动，仍强制要求已完成、已入库、无保护标签且达到最低保护时长。</div></div>
          </div>
          <v-switch v-model="config.disk_guard.enabled" color="warning" label="启用磁盘低水位应急删种" />
          <v-row :class="{ 'disabled-section': !config.disk_guard.enabled }">
            <v-col cols="12" md="6"><v-text-field v-model.number="config.disk_guard.free_space_threshold_gb" type="number" min="0" label="触发阈值：剩余空间低于 GB" variant="outlined" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model.number="config.disk_guard.target_free_space_gb" type="number" min="0" label="恢复目标：预计剩余空间达到 GB" variant="outlined" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model.number="config.disk_guard.min_protect_hours" type="number" min="0" label="最低做种保护时长（小时）" variant="outlined" /></v-col>
            <v-col cols="12" md="6"><v-select v-model="config.disk_guard.sort_by" :items="sortItems" label="淘汰排序策略" variant="outlined" /></v-col>
            <v-col cols="12"><v-switch v-model="config.disk_guard.delete_files" color="error" label="应急淘汰时连同源文件删除（关闭仅移除任务）" hide-details /></v-col>
          </v-row>
        </v-card>
      </v-window-item>
    </v-window>

    <div class="sticky-actions">
      <v-btn variant="text" @click="emit('close')">取消</v-btn>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" @click="saveConfig">保存配置</v-btn>
    </div>
  </div>
</template>

<style scoped>
.seed-config { color: rgb(var(--v-theme-on-surface)); }
.section-title { display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 14px; color: rgb(var(--v-theme-primary)); }
.sticky-actions { position: sticky; bottom: 0; z-index: 2; display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding: 12px 0 4px; background: linear-gradient(transparent, rgb(var(--v-theme-background)) 24%); }
.disabled-section { opacity: .55; pointer-events: none; }
.flex-1-1 { flex: 1 1 0; }
</style>
