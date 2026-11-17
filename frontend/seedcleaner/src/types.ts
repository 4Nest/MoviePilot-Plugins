export interface DownloaderOverview {
  name: string
  type: string
  torrent_count: number
  seeding_count: number
  total_size_gb: number
  free_space_gb: number | null
  total_space_gb: number | null
  download_speed: number
  upload_speed: number
  low_space: boolean
}

export interface CleanItem {
  downloader: string
  hash: string
  name: string
  size: number
  size_gb: number
  ratio: number
  seeding_hours: number
  rule_name: string
  reason: string
  delete_files: boolean
  state?: string
  status?: string
  time?: string
  error?: string
}

export interface RuleTemplate {
  id: string
  name: string
  description: string
  rule: Record<string, any>
}

export interface HostToast {
  success(message: string): unknown
  error(message: string): unknown
  info(message: string): unknown
}

export function formatSingleLineTime(value?: string): string {
  if (!value) return '-'
  return String(value).replace(/\s+/g, ' ').trim()
}
