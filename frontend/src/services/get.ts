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

  const request = {
    url: getApiURL() + path,
    method: 'get',
    headers: { Authorization: token, ...getTestHeader() },
  }

  try {
    return await axios.request(request)
  } catch (error) {
    console.error('POST ERROR', { path })
    await apiError(error)
    return 'ERROR'
  }
}
