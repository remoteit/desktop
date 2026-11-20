import axios, { AxiosResponse } from 'axios'
import { getApiURL } from '../helpers/apiHelper'
import { apiRequest } from './remoteit'
import { store } from '../store'
import network from './Network'
import sleep from '../helpers/sleep'

let errorCount = 0

export function resetErrorCount() {
  errorCount = 0
}

export async function post(
  data: ILookup<any, string> = {},
  path: string = '',
  silent = false,
  retry = false
): Promise<AxiosResponse | 'ERROR'> {
  if (store.getState().ui.offline) return 'ERROR'

  const url = getApiURL() + path
  try {
    const response = await apiRequest('POST', url, async headers =>
      headers ? axios.request({ url, method: 'post', headers, data }) : undefined
    )
    if (!response) {
      console.warn('Unable to get token for API request.', data)
      return 'ERROR'
    }
    return response
  } catch (error) {
    if (retry && droppedInFlight(error)) {
      console.warn('POST DROPPED, RETRYING', { data, path })
      await sleep(1000)
      return await post(data, path, silent)
    }
    console.error('POST ERROR', { data, path })
    await apiError(error, silent)
    return 'ERROR'
  }
}

// Chromium drops in-flight requests with ERR_NETWORK_CHANGED when the OS network shifts (as on the
// relaunch after an update); axios sees only a Network Error with no response.
function droppedInFlight(error: unknown) {
  return axios.isAxiosError(error) && !error.response && error.code === 'ERR_NETWORK'
}

export async function postFile(file: File, data: ILookup<any, string> = {}, path: string = '') {
  const form = new FormData()

  form.append('file', file)
  Object.entries(data).forEach(([key, value]) => {
    form.append(key, value)
  })

  return await post(form, path)
}

export async function apiError(error: unknown, silent = false) {
  const { ui, auth } = store.dispatch
  console.error('API ERROR:', error)
  console.trace()
  errorCount = errorCount + 1

  if (axios.isAxiosError(error)) {
    console.error('AXIOS ERROR DETAILS:', { ...error })

    if (!navigator.onLine) network.offline()

    if (error.response?.status === 429) {
      if (!silent)
        ui.set({
          errorMessage:
            'API request failure. Your API usage has been throttled. Check the usage on your account and if issues persist please contact support.',
        })
      return
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      // Migration reality: legacy endpoints and edge path-allowlists answer 401/403 with
      // the session perfectly alive. NEVER tear down from here — checkSession consults
      // the OIDC truth (a dead refresh family) and only then signs out LOCALLY; nothing
      // on a failure path may end the AS session. Log the URL: it names the offender.
      console.warn('AUTH-SHAPED API ERROR', { url: error.config?.url, status: error.response?.status })
      await sleep(1000 * errorCount * errorCount)
      // The status rides along: under a SUPPORT session a 401 is terminal (no refresh token, the
      // session is gone) while a 403 is an ordinary refused write — checkSession tells them apart.
      auth.checkSession({ status: error.response?.status })
    }
  }

  if (!silent && (error instanceof Error || axios.isAxiosError(error))) {
    ui.set({ errorMessage: error.message })
  }
}
