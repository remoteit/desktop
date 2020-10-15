import axios, { AxiosError } from 'axios'
import { getToken } from '../services/remote.it'
import { store } from '../store'
import { version } from '../../package.json'
import { GRAPHQL_API, GRAPHQL_BETA_API } from '../shared/constants'

export async function graphQLRequest(query: String, variables: ILookup<any> = {}) {
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
  if (error?.response?.status === 401) {
    const { auth } = store.dispatch
    auth.signInError('Session Expired')
  } else if (error?.response?.status === 403) {
    auth.checkSession()
    backend.set({ globalError: error.message })
  } else {
    backend.set({ globalError: error.message })
  }
}
