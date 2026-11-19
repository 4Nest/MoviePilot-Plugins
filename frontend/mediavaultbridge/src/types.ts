export interface HostToast {
  success?: (msg: string) => void
  error?: (msg: string) => void
  warning?: (msg: string) => void
  info?: (msg: string) => void
}

export interface PathMappingItem {
  mp_prefix: string
  mv_cloud_prefix: string
  mv_strm_prefix: string
  storage: string
  enabled: boolean
}

export interface FailedUploadEvent {
  id: number
  file_name?: string
  file_path?: string
  dest_path?: string
  status?: string
  error?: string
  message?: string
  created_at?: string
  retry_category: 'retryable' | 'clear_lock_retry' | 'manual_confirm'
  retry_reason?: string
  auto_attempts: number
}

export interface BridgeLogItem {
  id: string
  time: string
  category: string
  status: 'success' | 'warning' | 'error' | string
  summary: string
  detail?: string
}

export function formatBytes(bytes?: number | null): string {
  const num = Number(bytes || 0)
  if (!Number.isFinite(num) || num <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let idx = 0
  let val = num
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024
    idx += 1
  }
  return `${val.toFixed(val >= 100 ? 0 : 2)} ${units[idx]}`
}
