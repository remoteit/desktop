import setup from 'remote.it'
import { API_URL, DEVELOPER_KEY, JOB_QUEUE_NAME, TASK_QUEUE_NAME } from '../constants'
import { store } from '../store'

export const r3 = setup(
  {
    apiURL: API_URL,
    developerKey: DEVELOPER_KEY,
    taskQueue: TASK_QUEUE_NAME,
    jobQueue: JOB_QUEUE_NAME,
    successURL: window.location.origin,
  },
  getToken
)

export async function getToken(withBearer = true): Promise<string> {
  try {
    const currentSession = await window.authService.currentCognitoSession()
    if (currentSession !== undefined) {
      let token = currentSession.getAccessToken().getJwtToken()
      if (withBearer) {
        token = 'Bearer ' + token
      }
      return token
    } else {
      return ''
    }
  } catch (error) {
    console.error('getToken Error:')
    console.error(error)
    if (error.code === 'NetworkError') {
      // Network error, notify?
      return ''
    } else {
      await store.dispatch.auth.signOut()
      return ''
    }
  }
}
