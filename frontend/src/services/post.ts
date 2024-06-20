import axios, { AxiosResponse } from 'axios'
import { getApiURL, getTestHeader } from '../helpers/apiHelper'
import { getToken } from './remoteit'
import { store } from '../store'

export async function post(data: ILookup<any, string> = {}, path: string = ''): Promise<undefined | AxiosResponse> {
  if (store.getState().ui.offline) return

  const token = await getToken()
  if (!token) {
    console.warn('Unable to get token for API request.', data)
    return
  }
  const request = {
    url: getApiURL() + path,
    method: 'post' as 'post',
    headers: { Authorization: token, ...getTestHeader() },
    data,
  }

  return await axios.request(request)
}
