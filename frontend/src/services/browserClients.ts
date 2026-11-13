import { graphQLBasicRequest } from './graphQL'

/* Browsers' remote.it clients in the device list. The portal registers each browser's client as the Browser platform
   (graphql-api db/migrations/2026-11-24-browser-platform-type.sql; services/browserGateway.ts handoff): a person's own
   browsers, made for them, not devices they added. The list leaves them out unless the filter asks for them —
   devices(browser:), sent only where the API has it, so a list on an API without it is as it was. */

export const BROWSER_PLATFORM = 1231

export type BrowsersShown = 'hide' | 'show' | 'only'

// The list's devices(browser:) for what the filter shows: false leaves them out (the default), true lists only them.
export function browserArg(shown: BrowsersShown | undefined): boolean | undefined {
  if (shown === 'only') return true
  if (shown === 'show') return undefined
  return false
}

let schema: Promise<boolean> | undefined

// Whether the API's device list takes `browser`. Asked once; a failure is asked again next time.
export function browserFilterServed(): Promise<boolean> {
  if (!schema)
    schema = graphQLBasicRequest(`query BrowserFilterFields { user: __type(name: "User") { fields { name args { name } } } }`).then(
      response => {
        if (response === 'ERROR') {
          schema = undefined
          return false
        }
        const devices = (response.data?.data?.user?.fields || []).find((f: { name: string }) => f.name === 'devices')
        return !!devices?.args?.some((arg: { name: string }) => arg.name === 'browser')
      }
    )
  return schema
}

export function resetBrowserFilter() {
  schema = undefined
}
