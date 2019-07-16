import axios from 'axios'
import setup, { IUser } from 'remote.it'
import { API_URL } from '../constants'

export async function refreshAccessKey() {
  // TODO: Handle errors
  const resp = await axios.post('https://api.remote.it/access-key')
  r3.accessKey = resp.data.accessKey
}

export function updateUserCredentials(user: IUser) {
  r3.token = user.token
  r3.authHash = user.authHash
}

export function clearUserCredentials() {
  r3.token = undefined
  r3.authHash = undefined
}

export const r3 = setup({ apiURL: API_URL })
