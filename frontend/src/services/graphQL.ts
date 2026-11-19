import { AxiosResponse } from 'axios'
import { post, resetErrorCount } from './post'
import { rememberPictures } from './userPictures'
import { store } from '../store'

const CLIENT_DEPRECATED = '121'

// A dropped mutation may still have reached the server, so only reads are safe to resend.
const isRead = (query: String) => !/^\s*mutation\b/.test(String(query))

export async function graphQLBasicRequest(query: String, variables: ILookup<any> = {}, silent = false) {
  const response = await post({ query, variables }, '', silent, isRead(query))
  if (response === 'ERROR') return response
  const errors = graphQLGetErrors(response, silent, { query, variables })
  if (!errors && query.includes('picture')) rememberPictures(response.data?.data)
  return errors ? 'ERROR' : response
}

// For batched per-account queries: one account the token can't read must not discard the ones that resolved.
export async function graphQLPartialRequest(query: String, variables: ILookup<any> = {}) {
  const response = await post({ query, variables }, '', false, isRead(query))
  if (response === 'ERROR') return response
  graphQLGetErrors(response, false, { query, variables })
  if (query.includes('picture')) rememberPictures(response.data?.data, response.data?.errors)
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
