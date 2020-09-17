import setup from 'remote.it'
import { API_URL, DEVELOPER_KEY } from '../shared/constants'
import { Auth } from 'aws-amplify'

export const r3 = setup(
  {
    apiURL: API_URL,
    developerKey: DEVELOPER_KEY,
    successURL: window.location.origin,
  },
  getToken
)

export async function getToken(): Promise<string> {
  const currentSession = await Auth.currentSession()
  if (currentSession !== undefined) {
    const token = 'Bearer ' + currentSession.getAccessToken().getJwtToken()
    return token
  } else {
    return ''
  }
}


export async function hasCredentials() {
  //TODO: try this
  try {
    const currentSession = await Auth.currentSession()
    if (currentSession !== undefined) {
      return true
    } else {
      return false
    }
  } catch {
    return false
  }
}
