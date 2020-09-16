import axios, { AxiosError } from 'axios'
import { getToken } from '../services/remote.it'
import { store } from '../store'
import { version } from '../../package.json'
import { GRAPHQL_API, GRAPHQL_BETA_API } from '../shared/constants'

export async function graphQLRequest(query: String, variables: ILookup = {}) {
  const request = {
    url: version.includes('alpha') ? GRAPHQL_BETA_API : GRAPHQL_API,
    method: 'post' as 'post',
    headers: { Authorization: await getToken() },
    data: { query, variables },
  }
  console.log('GRAPHQL REQUEST', request)
  return await axios.request(request)
}

export async function graphQLGetErrors(gqlData: any) {
  const { errors } = gqlData?.data

  if (errors) {
    errors.forEach((error: Error) => console.warn('graphQL error:', error))
    store.dispatch.backend.set({ globalError: 'GraphQL: ' + errors[0].message })
  }

  return errors
}

export async function graphQLHandleError(error: AxiosError) {
  const { auth, backend } = store.dispatch

  console.error('GraphQL fetch error:', error, error.response)
  if (error && error.response && (error.response.status === 401 || error.response.status === 403)) {
    auth.checkSession()
  } else if (error.response) {
    backend.set({ globalError: error.message })
  }
  // else no response, no network connection - so don't display error
}
