import axios from 'axios'
import { getApiURL, getTestHeader } from '../helpers/apiHelper'
import { getToken } from './remoteit'
import { store } from '../store'
import network from './Network'
import sleep from '../helpers/sleep'

let errorCount = 0

export function resetErrorCount() {
  errorCount = 0
}

export async function post(data: ILookup<any, string> = {}, path: string = '') {
  if (store.getState().ui.offline) return

  const token = await getToken()
  if (!token) {
    console.warn('Unable to get token for API request.', data)
    return
  }
  
  const headers: any = { Authorization: token, ...getTestHeader() }
  
  // Add x-r3-user header if in view-as mode
  const viewAsUser = store.getState().ui.viewAsUser
  if (viewAsUser) {
    headers['X-R3-User'] = viewAsUser.id
  }
  
  const request = {
    url: getApiURL() + path,
    method: 'post' as 'post',
    headers,
    data,
  }

  try {
    return await axios.request(request)
  } catch (error) {
    console.error('POST ERROR', { data, path })
    await apiError(error)
    return 'ERROR'
  }
}

export async function postFile(file: File, data: ILookup<any, string> = {}, path: string = '') {
  const form = new FormData()

  form.append('file', file)
  Object.entries(data).forEach(([key, value]) => form.append(key, value))

  return await post(form, path)
}

export async function apiError(error: unknown) {
  const { ui, auth } = store.dispatch
  console.error('API ERROR:', error)
  console.trace()
  errorCount = errorCount + 1

  if (axios.isAxiosError(error)) {
    console.error('AXIOS ERROR DETAILS:', { ...error })

    if (!navigator.onLine) network.offline()

    if (error.response?.status === 429) {
      ui.set({
        errorMessage:
          'API request failure. Your API usage has been throttled. Check the usage on your account and if issues persist please contact support.',
      })
      return
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      if (errorCount > 10) {
        auth.signOut()
      }
      console.log('Incrementing error count: ', errorCount)
      await sleep(1000 * errorCount * errorCount)
      auth.checkSession({ refreshToken: true })
    }
  }

  if (error instanceof Error || axios.isAxiosError(error)) {
    ui.set({ errorMessage: error.message })
  }
}
