import axios, { AxiosError, AxiosResponse } from 'axios'
import { getToken } from '../services/remote.it'
import { store } from '../store'
import { getGraphQLApi } from '../helpers/apiHelper'

export async function graphQLBasicRequest(query: String, variables: ILookup<any> = {}) {
  try {
    const response = await graphQLRequest(query, variables)
    await graphQLGetErrors(response)
    console.log('BASIC REQUEST GRAPHQL', response)
    return response
  } catch (error) {
    await graphQLCatchError(error)
  }
}

export async function graphQLRequest(query: String, variables: ILookup<any> = {}): Promise<undefined | AxiosResponse> {
  if (store.getState().ui.offline) return
  const token = await getToken()
  if (!token) {
    console.warn('Unable to get token for graphQL request.')
    return
  }

  const request = {
    url: getGraphQLApi(),
    method: 'post' as 'post',
    headers: { Authorization: token },
    data: { query, variables },
  }
  console.log('GRAPHQL REQUEST', { query, variables, url: request.url })
  return await axios.request(request)
}

export function graphQLGetErrors(response: AxiosResponse | void, silent?: boolean) {
  if (!response) return
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
