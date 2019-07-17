import setup, { IUser } from 'remote.it'
import { API_URL, DEVELOPER_KEY } from '../constants'

export function updateUserCredentials(user: IUser) {
  r3.token = user.token
  r3.authHash = user.authHash
}

export function clearUserCredentials() {
  r3.token = undefined
  r3.authHash = undefined
}

export const r3 = setup({ apiURL: API_URL, developerKey: DEVELOPER_KEY })
