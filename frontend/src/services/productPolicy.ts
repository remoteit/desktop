import { post } from './post'
import { graphQLGetErrors, graphQLRequestWithReason } from './graphQL'
import type { NetworkDeviceRole } from './graphQLDeviceNetworks'

/* Product policy for Control Link devices (graphql-api docs/PROXY-GROUPS.md §11, "Wave 4: product policy"). A product
   holds settings and grants — networks, proxies, tags — and a sync level that says what its devices get of them:
   template (copied at registration, then the device's own; the default), synced (locked and following the product, the
   device free to add its own) or enforced (the device exactly the product). The exit a device goes out through, and
   Protect, are never a product's: each device's own at every level. A device belongs to a product now
   (Device.product), apart from the one it registered with (Device.productOrigin). Changing a device's product, or a
   product's level, is previewed first: what each device gets, what becomes locked, what it loses, and what becomes its
   own.

   Offered only where the API has it, read from its schema once. graphql's half was built beside this one, so the
   schema also says how each call is made: the arguments' types, and which fields an answer has — an item marked
   `fromProduct`, a setting's `locked` reason, a product's networks — so a field graphql chose to leave out is left out
   here rather than failing the read. A mutation's answer is asked for nothing but its __typename: what the portal shows
   after one is read again. */

export type ProductSync = 'template' | 'synced' | 'enforced'
export const PRODUCT_SYNCS: ProductSync[] = ['template', 'synced', 'enforced']

// tag, network, service, setting or proxy: as graphql names it, for the preview to group by.
export type ProductItem = { kind: string; name: string }

// What a change of product, or of a product's level, does to one device: the items it is given, those that become
// locked to the product, those it loses (only a move into, or a raise to, enforced removes anything), and those that
// become its own (a detach, a move away, a product moved down to template). The lifecycle warning, where the move takes
// it from persistent to ephemeral.
export type ProductPreview = {
  deviceId: string | null
  name: string | null
  added: ProductItem[]
  locked: ProductItem[]
  removed: ProductItem[]
  unlocked: ProductItem[]
  warning: string | null
}

export type ProductNetwork = { id: string; name: string; role: NetworkDeviceRole }
export type ProductSetting = { name: string; value: any }
export type ProductDevice = { id: string; name: string; state: string | null }

// What the product page reads beside the product: its level, and each grant or list the API serves (null where not).
export type ProductPolicy = {
  sync: ProductSync
  settings: ProductSetting[] | null
  networks: ProductNetwork[] | null
  devices: ProductDevice[] | null
}

export type DeviceProductRef = { id: string; name: string; sync: ProductSync; networks: ProductNetwork[] | null }

// A device's product now and the one it registered with, and which of its tags and services the product gives it.
export type DeviceProductState = {
  product: DeviceProductRef | null
  origin: { id: string | null; name: string | null } | null
  tags: string[]
  services: string[]
}

// Why a setting is not the device's to change: its product sets it (at a level), or graphql's words for it.
export type SettingLock = { product: string | null; level: ProductSync | null; text: string | null }

// What the API serves of product policy: the device side (a device's product, attached, changed or detached with its
// preview), the product side (a product's level with its preview), and each part beside them.
export type ProductPolicyServed = {
  device: boolean
  product: boolean
  settings: boolean
  networks: boolean
  proxies: boolean
  devices: boolean
  bulk: boolean
}

export const NOTHING_SERVED: ProductPolicyServed = {
  device: false,
  product: false,
  settings: false,
  networks: false,
  proxies: false,
  devices: false,
  bulk: false,
}

/* The schema as it is read: each type's fields, each with its arguments' types as a declaration takes them ("ID!"),
   and the type it answers, unwrapped of lists and non-nulls. */

type TypeRef = { kind: string; name?: string | null; ofType?: TypeRef | null }
type Field = { name: string; kind: string; type: string | null; args: Record<string, string> }
type Type = Record<string, Field>
type Schema = Record<string, Type>

const REF = 'kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } }'

const declared = (ref?: TypeRef | null): string =>
  !ref
    ? ''
    : ref.kind === 'NON_NULL'
    ? `${declared(ref.ofType)}!`
    : ref.kind === 'LIST'
    ? `[${declared(ref.ofType)}]`
    : ref.name || ''

const named = (ref?: TypeRef | null): TypeRef | undefined => (ref?.ofType ? named(ref.ofType) : ref || undefined)

