import axios from 'axios'
import { getApiRestURL, getApiURL } from '../helpers/apiHelper'
import { apiRequest } from './remoteit'
import { apiError } from './post'
import { store } from '../store'

export async function get(path: string = '') {
  if (store.getState().ui.offline) return 'ERROR'

  // A REST route under the API's REST root (getApiRestURL: on the unified front, /api).
  const url = (path ? getApiRestURL() : getApiURL()) + path
  try {
    const response = await apiRequest('GET', url, async headers =>
      headers ? axios.request({ url, method: 'get', headers }) : undefined
    )
    if (!response) {
      console.warn('Unable to get token for API request.')
      return 'ERROR'
    }
    return response
  } catch (error) {
    console.error('POST ERROR', { path })
    await apiError(error)
    return 'ERROR'
  }
}
