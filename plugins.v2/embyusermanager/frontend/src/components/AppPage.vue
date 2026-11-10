<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'

interface HostToast {
  error(message: string): unknown
  info(message: string): unknown
  success(message: string): unknown
  warning(message: string): unknown
}

interface PluginConfig {
  enabled: boolean
  allow_mode: 'all' | 'whitelist' | 'blacklist'
  whitelist: string[]
  blacklist: string[]
  allowed_servers: string[]
  allow_emby_admin: boolean
}

interface EmbyServerSummary {
  name: string
  user_count: number
}

interface UserOverviewItem {
  username: string
  user_id: number | null
  registered_in_mp: boolean
  is_active: boolean
  emby_id: string
  emby_servers: string[]
  emby_is_admin: boolean
  emby_is_disabled: boolean
  last_login_date: string | null
  last_activity_date: string | null
  movie_sub_count: number
  tv_sub_count: number
  total_sub_count: number
  in_whitelist: boolean
  in_blacklist: boolean
  access_status: 'allowed' | 'blocked' | 'disabled'
  access_reason: string
}

interface UserSubscribeItem {
  id: number
  name: string
  year?: string
  type: string
  season?: number | null
  poster?: string
  state?: string
  total_episode?: number
  lack_episode?: number
  date?: string
  last_update?: string
  username?: string
}

const props = defineProps({
  api: {
    type: Object,
    default: () => ({}),
  },
  pluginId: {
    type: String,
    default: 'EmbyUserManager',
  },
  navKey: {
    type: String,
    default: 'main',
  },
})

const emit = defineEmits(['action', 'switch', 'close'])
const toast = inject<HostToast | null>('moviepilot:toast', null)

const loading = ref(false)
const savingConfig = ref(false)
const keyword = ref('')
const statusFilter = ref<'all' | 'allowed' | 'blocked' | 'disabled' | 'registered'>('all')

const config = ref<PluginConfig>({
  enabled: true,
  allow_mode: 'all',
  whitelist: [],
  blacklist: [],
  allowed_servers: [],
  allow_emby_admin: true,
})
const servers = ref<EmbyServerSummary[]>([])
const stats = ref({
  emby_user_count: 0,
  mp_registered_count: 0,
  allowed_user_count: 0,
  total_subscribe_count: 0,
})
const users = ref<UserOverviewItem[]>([])

const settingsDialog = ref(false)
const whitelistInput = ref('')
const blacklistInput = ref('')

const subDialog = ref(false)
const subDialogUser = ref('')
const subDialogLoading = ref(false)
const userSubscribes = ref<UserSubscribeItem[]>([])

const deleteDialog = ref(false)
const deleteTargetUser = ref<UserOverviewItem | null>(null)
const deleteWithSubscribes = ref(false)
const deletingUser = ref(false)

const resolvedPluginId = computed(() => props.pluginId || 'EmbyUserManager')

function notifySuccess(msg: string) {
  toast?.success(msg)
}

function notifyError(msg: string) {
  toast?.error(msg)
}

function parseListText(text: string): string[] {
  return text
    .replace(/\n/g, ',')
    .split(',')
    .map(item => item.trim())
    .filter((item, idx, arr) => Boolean(item) && arr.indexOf(item) === idx)
}

async function fetchOverview() {
  if (!props.api?.get) return
  loading.value = true
  try {
    const res = await props.api.get(`plugin/${resolvedPluginId.value}/overview`)
    if (res?.success && res.data) {
      config.value = {
        enabled: Boolean(res.data.config?.enabled ?? true),
        allow_mode: res.data.config?.allow_mode || 'all',
        whitelist: res.data.config?.whitelist || [],
        blacklist: res.data.config?.blacklist || [],
        allowed_servers: res.data.config?.allowed_servers || [],
        allow_emby_admin: Boolean(res.data.config?.allow_emby_admin ?? true),
      }
      whitelistInput.value = config.value.whitelist.join(', ')
      blacklistInput.value = config.value.blacklist.join(', ')
      servers.value = res.data.servers || []
      stats.value = res.data.stats || stats.value
      users.value = res.data.users || []
    }
  } catch (err) {
    console.error('加载 Emby 用户概览失败:', err)
    notifyError('加载 Emby 用户概览失败')
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return users.value.filter(user => {
    if (kw && !user.username.toLowerCase().includes(kw)) return false
    if (statusFilter.value === 'registered' && !user.registered_in_mp) return false
    if (
      statusFilter.value !== 'all' &&
      statusFilter.value !== 'registered' &&
      user.access_status !== statusFilter.value
    ) {
      return false
    }
    return true
  })
})

