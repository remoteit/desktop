import setup from 'remote.it'
import { API_URL, DEVELOPER_KEY } from '../shared/constants'
import { store } from '../store'

export const r3 = setup(
  {
    apiURL: API_URL,
    developerKey: DEVELOPER_KEY,
    successURL: window.location.origin,
  },
  getToken
)

export async function getToken(): Promise<string> {
  const { auth } = store.dispatch
  
  try {
    const currentSession = await store.getState().auth.authService?.currentCognitoSession()
    if (currentSession !== undefined) {
      const token = 'Bearer ' + currentSession.getAccessToken().getJwtToken()
      return token
    } else {
      auth.signInError('Session Expired')
      return ''
    }
  } catch (err) {
      auth.signInError('Session Expired')
      return ''
  }

  
}

export async function hasCredentials() {
  const { auth } = store.dispatch
  try {
    const currentSession = await store.getState().auth.authService?.currentCognitoSession()
    if (currentSession !== undefined) {
      return true
    } else {
      auth.signInError('Session Expired')
      return false
    }
  } catch {
    auth.signInError('Session Expired')
    return false
  }
}
