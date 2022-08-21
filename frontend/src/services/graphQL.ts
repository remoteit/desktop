import axios, { AxiosResponse } from 'axios'
import { getGraphQLApi } from '../helpers/apiHelper'
import { getToken } from '../services/remote.it'
import { store } from '../store'
import sleep from './sleep'

let errorCount = 0
const CLIENT_DEPRECATED = '121'

export async function graphQLBasicRequest(query: String, variables: ILookup<any> = {}) {
  try {
    const response = await graphQLRequest(query, variables)
    const errors = graphQLGetErrors(response)
    return errors ? 'ERROR' : response
  } catch (error) {
    await apiError(error)
    return 'ERROR'
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

// We should replace the code duplication following this pattern with this code.
// export async function graphQLRequestWithErrorHandling(query: String, variables: ILookup<any> = {}, parse : any = undefined) {
//   try {
//     const result = await graphQLRequest(
//       query,
//       variables
//     )
//     const errors = graphQLGetErrors(result)
//     if(parse) {
//       await parse(result)
//     }
//     return errors ? 'ERROR' : result
//   } catch (error) {
//     await apiError(error)
//   }
// }

export function graphQLGetErrors(response: AxiosResponse | 'ERROR' | void, silent?: boolean) {
  if (!response || response === 'ERROR') return
  const { ui } = store.dispatch

  const errors: undefined | { message: string }[] = response?.data?.errors
  const warning: undefined | string = response?.headers?.['X-R3-Warning']

  if (warning) {
    const code = warning.split(' ')[0]
    if (code === CLIENT_DEPRECATED) ui.deprecated()
  }

  if (errors) {
    errors.forEach(error => console.error('graphQL error:', JSON.stringify(error, null, 2)))
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
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (errorCount > 10) {
        auth.signOut()
      }
      console.log('Incrementing error count: ', errorCount)
      await sleep(1000 * errorCount * errorCount)
      auth.checkSession({ refreshToken: true })
    } else if (error.message !== 'Network Error') {
      ui.set({ errorMessage: error.message })
    }
  }

  if (error instanceof Error) {
    ui.set({ errorMessage: error.message })
  }
}
