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

type TypeRef = { kind: string; ofType?: TypeRef | null }
type Served = { served: boolean; fields: string }

let schema: Promise<Served> | undefined

const PROBE = `query DeviceDisableFields {
  mutation: __type(name: "Mutation") { fields { name } }
  device: __type(name: "Device") { fields { name type { kind ofType { kind ofType { kind } } } } }
}`

const kind = (type?: TypeRef | null): string | undefined => (type?.ofType ? kind(type.ofType) : type?.kind)

// What the API serves of device disable, and the fields a device query adds for it. `disabledBy` — who disabled it —
// is read only where Device has it: a user ({ id email }) where it is an object, else as given.
export function parseDeviceDisable(data: any): Served {
  const fields: { name: string; type?: TypeRef }[] = data?.device?.fields || []
  const has = (type: any, name: string) => !!type?.fields?.some((f: { name: string }) => f.name === name)
  const served =
    ['disableDevices', 'restoreDevices', 'decommissionDevices'].every(name => has(data?.mutation, name)) &&
    has(data?.device, 'disabled')
  if (!served) return { served, fields: '' }
  const by = fields.find(f => f.name === 'disabledBy')
  if (!by) return { served, fields: FIELDS }
  return {
    served,
    fields:
      FIELDS +
      (kind(by.type) === 'OBJECT'
        ? `
  disabledBy { id email }`
        : `
  disabledBy`),
  }
}

function deviceDisable(): Promise<Served> {
  if (!schema)
    schema = post({ query: PROBE }).then(response => {
      if (response === 'ERROR') {
        schema = undefined
        return { served: false, fields: '' }
      }
      return parseDeviceDisable(response.data?.data)
    })
  return schema
}

// Whether this API has device disable. Read once; asked again after a failed request.
export async function deviceDisableServed(): Promise<boolean> {
  return (await deviceDisable()).served
}

// For tests, and for a change of API or sign-in.
export function resetDeviceDisable() {
  schema = undefined
}

// The fields a device query adds: none where the API has no disable.
export async function deviceDisableFields(): Promise<string> {
  return (await deviceDisable()).fields
}

// disabledBy, where served: a user's email (or id), or as given — not for the expiry, which disabledReason says.
export function disabledAdaptor(d: any): Partial<IDevice> {
  if (d.disabled === undefined) return {}
  const reason = d.disabledReason ? (String(d.disabledReason).toLowerCase() as DisabledReason) : undefined
  const by = d.disabledBy
  const byText = by && typeof by === 'object' ? by.email || by.id : by ? String(by) : undefined
  return {
    disabled: !!d.disabled,
    disabledAt: d.disabledAt ? new Date(d.disabledAt) : undefined,
    disabledReason: reason,
    disabledBy: reason === 'expired' || byText === 'expiry' ? undefined : byText || undefined,
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

// An account's disabled devices — those the reader may manage: what the Disabled view lists. fields:
// deviceDisableFields(), which say who disabled each where the API does.
export async function graphQLFetchDisabledDevices(accountId: string, from = 0, fields = FIELDS) {
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
                owner { id email }${fields}
              }
            }
          }
        }
      }`,
    { accountId, size: DISABLED_PAGE_SIZE, from }
  )
}
