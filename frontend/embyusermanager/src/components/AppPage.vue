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
const createdCredential = ref<{ username: string; password: string } | null>(null)
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
  createdCredential.value = null
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
      if (res.data?.generated_password && res.data?.password) {
        createdCredential.value = {
          username: res.data.username,
          password: res.data.password,
        }
      } else {
        createDialog.value = false
      }
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
  <div class="emby-user-manager">
    <section class="emby-hero">
      <div class="emby-hero__copy">
        <div class="emby-eyebrow">
          <span class="emby-live-dot" />
          EMBY ACCOUNT CENTER
        </div>
        <div class="emby-hero__title">
          <div class="emby-hero__icon">
            <v-icon icon="mdi-account-group-outline" size="30" />
          </div>
          <div>
            <h2>用户与访问控制</h2>
            <p>集中管理 Emby 账号、媒体库权限与 MoviePilot 订阅准入。</p>
          </div>
        </div>
        <div class="emby-hero__tags">
          <span class="emby-soft-tag">
            <v-icon icon="mdi-server-outline" size="14" />
            {{ servers.length ? servers.map(s => s.name).join('、') : '未连接媒体服务器' }}
          </span>
          <span class="emby-soft-tag" :class="config.enabled ? 'is-success' : 'is-muted'">
            <v-icon :icon="config.enabled ? 'mdi-shield-check-outline' : 'mdi-shield-off-outline'" size="14" />
            {{ config.enabled ? allowModeLabel(config.allow_mode) : '准入拦截已关闭' }}
          </span>
        </div>
      </div>
      <div class="emby-hero__actions">
        <v-btn
          class="emby-primary-action"
          color="primary"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-account-plus-outline"
          :disabled="servers.length === 0"
          @click="openCreateDialog"
        >
          新建账号
        </v-btn>
        <v-btn variant="tonal" rounded="lg" prepend-icon="mdi-shield-tune-outline" @click="openSettingsDialog">
          准入策略
        </v-btn>
        <v-btn
          variant="text"
          rounded="lg"
          icon="mdi-refresh"
          aria-label="刷新用户列表"
          :loading="loading"
          @click="fetchOverview"
        />
      </div>
    </section>

    <section class="emby-metrics" aria-label="用户统计概览">
      <article class="emby-metric emby-metric--primary">
        <div class="emby-metric__icon"><v-icon icon="mdi-account-multiple-outline" /></div>
        <div>
          <div class="emby-metric__label">Emby 账号</div>
          <div class="emby-metric__value">{{ stats.emby_user_count }}</div>
          <div class="emby-metric__hint">{{ servers.length }} 个已连接实例</div>
        </div>
      </article>
      <article class="emby-metric emby-metric--success">
        <div class="emby-metric__icon"><v-icon icon="mdi-shield-check-outline" /></div>
        <div>
          <div class="emby-metric__label">允许登录 MP</div>
          <div class="emby-metric__value">{{ stats.allowed_user_count }}</div>
          <div class="emby-metric__hint">当前准入规则下可登录</div>
        </div>
      </article>
      <article class="emby-metric emby-metric--info">
        <div class="emby-metric__icon"><v-icon icon="mdi-login-variant" /></div>
        <div>
          <div class="emby-metric__label">已登录 MP</div>
          <div class="emby-metric__value">{{ stats.mp_registered_count }}</div>
          <div class="emby-metric__hint">首次 Emby 登录自动建号</div>
        </div>
      </article>
      <article class="emby-metric emby-metric--warning">
        <div class="emby-metric__icon"><v-icon icon="mdi-playlist-star" /></div>
        <div>
          <div class="emby-metric__label">用户订阅</div>
          <div class="emby-metric__value">{{ stats.total_subscribe_count }}</div>
          <div class="emby-metric__hint">电影与剧集订阅合计</div>
        </div>
      </article>
    </section>

    <section class="emby-policy-guide">
      <div class="emby-policy-guide__heading">
        <div class="emby-policy-guide__icon"><v-icon icon="mdi-shield-key-outline" size="22" /></div>
        <div>
          <h3>黑白名单控制「能否登录 MP」</h3>
          <p>不改变 Emby 账号本身的媒体库权限，也不会删除账号或订阅。</p>
        </div>
      </div>
      <div class="emby-policy-guide__modes">
        <div class="emby-policy-mode" :class="{ 'is-active': config.allow_mode === 'all' }">
          <v-icon icon="mdi-account-check-outline" size="18" />
          <div><strong>全部模式</strong><span>不读取名单，未被禁用的用户均可登录。</span></div>
        </div>
        <div class="emby-policy-mode" :class="{ 'is-active': config.allow_mode === 'whitelist' }">
          <v-icon icon="mdi-playlist-check" size="18" />
          <div><strong>白名单模式</strong><span>仅名单内 Emby 用户可登录。</span></div>
        </div>
        <div class="emby-policy-mode" :class="{ 'is-active': config.allow_mode === 'blacklist' }">
          <v-icon icon="mdi-account-cancel-outline" size="18" />
          <div><strong>黑名单模式</strong><span>仅拦截名单内用户，其他用户可登录。</span></div>
        </div>
      </div>
    </section>

    <section class="emby-directory">
      <div class="emby-directory__header">
        <div>
          <div class="emby-section-kicker">USER DIRECTORY</div>
          <div class="emby-directory__title">
            <h3>用户目录</h3>
            <span>{{ filteredUsers.length }} / {{ users.length }}</span>
          </div>
        </div>
        <v-text-field
          v-model="keyword"
          class="emby-user-search"
          prepend-inner-icon="mdi-magnify"
          placeholder="搜索 Emby 用户名"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          rounded="lg"
        />
      </div>
      <div class="emby-filter-row" role="group" aria-label="用户状态筛选">
        <button
          v-for="item in [
            { value: 'all', label: '全部用户', count: users.length },
            { value: 'allowed', label: '允许登录', count: users.filter(u => u.access_status === 'allowed').length },
            { value: 'blocked', label: '准入拦截', count: users.filter(u => u.access_status === 'blocked').length },
            { value: 'disabled', label: '已禁用', count: users.filter(u => u.access_status === 'disabled').length },
            { value: 'registered', label: '已登录 MP', count: stats.mp_registered_count },
          ]"
          :key="item.value"
          type="button"
          class="emby-filter-chip"
          :class="{ 'is-active': statusFilter === item.value }"
          @click="statusFilter = item.value as 'all' | 'allowed' | 'blocked' | 'disabled' | 'registered'"
        >
          {{ item.label }}<span>{{ item.count }}</span>
        </button>
      </div>
    </section>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" rounded />

    <div v-if="!loading && filteredUsers.length === 0" class="emby-empty-state">
      <div class="emby-empty-state__icon"><v-icon icon="mdi-account-search-outline" size="34" /></div>
      <h3>{{ keyword || statusFilter !== 'all' ? '没有匹配的用户' : '还没有 Emby 用户' }}</h3>
      <p>{{ keyword || statusFilter !== 'all' ? '尝试更换搜索词或筛选条件。' : '创建第一个账号，开始配置登录准入与媒体库权限。' }}</p>
      <v-btn
        v-if="!keyword && statusFilter === 'all'"
        color="primary"
        variant="tonal"
        rounded="lg"
        prepend-icon="mdi-account-plus-outline"
        :disabled="servers.length === 0"
        @click="openCreateDialog"
      >
        新建 Emby 账号
      </v-btn>
      <v-btn v-else variant="text" rounded="lg" @click="keyword = ''; statusFilter = 'all'">清除筛选</v-btn>
    </div>

    <div v-else class="emby-user-grid">
      <article
        v-for="user in filteredUsers"
        :key="user.username"
        class="emby-user-card"
        :class="`emby-user-card--${user.access_status}`"
      >
        <div class="emby-user-card__top">
          <div class="emby-user-identity">
            <v-avatar class="emby-user-avatar" color="primary" variant="tonal" size="44">
              <span>{{ user.username.slice(0, 1).toUpperCase() }}</span>
            </v-avatar>
            <div class="emby-user-identity__text">
              <div class="emby-user-name-row">
                <h4>{{ user.username }}</h4>
                <v-icon v-if="user.emby_is_admin" icon="mdi-crown-outline" color="warning" size="16" title="Emby 管理员" />
              </div>
              <div class="emby-user-server">
                <v-icon icon="mdi-server-outline" size="13" />
                {{ user.emby_servers.length ? user.emby_servers.join('、') : '仅本地记录' }}
              </div>
            </div>
          </div>
          <span class="emby-status-pill" :class="`is-${user.access_status}`">
            <span />{{ statusLabel(user.access_status) }}
          </span>
        </div>

        <div class="emby-user-badges">
          <span v-if="user.emby_is_admin" class="emby-mini-badge is-warning">Emby 管理员</span>
          <span v-if="user.emby_is_disabled" class="emby-mini-badge is-error">Emby 已停用</span>
          <span v-if="user.registered_in_mp" class="emby-mini-badge is-info">已登录 MP</span>
          <span v-if="user.in_whitelist" class="emby-mini-badge is-success">白名单</span>
          <span v-if="user.in_blacklist" class="emby-mini-badge is-error">黑名单</span>
          <span v-if="!user.emby_is_admin && !user.emby_is_disabled && !user.registered_in_mp && !user.in_whitelist && !user.in_blacklist" class="emby-mini-badge">普通账号</span>
        </div>

        <div class="emby-user-facts">
          <div><v-icon icon="mdi-folder-play-outline" size="15" /><span>{{ folderSummaryText(user) }}</span></div>
          <div><v-icon :icon="user.has_password ? 'mdi-lock-check-outline' : 'mdi-lock-open-variant-outline'" size="15" /><span>{{ user.has_password ? '已设置密码' : '未设置密码' }}</span></div>
          <div class="emby-user-facts__wide"><v-icon icon="mdi-clock-outline" size="15" /><span>最近活跃 {{ formatDateText(user.last_activity_date || user.last_login_date) }}</span></div>
        </div>

        <button type="button" class="emby-subscribe-summary" @click="openUserSubscribes(user)">
          <span><v-icon icon="mdi-movie-open-outline" size="16" />电影 <strong>{{ user.movie_sub_count }}</strong></span>
          <span><v-icon icon="mdi-television" size="16" />剧集 <strong>{{ user.tv_sub_count }}</strong></span>
          <v-icon icon="mdi-chevron-right" size="18" />
        </button>

        <div class="emby-user-card__actions">
          <v-btn
            v-if="user.emby_servers.length > 0"
            size="small"
            color="primary"
            variant="tonal"
            rounded="lg"
            prepend-icon="mdi-account-edit-outline"
            @click="openEditDialog(user)"
          >
            编辑
          </v-btn>
          <v-btn
            size="small"
            :color="user.is_active ? 'warning' : 'success'"
            variant="tonal"
            rounded="lg"
            :prepend-icon="user.is_active ? 'mdi-account-cancel-outline' : 'mdi-account-check-outline'"
            @click="toggleUserActive(user)"
          >
            {{ user.is_active ? '禁登 MP' : '允许 MP' }}
          </v-btn>
          <v-spacer />
          <v-menu location="bottom end" close-on-content-click>
            <template #activator="{ props: menuProps }">
              <v-btn v-bind="menuProps" icon="mdi-dots-horizontal" variant="text" size="small" aria-label="更多用户操作" />
            </template>
            <v-list density="compact" class="emby-user-menu" rounded="lg">
              <v-list-item prepend-icon="mdi-playlist-check" @click="updateAccessList(user, 'whitelist', user.in_whitelist ? 'remove' : 'add')">
                <v-list-item-title>{{ user.in_whitelist ? '移出白名单' : '加入白名单' }}</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-account-cancel-outline" @click="updateAccessList(user, 'blacklist', user.in_blacklist ? 'remove' : 'add')">
                <v-list-item-title>{{ user.in_blacklist ? '移出黑名单' : '加入黑名单' }}</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-format-list-bulleted" @click="openUserSubscribes(user)">
                <v-list-item-title>查看订阅明细</v-list-item-title>
              </v-list-item>
              <v-divider class="my-1" />
              <v-list-item class="text-error" prepend-icon="mdi-delete-outline" @click="openDeleteUserDialog(user)">
                <v-list-item-title>删除账号或清理订阅</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </article>
    </div>

    <!-- 新建 Emby 账号弹窗 -->
    <v-dialog v-model="createDialog" max-width="620" scrollable>
      <v-card class="emby-dialog">
        <v-card-title class="emby-dialog__title d-flex align-center justify-space-between">
          <span>新建 Emby 媒体服务器账号</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="createDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text v-if="!createdCredential" class="emby-dialog__content d-flex flex-column gap-3 pt-4">
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
                label="初始密码（留空则随机生成）"
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
        <v-card-text v-else class="pt-4">
          <v-alert type="success" variant="tonal" icon="mdi-key-check-outline">
            <template #title>账号 {{ createdCredential.username }} 创建成功</template>
            <div class="mb-3">初始密码已随机生成，请立即复制并妥善保管：</div>
            <v-text-field
              :model-value="createdCredential.password"
              label="随机生成的初始密码"
              readonly
              variant="outlined"
              density="compact"
              append-inner-icon="mdi-content-copy"
              @click:append-inner="navigator.clipboard?.writeText(createdCredential?.password || '')"
            />
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-end pa-4">
          <template v-if="!createdCredential">
            <v-btn variant="text" @click="createDialog = false">取消</v-btn>
            <v-btn color="primary" variant="flat" :loading="creatingUser" @click="submitCreateUser">
              创建账号
            </v-btn>
          </template>
          <v-btn v-else color="primary" variant="flat" @click="createDialog = false">完成</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 编辑 Emby 账号弹窗 -->
    <v-dialog v-model="editDialog" max-width="640" scrollable>
      <v-card class="emby-dialog">
        <v-card-title class="emby-dialog__title d-flex align-center justify-space-between">
          <span>编辑 Emby 账号：{{ editForm.username }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="editDialog = false" />
        </v-card-title>
        <v-divider />
        <v-progress-linear v-if="editLoading" indeterminate color="primary" />
        <v-card-text class="emby-dialog__content d-flex flex-column gap-3 pt-4">
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

          <v-text-field
            v-model="editForm.new_username"
            label="Emby 用户名"
            variant="outlined"
            density="compact"
            hint="修改用户名会自动同步迁移本地订阅归属"
            persistent-hint
          />

          <section class="emby-password-panel" :class="{ 'is-editing': editForm.change_password }">
            <div class="emby-password-panel__header">
              <div class="emby-password-panel__intro">
                <div class="emby-password-panel__icon">
                  <v-icon icon="mdi-key-outline" size="19" />
                </div>
                <div>
                  <strong>登录密码</strong>
                  <span>仅在需要修改或清空密码时开启</span>
                </div>
              </div>
              <v-switch
                v-model="editForm.change_password"
                class="emby-password-panel__switch"
                color="warning"
                density="compact"
                label="修改密码"
                hide-details
              />
            </div>
            <div v-if="editForm.change_password" class="emby-password-panel__form">
              <v-text-field
                v-model="editForm.new_password"
                :type="showEditPassword ? 'text' : 'password'"
                label="新密码"
                placeholder="输入新密码"
                variant="outlined"
                density="compact"
                hint="留空将清除现有密码，并允许该账号免密登录"
                persistent-hint
                :append-inner-icon="showEditPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                @click:append-inner="showEditPassword = !showEditPassword"
              />
            </div>
            <div v-else class="emby-password-panel__status">
              <v-icon icon="mdi-lock-check-outline" size="15" />
              当前密码保持不变
            </div>
          </section>

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
      <v-card class="emby-dialog">
        <v-card-title class="emby-dialog__title d-flex align-center justify-space-between">
          <span>MoviePilot 登录准入策略设置</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="settingsDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="emby-dialog__content d-flex flex-column gap-3">
          <div class="emby-dialog-note">
            <v-icon icon="mdi-information-outline" size="18" />
            <div>
              <strong>名单仅控制 MoviePilot 登录，不影响 Emby 媒体库权限。</strong>
              <span>全部模式不读取名单；白名单仅放行；黑名单仅拦截。禁用插件后不再执行名单准入。</span>
            </div>
          </div>
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
      <v-card class="emby-dialog">
        <v-card-title class="emby-dialog__title d-flex align-center justify-space-between">
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
      <v-card class="emby-dialog">
        <v-card-title class="text-error">删除用户：{{ deleteTargetUser?.username }}</v-card-title>
        <v-divider />
        <v-card-text class="emby-dialog__content d-flex flex-column gap-2 pt-4">
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

<style scoped>
.emby-user-manager {
  width: 100%;
  max-width: 1480px;
  margin: 0 auto;
  padding: 24px;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

.emby-hero {
  position: relative;
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px solid rgba(var(--v-theme-primary), 0.14);
  border-radius: 24px;
  background:
    radial-gradient(circle at 90% 10%, rgba(var(--v-theme-info), 0.14), transparent 36%),
    linear-gradient(135deg, rgba(var(--v-theme-primary), 0.12), rgba(var(--v-theme-surface), 0.94) 62%);
}

.emby-hero::after {
  position: absolute;
  width: 180px;
  height: 180px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  border-radius: 50%;
  content: '';
  inset-block-start: -92px;
  inset-inline-end: 18%;
  pointer-events: none;
}

.emby-hero__copy,
.emby-hero__actions {
  position: relative;
  z-index: 1;
}

.emby-eyebrow,
.emby-section-kicker {
  display: flex;
  align-items: center;
  color: rgba(var(--v-theme-primary), 0.88);
  font-size: 11px;
  font-weight: 700;
  gap: 7px;
  letter-spacing: 0.14em;
}

.emby-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgb(var(--v-theme-success));
  box-shadow: 0 0 0 4px rgba(var(--v-theme-success), 0.12);
}

.emby-hero__title {
  display: flex;
  align-items: center;
  margin-block-start: 14px;
  gap: 14px;
}

.emby-hero__icon {
  display: grid;
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  border-radius: 16px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  place-items: center;
}

.emby-hero h2 {
  margin: 0;
  font-size: clamp(24px, 3vw, 30px);
  font-weight: 750;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.emby-hero__title p {
  margin: 5px 0 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 13px;
}

.emby-hero__tags {
  display: flex;
  flex-wrap: wrap;
  margin-block-start: 18px;
  gap: 8px;
}

.emby-soft-tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 999px;
  background: rgba(var(--v-theme-surface), 0.58);
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 11px;
  gap: 5px;
}

.emby-soft-tag.is-success {
  border-color: rgba(var(--v-theme-success), 0.18);
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
}

.emby-hero__actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.emby-primary-action {
  box-shadow: 0 8px 22px rgba(var(--v-theme-primary), 0.2);
}

.emby-metrics {
  display: grid;
  margin-block: 18px;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.emby-metric {
  display: flex;
  min-width: 0;
  align-items: center;
  padding: 18px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 18px;
  background: rgba(var(--v-theme-surface), 0.82);
  gap: 14px;
  transition: border-color 160ms ease, transform 160ms ease;
}

.emby-metric:hover {
  border-color: rgba(var(--v-theme-primary), 0.2);
  transform: translateY(-1px);
}

.emby-metric__icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border-radius: 13px;
  place-items: center;
}

.emby-metric--primary .emby-metric__icon { background: rgba(var(--v-theme-primary), 0.12); color: rgb(var(--v-theme-primary)); }
.emby-metric--success .emby-metric__icon { background: rgba(var(--v-theme-success), 0.12); color: rgb(var(--v-theme-success)); }
.emby-metric--info .emby-metric__icon { background: rgba(var(--v-theme-info), 0.12); color: rgb(var(--v-theme-info)); }
.emby-metric--warning .emby-metric__icon { background: rgba(var(--v-theme-warning), 0.12); color: rgb(var(--v-theme-warning)); }

.emby-metric__label {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 12px;
}

.emby-metric__value {
  margin-block: 1px;
  font-size: 26px;
  font-weight: 750;
  line-height: 1.2;
}

.emby-metric__hint {
  overflow: hidden;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.emby-policy-guide {
  display: grid;
  align-items: center;
  padding: 18px 20px;
  border: 1px solid rgba(var(--v-theme-info), 0.12);
  border-radius: 18px;
  background: linear-gradient(110deg, rgba(var(--v-theme-info), 0.07), rgba(var(--v-theme-surface), 0.78));
  gap: 18px;
  grid-template-columns: minmax(240px, 0.8fr) minmax(0, 1.5fr);
}

.emby-policy-guide__heading {
  display: flex;
  align-items: flex-start;
  gap: 11px;
}

.emby-policy-guide__icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 12px;
  background: rgba(var(--v-theme-info), 0.12);
  color: rgb(var(--v-theme-info));
  place-items: center;
}

.emby-policy-guide h3,
.emby-directory h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.emby-policy-guide__heading p {
  margin: 4px 0 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 11px;
  line-height: 1.55;
}

.emby-policy-guide__modes {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.emby-policy-mode {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 12px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  gap: 7px;
}

.emby-policy-mode.is-active {
  border-color: rgba(var(--v-theme-primary), 0.16);
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
}

.emby-policy-mode strong,
.emby-policy-mode span {
  display: block;
}

.emby-policy-mode strong {
  margin-block-end: 2px;
  font-size: 11px;
}

.emby-policy-mode span {
  font-size: 10px;
  line-height: 1.45;
}

.emby-directory {
  padding: 24px 2px 14px;
}

.emby-directory__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.emby-section-kicker {
  margin-block-end: 5px;
  font-size: 9px;
}

.emby-directory__title {
  display: flex;
  align-items: baseline;
  gap: 9px;
}

.emby-directory__title h3 {
  font-size: 19px;
}

.emby-directory__title span {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 11px;
}

.emby-user-search {
  width: 280px;
  max-width: 100%;
  flex: 0 0 auto;
}

.emby-filter-row {
  display: flex;
  overflow-x: auto;
  margin-block-start: 14px;
  padding-block-end: 2px;
  gap: 7px;
  scrollbar-width: none;
}

.emby-filter-row::-webkit-scrollbar { display: none; }

.emby-filter-chip {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  padding: 7px 11px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 999px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  gap: 7px;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}

.emby-filter-chip span {
  display: grid;
  min-width: 18px;
  height: 18px;
  padding-inline: 4px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  font-size: 10px;
  place-items: center;
}

.emby-filter-chip:hover,
.emby-filter-chip.is-active {
  border-color: rgba(var(--v-theme-primary), 0.2);
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.emby-filter-chip.is-active span { background: rgba(var(--v-theme-primary), 0.14); }

.emby-user-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.emby-user-card {
  position: relative;
  display: flex;
  overflow: hidden;
  min-width: 0;
  flex-direction: column;
  padding: 18px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.075);
  border-radius: 20px;
  background: rgba(var(--v-theme-surface), 0.88);
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.emby-user-card::before {
  position: absolute;
  height: 3px;
  background: rgb(var(--v-theme-primary));
  content: '';
  inset: 0 0 auto;
  opacity: 0.7;
}

.emby-user-card--blocked::before { background: rgb(var(--v-theme-warning)); }
.emby-user-card--disabled::before { background: rgb(var(--v-theme-error)); }

.emby-user-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.2);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.emby-user-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.emby-user-identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
}

.emby-user-avatar {
  flex: 0 0 auto;
  border: 1px solid rgba(var(--v-theme-primary), 0.14);
  font-size: 17px;
  font-weight: 750;
}

.emby-user-identity__text { min-width: 0; }

.emby-user-name-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
}