function parseType(type: any): Type | undefined {
  if (!type?.fields) return undefined
  return Object.fromEntries(
    type.fields.map((field: any): [string, Field] => {
      const answer = named(field.type)
      return [
        field.name,
        {
          name: field.name,
          kind: answer?.kind || 'SCALAR',
          type: answer?.name || null,
          args: Object.fromEntries((field.args || []).map((arg: any) => [arg.name, declared(arg.type)])),
        },
      ]
    })
  )
}

async function readTypes(names: string[]): Promise<Schema | 'ERROR'> {
  if (!names.length) return {}
  const query = `query ProductPolicySchema {
    ${names
      .map(
        (name, i) =>
          `t${i}: __type(name: "${name}") { name fields { name args { name type { ${REF} } } type { ${REF} } } }`
      )
      .join('\n    ')}
  }`
  const response = await post({ query })
  if (response === 'ERROR') return 'ERROR'
  if (graphQLGetErrors(response, true, { query, variables: {} })) return 'ERROR'
  const data = response.data?.data || {}
  const schema: Schema = {}
  names.forEach((name, i) => {
    const parsed = parseType(data[`t${i}`])
    if (parsed) schema[name] = parsed
  })
  return schema
}

// The types read first; then those they answer that the portal selects from: the previews, a device's product, a
// product's networks and devices, a setting's lock.
const FIRST = ['Query', 'Mutation', 'Device', 'DeviceProduct', 'DeviceSetting', 'Tag', 'Service', 'Proxy']

const has = (schema: Schema, type: string, ...fields: string[]) => fields.every(field => !!schema[type]?.[field])

export function parseServed(schema: Schema): ProductPolicyServed {
  const device =
    has(schema, 'Device', 'product') &&
    has(schema, 'Query', 'deviceProductPreview') &&
    has(schema, 'Mutation', 'setDeviceProduct')
  const product =
    has(schema, 'DeviceProduct', 'sync') &&
    has(schema, 'Query', 'productSyncPreview') &&
    has(schema, 'Mutation', 'setDeviceProductSync')
  if (!device && !product) return NOTHING_SERVED
  return {
    device,
    product,
    settings: product && has(schema, 'DeviceProduct', 'settings') && has(schema, 'Mutation', 'setDeviceProductSetting'),
    networks:
      product &&
      has(schema, 'DeviceProduct', 'networks') &&
      has(schema, 'Mutation', 'addDeviceProductNetwork', 'removeDeviceProductNetwork'),
    proxies:
      product && has(schema, 'Proxy', 'products') && has(schema, 'Mutation', 'addProxyProduct', 'removeProxyProduct'),
    devices: product && has(schema, 'DeviceProduct', 'devices'),
    bulk: device && has(schema, 'Mutation', 'setDevicesProduct'),
  }
}

type Read = { served: ProductPolicyServed; schema: Schema }
let reading: Promise<Read> | undefined

function read(): Promise<Read> {
  if (!reading)
    reading = (async () => {
      const first = await readTypes(FIRST)
      if (first === 'ERROR') {
        reading = undefined
        return { served: NOTHING_SERVED, schema: {} }
      }
      const served = parseServed(first)
      if (!served.device && !served.product) return { served, schema: first }
      const answered = [
        first.Query?.deviceProductPreview?.type,
        first.Query?.productSyncPreview?.type,
        first.Device?.product?.type,
        first.DeviceProduct?.networks?.type,
        first.DeviceProduct?.devices?.type,
        first.DeviceSetting?.locked?.type,
      ].filter((name, i, all): name is string => !!name && !first[name] && all.indexOf(name) === i)
      const second = await readTypes(answered)
      if (second === 'ERROR') {
        reading = undefined
        return { served: NOTHING_SERVED, schema: {} }
      }
      return { served, schema: { ...first, ...second } }
    })()
  return reading
}

// What this API serves of product policy. Read once; asked again after a failed read.
export async function productPolicyServed(): Promise<ProductPolicyServed> {
  return (await read()).served
}

// For tests, and for a change of API or sign-in.
export function resetProductPolicy() {
  reading = undefined
}

/* Selections made from the schema: each field the portal wants that the type has — an object's with the selection
   given for it (a string), or chosen from its own type's fields (a nested want); a scalar's alone. */

type Want = { [field: string]: true | string | Want }

