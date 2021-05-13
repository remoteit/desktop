import { GRAPHQL_API, GRAPHQL_BETA_API } from '../shared/constants'
import { store } from '../store'
import { version } from '../../package.json'

export function getApiURL(): string {
  if (!store) return GRAPHQL_API

  const { apiGraphqlURL, switchApi } = store.getState().backend.preferences
  const { overrides } = store.getState().backend.environment
  const apiUrl = version.includes('alpha')
    ? overrides?.betaApiURL || GRAPHQL_BETA_API
    : overrides?.apiURL || GRAPHQL_API
  return apiGraphqlURL && switchApi ? apiGraphqlURL : apiUrl
}