.emby-user-name-row h4 {
  overflow: hidden;
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.emby-user-server {
  display: flex;
  overflow: hidden;
  align-items: center;
  margin-block-start: 4px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 10px;
  gap: 4px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.emby-status-pill {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  gap: 5px;
}

.emby-status-pill > span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.emby-status-pill.is-allowed { background: rgba(var(--v-theme-success), 0.1); color: rgb(var(--v-theme-success)); }
.emby-status-pill.is-blocked { background: rgba(var(--v-theme-warning), 0.12); color: rgb(var(--v-theme-warning)); }
.emby-status-pill.is-disabled { background: rgba(var(--v-theme-error), 0.1); color: rgb(var(--v-theme-error)); }

.emby-user-badges {
  display: flex;
  min-height: 22px;
  flex-wrap: wrap;
  margin-block: 12px 10px;
  gap: 5px;
}

.emby-mini-badge {
  padding: 3px 7px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.055);
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 9px;
  font-weight: 600;
}

.emby-mini-badge.is-warning { background: rgba(var(--v-theme-warning), 0.1); color: rgb(var(--v-theme-warning)); }
.emby-mini-badge.is-error { background: rgba(var(--v-theme-error), 0.09); color: rgb(var(--v-theme-error)); }
.emby-mini-badge.is-info { background: rgba(var(--v-theme-info), 0.1); color: rgb(var(--v-theme-info)); }
.emby-mini-badge.is-success { background: rgba(var(--v-theme-success), 0.1); color: rgb(var(--v-theme-success)); }

.emby-user-facts {
  display: grid;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 10px;
  gap: 8px 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.emby-user-facts > div {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
}

.emby-user-facts > div > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.emby-user-facts__wide { grid-column: 1 / -1; }

.emby-subscribe-summary {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  margin-block: 15px 12px;
  padding: 10px 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  gap: 10px;
  text-align: start;
  transition: background 140ms ease, border-color 140ms ease;
}

.emby-subscribe-summary:hover {
  border-color: rgba(var(--v-theme-primary), 0.14);
  background: rgba(var(--v-theme-primary), 0.06);
}

.emby-subscribe-summary > span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.emby-subscribe-summary strong {
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-size: 13px;
}

.emby-user-card__actions {
  display: flex;
  align-items: center;
  margin-block-start: auto;
  padding-block-start: 12px;
  border-block-start: 1px solid rgba(var(--v-theme-on-surface), 0.055);
  gap: 6px;
}

.emby-empty-state {
  display: flex;
  min-height: 300px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 36px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 20px;
  text-align: center;
}

.emby-empty-state__icon {
  display: grid;
  width: 64px;
  height: 64px;
  margin-block-end: 14px;
  border-radius: 20px;
  background: rgba(var(--v-theme-primary), 0.09);
  color: rgb(var(--v-theme-primary));
  place-items: center;
}

.emby-empty-state h3 { margin: 0; font-size: 17px; }
.emby-empty-state p { margin: 7px 0 18px; color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity)); font-size: 12px; }

