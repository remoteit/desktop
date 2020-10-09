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
  const { auth, backend } = store.dispatch
  
  try {
    const currentSession = await store.getState().auth.authService?.currentCognitoSession()
    const token = 'Bearer ' + currentSession?.getAccessToken().getJwtToken()
    return token
  } catch (err) {
      if(err.code === 'NetworkError') {
        backend.set({ globalError:err.message })
      } else {
        auth.signInError('Session Expired')
      }
      return ''
  }

  
}

export async function hasCredentials() {
  const { auth, backend } = store.dispatch
  try {
    await store.getState().auth.authService?.currentCognitoSession()
    return true
  } catch (err) {
    if(err.code === 'NetworkError') {
      backend.set({ globalError:err.message })
    } else {
      auth.signInError('Session Expired')
    }
    return false
  }
}