export function select(schema: Schema, typeName: string | null | undefined, want: Want): string {
  const type = typeName ? schema[typeName] : undefined
  if (!type) return ''
  return Object.entries(want)
    .map(([name, sub]) => {
      const field = type[name]
      if (!field) return ''
      if (field.kind !== 'OBJECT' && field.kind !== 'INTERFACE') return name
      if (sub === true) return ''
      const inner = typeof sub === 'string' ? sub : select(schema, field.type, sub)
      return inner ? `${name} { ${inner} }` : ''
    })
    .filter(Boolean)
    .join(' ')
}

// One call, declared as the schema declares its arguments: a variable it has no argument for is left out. A
// mutation's answer, where it is an object, is asked only for its __typename.
export function operation(
  schema: Schema,
  root: 'Query' | 'Mutation',
  field: string,
  variables: ILookup<any>,
  selection?: string
): { query: string; variables: ILookup<any> } {
  const args = schema[root]?.[field]?.args || {}
  const names = Object.keys(variables).filter(name => args[name])
  const object = ['OBJECT', 'INTERFACE', 'UNION'].includes(schema[root]?.[field]?.kind || '')
  const asked = selection ?? (object ? '__typename' : '')
  const declaration = names.length ? `(${names.map(name => `$${name}: ${args[name]}`).join(', ')})` : ''
  const passed = names.length ? `(${names.map(name => `${name}: $${name}`).join(', ')})` : ''
  return {
    query: `${root === 'Mutation' ? 'mutation' : 'query'} ${field[0].toUpperCase()}${field.slice(1)}${declaration} {
      ${field}${passed}${asked ? ` { ${asked} }` : ''}
    }`,
    variables: Object.fromEntries(names.map(name => [name, variables[name]])),
  }
}

/* Reading what graphql answers, whichever of the shapes it chose. */

export const syncOf = (value: any): ProductSync => {
  const sync = String(value || '').toLowerCase() as ProductSync
  return PRODUCT_SYNCS.includes(sync) ? sync : 'template'
}

const items = (list: any): ProductItem[] =>
  Array.isArray(list)
    ? list.map(item =>
        item && typeof item === 'object'
          ? { kind: String(item.kind || '').toLowerCase(), name: String(item.name ?? '') }
          : { kind: '', name: String(item) }
      )
    : []

export const previewOf = (preview: any): ProductPreview => ({
  deviceId: preview?.deviceId ?? preview?.device?.id ?? null,
  name: preview?.name ?? preview?.device?.name ?? null,
  added: items(preview?.added),
  locked: items(preview?.locked),
  removed: items(preview?.removed),
  unlocked: items(preview?.unlocked),
  warning: preview?.warning || null,
})

const ROLES: NetworkDeviceRole[] = ['INITIATOR', 'TARGET', 'BOTH']

export const networkOf = (network: any): ProductNetwork => {
  const role = String(network?.role || '').toUpperCase() as NetworkDeviceRole
  return {
    id: network?.id ?? network?.network?.id ?? network?.networkId,
    name: network?.name ?? network?.network?.name ?? '',
    role: ROLES.includes(role) ? role : 'TARGET',
  }
}

// A setting's lock as graphql says it: { by, product, level } as the device's document has it, or a reason.
export function lockOf(locked: any): SettingLock | null {
  if (!locked) return null
  if (typeof locked === 'object')
    return {
      product: locked.product?.name ?? locked.product ?? null,
      level: locked.level ? syncOf(locked.level) : null,
      text: locked.reason ?? null,
    }
  return { product: null, level: null, text: typeof locked === 'string' ? locked : null }
}

const NETWORK: Want = { id: true, name: true, role: true, networkId: true, network: 'id name' }
const LOCKED: Want = { by: true, product: 'name', level: true, reason: true }
const ITEMS = 'kind name'
const PREVIEW: Want = {
  deviceId: true,
  name: true,
  device: 'id name',
  added: ITEMS,
  locked: ITEMS,
  removed: ITEMS,
  unlocked: ITEMS,
  warning: true,
}

// The fields a device setting adds where its product may lock it: none where the API has no product policy.
export async function settingPolicyFields(): Promise<string> {
  const { served, schema } = await read()
  if (!served.device) return ''
  return select(schema, 'DeviceSetting', { fromProduct: 'id name', locked: LOCKED })
}

type Answer<T> = T | 'ERROR' | { reason: string }

