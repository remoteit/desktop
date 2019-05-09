import axios from 'axios'
import setup from 'remote.it'
import { API_URL } from '../constants'

/**
 * Get an access key for this session so the user can make API requests.
 */
export async function refreshAccessKey() {
  // TODO: Handle errors
  const resp = await axios.post('https://api.remote.it/access-key')
  r3.accessKey = resp.data.accessKey
}

export const r3 = setup({ apiURL: API_URL })
