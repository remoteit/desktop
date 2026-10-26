import axios from 'axios'
import { getApiRestURL } from '../helpers/apiHelper'
import { apiHeaders } from './remoteit'

export type DeviceLogEntry = {
  jobDeviceId: string
  deviceId: string
  deviceName: string
  status: string
  downloadUrl: string | null
  filename: string
}

export type JobLogsResponse = {
  downloadUrl: string | null
  filename: string | null
  expiresIn: number
  devices: DeviceLogEntry[]
  // More runs than one zip is built for: each run's log is its own download.
  zipTooBig?: boolean
}

export type GetJobLogsResult =
  | { kind: 'ok'; data: JobLogsResponse }
  | { kind: 'missing' }
  | { kind: 'error'; status?: number; message: string }

/**
 * Fetch presigned URLs for the all-logs zip and every per-device archive — or, given a run, only that run's archive
 * (a job may have tens of thousands of runs; every one's archive was looked up to download one), or with zipOnly the
 * zip alone (no per-device links made for a download that uses none).
 *
 * The `kind` field lets callers distinguish:
 *   - `ok`: payload available
 *   - `missing`: 404 (job has no logs yet — usual "still uploading" case)
 *   - `error`: anything else (auth expiry, network failure, server error)
 *
 * Conflating the last two as `null` made the UI report "No logs available"
 * for transient operational failures and gave users no recovery path.
 */
export async function getJobLogs(jobId: string, jobDeviceId?: string, zipOnly = false): Promise<GetJobLogsResult> {
  const query = jobDeviceId ? `?jobDeviceId=${encodeURIComponent(jobDeviceId)}` : zipOnly ? '?devices=0' : ''
  const url = `${getApiRestURL()}/job/log/all/${jobId}${query}`
  const headers = await apiHeaders('GET', url)
  if (!headers) return { kind: 'error', status: 401, message: 'Not signed in' }
  try {
    const response = await axios.get(url, { headers })
    return { kind: 'ok', data: response?.data as JobLogsResponse }
  } catch (err: any) {
    const status: number | undefined = err?.response?.status
    if (status === 404) return { kind: 'missing' }
    const message: string = err?.response?.data?.message || err?.message || 'Failed to load logs'
    console.error('getJobLogs error:', { status, message, err })
    return { kind: 'error', status, message }
  }
}

/** Trigger a browser download of the archive at the given presigned URL. */
export function triggerBrowserDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
