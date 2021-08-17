import setup from 'remote.it'
import { getRestApi } from '../helpers/apiHelper'
import { DEVELOPER_KEY, API_URL } from '../shared/constants'
import { store } from '../store'

console.log('API_URL', API_URL)
console.log('getApiURL()', getRestApi())

export const r3 = setup(
  {
    apiURL: getRestApi(),
    developerKey: DEVELOPER_KEY,
    successURL: window.location.origin,
  },
  getToken
)

export async function getToken(): Promise<string> {
  const { auth } = store.dispatch

  try {
    const currentSession = await store.getState().auth.authService?.currentCognitoSession()
    const token = 'Bearer ' + currentSession?.getAccessToken().getJwtToken()
    return token
  } catch (error) {
    console.error('GET TOKEN ERROR', error.message, error.code, error)
    if (error.code && error.code == 'NotAuthorizedException') {
      auth.signInError('Session Expired')
    }
    return ''
  }
}

export async function hasCredentials() {
  const { auth } = store.dispatch
  try {
    await store.getState().auth.authService?.currentCognitoSession()
    return true
  } catch (error) {
    console.error('HAS CREDENTIALS ERROR', error.message, error)
    if (error.code && error.code == 'NotAuthorizedException') {
      auth.signInError('Session Expired')
    }
    return false
  }
}
