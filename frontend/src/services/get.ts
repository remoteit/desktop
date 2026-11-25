import axios from 'axios'
import { getApiRestURL, getApiURL } from '../helpers/apiHelper'
import { apiRequest } from './remoteit'
import { apiError } from './post'
import { store } from '../store'
import { requestSignIn, RequestFor } from '../selectors/signIns'

export async function get(path: string = '', requestFor?: RequestFor) {
  if (store.getState().ui.offline) return 'ERROR'
  const sub = requestSignIn(store.getState(), requestFor)

  // A REST route under the API's REST root (getApiRestURL: on the unified front, /api).
  const url = (path ? getApiRestURL() : getApiURL()) + path
  try {
    const response = await apiRequest(
      'GET',
      url,
      async headers => (headers ? axios.request({ url, method: 'get', headers }) : undefined),
      sub
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
