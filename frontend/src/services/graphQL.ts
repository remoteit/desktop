import axios, { AxiosResponse } from 'axios'
import { post } from './post'
import { store } from '../store'
import network from './Network'
import sleep from '../helpers/sleep'

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
  return await post({ query, variables })
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

    if (!navigator.onLine) network.offline()

    if (error.response?.status === 429) {
      ui.set({
        errorMessage:
          'API request failure. Your API usage has been throttled. Check the usage on your account and if issues persist please contact support.',
      })
      return
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      if (errorCount > 10) {
        auth.signOut()
      }
      console.log('Incrementing error count: ', errorCount)
      await sleep(1000 * errorCount * errorCount)
      auth.checkSession({ refreshToken: true })
    }
  }

  if (error instanceof Error || axios.isAxiosError(error)) {
    ui.set({ errorMessage: error.message })
  }
}
