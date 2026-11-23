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
  subscribe_approval_enabled: boolean
  approval_bypass_users: string[]
  approval_notify_telegram: boolean
  approval_tg_chat_id: string
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
  pending_sub_count?: number
  in_whitelist: boolean
  in_blacklist: boolean
  in_approval_bypass?: boolean
  access_status: 'allowed' | 'blocked' | 'disabled'
  access_reason: string
}

interface ApprovalRequestItem {
  id: string
  status: 'pending' | 'approved' | 'manual' | 'rejected'
  username: string
  title: string
  year?: string
  type: string
  season?: number | null
  vote?: number | null
  overview?: string
  poster?: string
  backdrop?: string
  created_at?: string
  handled_at?: string | null
  handled_by?: string | null
  subscribe_id?: number | null
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
const activeTab = ref<'users' | 'approvals'>('users')
const keyword = ref('')
const statusFilter = ref<'all' | 'allowed' | 'blocked' | 'disabled' | 'registered'>('all')
const approvalFilter = ref<'pending' | 'approved' | 'manual' | 'rejected' | 'all'>('pending')
const actingApprovalIds = ref<Record<string, boolean>>({})
const batchApproving = ref(false)
const clearingHistory = ref(false)

const config = ref<PluginConfig>({
  enabled: true,
  allow_mode: 'all',
  whitelist: [],
  blacklist: [],
  allowed_servers: [],
  allow_emby_admin: true,
  subscribe_approval_enabled: false,
  approval_bypass_users: [],
  approval_notify_telegram: true,
  approval_tg_chat_id: '',
})
const servers = ref<EmbyServerSummary[]>([])
const stats = ref({
  emby_user_count: 0,
  mp_registered_count: 0,
  allowed_user_count: 0,
  total_subscribe_count: 0,
  pending_approval_count: 0,
})
const users = ref<UserOverviewItem[]>([])
const approvals = ref<ApprovalRequestItem[]>([])

// 准入策略弹窗状态
const settingsDialog = ref(false)
const whitelistInput = ref('')
const blacklistInput = ref('')
const approvalBypassInput = ref('')

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
  add_to_approval_bypass: false,
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

const filterPills = computed(() => [
  { value: 'all' as const, label: '全部', count: users.value.length },
  { value: 'allowed' as const, label: '可登录', count: users.value.filter(u => u.access_status === 'allowed').length },
  {
    value: 'blocked' as const,
    label: '准入拦截',
    count: users.value.filter(u => u.access_status === 'blocked').length,
  },
  { value: 'disabled' as const, label: '已禁用', count: users.value.filter(u => u.access_status === 'disabled').length },
  { value: 'registered' as const, label: '已登录 MP', count: stats.value.mp_registered_count },
])

const pendingApprovalCount = computed(() => approvals.value.filter(item => item.status === 'pending').length)
const handledApprovalCount = computed(() => approvals.value.filter(item => item.status !== 'pending').length)

const approvalPills = computed(() => [
  { value: 'pending' as const, label: '待审批', count: pendingApprovalCount.value },
  {
    value: 'approved' as const,
    label: '已通过',
    count: approvals.value.filter(i => i.status === 'approved').length,
  },
  {
    value: 'manual' as const,
    label: '手动入库',
    count: approvals.value.filter(i => i.status === 'manual').length,
  },
  {
    value: 'rejected' as const,
    label: '已拒绝',
    count: approvals.value.filter(i => i.status === 'rejected').length,
  },
  { value: 'all' as const, label: '全部', count: approvals.value.length },
])

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
        subscribe_approval_enabled: Boolean(res.data.config?.subscribe_approval_enabled ?? false),
        approval_bypass_users: res.data.config?.approval_bypass_users || [],
        approval_notify_telegram: Boolean(res.data.config?.approval_notify_telegram ?? true),
        approval_tg_chat_id: String(res.data.config?.approval_tg_chat_id ?? ''),
      }
      whitelistInput.value = config.value.whitelist.join(', ')
      blacklistInput.value = config.value.blacklist.join(', ')
      approvalBypassInput.value = config.value.approval_bypass_users.join(', ')
      servers.value = res.data.servers || []
      stats.value = {
        ...stats.value,
        ...(res.data.stats || {}),
      }
      users.value = res.data.users || []
      approvals.value = Array.isArray(res.data.approvals) ? res.data.approvals : []
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

const filteredApprovals = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return approvals.value.filter(item => {
    if (approvalFilter.value !== 'all' && item.status !== approvalFilter.value) return false
    if (kw) {
      const hay = `${item.title || ''} ${item.username || ''} ${item.year || ''}`.toLowerCase()
      if (!hay.includes(kw)) return false
    }
    return true
  })
})

function approvalStatusLabel(status: ApprovalRequestItem['status']) {
  if (status === 'approved') return '已通过并提交 MP'
  if (status === 'manual') return '已标记手动入库'
  if (status === 'rejected') return '已拒绝'
  return '待审批'
}

function jumpToUserApprovals(username: string) {
  activeTab.value = 'approvals'
  approvalFilter.value = 'pending'
  keyword.value = username
}

function statusLabel(status: UserOverviewItem['access_status']) {
  if (status === 'allowed') return '允许登录'
  if (status === 'blocked') return '准入拦截'
  return '已禁用'
}

function allowModeLabel(mode: PluginConfig['allow_mode']) {
  if (mode === 'whitelist') return `白名单 (${config.value.whitelist.length})`
  if (mode === 'blacklist') return `黑名单 (${config.value.blacklist.length})`
  return '全部允许'
}