async function ask<T>(
  root: 'Query' | 'Mutation',
  field: string,
  variables: ILookup<any>,
  pick: (data: any) => T,
  selection?: string
): Promise<Answer<T>> {
  const { schema } = await read()
  if (!schema[root]?.[field]) return 'ERROR'
  const call = operation(schema, root, field, variables, selection)
  const result = await graphQLRequestWithReason(call.query, call.variables)
  if (result === 'ERROR' || 'reason' in result) return result
  return pick(result.data?.data?.[field])
}

/* The product side. */

export async function graphQLProductPolicy(productId: string, accountId?: string): Promise<ProductPolicy | 'ERROR'> {
  const { served, schema } = await read()
  if (!served.product) return 'ERROR'
  const fields = select(schema, 'DeviceProduct', {
    sync: true,
    ...(served.settings ? { settings: 'name value' } : {}),
    ...(served.networks ? { networks: NETWORK } : {}),
    ...(served.devices ? { devices: 'id name state' } : {}),
  })
  const query = `query DeviceProductPolicy($id: String!, $accountId: String) {
    login { account(id: $accountId) { deviceProducts(id: [$id]) { items { id ${fields} } } } }
  }`
  const variables = { id: productId, accountId }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  if (graphQLGetErrors(response, true, { query, variables })) return 'ERROR'
  const product = response.data?.data?.login?.account?.deviceProducts?.items?.[0]
  if (!product) return 'ERROR'
  return {
    sync: syncOf(product.sync),
    settings: served.settings ? (product.settings || []).map((s: any) => ({ name: s.name, value: s.value })) : null,
    networks: served.networks ? (product.networks || []).map(networkOf) : null,
    devices: served.devices
      ? (product.devices || []).map((d: any) => ({ id: d.id, name: d.name ?? d.id, state: d.state ?? null }))
      : null,
  }
}

// One preview per device of the product, or one for them all where graphql answers so.
export async function graphQLProductSyncPreview(productId: string, sync: ProductSync) {
  const { schema } = await read()
  const type = schema.Query?.productSyncPreview?.type
  return ask<ProductPreview[]>(
    'Query',
    'productSyncPreview',
    { productId, sync },
    data => (Array.isArray(data) ? data : data ? [data] : []).map(previewOf),
    select(schema, type, PREVIEW)
  )
}

// Refused without confirm where anything is removed, in graphql's words.
export const graphQLSetDeviceProductSync = (productId: string, sync: ProductSync, confirm: boolean) =>
  ask<true>('Mutation', 'setDeviceProductSync', { productId, sync, confirm }, () => true)

// null unsets it: the devices choose it themselves again.
export const graphQLSetDeviceProductSetting = (productId: string, name: string, value: any) =>
  ask<true>('Mutation', 'setDeviceProductSetting', { productId, name, value }, () => true)

export const graphQLAddDeviceProductNetwork = (productId: string, networkId: string, role: NetworkDeviceRole) =>
  ask<true>('Mutation', 'addDeviceProductNetwork', { productId, networkId, role }, () => true)

export const graphQLRemoveDeviceProductNetwork = (productId: string, networkId: string) =>
  ask<true>('Mutation', 'removeDeviceProductNetwork', { productId, networkId }, () => true)

export type ProxyGrant = { id: string; name: string; joined: boolean }

// The account's own proxies you manage, and whether the product's devices are members of each.
export async function graphQLProductProxies(productId: string, accountId?: string): Promise<ProxyGrant[] | 'ERROR'> {
  const query = `query ProductProxies($accountId: String) {
    login { id account(id: $accountId) { id proxies { id name manage products { id } } } }
  }`
  const variables = { accountId }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  if (graphQLGetErrors(response, true, { query, variables })) return 'ERROR'
  return (response.data?.data?.login?.account?.proxies || [])
    .filter((proxy: any) => proxy.manage !== false)
    .map((proxy: any) => ({
      id: proxy.id,
      name: proxy.name,
      joined: (proxy.products || []).some((product: any) => product.id === productId),
    }))
}

/* The device side. */

