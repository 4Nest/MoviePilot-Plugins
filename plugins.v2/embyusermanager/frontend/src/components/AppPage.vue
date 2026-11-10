<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref } from 'vue'

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

interface EmbyFolderItem {
  id: string
  raw_id?: string
  name: string
}

interface EmbyTemplateUser {
  id: string
  name: string
}

interface EmbyServerSummary {
  name: string
  user_count: number
  folders?: EmbyFolderItem[]
  users?: EmbyTemplateUser[]
}

interface EmbyServerAccount {
  server: string
  user_id: string
  name: string
  has_password: boolean
  is_admin: boolean
  is_disabled: boolean
  is_hidden: boolean
  enable_all_folders: boolean
  enabled_folders: string[]
  enable_remote_access: boolean
  enable_downloading: boolean
  enable_video_transcoding: boolean
  enable_audio_transcoding: boolean
  simultaneous_stream_limit: number
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
  has_password?: boolean
  server_accounts?: Record<string, EmbyServerAccount>
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

// 准入策略弹窗状态
const settingsDialog = ref(false)
const whitelistInput = ref('')
const blacklistInput = ref('')

// 新建 Emby 账号弹窗状态
const createDialog = ref(false)
const creatingUser = ref(false)
const showCreatePassword = ref(false)
const createForm = reactive({
  server: '',
  username: '',
  password: '',
  copy_from_user_id: '',
  is_admin: false,
  is_hidden: true,
  enable_all_folders: true,
  enabled_folders: [] as string[],
  enable_remote_access: true,
  enable_downloading: true,
  enable_video_transcoding: true,
  enable_audio_transcoding: true,
  simultaneous_stream_limit: 0,
  add_to_whitelist: false,
})

// 编辑 Emby 账号弹窗状态
const editDialog = ref(false)
const editLoading = ref(false)
const savingEdit = ref(false)
const showEditPassword = ref(false)
const editTargetUser = ref<UserOverviewItem | null>(null)
const editForm = reactive({
  server: '',
  user_id: '',
  username: '',
  new_username: '',
  change_password: false,
  new_password: '',
  mp_is_active: true,
  is_admin: false,
  is_disabled: false,
  is_hidden: true,
  enable_all_folders: true,
  enabled_folders: [] as string[],
  enable_remote_access: true,
  enable_downloading: true,
  enable_video_transcoding: true,
  enable_audio_transcoding: true,
  simultaneous_stream_limit: 0,
})

// 订阅明细弹窗状态
const subDialog = ref(false)
const subDialogUser = ref('')
const subDialogLoading = ref(false)
const userSubscribes = ref<UserSubscribeItem[]>([])

// 删除账号确认弹窗状态
const deleteDialog = ref(false)
const deleteTargetUser = ref<UserOverviewItem | null>(null)
const deleteFromEmby = ref(false)
const deleteMpUser = ref(true)
const deleteWithSubscribes = ref(false)
const deletingUser = ref(false)

const resolvedPluginId = computed(() => props.pluginId || 'EmbyUserManager')

const createServerObj = computed(() => servers.value.find(s => s.name === createForm.server) || servers.value[0])
const createServerFolders = computed(() => createServerObj.value?.folders || [])
const createTemplateUsers = computed(() => createServerObj.value?.users || [])

const editServerObj = computed(() => servers.value.find(s => s.name === editForm.server) || servers.value[0])
const editServerFolders = ref<EmbyFolderItem[]>([])

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

function primaryServerAccount(user: UserOverviewItem): EmbyServerAccount | null {
  const map = user.server_accounts || {}
  const firstServer = user.emby_servers[0]
  if (firstServer && map[firstServer]) return map[firstServer]
  const keys = Object.keys(map)
  return keys.length ? map[keys[0]] : null
}

function folderSummaryText(user: UserOverviewItem): string {
  const acc = primaryServerAccount(user)
  if (!acc) return '仅本地账号'
  if (acc.enable_all_folders) return '全部媒体库'
  return `限定 ${acc.enabled_folders?.length || 0} 个媒体库`
}

// 打开新建 Emby 账号弹窗
function openCreateDialog() {
  if (!servers.value.length) {
    notifyError('当前没有已启用的 Emby 媒体服务器实例')
    return
  }
  createForm.server = servers.value[0].name
  createForm.username = ''
  createForm.password = ''
  createForm.copy_from_user_id = ''
  createForm.is_admin = false
  createForm.is_hidden = true
  createForm.enable_all_folders = true
  createForm.enabled_folders = []
  createForm.enable_remote_access = true
  createForm.enable_downloading = true
  createForm.enable_video_transcoding = true
  createForm.enable_audio_transcoding = true
  createForm.simultaneous_stream_limit = 0
  createForm.add_to_whitelist = config.value.allow_mode === 'whitelist'
  showCreatePassword.value = false
  createDialog.value = true
}

async function submitCreateUser() {
  if (!props.api?.post) return
  const uname = createForm.username.trim()
  if (!uname) {
    notifyError('请输入新 Emby 用户名')
    return
  }
  creatingUser.value = true
  try {
    const payload: Record<string, unknown> = {
      server: createForm.server,
      username: uname,
      password: createForm.password,
      copy_from_user_id: createForm.copy_from_user_id || '',
      add_to_whitelist: createForm.add_to_whitelist,
    }
    if (!createForm.copy_from_user_id) {
      Object.assign(payload, {
        is_admin: createForm.is_admin,
        is_hidden: createForm.is_hidden,
        enable_all_folders: createForm.enable_all_folders,
        enabled_folders: createForm.enable_all_folders ? [] : createForm.enabled_folders,
        enable_remote_access: createForm.enable_remote_access,
        enable_downloading: createForm.enable_downloading,
        enable_video_transcoding: createForm.enable_video_transcoding,
        enable_audio_transcoding: createForm.enable_audio_transcoding,
        simultaneous_stream_limit: Number(createForm.simultaneous_stream_limit) || 0,
      })
    }
    const res = await props.api.post(`plugin/${resolvedPluginId.value}/emby/user/create`, payload)
    if (res?.success) {
      notifySuccess(res.message || '创建 Emby 账号成功')
      createDialog.value = false
      await fetchOverview()
    } else {
      notifyError(res?.message || '创建 Emby 账号失败')
    }
  } catch (err) {
    console.error(err)
    notifyError('创建 Emby 账号请求失败')
  } finally {
    creatingUser.value = false
  }
}

// 加载指定服务器上的 Emby 账号实时详情填充到编辑表单
async function loadEditServerDetail(user: UserOverviewItem, serverName: string) {
  const acc = user.server_accounts?.[serverName]
  editForm.server = serverName
  editForm.username = user.username
  editForm.new_username = user.username
  editForm.change_password = false
  editForm.new_password = ''
  editForm.mp_is_active = user.is_active
  editServerFolders.value = editServerObj.value?.folders || []

  if (acc) {
    editForm.user_id = acc.user_id
    editForm.is_admin = acc.is_admin
    editForm.is_disabled = acc.is_disabled
    editForm.is_hidden = acc.is_hidden
    editForm.enable_all_folders = acc.enable_all_folders
    editForm.enabled_folders = [...(acc.enabled_folders || [])]
    editForm.enable_remote_access = acc.enable_remote_access
    editForm.enable_downloading = acc.enable_downloading
    editForm.enable_video_transcoding = acc.enable_video_transcoding
    editForm.enable_audio_transcoding = acc.enable_audio_transcoding
    editForm.simultaneous_stream_limit = acc.simultaneous_stream_limit || 0
  }

  if (!props.api?.get || !acc?.user_id) return
  editLoading.value = true
  try {
    const res = await props.api.get(`plugin/${resolvedPluginId.value}/emby/user`, {
      params: { server: serverName, user_id: acc.user_id },
    })
    if (res?.success && res.data) {
      const p = res.data.policy || {}
      editForm.user_id = res.data.user_id || acc.user_id
      editForm.new_username = res.data.username || user.username
      editForm.is_admin = Boolean(p.is_admin)
      editForm.is_disabled = Boolean(p.is_disabled)
      editForm.is_hidden = Boolean(p.is_hidden ?? true)
      editForm.enable_all_folders = Boolean(p.enable_all_folders ?? true)
      editForm.enabled_folders = Array.isArray(p.enabled_folders) ? [...p.enabled_folders] : []
      editForm.enable_remote_access = Boolean(p.enable_remote_access ?? true)
      editForm.enable_downloading = Boolean(p.enable_downloading ?? true)
      editForm.enable_video_transcoding = Boolean(p.enable_video_transcoding ?? true)
      editForm.enable_audio_transcoding = Boolean(p.enable_audio_transcoding ?? true)
      editForm.simultaneous_stream_limit = Number(p.simultaneous_stream_limit) || 0
      if (Array.isArray(res.data.folders) && res.data.folders.length) {
        editServerFolders.value = res.data.folders
      }
    }
  } catch (err) {
    console.error('获取 Emby 用户实时详情失败:', err)
  } finally {
    editLoading.value = false
  }
}

async function openEditDialog(user: UserOverviewItem) {
  if (!user.emby_servers.length) {
    notifyError('该账号仅存在于本地记录中，不在 Emby 服务器上')
    return
  }
  editTargetUser.value = user
  showEditPassword.value = false
  editDialog.value = true
  await loadEditServerDetail(user, user.emby_servers[0])
}

async function onEditServerChange(nextServer: string) {
  if (!editTargetUser.value || !nextServer) return
  await loadEditServerDetail(editTargetUser.value, nextServer)
}

async function submitEditUser() {
  if (!props.api?.post || !editForm.user_id) return
  if (!editForm.new_username.trim()) {
    notifyError('用户名不能为空')
    return
  }
  savingEdit.value = true
  try {
    const res = await props.api.post(`plugin/${resolvedPluginId.value}/emby/user/update`, {
      server: editForm.server,
      user_id: editForm.user_id,
      username: editForm.username,
      new_username: editForm.new_username.trim(),
      change_password: editForm.change_password,
      new_password: editForm.new_password,
      mp_is_active: editForm.mp_is_active,
      policy: {
        is_admin: editForm.is_admin,
        is_disabled: editForm.is_disabled,
        is_hidden: editForm.is_hidden,
        enable_all_folders: editForm.enable_all_folders,
        enabled_folders: editForm.enable_all_folders ? [] : editForm.enabled_folders,
        enable_remote_access: editForm.enable_remote_access,
        enable_downloading: editForm.enable_downloading,
        enable_video_transcoding: editForm.enable_video_transcoding,
        enable_audio_transcoding: editForm.enable_audio_transcoding,
        simultaneous_stream_limit: Number(editForm.simultaneous_stream_limit) || 0,
      },
    })
    if (res?.success) {
      notifySuccess(res.message || 'Emby 用户信息已更新')
      editDialog.value = false
      await fetchOverview()
    } else {
      notifyError(res?.message || '更新 Emby 用户失败')
    }
  } catch (err) {
    console.error(err)
    notifyError('更新 Emby 用户请求失败')
  } finally {
    savingEdit.value = false
  }
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
  deleteFromEmby.value = user.emby_servers.length > 0
  deleteMpUser.value = true
  deleteWithSubscribes.value = false
  deleteDialog.value = true
}

async function confirmDeleteUser() {
  if (!deleteTargetUser.value || !props.api?.post) return
  if (!deleteFromEmby.value && !deleteMpUser.value && !deleteWithSubscribes.value) {
    notifyError('请至少勾选一项要删除或清理的内容')
    return
  }
  deletingUser.value = true
  try {
    const res = await props.api.post(`plugin/${resolvedPluginId.value}/user/delete`, {
      username: deleteTargetUser.value.username,
      delete_from_emby: deleteFromEmby.value,
      delete_mp_user: deleteMpUser.value,
      delete_subscribes: deleteWithSubscribes.value,
      emby_servers: deleteTargetUser.value.emby_servers,
    })
    if (res?.success) {
      notifySuccess(res.message || '用户删除操作已完成')
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
        <div class="d-flex align-center flex-wrap gap-2">
          <v-icon icon="mdi-account-group-outline" color="primary" size="28" />
          <h2 class="text-h5 font-weight-bold mb-0">Emby 账号与订阅管理</h2>
          <v-chip :color="config.enabled ? 'success' : 'secondary'" size="small" variant="tonal">
            {{ config.enabled ? allowModeLabel(config.allow_mode) : '准入拦截已关闭' }}
          </v-chip>
        </div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          直接新建、编辑、删除 Emby 媒体服务器账号与媒体库权限，并管控 MoviePilot 登录准入与个人订阅。
        </div>
      </div>

      <div class="d-flex align-center flex-wrap gap-2">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-account-plus-outline"
          :disabled="servers.length === 0"
          @click="openCreateDialog"
        >
          新建 Emby 账号
        </v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-shield-tune-outline" @click="openSettingsDialog">
          准入策略
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
          <div class="text-caption text-medium-emphasis">Emby 媒体库账号</div>
          <div class="text-h5 font-weight-bold mt-1">{{ stats.emby_user_count }}</div>
          <div class="text-caption mt-1">
            实例：{{ servers.length ? servers.map(s => s.name).join('、') : '未连接' }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="tonal" color="success" class="pa-3">
          <div class="text-caption text-medium-emphasis">允许登录 MP</div>
          <div class="text-h5 font-weight-bold mt-1">{{ stats.allowed_user_count }}</div>
          <div class="text-caption mt-1">策略：{{ allowModeLabel(config.allow_mode) }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="tonal" color="info" class="pa-3">
          <div class="text-caption text-medium-emphasis">已登录 MP 用户</div>
          <div class="text-h5 font-weight-bold mt-1">{{ stats.mp_registered_count }}</div>
          <div class="text-caption mt-1">首次使用 Emby 登录自动建号</div>
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
        可点击右上角「新建 Emby 账号」创建新用户，或检查媒体服务器连接状态。
      </div>
    </v-card>

    <v-row v-else dense>
      <v-col v-for="user in filteredUsers" :key="user.username" cols="12" md="6" lg="4">
        <v-card variant="outlined" class="pa-3 h-100 d-flex flex-column justify-space-between">
          <div>
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center gap-2 min-w-0">
                <v-avatar color="primary" variant="tonal" size="38">
                  <span class="font-weight-bold">{{ user.username.slice(0, 1).toUpperCase() }}</span>
                </v-avatar>
                <div class="min-w-0">
                  <div class="d-flex align-center flex-wrap gap-1">
                    <span class="font-weight-bold text-body-1">{{ user.username }}</span>
                    <v-chip v-if="user.emby_is_admin" size="x-small" color="purple" variant="tonal">
                      Emby管理员
                    </v-chip>
                    <v-chip v-if="user.emby_is_disabled" size="x-small" color="error" variant="tonal">
                      Emby已停用
                    </v-chip>
                    <v-chip v-if="user.registered_in_mp" size="x-small" color="info" variant="tonal">
                      已登录MP
                    </v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ user.emby_servers.length ? user.emby_servers.join('、') : '仅本地记录' }} ·
                    {{ folderSummaryText(user) }} ·
                    {{ user.has_password ? '已设密码' : '免密登录' }}
                  </div>
                </div>
              </div>

              <v-chip :color="statusColor(user.access_status)" size="small" variant="tonal">
                {{ statusLabel(user.access_status) }}
              </v-chip>
            </div>

            <div class="text-caption text-medium-emphasis mb-2">
              <div>MP 准入：{{ user.access_reason }}</div>
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
                电影 {{ user.movie_sub_count }}
              </v-chip>
              <v-chip
                size="small"
                variant="tonal"
                color="warning"
                prepend-icon="mdi-television"
                @click="openUserSubscribes(user)"
              >
                剧集 {{ user.tv_sub_count }}
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
            <div class="d-flex align-center flex-wrap gap-1">
              <v-btn
                v-if="user.emby_servers.length > 0"
                size="x-small"
                color="primary"
                variant="tonal"
                prepend-icon="mdi-account-edit-outline"
                @click="openEditDialog(user)"
              >
                编辑账号
              </v-btn>

              <v-btn
                size="x-small"
                :color="user.is_active ? 'warning' : 'success'"
                variant="tonal"
                :prepend-icon="user.is_active ? 'mdi-account-cancel-outline' : 'mdi-account-check-outline'"
                @click="toggleUserActive(user)"
              >
                {{ user.is_active ? '禁登MP' : '允许MP' }}
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
                -白名单
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
                -黑名单
              </v-btn>
            </div>

            <div class="d-flex align-center gap-1">
              <v-btn
                size="x-small"
                variant="text"
                color="info"
                icon="mdi-format-list-bulleted"
                title="查看订阅明细"
                @click="openUserSubscribes(user)"
              />
              <v-btn
                size="x-small"
                variant="text"
                color="error"
                icon="mdi-delete-outline"
                title="删除 Emby 账号或清理订阅"
                @click="openDeleteUserDialog(user)"
              />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 新建 Emby 账号弹窗 -->
    <v-dialog v-model="createDialog" max-width="620" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>新建 Emby 媒体服务器账号</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="createDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="d-flex flex-column gap-3 pt-4">
          <v-select
            v-if="servers.length > 1"
            v-model="createForm.server"
            :items="servers.map(s => s.name)"
            label="目标 Emby 服务器"
            variant="outlined"
            density="compact"
            hide-details
          />

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="createForm.username"
                label="Emby 用户名 *"
                placeholder="例如：alice"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="createForm.password"
                :type="showCreatePassword ? 'text' : 'password'"
                label="初始密码（留空则免密）"
                variant="outlined"
                density="compact"
                hide-details
                :append-inner-icon="showCreatePassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                @click:append-inner="showCreatePassword = !showCreatePassword"
              />
            </v-col>
          </v-row>

          <v-select
            v-model="createForm.copy_from_user_id"
            :items="[{ id: '', name: '不复制（按下方自定义权限配置）' }, ...createTemplateUsers]"
            item-title="name"
            item-value="id"
            label="从现有用户复制权限配置（可选）"
            variant="outlined"
            density="compact"
            hide-details
          />

          <template v-if="!createForm.copy_from_user_id">
            <v-divider class="my-1" />
            <div class="text-subtitle-2 font-weight-bold">Emby 账号权限与媒体库授权</div>

            <v-row dense>
              <v-col cols="12" sm="6">
                <v-switch
                  v-model="createForm.is_admin"
                  color="primary"
                  density="compact"
                  label="设为 Emby 管理员"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-switch
                  v-model="createForm.is_hidden"
                  color="primary"
                  density="compact"
                  label="在登录界面隐藏此账号"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-switch
                  v-model="createForm.enable_remote_access"
                  color="primary"
                  density="compact"
                  label="允许外网远程连接"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-switch
                  v-model="createForm.enable_downloading"
                  color="primary"
                  density="compact"
                  label="允许下载媒体文件"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-switch
                  v-model="createForm.enable_video_transcoding"
                  color="primary"
                  density="compact"
                  label="允许视频播放转码"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-switch
                  v-model="createForm.enable_audio_transcoding"
                  color="primary"
                  density="compact"
                  label="允许音频播放转码"
                  hide-details
                />
              </v-col>
            </v-row>

            <v-text-field
              v-model.number="createForm.simultaneous_stream_limit"
              type="number"
              min="0"
              label="最大同时播放流数量限制（0 表示不限制）"
              variant="outlined"
              density="compact"
              hide-details
            />

            <v-switch
              v-model="createForm.enable_all_folders"
              color="success"
              density="compact"
              label="允许访问所有媒体库"
              hide-details
            />

            <v-card v-if="!createForm.enable_all_folders" variant="outlined" class="pa-3">
              <div class="text-caption text-medium-emphasis mb-2">勾选允许该用户访问的媒体库：</div>
              <div v-if="createServerFolders.length === 0" class="text-caption text-medium-emphasis">
                未读取到媒体库文件夹列表
              </div>
              <v-row v-else dense>
                <v-col v-for="folder in createServerFolders" :key="folder.id" cols="6" sm="4">
                  <v-checkbox
                    v-model="createForm.enabled_folders"
                    :value="folder.id"
                    :label="folder.name"
                    density="compact"
                    hide-details
                  />
                </v-col>
              </v-row>
            </v-card>
          </template>

          <v-divider class="my-1" />
          <v-checkbox
            v-model="createForm.add_to_whitelist"
            color="success"
            density="compact"
            label="同时将该用户加入 MoviePilot 登录白名单"
            hide-details
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-end pa-4">
          <v-btn variant="text" @click="createDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="creatingUser" @click="submitCreateUser">
            创建账号
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 编辑 Emby 账号弹窗 -->
    <v-dialog v-model="editDialog" max-width="640" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>编辑 Emby 账号：{{ editForm.username }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="editDialog = false" />
        </v-card-title>
        <v-divider />
        <v-progress-linear v-if="editLoading" indeterminate color="primary" />
        <v-card-text class="d-flex flex-column gap-3 pt-4">
          <v-select
            v-if="editTargetUser && editTargetUser.emby_servers.length > 1"
            :model-value="editForm.server"
            :items="editTargetUser.emby_servers"
            label="当前编辑的 Emby 服务器实例"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="onEditServerChange"
          />

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editForm.new_username"
                label="Emby 用户名"
                variant="outlined"
                density="compact"
                hint="修改用户名会自动同步迁移本地订阅归属"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-switch
                v-model="editForm.change_password"
                color="warning"
                density="compact"
                label="重置 / 修改登录密码"
                hide-details
              />
              <v-text-field
                v-if="editForm.change_password"
                v-model="editForm.new_password"
                :type="showEditPassword ? 'text' : 'password'"
                label="新密码（留空表示清空密码设为免密）"
                variant="outlined"
                density="compact"
                hide-details
                class="mt-2"
                :append-inner-icon="showEditPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                @click:append-inner="showEditPassword = !showEditPassword"
              />
            </v-col>
          </v-row>

          <v-divider class="my-1" />
          <div class="text-subtitle-2 font-weight-bold">账号状态与权限策略</div>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-switch
                v-model="editForm.is_disabled"
                color="error"
                density="compact"
                label="在 Emby 中禁用此账号"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-switch
                v-model="editForm.mp_is_active"
                color="success"
                density="compact"
                label="允许登录 MoviePilot 订阅"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-switch
                v-model="editForm.is_admin"
                color="primary"
                density="compact"
                label="Emby 管理员权限"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-switch
                v-model="editForm.is_hidden"
                color="primary"
                density="compact"
                label="在 Emby 登录界面隐藏"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-switch
                v-model="editForm.enable_remote_access"
                color="primary"
                density="compact"
                label="允许外网远程连接"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-switch
                v-model="editForm.enable_downloading"
                color="primary"
                density="compact"
                label="允许下载媒体文件"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-switch
                v-model="editForm.enable_video_transcoding"
                color="primary"
                density="compact"
                label="允许视频播放转码"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-switch
                v-model="editForm.enable_audio_transcoding"
                color="primary"
                density="compact"
                label="允许音频播放转码"
                hide-details
              />
            </v-col>
          </v-row>

          <v-text-field
            v-model.number="editForm.simultaneous_stream_limit"
            type="number"
            min="0"
            label="最大同时播放流数量限制（0 表示不限制）"
            variant="outlined"
            density="compact"
            hide-details
          />

          <v-divider class="my-1" />
          <div class="text-subtitle-2 font-weight-bold">媒体库访问范围</div>

          <v-switch
            v-model="editForm.enable_all_folders"
            color="success"
            density="compact"
            label="允许访问所有媒体库"
            hide-details
          />

          <v-card v-if="!editForm.enable_all_folders" variant="outlined" class="pa-3">
            <div class="text-caption text-medium-emphasis mb-2">勾选允许访问的媒体库：</div>
            <div v-if="editServerFolders.length === 0" class="text-caption text-medium-emphasis">
              未读取到媒体库文件夹列表
            </div>
            <v-row v-else dense>
              <v-col v-for="folder in editServerFolders" :key="folder.id" cols="6" sm="4">
                <v-checkbox
                  v-model="editForm.enabled_folders"
                  :value="folder.id"
                  :label="folder.name"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-end pa-4">
          <v-btn variant="text" @click="editDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingEdit" @click="submitEditUser">
            保存修改
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 准入策略设置弹窗 -->
    <v-dialog v-model="settingsDialog" max-width="560">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>MoviePilot 登录准入策略设置</span>
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
    <v-dialog v-model="deleteDialog" max-width="480">
      <v-card>
        <v-card-title class="text-error">删除用户：{{ deleteTargetUser?.username }}</v-card-title>
        <v-divider />
        <v-card-text class="d-flex flex-column gap-2 pt-4">
          <div class="text-body-2 mb-1">
            请选择要对用户 <strong>{{ deleteTargetUser?.username }}</strong> 执行的清理范围：
          </div>
          <v-checkbox
            v-if="deleteTargetUser && deleteTargetUser.emby_servers.length > 0"
            v-model="deleteFromEmby"
            color="error"
            density="compact"
            :label="`从 Emby 媒体服务器 (${deleteTargetUser.emby_servers.join('、')}) 彻底删除该账号`"
            hide-details
          />
          <v-checkbox
            v-model="deleteMpUser"
            color="warning"
            density="compact"
            label="移除 MoviePilot 本地账号与个人配置记录"
            hide-details
          />
          <v-checkbox
            v-model="deleteWithSubscribes"
            color="error"
            density="compact"
            :label="`同时清理该用户名下的全部影视订阅 (${deleteTargetUser?.total_sub_count || 0} 条)`"
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
