import humanize from 'humanize-duration'

export function isUsageNumber(value?: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function formatBytes(bytes?: number | null): string {
  if (!isUsageNumber(bytes)) return '-'
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  const decimals = value >= 100 || exponent === 0 ? 0 : value >= 10 ? 1 : 2

  return `${value.toFixed(decimals).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')} ${units[exponent]}`
}

export function formatDuration(durationSeconds?: number | null): string {
  if (!isUsageNumber(durationSeconds)) return '-'
  if (durationSeconds === 0) return '0 seconds'

  return humanize(durationSeconds * 1000, { largest: 2, round: true })
}
