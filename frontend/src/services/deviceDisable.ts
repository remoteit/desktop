import { post } from './post'
import { graphQLBasicRequest } from './graphQL'

/* Disabled devices (graphql-api docs/DEVICE-DISABLE.md). "Delete" becomes Disable: the device stops serving at once and
   can be restored at any time. Decommission, offered only on a disabled device, is the final step.

   graphql's schema: disableDevices(ids, keepHosted), restoreDevices(ids), decommissionDevices(ids, confirm: true), the
   Device fields disabled / disabledAt / disabledReason, and the device list's `disabled` argument.

   Offered only where the API has it. The portal is released apart from graphql — app.<stage> from its own branch, the
   desktop app to every user, either pointed at any API — so it meets graphqls without these. There a device query that
   named `disabled` would fail every list, and deleteDevice still deletes for good, so the portal keeps its delete.
   Whether the API has them is read from its schema once, as multiPortServices and jobRunOptions read theirs. */

export type DisabledReason = 'person' | 'expired'

const FIELDS = `
  disabled
  disabledAt
  disabledReason`

let served: Promise<boolean> | undefined

const PROBE = `query DeviceDisableFields {
  mutation: __type(name: "Mutation") { fields { name } }
  device: __type(name: "Device") { fields { name } }
}`

export function parseDeviceDisableServed(data: any): boolean {
  const has = (type: any, name: string) => !!type?.fields?.some((f: { name: string }) => f.name === name)
  return (
    ['disableDevices', 'restoreDevices', 'decommissionDevices'].every(name => has(data?.mutation, name)) &&
    has(data?.device, 'disabled')
  )
}

// Whether this API has device disable. Read once; asked again after a failed request.
export function deviceDisableServed(): Promise<boolean> {
  if (!served)
    served = post({ query: PROBE }).then(response => {
      if (response === 'ERROR') {
        served = undefined
        return false
      }
      return parseDeviceDisableServed(response.data?.data)
    })
  return served
}

// For tests, and for a change of API or sign-in.
export function resetDeviceDisable() {
  served = undefined
}

// The fields a device query adds: none where the API has no disable.
export async function deviceDisableFields(): Promise<string> {
  return (await deviceDisableServed()) ? FIELDS : ''
}

export function disabledAdaptor(d: any): Partial<IDevice> {
  if (d.disabled === undefined) return {}
  return {
    disabled: !!d.disabled,
    disabledAt: d.disabledAt ? new Date(d.disabledAt) : undefined,
    disabledReason: d.disabledReason ? (String(d.disabledReason).toLowerCase() as DisabledReason) : undefined,
  }
}

// keepHosted: a gateway's virtual devices kept live (graphql's default, where it is left out), or disabled with it.
export async function graphQLDisableDevices(ids: string[], keepHosted?: boolean) {
  return await graphQLBasicRequest(
    ` mutation DisableDevices($ids: [String!]!, $keepHosted: Boolean) {
        disableDevices(ids: $ids, keepHosted: $keepHosted)
      }`,
    keepHosted === undefined ? { ids } : { ids, keepHosted }
  )
}

export async function graphQLRestoreDevices(ids: string[]) {
  return await graphQLBasicRequest(
    ` mutation RestoreDevices($ids: [String!]!) {
        restoreDevices(ids: $ids)
      }`,
    { ids }
  )
}

// graphql asks only that `confirm` be true; what the person must type to get here is the portal's (DecommissionDialog).
export async function graphQLDecommissionDevices(ids: string[]) {
  return await graphQLBasicRequest(
    ` mutation DecommissionDevices($ids: [String!]!) {
        decommissionDevices(ids: $ids, confirm: true)
      }`,
    { ids }
  )
}

export const DISABLED_PAGE_SIZE = 100

// An account's disabled devices — those the reader may manage: what the Disabled view lists.
export async function graphQLFetchDisabledDevices(accountId: string, from = 0) {
  return await graphQLBasicRequest(
    ` query DisabledDevices($accountId: String, $size: Int, $from: Int) {
        login {
          id
          account(id: $accountId) {
            devices(disabled: true, size: $size, from: $from, sort: "name") {
              total
              items {
                id
                name
                state
                platform
                permissions
                owner { id email }${FIELDS}
              }
            }
          }
        }
      }`,
    { accountId, size: DISABLED_PAGE_SIZE, from }
  )
}
