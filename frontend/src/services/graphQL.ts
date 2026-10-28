import { AxiosResponse } from 'axios'
import { post, resetErrorCount } from './post'
import { store } from '../store'

const CLIENT_DEPRECATED = '121'

export async function graphQLBasicRequest(query: String, variables: ILookup<any> = {}) {
  const response = await post({ query, variables })
  if (response === 'ERROR') return response
  const errors = graphQLGetErrors(response, false, { query, variables })
  return errors ? 'ERROR' : response
}

// A request whose refusal the caller shows itself, in graphql's own words — a refusal's reason (extensions.message),
// else the error's message, as a sentence — rather than the generic snackbar.
export async function graphQLRequestWithReason(query: String, variables: ILookup<any> = {}) {
  const response = await post({ query, variables })
  if (response === 'ERROR') return response
  const errors = graphQLGetErrors(response, true, { query, variables }) as
    | undefined
    | (Error & { extensions?: { message?: string } })[]
  if (!errors) return response
  const reason = errors[0]?.extensions?.message || errors[0]?.message || ''
  return { reason: reason.charAt(0).toUpperCase() + reason.slice(1) }
}

// For batched per-account queries: one account the token can't read must not discard the ones that resolved.
export async function graphQLPartialRequest(query: String, variables: ILookup<any> = {}) {
  const response = await post({ query, variables })
  if (response === 'ERROR') return response
  graphQLGetErrors(response, false, { query, variables })
  const fields = Object.values(response.data?.data || {})
  const resolved = fields.some(field => Object.values(field || {}).some(alias => alias != null))
  return resolved ? response : 'ERROR'
}

export function graphQLGetErrors(
  response: AxiosResponse,
  silent?: boolean,
  details?: { query: String; variables: ILookup<any> }
) {
  const { ui } = store.dispatch

  const errors: undefined | Error[] = response.data?.errors
  const warning: undefined | string = response.headers?.['X-R3-Warning']

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
