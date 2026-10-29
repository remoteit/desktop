import { post } from './post'
import { graphQLBasicRequest } from './graphQL'

/* Disabled devices (graphql-api docs/DEVICE-DISABLE.md). "Delete" becomes Disable: the device stops serving at once and
   can be restored at any time. Decommission, offered only on a disabled device, is the final step.

   Offered only where the API has it: whether it does, and the shape of what it has, is read from its schema once — the
   three mutations and their arguments, the Device fields, the device list's `disabled` filter — so nothing here names a
   field an older API lacks, and the portal keeps its delete there. */

export type DisabledReason = 'person' | 'expired'

type Mutation = { arg: string; argType: string; returnsObject: boolean }

export type DeviceDisableSchema = {
  disable: Mutation
  restore: Mutation
  decommission: Mutation & { confirm?: { name: string; type: string; boolean: boolean } }
  filter: boolean // User.devices(disabled:)
  fields: string // what a device query adds for each device
}

let schema: Promise<DeviceDisableSchema | undefined> | undefined

type TypeRef = { kind: string; name?: string; ofType?: TypeRef }
type Field = { name: string; type: TypeRef; args?: { name: string; type: TypeRef }[] }

const named = (type?: TypeRef): TypeRef | undefined => (type?.ofType ? named(type.ofType) : type)

const PROBE = `query DeviceDisableSchema {
  mutation: __type(name: "Mutation") { fields { name type { ...Ref } args { name type { ...Ref } } } }
  device: __type(name: "Device") { fields { name type { ...Ref } } }
  user: __type(name: "User") { fields { name args { name type { ...Ref } } } }
}
fragment Ref on __Type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }`

export function parseDeviceDisableSchema(data: any): DeviceDisableSchema | undefined {
  const mutations: Field[] = data?.mutation?.fields || []
  const mutation = (name: string): (Mutation & { field: Field }) | undefined => {
    const field = mutations.find(f => f.name === name)
    // The device ids: the one list argument (graphql's contract calls it `ids`; deleteDevices calls it `deviceId`).
    const arg = field?.args?.find(a => isList(a.type)) ?? field?.args?.[0]
    if (!field || !arg) return
    return { field, arg: arg.name, argType: sdl(arg.type), returnsObject: named(field.type)?.kind === 'OBJECT' }
  }
  const disable = mutation('disableDevices')
  const restore = mutation('restoreDevices')
  const decommission = mutation('decommissionDevices')
  if (!disable || !restore || !decommission) return

  const confirmArg = decommission.field.args?.find(a => a.name !== decommission.arg)
  const confirm = confirmArg && {
    name: confirmArg.name,
    type: sdl(confirmArg.type),
    boolean: named(confirmArg.type)?.name === 'Boolean',
  }

  const deviceFields: Field[] = data?.device?.fields || []
  const has = (name: string) => deviceFields.find(f => f.name === name)
  if (!has('disabled')) return
  let fields = `
  disabled`
  if (has('disabledAt'))
    fields += `
  disabledAt`
  if (has('disabledReason'))
    fields += `
  disabledReason`
  // Who disabled it: a user (its email shown), or a plain id. Not in the contract's field list; read where served.
  const by = has('disabledBy')
  if (by)
    fields +=
      named(by.type)?.kind === 'OBJECT'
        ? `
  disabledBy { id email }`
        : `
  disabledBy`

  const devices = (data?.user?.fields as Field[] | undefined)?.find(f => f.name === 'devices')
  const filter = !!devices?.args?.some(a => a.name === 'disabled')

  const strip = ({ field, ...m }: Mutation & { field: Field }) => m
  return {
    disable: strip(disable),
    restore: strip(restore),
    decommission: { ...strip(decommission), confirm },
    filter,
    fields,
  }
}

// A type as a query declares it: [String!]!
function sdl(type: TypeRef): string {
  if (type.kind === 'NON_NULL') return sdl(type.ofType!) + '!'
  if (type.kind === 'LIST') return `[${sdl(type.ofType!)}]`
  return type.name || 'String'
}

function isList(type?: TypeRef): boolean {
  if (!type) return false
  return type.kind === 'LIST' || isList(type.ofType)
}

// What this API has of device disable, or undefined where it has none. Read once; asked again after a failed request.
export function deviceDisableSchema(): Promise<DeviceDisableSchema | undefined> {
  if (!schema)
    schema = post({ query: PROBE }).then(response => {
      if (response === 'ERROR') {
        schema = undefined
        return undefined
      }
      return parseDeviceDisableSchema(response.data?.data)
    })
  return schema
}

// For tests, and for a change of API or sign-in.
export function resetDeviceDisable() {
  schema = undefined
}

// The fields a device query adds: none where the API has no disable.
export async function deviceDisableFields(): Promise<string> {
  return (await deviceDisableSchema())?.fields ?? ''
}

export function disabledAdaptor(d: any): Partial<IDevice> {
  if (d.disabled === undefined) return {}
  const by = d.disabledBy
  return {
    disabled: !!d.disabled,
    disabledAt: d.disabledAt ? new Date(d.disabledAt) : undefined,
    disabledReason: d.disabledReason ? (String(d.disabledReason).toLowerCase() as DisabledReason) : undefined,
    disabledBy: by ? (typeof by === 'object' ? by.email || by.id : String(by)) : undefined,
  }
}

async function mutate(name: 'disableDevices' | 'restoreDevices', key: 'disable' | 'restore', ids: string[]) {
  const disable = await deviceDisableSchema()
  if (!disable) return 'ERROR'
  const { arg, argType, returnsObject } = disable[key]
  return await graphQLBasicRequest(
    ` mutation ${name[0].toUpperCase() + name.slice(1)}($ids: ${argType}) {
        ${name}(${arg}: $ids)${returnsObject ? ' { __typename }' : ''}
      }`,
    { ids }
  )
}

export const graphQLDisableDevices = (ids: string[]) => mutate('disableDevices', 'disable', ids)

export const graphQLRestoreDevices = (ids: string[]) => mutate('restoreDevices', 'restore', ids)

// confirm: what the person typed (the device's name, or how many) — true where graphql takes a Boolean, else as typed.
export async function graphQLDecommissionDevices(ids: string[], typed: string) {
  const disable = await deviceDisableSchema()
  if (!disable) return 'ERROR'
  const { arg, argType, returnsObject, confirm } = disable.decommission
  const confirmParam = confirm ? `, $confirm: ${confirm.type}` : ''
  const confirmArg = confirm ? `, ${confirm.name}: $confirm` : ''
  return await graphQLBasicRequest(
    ` mutation DecommissionDevices($ids: ${argType}${confirmParam}) {
        decommissionDevices(${arg}: $ids${confirmArg})${returnsObject ? ' { __typename }' : ''}
      }`,
    { ids, ...(confirm ? { confirm: confirm.boolean ? true : typed } : {}) }
  )
}

export const DISABLED_PAGE_SIZE = 100

// An account's disabled devices: what the Disabled view lists. Only where the list takes the `disabled` filter.
export async function graphQLFetchDisabledDevices(accountId: string, from = 0) {
  const disable = await deviceDisableSchema()
  if (!disable?.filter) return 'ERROR'
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
                owner { id email }${disable.fields}
              }
            }
          }
        }
      }`,
    { accountId, size: DISABLED_PAGE_SIZE, from }
  )
}
