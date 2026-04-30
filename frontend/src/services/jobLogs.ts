import axios from 'axios'
import { getApiURL, getTestHeader } from '../helpers/apiHelper'
import { getToken } from './remoteit'
import { store } from '../store'

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
}

/** Fetch presigned URLs for the all-logs zip and every per-device archive. */
export async function getJobLogs(jobId: string): Promise<JobLogsResponse | null> {
  const token = await getToken()
  if (!token) return null

  const headers: any = { Authorization: token, ...getTestHeader() }
  const viewAsUser = store.getState().ui.viewAsUser
  if (viewAsUser) headers['X-R3-User'] = viewAsUser.id

  try {
    const response = await axios.get(`${getApiURL()}/job/log/all/${jobId}`, { headers })
    return response?.data as JobLogsResponse
  } catch (err: any) {
    const status = err?.response?.status
    if (status === 404) return null
    console.error('getJobLogs error:', err?.message || err)
    return null
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
