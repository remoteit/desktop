import axios from 'axios'
import { getApiURL } from '../helpers/apiHelper'
import { apiHeaders } from './remoteit'
import { apiError } from './post'
import { store } from '../store'

export async function get(path: string = '') {
  if (store.getState().ui.offline) return

  const url = getApiURL() + path
  const headers = await apiHeaders('GET', url)
  if (!headers) {
    console.warn('Unable to get token for API request.')
    return
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
