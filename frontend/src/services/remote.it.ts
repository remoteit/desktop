import setup from 'remote.it'
import { API_URL, CLIENT_ID, DEVELOPER_KEY, CALLBACK_URL } from '../shared/constants'
import { AuthService } from '@remote.it/services'
import { getRedirectUrl } from '../services/Browser'
import { store } from '../store'

const authService = new AuthService({cognitoClientID:CLIENT_ID, apiURL:API_URL, developerKey:DEVELOPER_KEY, redirectURL: getRedirectUrl(), callbackURL:CALLBACK_URL});

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
    const currentSession = await authService.currentCognitoSession()
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
    const currentSession = await authService.currentCognitoSession()
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
