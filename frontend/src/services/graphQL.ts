import { AxiosResponse } from 'axios'
import { post, resetErrorCount } from './post'
import { store } from '../store'

const CLIENT_DEPRECATED = '121'

export async function graphQLBasicRequest(query: String, variables: ILookup<any> = {}) {
  const response = await post({ query, variables })
  const errors = graphQLGetErrors(response, false, { query, variables })
  return errors ? 'ERROR' : response
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
    resetErrorCount()
  }

  return errors
}