.emby-dialog {
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 22px !important;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.2) !important;
}

.emby-dialog__title {
  min-height: 64px;
  padding: 18px 22px !important;
  font-size: 17px !important;
  font-weight: 700;
}

.emby-dialog__content {
  padding: 20px 22px !important;
}

.emby-password-panel {
  padding: 14px 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  transition: border-color 150ms ease, background 150ms ease;
}

.emby-password-panel.is-editing {
  border-color: rgba(var(--v-theme-warning), 0.22);
  background: rgba(var(--v-theme-warning), 0.045);
}

.emby-password-panel__header {
  display: flex;
  min-height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.emby-password-panel__intro {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.emby-password-panel__icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border-radius: 10px;
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
  place-items: center;
}

.emby-password-panel__intro strong,
.emby-password-panel__intro span {
  display: block;
}

.emby-password-panel__intro strong {
  font-size: 13px;
  font-weight: 650;
}

.emby-password-panel__intro span {
  margin-block-start: 2px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 10px;
}

.emby-password-panel__switch {
  flex: 0 0 auto;
}

.emby-password-panel__form {
  margin-block-start: 14px;
  padding-block-start: 14px;
  border-block-start: 1px solid rgba(var(--v-theme-warning), 0.1);
}

.emby-password-panel__form :deep(.v-messages) {
  min-height: 18px;
  font-size: 10px;
  line-height: 1.5;
}

.emby-password-panel__status {
  display: flex;
  align-items: center;
  margin-block-start: 4px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 10px;
  gap: 5px;
}

.emby-dialog-note {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid rgba(var(--v-theme-info), 0.12);
  border-radius: 12px;
  background: rgba(var(--v-theme-info), 0.07);
  color: rgb(var(--v-theme-info));
  gap: 8px;
}

.emby-dialog-note strong,
.emby-dialog-note span {
  display: block;
  font-size: 11px;
  line-height: 1.55;
}

.emby-dialog-note span {
  margin-block-start: 3px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.emby-user-menu { min-width: 190px; }

@media (max-width: 1180px) {
  .emby-user-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .emby-policy-guide { grid-template-columns: 1fr; }
}

@media (max-width: 900px) {
  .emby-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .emby-hero { align-items: flex-start; flex-direction: column; }
  .emby-hero__actions { justify-content: flex-start; }
}

@media (max-width: 640px) {
  .emby-user-manager { padding: 12px; }
  .emby-hero { padding: 20px; border-radius: 20px; }
  .emby-hero__title { align-items: flex-start; }
  .emby-hero__icon { width: 44px; height: 44px; border-radius: 13px; }
  .emby-hero__title p { font-size: 11px; line-height: 1.5; }
  .emby-hero__actions { width: 100%; }
  .emby-hero__actions .v-btn:not(.v-btn--icon) { flex: 1 1 auto; }
  .emby-metric { padding: 13px; gap: 10px; }
  .emby-metric__icon { width: 34px; height: 34px; border-radius: 10px; }
  .emby-metric__value { font-size: 22px; }
  .emby-metric__hint { display: none; }
  .emby-policy-guide { padding: 15px; }
  .emby-policy-guide__modes { grid-template-columns: 1fr; }
  .emby-policy-mode { padding: 8px; }
  .emby-directory__header { align-items: stretch; flex-direction: column; }
  .emby-user-search { width: 100%; }
  .emby-user-grid { grid-template-columns: 1fr; }
  .emby-user-card { padding: 16px; }
  .emby-user-card__top { gap: 7px; }
  .emby-status-pill { padding: 4px 6px; font-size: 9px; }
  .emby-dialog__title { padding: 16px !important; }
  .emby-dialog__content { padding: 16px !important; }
  .emby-password-panel { padding: 12px; }
  .emby-password-panel__header { align-items: flex-start; flex-wrap: wrap; gap: 8px; }
  .emby-password-panel__switch { margin-inline-start: 44px; }
}
</style>
