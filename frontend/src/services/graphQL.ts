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

export function graphQLGetErrors(response: any, silent?: boolean) {
  const errors: undefined | { message: string }[] = response?.data?.errors

  if (errors) {
    errors.forEach(error => console.warn('graphQL error:', error))
    if (!silent) store.dispatch.ui.set({ errorMessage: 'GraphQL: ' + errors[0].message })
  }

  return errors
}

export async function graphQLHandleError(error: AxiosError) {
  const { auth, ui } = store.dispatch
  console.error('GraphQL fetch error:', error, error?.response?.status)
  if (error?.response?.status === 401) {
    auth.signInError('Session Expired')
  } else if (error?.response?.status === 403) {
    auth.checkSession()
    ui.set({ errorMessage: error.message })
  } else if (error.message === 'Network Error') {
    // hide network disconnected error
  } else {
    ui.set({ errorMessage: error.message })
  }
}
