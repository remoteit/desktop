import { GRAPHQL_API, GRAPHQL_BETA_API } from '../../src/constants'
import { store } from '../store'
import { version } from '../../package.json'

export function getApiURL(): string {
  if (!store) return GRAPHQL_API

  const apiUrl = version.includes('alpha')
    ?  GRAPHQL_BETA_API
    :  GRAPHQL_API
  return  apiUrl
}
