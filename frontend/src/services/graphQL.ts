import axios, { AxiosError } from 'axios'
import { getToken } from '../services/remote.it'
import { store } from '../store'
import { version } from '../../package.json'
import { GRAPHQL_API, GRAPHQL_BETA_API } from '../shared/constants'

export async function graphQLBasicRequest(query: String, variables: ILookup<any> = {}) {
  try {
    const response = await graphQLRequest(query, variables)
    await graphQLGetErrors(response)
    return response
  } catch (error) {
    await graphQLCatchError(error)
  }
}

export async function graphQLRequest(query: String, variables: ILookup<any> = {}) {
  const token = await getToken()

  if (!token) throw new Error('Unable to retrieve data')

  const request = {
    url: version.includes('alpha') ? GRAPHQL_BETA_API : GRAPHQL_API,
    method: 'post' as 'post',
    headers: { Authorization: token },
    data: { query, variables },
  }
  console.log('GRAPHQL REQUEST', { query, variables, url: request.url })
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

export async function graphQLCatchError(error: AxiosError) {
  const { auth, ui } = store.dispatch
  console.error('GRAPHQL FETCH ERROR:', error, error?.response?.status)
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    auth.checkSession()
  } else if (error.message !== 'Network Error') {
    ui.set({ errorMessage: error.message })
  }
}