export async function graphQLDeviceProduct(
  deviceId: string,
  accountId?: string
): Promise<DeviceProductState | 'ERROR'> {
  const { served, schema } = await read()
  if (!served.device) return 'ERROR'
  const product = select(schema, schema.Device?.product?.type, { id: true, name: true, sync: true, networks: NETWORK })
  const fields = [
    `product { ${product || 'id name'} }`,
    select(schema, 'Device', { productOrigin: 'id name' }),
    schema.Tag?.fromProduct &&
      `tags(accountId: $accountId) { ${select(schema, 'Tag', { name: true, fromProduct: 'id' })} }`,
    schema.Service?.fromProduct && `services { ${select(schema, 'Service', { id: true, fromProduct: 'id' })} }`,
  ]
    .filter(Boolean)
    .join(' ')
  const query = `query DeviceProduct($id: [String!]!, $accountId: String) { login { id device(id: $id) { id ${fields} } } }`
  const variables = { id: [deviceId], accountId }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  if (graphQLGetErrors(response, true, { query, variables })) return 'ERROR'
  const device = response.data?.data?.login?.device?.[0]
  if (!device) return 'ERROR'
  const origin = device.productOrigin
  return {
    product: device.product
      ? {
          id: device.product.id,
          name: device.product.name ?? '',
          sync: syncOf(device.product.sync),
          networks: device.product.networks ? device.product.networks.map(networkOf) : null,
        }
      : null,
    origin: !origin
      ? null
      : typeof origin === 'object'
      ? { id: origin.id ?? null, name: origin.name ?? null }
      : { id: String(origin), name: null },
    tags: (device.tags || []).filter((tag: any) => tag.fromProduct).map((tag: any) => tag.name),
    services: (device.services || []).filter((service: any) => service.fromProduct).map((service: any) => service.id),
  }
}

// What attaching, changing or detaching (productId null) would do to the device.
export async function graphQLDeviceProductPreview(deviceId: string, productId: string | null) {
  const { schema } = await read()
  const type = schema.Query?.deviceProductPreview?.type
  return ask<ProductPreview>(
    'Query',
    'deviceProductPreview',
    { deviceId, productId },
    data => previewOf(Array.isArray(data) ? data[0] : data),
    select(schema, type, PREVIEW)
  )
}

// productId null detaches. Refused without confirm where anything would be removed, and where the lifecycle differs
// and the device's daemon cannot move its key: in graphql's words.
export const graphQLSetDeviceProduct = (deviceId: string, productId: string | null, confirm: boolean) =>
  ask<true>('Mutation', 'setDeviceProduct', { deviceId, productId, confirm }, () => true)

export const graphQLSetDevicesProduct = (deviceIds: string[], productId: string | null, confirm: boolean) =>
  ask<true>('Mutation', 'setDevicesProduct', { deviceIds, productId, confirm }, () => true)

export type ProductChoice = { id: string; name: string; sync: ProductSync }

// The account's products with their levels, to choose one to attach a device to.
export async function graphQLProductChoices(accountId?: string): Promise<ProductChoice[] | 'ERROR'> {
  const { schema } = await read()
  const query = `query ProductChoices($accountId: String) {
    login { account(id: $accountId) { deviceProducts { items { ${
      select(schema, 'DeviceProduct', { id: true, name: true, sync: true }) || 'id name'
    } } } } }
  }`
  const variables = { accountId }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  if (graphQLGetErrors(response, true, { query, variables })) return 'ERROR'
  return (response.data?.data?.login?.account?.deviceProducts?.items || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    sync: syncOf(p.sync),
  }))
}

/* A preview said in brief: per kind of item, how many devices are given, locked to, lose or keep how many of them —
   "37 devices will lose 12 tags". */

export type PreviewCount = { kind: string; devices: number; items: number }
export type PreviewSummary = {
  added: PreviewCount[]
  locked: PreviewCount[]
  removed: PreviewCount[]
  unlocked: PreviewCount[]
}

export function summarize(previews: ProductPreview[]): PreviewSummary {
  const count = (part: 'added' | 'locked' | 'removed' | 'unlocked'): PreviewCount[] => {
    const kinds = new Map<string, { devices: number; names: Set<string> }>()
    previews.forEach(preview => {
      const seen = new Set<string>()
      preview[part].forEach(item => {
        const entry = kinds.get(item.kind) || { devices: 0, names: new Set<string>() }
        entry.names.add(item.name)
        if (!seen.has(item.kind)) entry.devices++
        seen.add(item.kind)
        kinds.set(item.kind, entry)
      })
    })
    return [...kinds.entries()].map(([kind, { devices, names }]) => ({ kind, devices, items: names.size }))
  }
  return { added: count('added'), locked: count('locked'), removed: count('removed'), unlocked: count('unlocked') }
}

// Whether the change takes anything away, and so must be confirmed.
export const removes = (previews: ProductPreview[]) => previews.some(preview => preview.removed.length > 0)
