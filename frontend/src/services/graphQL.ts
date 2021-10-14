import axios, { AxiosResponse } from 'axios'
import { getGraphQLApi, apiError } from '../helpers/apiHelper'
import { getToken } from '../services/remote.it'
import { store } from '../store'

export async function graphQLBasicRequest(query: String, variables: ILookup<any> = {}) {
  try {
    const response = await graphQLRequest(query, variables)
    const errors = await graphQLGetErrors(response)
    console.log('BASIC REQUEST GRAPHQL', response, errors)
    return errors ? 'ERROR' : response
  } catch (error) {
    await apiError(error)
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

export function graphQLGetErrors(response: AxiosResponse | 'ERROR' | void, silent?: boolean) {
  if (!response || response === 'ERROR') return
  const errors: undefined | { message: string }[] = response?.data?.errors

  if (errors) {
    errors.forEach(error => console.warn('graphQL error:', error))
    if (!silent) store.dispatch.ui.set({ errorMessage: 'GraphQL: ' + errors[0].message })
  }

  return errors
}
