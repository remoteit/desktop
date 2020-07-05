import setup, { IUser } from 'remote.it'
import { API_URL, DEVELOPER_KEY } from '../shared/constants'

export function updateUserCredentials(user: IUser) {
  r3.token = user.token
  r3.authHash = user.authHash
}

export function clearUserCredentials() {
  r3.token = undefined
  r3.authHash = undefined
}

export const r3 = setup({ apiURL: API_URL, developerKey: DEVELOPER_KEY })

export function hasCredentials() {
  if (r3.token && r3.authHash) return true
  console.warn('Missing api token or authHash. Token:', r3.token, 'AuthHash:', r3.authHash)
  return false
}
