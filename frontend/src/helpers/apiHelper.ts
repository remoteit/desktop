import {
  GRAPHQL_API,
  GRAPHQL_BETA_API,
  API_URL,
  WEBSOCKET_BETA_URL,
  WEBSOCKET_URL,
  TEST_HEADER,
} from '../shared/constants'

import { version } from './versionHelper'
import { store } from '../store'

export function getGraphQLApi(): string | undefined {
  if (!store) return GRAPHQL_API

  const { apiGraphqlURL, switchApi } = store.getState().backend.preferences
  const { overrides } = store.getState().backend.environment
  const defaultURL =
    version.includes('alpha') || version.includes('beta')
      ? overrides?.betaApiURL || GRAPHQL_BETA_API
      : overrides?.apiURL || GRAPHQL_API
  return apiGraphqlURL && switchApi ? apiGraphqlURL : defaultURL
}

export function getRestApi(): string | undefined {
  try {
    if (!store) return API_URL
    const { apiURL, switchApi } = store.getState().backend.preferences
    return apiURL && switchApi ? apiURL : API_URL
  } catch {
    return API_URL
  }
}

export function getWebSocketURL(): string | undefined {
  if (!store) return WEBSOCKET_URL

  const { webSocketURL, switchApi } = store.getState().backend.preferences
  const defaultURL = version.includes('alpha') || version.includes('beta') ? WEBSOCKET_BETA_URL : WEBSOCKET_URL
  return webSocketURL && switchApi ? webSocketURL : defaultURL
}

export function getTestHeader(): { [key: string]: string } {
  const testHeader = window.localStorage.getItem(TEST_HEADER)
  if (!testHeader) return {}
  const parts = testHeader.split(':')
  console.log('USING TEST HEADER', { [parts[0].trim()]: parts[1].trim() })
  return { [parts[0].trim()]: parts[1].trim() }
}

export async function apiError(error: unknown) {
  const { ui } = store.dispatch
  console.error('API ERROR:', error)
  console.trace()

  if (error instanceof Error) {
    ui.set({ errorMessage: error.message })
  }
}
