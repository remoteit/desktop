import axios from 'axios'
import { getApiURL, getTestHeader } from '../helpers/apiHelper'
import { getToken } from './remoteit'
import { apiError } from './post'
import { store } from '../store'

export async function get(path: string = '') {
  if (store.getState().ui.offline) return

  const token = await getToken()
  if (!token) {
    console.warn('Unable to get token for API request.')
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
    method: 'get',
    headers,
  }

  try {
    return await axios.request(request)
  } catch (error) {
    console.error('POST ERROR', { path })
    await apiError(error)
    return 'ERROR'
  }
}