function formatCompactTime(value: string | null) {
  if (!value) return '暂无活跃'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec >= 0 && diffSec < 60) return '刚刚'
  if (diffSec >= 60 && diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`
  if (diffSec >= 3600 && diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`
  if (diffSec >= 86400 && diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} 天前`
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function primaryServerAccount(user: UserOverviewItem): EmbyServerAccount | null {
  const map = user.server_accounts || {}
  const firstServer = user.emby_servers[0]
  if (firstServer && map[firstServer]) return map[firstServer]
  const keys = Object.keys(map)
  return keys.length ? map[keys[0]] : null
}

function userMetaSummary(user: UserOverviewItem): string {
  const serverPart = user.emby_servers.length ? user.emby_servers.join('、') : '仅本地记录'
  const acc = primaryServerAccount(user)
  if (!acc) return serverPart
  const folderPart = acc.enable_all_folders ? '全部媒体库' : `${acc.enabled_folders?.length || 0} 个媒体库`
  const pwdPart = user.has_password === false ? ' · 免密' : ''
  return `${serverPart} · ${folderPart}${pwdPart}`
}

function copyPasswordText(pwd?: string) {
  if (!pwd) return
  navigator.clipboard?.writeText(pwd)
  notifySuccess('密码已复制到剪贴板')
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
  createForm.add_to_approval_bypass = false
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
      add_to_approval_bypass: createForm.add_to_approval_bypass,
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
  listType: 'whitelist' | 'blacklist' | 'approval_bypass',
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

async function handleApprovalAction(
  item: ApprovalRequestItem,
  action: 'approve' | 'manual' | 'reject' | 'delete',
) {
  if (!props.api?.post || actingApprovalIds.value[item.id]) return
  actingApprovalIds.value[item.id] = true
  try {
    const res = await props.api.post(`plugin/${resolvedPluginId.value}/approval/action`, {
      request_id: item.id,
      action,
    })
    if (res?.success) {
      notifySuccess(res.message || '操作已完成')
      if (Array.isArray(res.data?.approvals)) {
        approvals.value = res.data.approvals
      }
      await fetchOverview()
    } else {
      notifyError(res?.message || '处理审批失败')
    }
  } catch (err) {
    console.error(err)
    notifyError('处理审批请求失败')
  } finally {
    delete actingApprovalIds.value[item.id]
  }
}

async function approveAllFiltered() {
  const pendingIds = filteredApprovals.value.filter(i => i.status === 'pending').map(i => i.id)
  if (!pendingIds.length || !props.api?.post) return
  batchApproving.value = true
  try {
    const res = await props.api.post(`plugin/${resolvedPluginId.value}/approval/action`, {
      request_ids: pendingIds,
      action: 'approve',
    })
    if (res?.success) {
      notifySuccess(res.message || '批量通过已完成')
      await fetchOverview()
    } else {
      notifyError(res?.message || '批量通过失败')
    }
  } catch (err) {
    console.error(err)
    notifyError('批量通过请求失败')
  } finally {
    batchApproving.value = false
  }
}

async function clearApprovalHistory() {
  if (!props.api?.post) return
  clearingHistory.value = true
  try {
    const res = await props.api.post(`plugin/${resolvedPluginId.value}/approval/clear`, {})
    if (res?.success) {
      notifySuccess(res.message || '已清理历史审批记录')
      if (Array.isArray(res.data?.approvals)) {
        approvals.value = res.data.approvals
      }
    } else {
      notifyError(res?.message || '清理历史记录失败')
    }
  } catch (err) {
    console.error(err)
    notifyError('清理历史记录请求失败')
  } finally {
    clearingHistory.value = false
  }
}

function openSettingsDialog() {
  whitelistInput.value = config.value.whitelist.join(', ')
  blacklistInput.value = config.value.blacklist.join(', ')
  approvalBypassInput.value = config.value.approval_bypass_users.join(', ')
  settingsDialog.value = true
}

async function savePolicyConfig() {
  if (!props.api?.post) return
  savingConfig.value = true
  try {
    const payload: PluginConfig = {
      ...config.value,
      approval_tg_chat_id: (config.value.approval_tg_chat_id || '').trim(),
      whitelist: parseListText(whitelistInput.value),
      blacklist: parseListText(blacklistInput.value),
      approval_bypass_users: parseListText(approvalBypassInput.value),
    }
    const res = await props.api.post(`plugin/${resolvedPluginId.value}/config`, payload)
    if (res?.success) {
      notifySuccess('准入与订阅审批策略已保存')
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
  <div class="emby-page">
    <!-- 1. 精炼顶部标题与操作栏 -->
    <header class="emby-topbar">
      <div class="emby-topbar__left">
        <div class="emby-topbar__icon">
          <v-icon icon="mdi-account-group-outline" size="22" />
        </div>
        <div class="emby-topbar__heading">
          <div class="emby-topbar__title-row">
            <h2>Emby 用户管理</h2>
            <span class="emby-tag">
              <v-icon icon="mdi-server-outline" size="13" />
              {{ servers.length ? servers.map(s => s.name).join('、') : '未连接服务器' }}
            </span>
            <button
              type="button"
              class="emby-tag emby-tag--clickable"
              :class="config.enabled ? 'is-active' : 'is-muted'"
              @click="openSettingsDialog"
            >
              <v-icon :icon="config.enabled ? 'mdi-shield-check-outline' : 'mdi-shield-off-outline'" size="13" />
              {{ config.enabled ? `准入：${allowModeLabel(config.allow_mode)}` : '准入已关闭' }}
            </button>
            <button
              type="button"
              class="emby-tag emby-tag--clickable"
              :class="
                pendingApprovalCount > 0
                  ? 'is-warning'
                  : config.subscribe_approval_enabled
                    ? 'is-active'
                    : 'is-muted'
              "
              @click="config.subscribe_approval_enabled || approvals.length ? (activeTab = 'approvals') : openSettingsDialog()"
            >
              <v-icon
                :icon="config.subscribe_approval_enabled ? 'mdi-bell-check' : 'mdi-bell-sleep-outline'"
                size="13"
              />
              {{
                config.subscribe_approval_enabled
                  ? pendingApprovalCount > 0
                    ? `订阅审批 · 待审 ${pendingApprovalCount}`
                    : '订阅审批已开启'
                  : '订阅审批已关闭'
              }}
            </button>
          </div>
        </div>
      </div>

      <div class="emby-topbar__actions">
        <v-btn
          icon="mdi-refresh"
          variant="text"
          size="small"
          rounded="lg"
          aria-label="刷新列表"
          :loading="loading"
          @click="fetchOverview"
        />
        <v-btn
          size="small"
          variant="outlined"
          rounded="lg"
          prepend-icon="mdi-shield-lock-outline"
          @click="openSettingsDialog"
        >
          准入与审批策略
        </v-btn>
        <v-btn
          size="small"
          color="primary"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-account-plus-outline"
          :disabled="servers.length === 0"
          @click="openCreateDialog"
        >
          新建账号
        </v-btn>
      </div>
    </header>

    <!-- 2. 一体化视图切换、统计筛选与搜索工具条 -->
    <section class="emby-toolbar">
      <div class="emby-toolbar__left">
        <div class="emby-pills emby-pills--mode" role="tablist" aria-label="功能视图切换">
          <button
            type="button"
            class="emby-pill"
            :class="{ 'is-active': activeTab === 'users' }"
            @click="activeTab = 'users'"
          >
            <v-icon icon="mdi-account-multiple-outline" size="14" />
            <span>用户列表</span>
            <strong>{{ users.length }}</strong>
          </button>
          <button
            type="button"
            class="emby-pill"
            :class="{ 'is-active': activeTab === 'approvals' }"
            @click="activeTab = 'approvals'"
          >
            <v-icon icon="mdi-clipboard-list-outline" size="14" />
            <span>订阅审批</span>
            <strong :class="{ 'is-alert': pendingApprovalCount > 0 }">
              {{ pendingApprovalCount > 0 ? pendingApprovalCount : approvals.length }}
            </strong>
          </button>
        </div>

        <template v-if="activeTab === 'users'">
          <div class="emby-pills" role="group" aria-label="用户状态筛选">
            <button
              v-for="item in filterPills"
              :key="item.value"
              type="button"
              class="emby-pill"
              :class="{ 'is-active': statusFilter === item.value }"
              @click="statusFilter = item.value"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}</strong>
            </button>
          </div>

          <span class="emby-sub-counter" title="全员电影与剧集订阅总数">
            <v-icon icon="mdi-playlist-star" size="14" />
            订阅 {{ stats.total_subscribe_count }}
          </span>
        </template>

        <template v-else>
          <div class="emby-pills" role="group" aria-label="审批状态筛选">
            <button
              v-for="item in approvalPills"
              :key="item.value"
              type="button"
              class="emby-pill"
              :class="{ 'is-active': approvalFilter === item.value }"
              @click="approvalFilter = item.value"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}</strong>
            </button>
          </div>
        </template>
      </div>

      <div class="emby-toolbar__right">
        <v-btn
          v-if="activeTab === 'approvals' && filteredApprovals.some(i => i.status === 'pending')"
          size="small"
          color="success"
          variant="tonal"
          rounded="lg"
          prepend-icon="mdi-check-all"
          :loading="batchApproving"
          @click="approveAllFiltered"
        >
          全部通过
        </v-btn>
        <v-btn
          v-if="activeTab === 'approvals' && handledApprovalCount > 0"
          size="small"
          variant="outlined"
          rounded="lg"
          prepend-icon="mdi-broom"
          :loading="clearingHistory"
          @click="clearApprovalHistory"
        >
          清理历史
        </v-btn>
        <v-text-field
          v-model="keyword"
          class="emby-search"
          prepend-inner-icon="mdi-magnify"
          :placeholder="activeTab === 'users' ? '搜索用户名...' : '搜索片名或申请人...'"
          density="compact"
          variant="outlined"
          hide-details
          clearable
        />
      </div>
    </section>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" rounded />

    <!-- 视图 A：订阅审批列表 -->
    <template v-if="activeTab === 'approvals'">
      <v-alert
        v-if="!config.subscribe_approval_enabled"
        type="info"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="mb-3"
      >
        <div class="d-flex flex-wrap align-center justify-space-between ga-2">
          <span class="text-body-2">
            当前尚未开启「普通用户订阅审批」，非管理员发起的订阅将直接提交至 MoviePilot。
          </span>
          <v-btn size="x-small" color="primary" variant="flat" rounded="lg" @click="openSettingsDialog">
            前往开启
          </v-btn>
        </div>
      </v-alert>

      <div v-if="!loading && filteredApprovals.length === 0" class="emby-empty">
        <v-icon icon="mdi-clipboard-search-outline" size="38" class="mb-2 text-medium-emphasis" />
        <div class="text-subtitle-1 font-weight-bold">
          {{ approvalFilter === 'pending' && !keyword ? '暂无待审批订阅申请' : '未找到匹配的审批记录' }}
        </div>
        <div class="text-body-2 text-medium-emphasis mt-1 mb-3">
          {{
            approvalFilter === 'pending' && !keyword
              ? '当普通 Emby 用户发起新订阅时，将在此处展示并同步推送 Telegram 审批卡片'
              : '可切换状态筛选或清空搜索关键词查看其他记录'
          }}
        </div>
        <v-btn
          v-if="keyword || approvalFilter !== 'all'"
          size="small"
          variant="tonal"
          rounded="lg"
          @click="
            keyword = '';
            approvalFilter = 'all'
          "
        >
          查看全部记录
        </v-btn>
      </div>

      <div v-else class="emby-approval-list">
        <article
          v-for="req in filteredApprovals"
          :key="req.id"
          class="emby-approval-card"
          :class="`is-${req.status}`"
        >
          <div class="emby-approval-card__poster">
            <img v-if="req.poster" :src="req.poster" :alt="req.title" loading="lazy" />
            <div v-else class="emby-approval-card__poster-fallback">
              <v-icon :icon="req.type === '电影' ? 'mdi-movie-open-outline' : 'mdi-television'" size="24" />
            </div>
          </div>

          <div class="emby-approval-card__main">
            <div class="emby-approval-card__title-row">
              <span class="emby-approval-card__title">{{ req.title }}</span>
              <span v-if="req.year" class="emby-approval-card__year">({{ req.year }})</span>
              <span class="emby-chip" :class="req.type === '电影' ? 'is-success' : 'is-info'">
                {{ req.type === '电影' ? '电影' : '剧集' }}
              </span>
              <span v-if="req.type !== '电影' && req.season" class="emby-chip is-neutral">
                第 {{ req.season }} 季
              </span>
              <span v-if="req.vote && req.vote > 0" class="emby-approval-card__vote">
                <v-icon icon="mdi-star" size="13" color="warning" />
                {{ Number(req.vote).toFixed(1) }}
              </span>
            </div>

            <div class="emby-approval-card__meta">
              <span>
                <v-icon icon="mdi-account-outline" size="13" />
                申请人：<b>{{ req.username }}</b>
              </span>
              <span class="emby-dot">·</span>
              <span>{{ req.created_at || '-' }}</span>
              <template v-if="req.status !== 'pending' && req.handled_by">
                <span class="emby-dot">·</span>
                <span>由 {{ req.handled_by }} 处理于 {{ req.handled_at || '-' }}</span>
              </template>
            </div>

            <div v-if="req.overview" class="emby-approval-card__overview" :title="req.overview">
              {{ req.overview }}
            </div>
          </div>

          <div class="emby-approval-card__actions">
            <template v-if="req.status === 'pending'">
              <v-btn
                size="small"
                color="success"
                variant="flat"
                rounded="lg"
                prepend-icon="mdi-check-circle-outline"
                :loading="Boolean(actingApprovalIds[req.id])"
                @click="handleApprovalAction(req, 'approve')"
              >
                通过并提交 MP
              </v-btn>
              <v-btn
                size="small"
                color="info"
                variant="tonal"
                rounded="lg"
                prepend-icon="mdi-tray-arrow-down"
                :loading="Boolean(actingApprovalIds[req.id])"
                @click="handleApprovalAction(req, 'manual')"
              >
                标记手动入库
              </v-btn>
              <v-btn
                size="small"
                color="error"
                variant="tonal"
                rounded="lg"
                prepend-icon="mdi-close-circle-outline"
                :loading="Boolean(actingApprovalIds[req.id])"
                @click="handleApprovalAction(req, 'reject')"
              >
                拒绝申请
              </v-btn>
            </template>
            <template v-else>
              <span class="emby-approval-badge" :class="`is-${req.status}`">
                {{ approvalStatusLabel(req.status) }}
                <template v-if="req.status === 'approved' && req.subscribe_id">#{{ req.subscribe_id }}</template>
              </span>
              <v-btn
                icon="mdi-delete-outline"
                size="x-small"
                variant="text"
                rounded="lg"
                color="medium-emphasis"
                aria-label="删除记录"
                :loading="Boolean(actingApprovalIds[req.id])"
                @click="handleApprovalAction(req, 'delete')"
              />
            </template>
          </div>
        </article>
      </div>
    </template>

    <!-- 视图 B：用户列表 -->
    <template v-else>
      <!-- 空状态 -->
      <div v-if="!loading && filteredUsers.length === 0" class="emby-empty">
      <v-icon icon="mdi-account-search-outline" size="38" class="mb-2 text-medium-emphasis" />
      <div class="text-subtitle-1 font-weight-bold">
        {{ keyword || statusFilter !== 'all' ? '未找到匹配的用户' : '暂无 Emby 用户' }}
      </div>
      <div class="text-body-2 text-medium-emphasis mt-1 mb-3">
        {{ keyword || statusFilter !== 'all' ? '可尝试调整筛选条件或清空搜索词' : '点击右上角「新建账号」创建首个媒体库用户' }}
      </div>
      <v-btn
        v-if="!keyword && statusFilter === 'all'"
        size="small"
        color="primary"
        variant="tonal"
        rounded="lg"
        prepend-icon="mdi-account-plus-outline"
        :disabled="servers.length === 0"
        @click="openCreateDialog"
      >
        新建账号
      </v-btn>
      <v-btn
        v-else
        size="small"
        variant="tonal"
        rounded="lg"
        @click="
          keyword = '';
          statusFilter = 'all'
        "
      >
        重置筛选
      </v-btn>
    </div>

    <!-- 3. 紧凑三段式用户卡片网格 -->
    <div v-else class="emby-grid">
      <article
        v-for="user in filteredUsers"
        :key="user.username"
        class="emby-card"
        :class="`emby-card--${user.access_status}`"
      >
        <!-- 上段：头像、用户名、服务器摘要、准入状态 -->
        <div class="emby-card__head">
          <div class="emby-card__avatar">
            {{ user.username.slice(0, 1).toUpperCase() }}
          </div>

          <div class="emby-card__identity">
            <div class="emby-card__name-line">
              <span class="emby-card__name" :title="user.username">{{ user.username }}</span>
              <v-icon
                v-if="user.emby_is_admin"
                icon="mdi-crown-outline"
                color="warning"
                size="15"
                title="Emby 管理员"
              />
              <span v-if="user.in_whitelist" class="emby-chip is-success">白名单</span>
              <span v-if="user.in_blacklist" class="emby-chip is-error">黑名单</span>
              <span v-if="user.in_approval_bypass" class="emby-chip is-primary">免审</span>
              <span v-if="user.registered_in_mp" class="emby-chip is-info">MP</span>
              <button
                v-if="user.pending_sub_count && user.pending_sub_count > 0"
                type="button"
                class="emby-chip is-warning emby-chip--clickable"
                @click="jumpToUserApprovals(user.username)"
              >
                待审 {{ user.pending_sub_count }}
              </button>
            </div>
            <div class="emby-card__meta" :title="userMetaSummary(user)">
              {{ userMetaSummary(user) }}
            </div>
          </div>

          <span class="emby-status" :class="`is-${user.access_status}`">
            <i />{{ statusLabel(user.access_status) }}
          </span>
        </div>

        <!-- 中段：订阅计数（点击看明细） + 最近活跃 -->
        <div class="emby-card__stats">
          <button type="button" class="emby-card__subs" @click="openUserSubscribes(user)">
            <v-icon icon="mdi-movie-open-outline" size="14" />
            <span>电影 <b>{{ user.movie_sub_count }}</b></span>
            <span class="emby-dot">·</span>
            <span>剧集 <b>{{ user.tv_sub_count }}</b></span>
            <v-icon icon="mdi-chevron-right" size="15" class="ms-auto text-disabled" />
          </button>

          <div class="emby-card__active" :title="user.last_activity_date || user.last_login_date || ''">
            <v-icon icon="mdi-clock-outline" size="13" />
            <span>{{ formatCompactTime(user.last_activity_date || user.last_login_date) }}</span>
          </div>
        </div>

        <!-- 下段：快捷操作栏 -->
        <div class="emby-card__footer">
          <v-btn
            v-if="user.emby_servers.length > 0"
            size="x-small"
            color="primary"
            variant="tonal"
            rounded="lg"
            class="px-3"
            prepend-icon="mdi-account-edit-outline"
            @click="openEditDialog(user)"
          >
            编辑
          </v-btn>
          <v-btn
            size="x-small"
            :color="user.is_active ? 'warning' : 'success'"
            variant="tonal"
            rounded="lg"
            class="px-3"
            :prepend-icon="user.is_active ? 'mdi-account-cancel-outline' : 'mdi-account-check-outline'"
            @click="toggleUserActive(user)"
          >
            {{ user.is_active ? '禁登 MP' : '允许 MP' }}
          </v-btn>

          <v-spacer />

          <v-menu location="bottom end" close-on-content-click>
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon="mdi-dots-horizontal"
                variant="text"
                size="x-small"
                rounded="lg"
                aria-label="更多操作"
              />
            </template>
            <v-list density="compact" rounded="lg" class="py-1 emby-menu-list">
              <v-list-item
                prepend-icon="mdi-playlist-check"
                @click="updateAccessList(user, 'whitelist', user.in_whitelist ? 'remove' : 'add')"
              >
                <v-list-item-title>{{ user.in_whitelist ? '移出白名单' : '加入白名单' }}</v-list-item-title>
              </v-list-item>
              <v-list-item
                prepend-icon="mdi-account-cancel-outline"
                @click="updateAccessList(user, 'blacklist', user.in_blacklist ? 'remove' : 'add')"
              >
                <v-list-item-title>{{ user.in_blacklist ? '移出黑名单' : '加入黑名单' }}</v-list-item-title>
              </v-list-item>
              <v-list-item
                prepend-icon="mdi-check-decagram-outline"
                @click="updateAccessList(user, 'approval_bypass', user.in_approval_bypass ? 'remove' : 'add')"
              >
                <v-list-item-title>{{ user.in_approval_bypass ? '取消订阅免审' : '设为订阅免审' }}</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-format-list-bulleted" @click="openUserSubscribes(user)">
                <v-list-item-title>查看订阅明细 ({{ user.total_sub_count }})</v-list-item-title>
              </v-list-item>
              <v-divider class="my-1" />
              <v-list-item class="text-error" prepend-icon="mdi-delete-outline" @click="openDeleteUserDialog(user)">
                <v-list-item-title>删除账号 / 清理订阅</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </article>
    </div>
    </template>

    <!-- 新建 Emby 账号弹窗 -->
    <v-dialog v-model="createDialog" max-width="600" scrollable>
      <v-card class="emby-dialog">
        <v-card-title class="emby-dialog__header">
          <span class="d-flex align-center ga-2">
            <v-icon icon="mdi-account-plus-outline" size="20" color="primary" />
            <span>新建 Emby 账号</span>
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" rounded="lg" @click="createDialog = false" />
        </v-card-title>
        <v-card-text v-if="!createdCredential" class="emby-dialog__body">
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
                label="用户名 *"
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
                label="初始密码（留空随机生成）"
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
            :items="[{ id: '', name: '自定义权限配置' }, ...createTemplateUsers]"
            item-title="name"
            item-value="id"
            label="复制现有用户权限（可选）"
            variant="outlined"
            density="compact"
            hide-details
          />

          <template v-if="!createForm.copy_from_user_id">
            <div class="emby-dialog__subhead">权限与媒体库授权</div>
            <v-row dense>
              <v-col cols="6">
                <v-switch v-model="createForm.is_admin" color="primary" density="compact" label="Emby 管理员" hide-details />
              </v-col>
              <v-col cols="6">
                <v-switch v-model="createForm.is_hidden" color="primary" density="compact" label="登录页隐藏" hide-details />
              </v-col>
              <v-col cols="6">
                <v-switch
                  v-model="createForm.enable_remote_access"
                  color="primary"
                  density="compact"
                  label="允许外网连接"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-switch
                  v-model="createForm.enable_downloading"
                  color="primary"
                  density="compact"
                  label="允许下载媒体"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-switch
                  v-model="createForm.enable_video_transcoding"
                  color="primary"
                  density="compact"
                  label="允许视频转码"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-switch
                  v-model="createForm.enable_audio_transcoding"
                  color="primary"
                  density="compact"
                  label="允许音频转码"
                  hide-details
                />
              </v-col>
            </v-row>

            <v-text-field
              v-model.number="createForm.simultaneous_stream_limit"
              type="number"
              min="0"
              label="最大并发播放流数（0 为不限）"
              variant="outlined"
              density="compact"
              hide-details
            />

            <v-switch
              v-model="createForm.enable_all_folders"
              color="primary"
              density="compact"
              label="允许访问全部媒体库"
              hide-details
            />

            <v-card v-if="!createForm.enable_all_folders" variant="outlined" rounded="lg" class="pa-3 emby-subcard">
              <div v-if="createServerFolders.length === 0" class="text-caption text-medium-emphasis">
                未读取到媒体库列表
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

          <v-checkbox
            v-model="createForm.add_to_whitelist"
            color="primary"
            density="compact"
            label="同时加入 MoviePilot 登录白名单"
            hide-details
          />
          <v-checkbox
            v-model="createForm.add_to_approval_bypass"
            color="primary"
            density="compact"
            label="同时加入订阅免审直通名单"
            hide-details
          />
        </v-card-text>
        <v-card-text v-else class="emby-dialog__body">
          <v-alert type="success" variant="tonal" rounded="lg" icon="mdi-check-circle-outline">
            <div class="font-weight-bold mb-1">账号 {{ createdCredential.username }} 创建成功</div>
            <div class="text-body-2 mb-3">请复制并保存自动生成的初始密码：</div>
            <v-text-field
              :model-value="createdCredential.password"
              label="初始密码"
              readonly
              variant="outlined"
              density="compact"
              hide-details
              append-inner-icon="mdi-content-copy"
              @click:append-inner="copyPasswordText(createdCredential?.password)"
            />
          </v-alert>
        </v-card-text>
        <v-card-actions class="emby-dialog__footer">
          <v-spacer />
          <template v-if="!createdCredential">
            <v-btn variant="text" rounded="lg" @click="createDialog = false">取消</v-btn>
            <v-btn color="primary" variant="flat" rounded="lg" class="px-5" :loading="creatingUser" @click="submitCreateUser">
              创建账号
            </v-btn>
          </template>
          <v-btn v-else color="primary" variant="flat" rounded="lg" class="px-5" @click="createDialog = false">完成</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 编辑 Emby 账号弹窗 -->
    <v-dialog v-model="editDialog" max-width="620" scrollable>
      <v-card class="emby-dialog">
        <v-card-title class="emby-dialog__header">
          <span class="d-flex align-center ga-2">
            <v-icon icon="mdi-account-edit-outline" size="20" color="primary" />
            <span>编辑账号：{{ editForm.username }}</span>
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" rounded="lg" @click="editDialog = false" />
        </v-card-title>
        <v-progress-linear v-if="editLoading" indeterminate color="primary" />
        <v-card-text class="emby-dialog__body">
          <v-select
            v-if="editTargetUser && editTargetUser.emby_servers.length > 1"
            :model-value="editForm.server"
            :items="editTargetUser.emby_servers"
            label="Emby 服务器实例"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="onEditServerChange"
          />

          <v-text-field
            v-model="editForm.new_username"
            label="Emby 用户名（改名将同步迁移本地订阅）"
            variant="outlined"
            density="compact"
            hide-details
          />

          <div class="emby-pwd-box">
            <div class="d-flex align-center justify-space-between">
              <span class="d-flex align-center ga-2 text-body-2 font-weight-medium">
                <v-icon icon="mdi-key-outline" size="17" color="primary" />
                重置登录密码
              </span>
              <v-switch v-model="editForm.change_password" color="primary" density="compact" hide-details />
            </div>
            <v-text-field
              v-if="editForm.change_password"
              v-model="editForm.new_password"
              :type="showEditPassword ? 'text' : 'password'"
              label="新密码（留空将清除密码改为免密）"
              variant="outlined"
              density="compact"
              hide-details
              class="mt-2"
              :append-inner-icon="showEditPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              @click:append-inner="showEditPassword = !showEditPassword"
            />
          </div>

          <div class="emby-dialog__subhead">状态与权限</div>
          <v-row dense>
            <v-col cols="6">
              <v-switch
                v-model="editForm.mp_is_active"
                color="primary"
                density="compact"
                label="允许登录 MP"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-switch
                v-model="editForm.is_disabled"
                color="error"
                density="compact"
                label="Emby 禁用此号"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-switch v-model="editForm.is_admin" color="primary" density="compact" label="Emby 管理员" hide-details />
            </v-col>
            <v-col cols="6">
              <v-switch v-model="editForm.is_hidden" color="primary" density="compact" label="登录页隐藏" hide-details />
            </v-col>
            <v-col cols="6">
              <v-switch
                v-model="editForm.enable_remote_access"
                color="primary"
                density="compact"
                label="允许外网连接"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-switch
                v-model="editForm.enable_downloading"
                color="primary"
                density="compact"
                label="允许下载媒体"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-switch
                v-model="editForm.enable_video_transcoding"
                color="primary"
                density="compact"
                label="允许视频转码"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-switch
                v-model="editForm.enable_audio_transcoding"
                color="primary"
                density="compact"
                label="允许音频转码"
                hide-details
              />
            </v-col>
          </v-row>

          <v-text-field
            v-model.number="editForm.simultaneous_stream_limit"
            type="number"
            min="0"
            label="最大并发播放流数（0 为不限）"
            variant="outlined"
            density="compact"
            hide-details
          />

          <v-switch
            v-model="editForm.enable_all_folders"
            color="primary"
            density="compact"
            label="允许访问全部媒体库"
            hide-details
          />

          <v-card v-if="!editForm.enable_all_folders" variant="outlined" rounded="lg" class="pa-3 emby-subcard">
            <div v-if="editServerFolders.length === 0" class="text-caption text-medium-emphasis">
              未读取到媒体库列表
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
        <v-card-actions class="emby-dialog__footer">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="editDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" class="px-5" :loading="savingEdit" @click="submitEditUser">
            保存修改
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 准入与订阅审批策略设置弹窗 -->
    <v-dialog v-model="settingsDialog" max-width="580" scrollable>
      <v-card class="emby-dialog">
        <v-card-title class="emby-dialog__header">
          <span class="d-flex align-center ga-2">
            <v-icon icon="mdi-shield-lock-outline" size="20" color="primary" />
            <span>登录准入与订阅审批策略</span>
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" rounded="lg" @click="settingsDialog = false" />
        </v-card-title>
        <v-card-text class="emby-dialog__body">
          <div class="emby-dialog__subhead">1. 登录准入控制</div>
          <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">
            仅控制谁能使用 Emby 账号登录 MoviePilot 发起订阅，不影响 Emby 自身观影权限。
          </v-alert>
          <v-switch v-model="config.enabled" color="primary" density="compact" label="启用登录准入控制" hide-details />
          <v-switch
            v-model="config.allow_emby_admin"
            color="primary"
            density="compact"
            label="允许 Emby 管理员作为普通订阅用户登录"
            hide-details
          />
          <v-select
            v-model="config.allow_mode"
            :items="[
              { title: '全部允许（未禁用账号均可登录）', value: 'all' },
              { title: '白名单模式（仅白名单可登录）', value: 'whitelist' },
              { title: '黑名单模式（拦截黑名单用户）', value: 'blacklist' },
            ]"
            item-title="title"
            item-value="value"
            label="准入模式"
            variant="outlined"
            density="compact"
            hide-details
          />
          <v-select
            v-model="config.allowed_servers"
            :items="servers.map(s => s.name)"
            label="限定 Emby 实例（留空为全部）"
            variant="outlined"
            density="compact"
            multiple
            chips
            clearable
            hide-details
          />
          <v-textarea
            v-model="whitelistInput"
            label="白名单用户名（逗号或换行分隔）"
            variant="outlined"
            rows="2"
            density="compact"
            hide-details
          />
          <v-textarea
            v-model="blacklistInput"
            label="黑名单用户名（逗号或换行分隔）"
            variant="outlined"
            rows="2"
            density="compact"
            hide-details
          />

          <v-divider class="my-1" />
          <div class="emby-dialog__subhead">2. 普通用户订阅审批</div>
          <v-switch
            v-model="config.subscribe_approval_enabled"
            color="primary"
            density="compact"
            label="开启普通用户订阅审批（通过后才提交到 MoviePilot）"
            hide-details
          />
          <v-switch
            v-model="config.approval_notify_telegram"
            color="primary"
            density="compact"
            label="推送 Telegram 审批卡片（含通过并提交 MP / 标记手动入库 / 拒绝按钮）"
            hide-details
          />
          <v-text-field
            v-model="config.approval_tg_chat_id"
            label="审批通知 Telegram Chat ID（可选，留空走系统默认通知会话）"
            variant="outlined"
            density="compact"
            hide-details
          />
          <v-textarea
            v-model="approvalBypassInput"
            label="免审批直通用户名单（逗号或换行分隔，名单内用户订阅直接提交 MP）"
            variant="outlined"
            rows="2"
            density="compact"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="emby-dialog__footer">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="settingsDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" class="px-5" :loading="savingConfig" @click="savePolicyConfig">
            保存策略
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 用户订阅明细弹窗 -->
    <v-dialog v-model="subDialog" max-width="600" scrollable>
      <v-card class="emby-dialog">
        <v-card-title class="emby-dialog__header">
          <span class="d-flex align-center ga-2">
            <v-icon icon="mdi-playlist-star" size="20" color="primary" />
            <span>{{ subDialogUser }} 的订阅 ({{ userSubscribes.length }})</span>
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" rounded="lg" @click="subDialog = false" />
        </v-card-title>
        <v-card-text class="pa-3">
          <v-progress-linear v-if="subDialogLoading" indeterminate color="primary" class="mb-2" />
          <div v-else-if="userSubscribes.length === 0" class="text-center py-6 text-medium-emphasis text-body-2">
            该用户暂无订阅记录
          </div>
          <v-list v-else lines="two" density="compact">
            <v-list-item v-for="sub in userSubscribes" :key="sub.id" rounded="lg">
              <template #prepend>
                <v-icon
                  :icon="sub.type === '电影' ? 'mdi-movie-open-outline' : 'mdi-television'"
                  :color="sub.type === '电影' ? 'success' : 'info'"
                />
              </template>
              <v-list-item-title class="font-weight-medium">
                {{ sub.name }}
                <span v-if="sub.year" class="text-caption text-medium-emphasis">({{ sub.year }})</span>
                <span v-if="sub.season" class="text-caption ms-1">S{{ sub.season }}</span>
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ sub.type }} · 状态 {{ sub.state || 'R' }} · {{ sub.date || '-' }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 删除用户确认弹窗 -->
    <v-dialog v-model="deleteDialog" max-width="460">
      <v-card class="emby-dialog">
        <v-card-title class="emby-dialog__header text-error">
          <span class="d-flex align-center ga-2">
            <v-icon icon="mdi-alert-circle-outline" size="20" color="error" />
            <span>删除用户：{{ deleteTargetUser?.username }}</span>
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" rounded="lg" @click="deleteDialog = false" />
        </v-card-title>
        <v-card-text class="emby-dialog__body">
          <div class="text-body-2 text-medium-emphasis">勾选需要清理的范围：</div>
          <v-checkbox
            v-if="deleteTargetUser && deleteTargetUser.emby_servers.length > 0"
            v-model="deleteFromEmby"
            color="error"
            density="compact"
            :label="`从 Emby (${deleteTargetUser.emby_servers.join('、')}) 删除该账号`"
            hide-details
          />
          <v-checkbox
            v-model="deleteMpUser"
            color="error"
            density="compact"
            label="移除 MoviePilot 本地账号记录"
            hide-details
          />
          <v-checkbox
            v-model="deleteWithSubscribes"
            color="error"
            density="compact"
            :label="`清理名下全部影视订阅 (${deleteTargetUser?.total_sub_count || 0} 条)`"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="emby-dialog__footer">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" class="px-5" :loading="deletingUser" @click="confirmDeleteUser">
            确认删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.emby-page {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 2px 0 16px;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

.emby-page :deep(.v-field) {
  border-radius: 8px;
}

/* 1. 紧凑顶栏 */
.emby-topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.emby-topbar__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.emby-topbar__icon {
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

.emby-topbar__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.emby-topbar h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
}

.emby-tag {
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

.emby-tag--clickable {
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.emby-tag--clickable:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.16);
}

.emby-tag.is-active {
  border-color: rgba(var(--v-theme-success), 0.24);
  background: rgba(var(--v-theme-success), 0.09);
  color: rgb(var(--v-theme-success));
}

.emby-topbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 2. IDE 分段胶囊筛选与搜索工具条 */
.emby-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.emby-toolbar__left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.emby-pills {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 9px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.emby-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
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

.emby-pill strong {
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.66);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.45;
  font-variant-numeric: tabular-nums;
}

.emby-pill:hover {
  color: rgba(var(--v-theme-on-surface), 0.88);
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.emby-pill.is-active {
  border-color: rgba(var(--v-theme-on-surface), 0.1);
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-weight: 600;
}

.emby-pill.is-active strong {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.emby-sub-counter {
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

.emby-sub-counter :deep(.v-icon) {
  color: rgb(var(--v-theme-warning));
}

.emby-search {
  width: 240px;
  max-width: 100%;
  flex: 0 1 240px;
}

/* 空状态 */
.emby-empty {
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

.emby-empty:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.16);
}

/* 3. 三段式用户卡片网格 */
.emby-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(296px, 1fr));
  gap: 12px;
}

.emby-card {
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

.emby-card:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.16);
  box-shadow: none;
}

.emby-card--disabled {
  opacity: 0.78;
}

.emby-card__head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.emby-card__avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-size: 14px;
  font-weight: 700;
}

.emby-card__identity {
  flex: 1;
  min-width: 0;
}

.emby-card__name-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.emby-card__name {
  overflow: hidden;
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.3;
  max-width: 140px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.emby-chip {
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.4;
}

.emby-chip.is-success {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}

.emby-chip.is-error {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

.emby-chip.is-info {
  background: rgba(var(--v-theme-info), 0.12);
  color: rgb(var(--v-theme-info));
}

.emby-card__meta {
  overflow: hidden;
  margin-top: 2px;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.emby-status {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.emby-status i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.emby-status.is-allowed {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}

.emby-status.is-blocked {
  background: rgba(var(--v-theme-warning), 0.13);
  color: rgb(var(--v-theme-warning));
}

.emby-status.is-disabled {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

/* 中段指标栏 */
.emby-card__stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.emby-card__subs {
  display: inline-flex;
  flex: 1;
  align-items: center;
  gap: 5px;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.82);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.emby-card__subs:hover {
  color: rgb(var(--v-theme-primary));
}

.emby-card__subs b {
  font-variant-numeric: tabular-nums;
}

.emby-dot {
  opacity: 0.45;
}

.emby-card__active {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  color: rgba(var(--v-theme-on-surface), 0.54);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

/* 底栏动作 */
.emby-card__footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 2px;
}

.emby-menu-list {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: none !important;
}

.emby-tag.is-warning {
  border-color: rgba(var(--v-theme-warning), 0.3);
  background: rgba(var(--v-theme-warning), 0.12);
  color: rgb(var(--v-theme-warning));
}

.emby-toolbar__right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.emby-pill strong.is-alert {
  background: rgba(var(--v-theme-warning), 0.16);
  color: rgb(var(--v-theme-warning));
}

.emby-chip.is-primary {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.emby-chip.is-warning {
  background: rgba(var(--v-theme-warning), 0.14);
  color: rgb(var(--v-theme-warning));
}

.emby-chip.is-neutral {
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgba(var(--v-theme-on-surface), 0.75);
}

.emby-chip--clickable {
  border: none;
  cursor: pointer;
}

/* 4. 订阅审批卡片列表（哑光分层，零毛玻璃） */
.emby-approval-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.emby-approval-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 15px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.16s ease;
}

.emby-approval-card:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.16);
}

.emby-approval-card.is-pending {
  border-color: rgba(var(--v-theme-primary), 0.22);
}

.emby-approval-card__poster {
  width: 56px;
  height: 82px;
  flex-shrink: 0;
  border-radius: 7px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.emby-approval-card__poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.emby-approval-card__poster-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: rgba(var(--v-theme-on-surface), 0.36);
}

.emby-approval-card__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.emby-approval-card__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.emby-approval-card__title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}

.emby-approval-card__year {
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-size: 13px;
}

.emby-approval-card__vote {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-warning));
  font-variant-numeric: tabular-nums;
}

.emby-approval-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 12px;
}

.emby-approval-card__meta b {
  color: rgba(var(--v-theme-on-surface), 0.88);
}

.emby-approval-card__overview {
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 12.5px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.emby-approval-card__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.emby-approval-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.emby-approval-badge.is-approved {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}

.emby-approval-badge.is-manual {
  background: rgba(var(--v-theme-info), 0.12);
  color: rgb(var(--v-theme-info));
}

.emby-approval-badge.is-rejected {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

/* 弹窗统一样式（Antigravity IDE 14px + 50px 紧凑顶栏） */
.emby-dialog {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgb(var(--v-theme-surface));
  box-shadow: none !important;
  overflow: hidden;
}

.emby-dialog :deep(.v-field) {
  border-radius: 8px;
}

.emby-dialog__header {
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

.emby-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
}

.emby-dialog__subhead {
  margin-top: 2px;
  color: rgb(var(--v-theme-primary));
  font-size: 13px;
  font-weight: 600;
}

.emby-pwd-box,
.emby-subcard {
  padding: 10px 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.025);
}

.emby-dialog__footer {
  padding: 10px 18px 12px;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

@media (max-width: 720px) {
  .emby-approval-card {
    flex-wrap: wrap;
  }

  .emby-approval-card__actions {
    width: 100%;
    justify-content: flex-start;
    padding-top: 4px;
  }
}

@media (max-width: 600px) {
  .emby-page {
    padding: 4px 4px 14px;
  }

  .emby-search {
    width: 100%;
    flex: 1 1 100%;
  }
}
</style>
