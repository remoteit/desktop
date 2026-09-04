import axios from 'axios'
import { getApiURL } from '../helpers/apiHelper'
import { apiAuthHeaders } from './remoteit'
import { apiError } from './post'
import { store } from '../store'

export async function get(path: string = '') {
  if (store.getState().ui.offline) return

  const url = getApiURL() + path
  const auth = await apiAuthHeaders('GET', url)
  if (!auth.authorization) {
    console.warn('Unable to get token for API request.')
    return
  }

  const headers: any = { ...auth }
  
  // Add x-r3-user header if in view-as mode
  const viewAsUser = store.getState().ui.viewAsUser
  if (viewAsUser) {
    headers['X-R3-User'] = viewAsUser.id
  }

  const request = {
    url,
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
