import axios from 'axios'
import { GRAPHQL_API, GRAPHQL_BETA_API, API_URL, WEBSOCKET_BETA_URL, WEBSOCKET_URL } from '../shared/constants'
import { store } from '../store'
import { version } from '../../package.json'

export function getGraphQLApi(): string {
  if (!store) return GRAPHQL_API

  const { apiGraphqlURL, switchApi } = store.getState().backend.preferences
  const { overrides } = store.getState().backend.environment
  const defaultURL = version.includes('alpha')
    ? overrides?.betaApiURL || GRAPHQL_BETA_API
    : overrides?.apiURL || GRAPHQL_API
  return apiGraphqlURL && switchApi ? apiGraphqlURL : defaultURL
}

export function getRestApi(): string {
  try {
    if (!store) return API_URL
    const { apiURL, switchApi } = store.getState().backend.preferences
    return apiURL && switchApi ? apiURL : API_URL
  } catch {
    return API_URL
  }
}

export function getWebSocketURL(): string {
  if (!store) return WEBSOCKET_URL

  const { webSocketURL, switchApi } = store.getState().backend.preferences
  const defaultURL = version.includes('alpha') ? WEBSOCKET_BETA_URL : WEBSOCKET_URL
  return webSocketURL && switchApi ? webSocketURL : defaultURL
}

export async function apiError(error: unknown) {
  const { ui, auth } = store.dispatch
  console.error('API ERROR:', error)
  console.trace()

  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      auth.checkSession()
    } else if (error.message !== 'Network Error') {
      ui.set({ errorMessage: error.message })
    }
  }

  if (error instanceof Error) {
    ui.set({ errorMessage: error.message })
  }
}