function statusColor(status: UserOverviewItem['access_status']) {
  if (status === 'allowed') return 'success'
  if (status === 'blocked') return 'warning'
  return 'error'
}

function statusLabel(status: UserOverviewItem['access_status']) {
  if (status === 'allowed') return '允许登录'
  if (status === 'blocked') return '准入拦截'
  return '已禁用'
}

function allowModeLabel(mode: PluginConfig['allow_mode']) {
  if (mode === 'whitelist') return '白名单模式'
  if (mode === 'blacklist') return '黑名单模式'
  return '允许全部 Emby 用户'
}

function formatDateText(value: string | null) {
  if (!value) return '暂无记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

async function toggleUserActive(user: UserOverviewItem) {
  if (!props.api?.post) return
  const nextActive = !user.is_active
  try {
    const res = await props.api.post(`plugin/${resolvedPluginId.value}/user/status`, {
      username: user.username,
      is_active: nextActive,
    })
    if (res?.success) {
      notifySuccess(res.message || '状态已更新')
      await fetchOverview()
    } else {
      notifyError(res?.message || '操作失败')
    }
  } catch (err) {
    console.error(err)
    notifyError('更新用户状态失败')
  }
}

async function updateAccessList(
  user: UserOverviewItem,
  listType: 'whitelist' | 'blacklist',
  action: 'add' | 'remove',
) {
  if (!props.api?.post) return
  try {
    const res = await props.api.post(`plugin/${resolvedPluginId.value}/user/access-list`, {
      username: user.username,
      list_type: listType,
      action,
    })
    if (res?.success) {
      notifySuccess(res.message || '名单已更新')
      await fetchOverview()
    } else {
      notifyError(res?.message || '更新名单失败')
    }
  } catch (err) {
    console.error(err)
    notifyError('更新名单失败')
  }
}

function openSettingsDialog() {
  whitelistInput.value = config.value.whitelist.join(', ')
  blacklistInput.value = config.value.blacklist.join(', ')
  settingsDialog.value = true
}

async function savePolicyConfig() {
  if (!props.api?.post) return
  savingConfig.value = true
  try {
    const payload: PluginConfig = {
      ...config.value,
      whitelist: parseListText(whitelistInput.value),
      blacklist: parseListText(blacklistInput.value),
    }
    const res = await props.api.post(`plugin/${resolvedPluginId.value}/config`, payload)
    if (res?.success) {
      notifySuccess('登录准入策略已保存')
      settingsDialog.value = false
      await fetchOverview()
      emit('action')
    } else {
      notifyError(res?.message || '保存配置失败')
    }
  } catch (err) {
    console.error(err)
    notifyError('保存配置失败')
  } finally {
    savingConfig.value = false
  }
}

async function openUserSubscribes(user: UserOverviewItem) {
  if (!props.api?.get) return
  subDialogUser.value = user.username
  subDialog.value = true
  subDialogLoading.value = true
  userSubscribes.value = []
  try {
    const res = await props.api.get(`plugin/${resolvedPluginId.value}/user/subscribes`, {
      params: { username: user.username },
    })
    if (res?.success && Array.isArray(res.data)) {
      userSubscribes.value = res.data
    }
  } catch (err) {
    console.error(err)
    notifyError('读取用户订阅列表失败')
  } finally {
    subDialogLoading.value = false
  }
}

function openDeleteUserDialog(user: UserOverviewItem) {
  deleteTargetUser.value = user
  deleteWithSubscribes.value = false
  deleteDialog.value = true
}

async function confirmDeleteUser() {
  if (!deleteTargetUser.value || !props.api?.post) return
  deletingUser.value = true
  try {
    const res = await props.api.post(`plugin/${resolvedPluginId.value}/user/delete`, {
      username: deleteTargetUser.value.username,
      delete_subscribes: deleteWithSubscribes.value,
    })
    if (res?.success) {
      notifySuccess(res.message || '用户已删除')
      deleteDialog.value = false
      await fetchOverview()
    } else {
      notifyError(res?.message || '删除用户失败')
    }
  } catch (err) {
    console.error(err)
    notifyError('删除用户失败')
  } finally {
    deletingUser.value = false
  }
}

onMounted(() => {
  fetchOverview()
})
</script>

<template>
  <div class="emby-user-manager pa-4">
    <!-- 顶部标题与操作栏 -->
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 gap-3">
      <div>
        <div class="d-flex align-center gap-2">
          <v-icon icon="mdi-account-group-outline" color="primary" size="28" />
          <h2 class="text-h5 font-weight-bold mb-0">Emby 用户与订阅管理</h2>
          <v-chip :color="config.enabled ? 'success' : 'secondary'" size="small" variant="tonal">
            {{ config.enabled ? allowModeLabel(config.allow_mode) : '准入拦截已关闭' }}
          </v-chip>
        </div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          同步查看 Emby 媒体服务器用户，控制登录准入黑白名单，并集中查看或清理各用户的影视订阅。
        </div>
      </div>

      <div class="d-flex align-center gap-2">
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-shield-tune-outline" @click="openSettingsDialog">
          准入策略设置
        </v-btn>
        <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="loading" @click="fetchOverview">
          刷新
        </v-btn>
      </div>
    </div>

    <!-- 统计概览卡片 -->
    <v-row class="mb-4" dense>
      <v-col cols="6" sm="3">
        <v-card variant="tonal" color="primary" class="pa-3">
          <div class="text-caption text-medium-emphasis">Emby 媒体库用户</div>
          <div class="text-h5 font-weight-bold mt-1">{{ stats.emby_user_count }}</div>
          <div class="text-caption mt-1">
            来源实例：{{ servers.length ? servers.map(s => s.name).join('、') : '未配置或未连接' }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="tonal" color="success" class="pa-3">
          <div class="text-caption text-medium-emphasis">允许登录用户</div>
          <div class="text-h5 font-weight-bold mt-1">{{ stats.allowed_user_count }}</div>
          <div class="text-caption mt-1">当前策略：{{ allowModeLabel(config.allow_mode) }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="tonal" color="info" class="pa-3">
          <div class="text-caption text-medium-emphasis">已登录 MP 用户</div>
          <div class="text-h5 font-weight-bold mt-1">{{ stats.mp_registered_count }}</div>
          <div class="text-caption mt-1">首次通过 Emby 登录时自动建号</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="tonal" color="warning" class="pa-3">
          <div class="text-caption text-medium-emphasis">普通用户订阅总数</div>
          <div class="text-h5 font-weight-bold mt-1">{{ stats.total_subscribe_count }}</div>
          <div class="text-caption mt-1">可在订阅页按用户名筛选</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 搜索与筛选栏 -->
    <v-card class="mb-4 pa-3" variant="outlined">
      <div class="d-flex flex-wrap align-center justify-space-between gap-3">
        <v-text-field
          v-model="keyword"
          prepend-inner-icon="mdi-magnify"
          placeholder="搜索 Emby 用户名..."
          density="compact"
          variant="outlined"
          hide-details
          clearable
          style="max-width: 320px; min-width: 220px"
        />

        <v-chip-group v-model="statusFilter" mandatory selected-class="text-primary">
          <v-chip value="all" size="small" filter variant="tonal">全部 ({{ users.length }})</v-chip>
          <v-chip value="allowed" size="small" filter variant="tonal" color="success">允许登录</v-chip>
          <v-chip value="blocked" size="small" filter variant="tonal" color="warning">准入拦截</v-chip>
          <v-chip value="disabled" size="small" filter variant="tonal" color="error">已禁用</v-chip>
          <v-chip value="registered" size="small" filter variant="tonal" color="info">已登录 MP</v-chip>
        </v-chip-group>
      </div>
    </v-card>

    <!-- 用户列表 -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />

    <v-card v-if="!loading && filteredUsers.length === 0" variant="outlined" class="pa-8 text-center">
      <v-icon icon="mdi-account-off-outline" size="48" color="medium-emphasis" class="mb-2" />
      <div class="text-body-1 font-weight-medium">暂无匹配的 Emby 用户</div>
      <div class="text-caption text-medium-emphasis mt-1">
        请确认已在「设定 -> 媒体服务器」中启用 Emby 实例，或调整上方筛选条件。
      </div>
    </v-card>

    <v-row v-else dense>
      <v-col v-for="user in filteredUsers" :key="user.username" cols="12" md="6" lg="4">
        <v-card variant="outlined" class="pa-3 h-100 d-flex flex-column justify-space-between">
          <div>
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center gap-2">
                <v-avatar color="primary" variant="tonal" size="36">
                  <span class="font-weight-bold">{{ user.username.slice(0, 1).toUpperCase() }}</span>
                </v-avatar>
                <div>
                  <div class="d-flex align-center gap-1">
                    <span class="font-weight-bold text-body-1">{{ user.username }}</span>
                    <v-chip v-if="user.emby_is_admin" size="x-small" color="purple" variant="tonal">
                      Emby管理员
                    </v-chip>
                    <v-chip v-if="user.registered_in_mp" size="x-small" color="info" variant="tonal">
                      已建号
                    </v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    服务器：{{ user.emby_servers.length ? user.emby_servers.join('、') : '仅本地记录' }}
                  </div>
                </div>
              </div>

              <v-chip :color="statusColor(user.access_status)" size="small" variant="tonal">
                {{ statusLabel(user.access_status) }}
              </v-chip>
            </div>

            <div class="text-caption text-medium-emphasis mb-2">
              <div>准入说明：{{ user.access_reason }}</div>
              <div>最近活跃：{{ formatDateText(user.last_activity_date || user.last_login_date) }}</div>
            </div>

            <div class="d-flex align-center flex-wrap gap-2 my-2">
              <v-chip
                size="small"
                variant="tonal"
                color="primary"
                prepend-icon="mdi-movie-open-outline"
                @click="openUserSubscribes(user)"
              >
                电影订阅 {{ user.movie_sub_count }}
              </v-chip>
              <v-chip
                size="small"
                variant="tonal"
                color="warning"
                prepend-icon="mdi-television"
                @click="openUserSubscribes(user)"
              >
                剧集订阅 {{ user.tv_sub_count }}
              </v-chip>
              <v-chip v-if="user.in_whitelist" size="x-small" color="success" variant="outlined">
                白名单
              </v-chip>
              <v-chip v-if="user.in_blacklist" size="x-small" color="error" variant="outlined">
                黑名单
              </v-chip>
            </div>
          </div>

          <v-divider class="my-2" />

          <div class="d-flex align-center justify-space-between flex-wrap gap-1">
            <div class="d-flex align-center gap-1">
              <v-btn
                size="x-small"
                :color="user.is_active ? 'warning' : 'success'"
                variant="tonal"
                :prepend-icon="user.is_active ? 'mdi-account-cancel-outline' : 'mdi-account-check-outline'"
                @click="toggleUserActive(user)"
              >
                {{ user.is_active ? '禁用登录' : '恢复启用' }}
              </v-btn>

              <v-btn
                v-if="!user.in_whitelist"
                size="x-small"
                color="success"
                variant="text"
                @click="updateAccessList(user, 'whitelist', 'add')"
              >
                +白名单
              </v-btn>
              <v-btn
                v-else
                size="x-small"
                color="secondary"
                variant="text"
                @click="updateAccessList(user, 'whitelist', 'remove')"
              >
                -移出白名单
              </v-btn>

              <v-btn
                v-if="!user.in_blacklist"
                size="x-small"
                color="error"
                variant="text"
                @click="updateAccessList(user, 'blacklist', 'add')"
              >
                +黑名单
              </v-btn>
              <v-btn
                v-else
                size="x-small"
                color="secondary"
                variant="text"
                @click="updateAccessList(user, 'blacklist', 'remove')"
              >
                -移出黑名单
              </v-btn>
            </div>

            <div class="d-flex align-center gap-1">
              <v-btn
                size="x-small"
                variant="text"
                color="primary"
                prepend-icon="mdi-format-list-bulleted"
                @click="openUserSubscribes(user)"
              >
                订阅明细
              </v-btn>
              <v-btn
                v-if="user.registered_in_mp || user.total_sub_count > 0"
                size="x-small"
                variant="text"
                color="error"
                icon="mdi-delete-outline"
                title="删除用户账号或清理订阅"
                @click="openDeleteUserDialog(user)"
              />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 准入策略设置弹窗 -->
    <v-dialog v-model="settingsDialog" max-width="560">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Emby 登录准入策略设置</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="settingsDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="d-flex flex-column gap-3">
          <v-switch
            v-model="config.enabled"
            color="primary"
            label="启用 Emby 用户管理与准入拦截"
            hide-details
          />
          <v-switch
            v-model="config.allow_emby_admin"
            color="primary"
            label="允许 Emby 管理员账号作为普通订阅用户登录"
            hide-details
          />
          <v-select
            v-model="config.allow_mode"
            :items="[
              { title: '全部允许（除黑名单/禁用账号外均可登录）', value: 'all' },
              { title: '白名单模式（仅白名单中的 Emby 用户可登录）', value: 'whitelist' },
              { title: '黑名单模式（拦截黑名单中的 Emby 用户）', value: 'blacklist' },
            ]"
            item-title="title"
            item-value="value"
            label="登录准入模式"
            variant="outlined"
            density="compact"
          />
          <v-select
            v-model="config.allowed_servers"
            :items="servers.map(s => s.name)"
            label="允许登录的 Emby 服务器（留空表示全部已启用实例）"
            variant="outlined"
            density="compact"
            multiple
            chips
            clearable
          />
          <v-textarea
            v-model="whitelistInput"
            label="白名单用户名（多个用户名用逗号或换行分隔）"
            variant="outlined"
            rows="2"
            density="compact"
          />
          <v-textarea
            v-model="blacklistInput"
            label="黑名单用户名（多个用户名用逗号或换行分隔）"
            variant="outlined"
            rows="2"
            density="compact"
          />
        </v-card-text>
        <v-card-actions class="justify-end pa-4">
          <v-btn variant="text" @click="settingsDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingConfig" @click="savePolicyConfig">
            保存设置
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 用户订阅明细弹窗 -->
    <v-dialog v-model="subDialog" max-width="640">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ subDialogUser }} 的订阅记录 ({{ userSubscribes.length }})</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="subDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-progress-linear v-if="subDialogLoading" indeterminate color="primary" class="mb-3" />
          <div v-else-if="userSubscribes.length === 0" class="text-center py-6 text-medium-emphasis">
            该用户暂无订阅记录
          </div>
          <v-list v-else lines="two" density="comfortable">
            <v-list-item v-for="sub in userSubscribes" :key="sub.id">
              <template #prepend>
                <v-icon
                  :icon="sub.type === '电影' ? 'mdi-movie-open-outline' : 'mdi-television'"
                  :color="sub.type === '电影' ? 'success' : 'warning'"
                />
              </template>
              <v-list-item-title class="font-weight-medium">
                {{ sub.name }}
                <span v-if="sub.year" class="text-caption text-medium-emphasis">({{ sub.year }})</span>
                <span v-if="sub.season" class="text-caption ms-1">S{{ sub.season }}</span>
              </v-list-item-title>
              <v-list-item-subtitle>
                类型：{{ sub.type }} · 状态：{{ sub.state || 'R' }} · 订阅时间：{{ sub.date || '-' }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 删除用户确认弹窗 -->
    <v-dialog v-model="deleteDialog" max-width="460">
      <v-card>
        <v-card-title>移除用户 {{ deleteTargetUser?.username }}</v-card-title>
        <v-card-text>
          <div class="text-body-2 mb-3">
            确定要移除本地用户 <strong>{{ deleteTargetUser?.username }}</strong> 的账号记录吗？
          </div>
          <v-checkbox
            v-model="deleteWithSubscribes"
            color="error"
            :label="`同时删除该用户名下的全部订阅 (${deleteTargetUser?.total_sub_count || 0} 条)`"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="justify-end pa-4">
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="deletingUser" @click="confirmDeleteUser">
            确认删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
