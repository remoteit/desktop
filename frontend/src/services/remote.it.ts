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
  const { auth, ui } = store.dispatch

  try {
    const currentSession = await store.getState().auth.authService?.currentCognitoSession()
    const token = 'Bearer ' + currentSession?.getAccessToken().getJwtToken()
    return token
  } catch (error) {
    console.error('GET TOKEN ERROR', error.message, error)
    if (error.code !== 'NetworkError') {
      auth.signInError('Session Expired')
    }
    return ''
  }
}

export async function hasCredentials() {
  const { auth, ui } = store.dispatch
  try {
    await store.getState().auth.authService?.currentCognitoSession()
    return true
  } catch (err) {
    if (err.code === 'NetworkError') {
      ui.set({ errorMessage: err.message })
    } else {
      auth.signInError('Session Expired')
    }
    return false
  }
}
