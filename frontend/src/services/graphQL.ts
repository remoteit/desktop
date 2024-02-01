import axios, { AxiosResponse } from 'axios'
import { getGraphQLApi, getTestHeader } from '../helpers/apiHelper'
import { getToken } from './remoteit'
import { store } from '../store'
import sleep from './sleep'

let errorCount = 0
const CLIENT_DEPRECATED = '121'

export async function graphQLBasicRequest(query: String, variables: ILookup<any> = {}) {
  try {
    const response = await graphQLRequest(query, variables)
    const errors = graphQLGetErrors(response, false, { query, variables })
    return errors ? 'ERROR' : response
  } catch (error) {
    console.error('GRAPHQL QUERY ERROR', { query, variables })
    await apiError(error)
    return 'ERROR'
  }
}

export async function graphQLRequest(query: String, variables: ILookup<any> = {}): Promise<undefined | AxiosResponse> {
  if (store.getState().ui.offline) return
  const token = await getToken()
  if (!token) {
    console.warn('Unable to get token for graphQL request.', query, variables)
    return
  }
  const request = {
    url: getGraphQLApi(),
    method: 'post' as 'post',
    headers: { Authorization: token, ...getTestHeader() },
    data: { query, variables },
  }

  return await axios.request(request)
}

export function graphQLGetErrors(
  response: AxiosResponse | 'ERROR' | void,
  silent?: boolean,
  details?: { query: String; variables: ILookup<any> }
) {
  if (!response || response === 'ERROR') return
  const { ui } = store.dispatch

  const errors: undefined | Error[] = response?.data?.errors
  const warning: undefined | string = response?.headers?.['X-R3-Warning']

  if (warning) {
    const code = warning.split(' ')[0]
    if (code === CLIENT_DEPRECATED) ui.deprecated()
  }

  if (errors) {
    errors.forEach(error => {
      console.error('graphQL error:', JSON.stringify(error, null, 2))
      if (details) console.error('graphQL error details:', JSON.stringify(details, null, 2))
    })
    if (!silent)
      store.dispatch.ui.set({
        errorMessage:
          'GraphQL: ' + errors[0].message + (errors.length > 1 ? ` (+${errors.length - 1} more errors)` : ''),
      })
  } else {
    errorCount = 0 //Set error count back to 0, no errors
  }

  return errors
}

export async function apiError(error: unknown) {
  const { ui, auth } = store.dispatch
  console.error('API ERROR:', error)
  console.trace()
  errorCount = errorCount + 1

  if (axios.isAxiosError(error)) {
    console.error('AXIOS ERROR DETAILS:', { ...error })
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (errorCount > 10) {
        auth.signOut()
      }
      console.log('Incrementing error count: ', errorCount)
      await sleep(1000 * errorCount * errorCount)
      auth.checkSession({ refreshToken: true })
    } else if (error.code === 'ERR_NETWORK') {
      ui.set({
        errorMessage:
          'API request failure. Your API usage may be throttled. Check the usage on your account and if issues persist please contact support.',
      })
    }
  }

  if ((error instanceof Error || axios.isAxiosError(error)) && error.message !== 'Network Error') {
    ui.set({ errorMessage: error.message })
  }
}
