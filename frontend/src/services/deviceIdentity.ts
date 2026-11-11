import { post } from './post'
import { graphQLBasicRequest, graphQLRequestWithReason } from './graphQL'
import { SchemaField, TypeRef, buildCall, named } from './graphQLSchema'
import { deviceDisableFields, disabledAdaptor } from './deviceDisable'

/* A device's identity (graphql-api docs/PROXY-GROUPS.md §11, "Wave 3: device identity"): the join keys that bring a
   device that starts fresh at every boot back as itself, a device added ahead of its first boot, and duplicates — two
   machines holding one device's identity.

   graphql's names: createDeviceJoinKey(deviceId, name, expires) answering { id name key }, revokeDeviceJoinKey(deviceId,
   id), revokeDeviceJoinKeys(deviceId) and Device.joinKeys { id name created expires revoked lastUsed boots stale };
   addDevice(name, productId, freshBoot); Device.duplicateOf and Device.duplicate { kind since address }; Device.copies,
   and Device.copyCount (counted for a page of devices in one query) where the API has it;
   keepDuplicate(deviceId, fromOriginal), keepDuplicates(deviceIds), makeOriginal(deviceId) and
   addDuplicateDevice(deviceId, name).

   The portal is released apart from graphql, so what the API serves of these is read from its schema once, as
   deviceDisable reads its own: a query names only the fields the API has, a mutation's variables take the types the
   API declares, and what an API without them lacks is not offered. */

export type DeviceJoinKey = {
  id: string
  name: string
  created: string
  expires: string | null
  revoked: string | null
  lastUsed: string | null
  boots: number
  stale: boolean // in force with no boot for 30 days: a suggestion to revoke it, only
  inForce?: boolean // it brings the device back now, by graphql's clock, where the API says
}

// A copy split off a device's identity, disabled until its owner decides: what the devices list groups under the device.
export type DuplicateCopy = Pick<IDevice, 'id' | 'name' | 'disabledAt' | 'duplicateOf'> & {
  platform?: number
  owner?: IUserRef
  permissions: IPermission[]
}

export const MUTATIONS = [
  'createDeviceJoinKey',
  'revokeDeviceJoinKey',
  'revokeDeviceJoinKeys',
  'addDevice',
  'keepDuplicate',
  'keepDuplicates',
  'makeOriginal',
  'addDuplicateDevice',
] as const

type Mutation = (typeof MUTATIONS)[number]

export type IdentityServed = {
  joinKeys: boolean // a device's join keys: listed, issued, revoked one by one and all at once
  addDevice: boolean
  duplicates: boolean // Device.duplicateOf and Device.duplicate
  copyCount: boolean // Device.copyCount and Device.copies: a listed device's copies read by the device, not by a scan
} & Record<'keepDuplicate' | 'keepDuplicates' | 'makeOriginal' | 'addDuplicateDevice', boolean>

type Identity = {
  served: IdentityServed
  fields: string // what a device query adds
  keyFields: string // a join key's, as Device.joinKeys lists it
  mutations: Partial<Record<Mutation, SchemaField>>
  selections: Partial<Record<Mutation, string>>
}

const NONE: Identity = {
  served: {
    joinKeys: false,
    addDevice: false,
    duplicates: false,
    copyCount: false,
    keepDuplicate: false,
    keepDuplicates: false,
    makeOriginal: false,
    addDuplicateDevice: false,
  },
  fields: '',
  keyFields: '',
  mutations: {},
  selections: {},
}

const KEY_FIELDS = ['id', 'name', 'created', 'expires', 'revoked', 'lastUsed', 'boots', 'stale', 'inForce']
// Beyond the contract's kind, since and address, where the API has them: when it was last seen, roughly where, and the
// device added for the other machine until it first starts.
const DUPLICATE_FIELDS = ['kind', 'since', 'seen', 'address', 'place']
// What an answer that makes something hands back, at its top or one object down (a device, a join key).
const ANSWER_FIELDS = ['id', 'name', 'key', 'deviceId']

const TYPE_REF = 'kind name ofType { kind name ofType { kind name ofType { kind name } } }'
const PROBE = `query DeviceIdentityFields {
  mutation: __type(name: "Mutation") { fields { name args { name type { ${TYPE_REF} } } type { ${TYPE_REF} } } }
  device: __type(name: "Device") { fields { name type { ${TYPE_REF} } } }
}`
// The fields of the types those answers and lists are, and of their object fields one level down.
const WITH_FIELDS = 'kind name fields { name }'
const TYPE_FIELDS = `fields { name type { ${WITH_FIELDS} ofType { ${WITH_FIELDS} ofType { ${WITH_FIELDS} } } } }`

type Typed = SchemaField & { type?: TypeRef & { fields?: { name: string }[] | null } }

const fieldNames = (type?: { fields?: { name: string }[] | null } | null) =>
  new Set((type?.fields || []).map(f => f.name))

// The object fields' type, with its fields where the probe read them.
const objectOf = (field: Typed) => named(field.type) as (TypeRef & { fields?: { name: string }[] | null }) | undefined

function answerSelection(fields: Typed[]): string {
  return fields
    .flatMap(field => {
      const type = objectOf(field)
      if (type?.kind !== 'OBJECT') return ANSWER_FIELDS.includes(field.name) ? [field.name] : []
      const inner = ANSWER_FIELDS.filter(name => fieldNames(type).has(name))
      return inner.length ? [`${field.name} { ${inner.join(' ')} }`] : []
    })
    .join(' ')
}

// What the API serves, from the probe of Mutation and Device and, for the few types the calls select from, theirs.
export function parseDeviceIdentity(data: any, types: Record<string, Typed[]> = {}): Identity {
  const mutationFields: SchemaField[] = data?.mutation?.fields || []
  const deviceFields: SchemaField[] = data?.device?.fields || []
  const device = new Map(deviceFields.map(f => [f.name, f]))
  const mutations: Identity['mutations'] = {}
  for (const field of mutationFields)
    if ((MUTATIONS as readonly string[]).includes(field.name)) mutations[field.name as Mutation] = field
  const fieldsOfType = (field?: SchemaField) => types[named(field?.type)?.name || ''] || []
  const pick = (wanted: string[], field?: SchemaField) => {
    const has = new Set(fieldsOfType(field).map(f => f.name))
    return wanted.filter(name => has.has(name)).join(' ')
  }

  const keyFields = pick(KEY_FIELDS, device.get('joinKeys'))
  const joinKeys =
    keyFields.split(' ').includes('id') &&
    !!mutations.createDeviceJoinKey &&
    !!mutations.revokeDeviceJoinKey &&
    !!mutations.revokeDeviceJoinKeys

  // duplicateOf: the original as { id name } where it is a device, else its id as given.
  const of = device.get('duplicateOf')
  const flagFields = fieldsOfType(device.get('duplicate'))
  const duplicateFields = [
    pick(DUPLICATE_FIELDS, device.get('duplicate')),
    flagFields.some(f => f.name === 'replacement' && objectOf(f)?.kind === 'OBJECT') && 'replacement { id name }',
  ]
    .filter(Boolean)
    .join(' ')
  const duplicates = !!of
  const copyCount = duplicates && !!device.get('copyCount') && !!device.get('copies')
  const fields = [
    of && (named(of.type)?.kind === 'OBJECT' ? 'duplicateOf { id name }' : 'duplicateOf'),
    duplicateFields && `duplicate { ${duplicateFields} }`,
    copyCount && 'copyCount',
  ]
    .filter(Boolean)
    .map(line => `\n  ${line}`)
    .join('')

  const selections: Identity['selections'] = {}
  for (const name of ['createDeviceJoinKey', 'addDevice', 'addDuplicateDevice'] as const)
    if (mutations[name]) selections[name] = answerSelection(fieldsOfType(mutations[name]))

  return {
    served: {
      joinKeys,
      addDevice: !!mutations.addDevice,
      duplicates,
      copyCount,
      keepDuplicate: duplicates && !!mutations.keepDuplicate,
      keepDuplicates: duplicates && !!mutations.keepDuplicates,
      makeOriginal: duplicates && !!mutations.makeOriginal,
      addDuplicateDevice: duplicates && !!mutations.addDuplicateDevice,
    },
    fields,
    keyFields,
    mutations,
    selections,
  }
}

// The types whose fields the calls select from: a join key's, a duplicate flag's, and what the answers that make
// something are. Their names come from the schema, so they are only ever GraphQL names.
export function typesToRead(data: any): string[] {
  const names = new Set<string>()
  const add = (field?: SchemaField) => {
    const type = named(field?.type)
    if (type?.kind === 'OBJECT' && type.name && /^\w+$/.test(type.name)) names.add(type.name)
  }
  for (const field of (data?.device?.fields || []) as SchemaField[])
    if (field.name === 'joinKeys' || field.name === 'duplicate') add(field)
  for (const field of (data?.mutation?.fields || []) as SchemaField[])
    if (['createDeviceJoinKey', 'addDevice', 'addDuplicateDevice'].includes(field.name)) add(field)
  return [...names]
}

let schema: Promise<Identity> | undefined

function deviceIdentity(): Promise<Identity> {
  if (!schema)
    schema = (async () => {
      const response = await post({ query: PROBE })
      if (response === 'ERROR') {
        schema = undefined
        return NONE
      }
      const data = response.data?.data
      const wanted = typesToRead(data)
      const types: Record<string, Typed[]> = {}
      if (wanted.length) {
        const query = `query DeviceIdentityTypes {
${wanted.map((name, i) => `  t${i}: __type(name: "${name}") { ${TYPE_FIELDS} }`).join('\n')}
}`
        const read = await post({ query })
        if (read === 'ERROR') {
          schema = undefined
          return NONE
        }
        wanted.forEach((name, i) => (types[name] = read.data?.data?.[`t${i}`]?.fields || []))
      }
      return parseDeviceIdentity(data, types)
    })()
  return schema
}

// What this API serves of device identity. Read once; asked again after a failed read.
export async function deviceIdentityServed(): Promise<IdentityServed> {
  return (await deviceIdentity()).served
}

// For tests, and for a change of API or sign-in.
export function resetDeviceIdentity() {
  schema = undefined
  copies.clear()
  reading.clear()
  byOriginal = new Map()
  readingOf.clear()
}

// The fields a device query adds: none where the API has no duplicates.
export async function deviceIdentityFields(): Promise<string> {
  return (await deviceIdentity()).fields
}

// A duplicate's kind as graphql spells it — device-join-key or key — whether it is served as a string or an enum.
const kindOf = (kind: unknown) =>
  String(kind ?? '')
    .toLowerCase()
    .replace(/_/g, '-')

export function identityAdaptor(d: any): Partial<IDevice> {
  const result: Partial<IDevice> = {}
  if (d.copyCount !== undefined) result.copyCount = Number(d.copyCount) || 0
  if (d.duplicateOf !== undefined)
    result.duplicateOf = !d.duplicateOf
      ? undefined
      : typeof d.duplicateOf === 'object'
      ? { id: d.duplicateOf.id, name: d.duplicateOf.name ?? undefined }
      : { id: String(d.duplicateOf) }
  if (d.duplicate !== undefined)
    result.duplicate = d.duplicate
      ? {
          kind: kindOf(d.duplicate.kind),
          since: d.duplicate.since ? new Date(d.duplicate.since) : undefined,
          seen: d.duplicate.seen ? new Date(d.duplicate.seen) : undefined,
          address: d.duplicate.address || undefined,
          place: d.duplicate.place || undefined,
          replacement: d.duplicate.replacement?.id
            ? { id: d.duplicate.replacement.id, name: d.duplicate.replacement.name ?? undefined }
            : undefined,
        }
      : undefined
  return result
}

type Outcome<T = unknown> = { ok: true; data: T } | { ok: false; reason: string }

// One of the identity mutations, as the API declares it. A refusal comes back in graphql's words, for the page to show;
// '' where none was said.
async function identityMutation(name: Mutation, variables: ILookup<any>): Promise<Outcome<any>> {
  const served = await deviceIdentity()
  const field = served.mutations[name]
  if (!field) return { ok: false, reason: '' }
  const request = buildCall('mutation', field, variables, served.selections[name] || '__typename')
  const response = await graphQLRequestWithReason(request.query, request.variables)
  if (response === 'ERROR') return { ok: false, reason: '' }
  if ('reason' in response) return { ok: false, reason: response.reason }
  return { ok: true, data: response.data?.data?.[name] }
}

// A device made by an answer (addDevice, addDuplicateDevice): its id and name, and the device join key shown this once,
// wherever in the answer graphql puts them.
export function madeDevice(answer: any): { deviceId?: string; name?: string; key?: string } {
  if (answer == null) return {}
  if (typeof answer !== 'object')
    return String(answer).startsWith('r3dk_') ? { key: String(answer) } : { deviceId: String(answer) }
  const device = answer.device && typeof answer.device === 'object' ? answer.device : undefined
  return {
    deviceId: answer.deviceId ?? device?.id ?? answer.id ?? undefined,
    name: device?.name ?? answer.name ?? undefined,
    key: answer.key ?? answer.joinKey?.key ?? device?.key ?? undefined,
  }
}

const failed = (outcome: Outcome): string | undefined => (outcome.ok ? undefined : outcome.reason)

// A device's join keys, newest first as graphql lists them: null where the API has none, or the device cannot be read.
export async function graphQLDeviceJoinKeys(deviceId: string): Promise<DeviceJoinKey[] | null | 'ERROR'> {
  const served = await deviceIdentity()
  if (!served.served.joinKeys) return null
  const response = await graphQLBasicRequest(
    ` query DeviceJoinKeys($id: [String!]!) {
        login {
          device(id: $id) {
            id
            joinKeys { ${served.keyFields} }
          }
        }
      }`,
    { id: [deviceId] }
  )
  if (response === 'ERROR') return 'ERROR'
  const device = response?.data?.data?.login?.device?.[0]
  if (!device) return null
  return (device.joinKeys || []).map((k: any) => ({
    id: k.id,
    name: k.name ?? '',
    created: k.created,
    expires: k.expires ?? null,
    revoked: k.revoked ?? null,
    lastUsed: k.lastUsed ?? null,
    boots: k.boots ?? 0,
    stale: !!k.stale,
    inForce: typeof k.inForce === 'boolean' ? k.inForce : undefined,
  }))
}

// The answer carries the key itself, once: the caller hands it to the person and keeps it nowhere.
export async function graphQLCreateDeviceJoinKey(
  deviceId: string,
  name: string,
  expires?: string
): Promise<{ key?: string; reason?: string }> {
  const outcome = await identityMutation('createDeviceJoinKey', { deviceId, name, expires })
  if (!outcome.ok) return { reason: outcome.reason }
  const key = outcome.data?.key ?? outcome.data?.joinKey?.key
  return key ? { key } : { reason: '' }
}

export async function graphQLRevokeDeviceJoinKey(deviceId: string, id: string) {
  return failed(await identityMutation('revokeDeviceJoinKey', { deviceId, id }))
}

// Every key of the device: it cannot come back until a new key is issued.
export async function graphQLRevokeDeviceJoinKeys(deviceId: string) {
  return failed(await identityMutation('revokeDeviceJoinKeys', { deviceId }))
}

// A device added ahead of its first boot: never online, a Control Link device from the start. With freshBoot its first
// device join key comes in the answer, shown once.
export async function graphQLAddDevice(input: {
  name: string
  productId?: string
  freshBoot: boolean
  accountId?: string // with no product, the account it is added to, where the API takes one
}): Promise<{ deviceId?: string; name?: string; key?: string; reason?: string }> {
  const outcome = await identityMutation('addDevice', input)
  return outcome.ok ? madeDevice(outcome.data) : { reason: outcome.reason }
}

// A copy kept as a new device: enabled, starting from its original's setup (services, tags, product) unless
// fromOriginal is false.
export async function graphQLKeepDuplicate(deviceId: string, fromOriginal: boolean) {
  return failed(await identityMutation('keepDuplicate', { deviceId, fromOriginal }))
}

export async function graphQLKeepDuplicates(deviceIds: string[]) {
  return failed(await identityMutation('keepDuplicates', { deviceIds }))
}

// The copy's machine becomes the original and the original's the copy, disabled.
export async function graphQLMakeOriginal(deviceId: string) {
  return failed(await identityMutation('makeOriginal', { deviceId }))
}

// For a device whose join key is on two machines: a new device with its setup and a fresh device join key, shown once,
// for whichever machine is to be the new device.
export async function graphQLAddDuplicateDevice(
  deviceId: string,
  name: string
): Promise<{ deviceId?: string; name?: string; key?: string; reason?: string }> {
  const outcome = await identityMutation('addDuplicateDevice', { deviceId, name })
  return outcome.ok ? madeDevice(outcome.data) : { reason: outcome.reason }
}

/* The copies awaiting their owner's decision: disabled, so left out of the device lists. Where the API counts each
   device's copies (Device.copyCount), read by the devices listed with any — one query for them all, from each
   one's Device.copies —, kept by the device each copies. Otherwise read from the account's disabled devices — those
   the reader may manage — to be grouped under the device each copies. Kept for the session, read again on request. */

const COPIES_PAGE = 100
const COPIES_MAX = 1000

type Listener = () => void
const copies = new Map<string, DuplicateCopy[]>()
const reading = new Map<string, Promise<void>>()
const listeners = new Set<Listener>()

export const duplicateCopies = (accountId: string): DuplicateCopy[] | undefined => copies.get(accountId)

// Each original's copies as read by it (Device.copies), a new map each time one is read.
let byOriginal = new Map<string, DuplicateCopy[]>()
const readingOf = new Map<string, Promise<void>>()
export const copiesByOriginal = () => byOriginal
const notify = () => listeners.forEach(listener => listener())

export function subscribeDuplicateCopies(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// A copy as a device read gives it: one split off another device, and disabled.
const copyOf = (d: any): DuplicateCopy | undefined => {
  const identityOf = identityAdaptor(d)
  if (!identityOf.duplicateOf) return undefined
  const disabledOf = disabledAdaptor(d)
  if (!disabledOf.disabled) return undefined
  return {
    id: d.id,
    name: d.name,
    platform: d.platform ?? undefined,
    owner: d.owner ?? undefined,
    permissions: d.permissions || [],
    disabledAt: disabledOf.disabledAt,
    duplicateOf: identityOf.duplicateOf,
  }
}

export async function graphQLFetchDuplicateCopies(accountId: string): Promise<DuplicateCopy[] | 'ERROR'> {
  const identity = await deviceIdentity()
  if (!identity.served.duplicates) return []
  const disabled = await deviceDisableFields()
  if (!disabled) return []
  const found: DuplicateCopy[] = []
  for (let from = 0; from < COPIES_MAX; from += COPIES_PAGE) {
    const response = await graphQLBasicRequest(
      ` query DuplicateCopies($accountId: String, $size: Int, $from: Int) {
          login {
            id
            account(id: $accountId) {
              devices(disabled: true, size: $size, from: $from, sort: "name") {
                total
                items {
                  id
                  name
                  platform
                  permissions
                  owner { id email }${disabled}${identity.fields}
                }
              }
            }
          }
        }`,
      { accountId, size: COPIES_PAGE, from }
    )
    if (response === 'ERROR') return 'ERROR'
    const devices = response?.data?.data?.login?.account?.devices
    const items: any[] = devices?.items || []
    for (const d of items) {
      const copy = copyOf(d)
      if (copy) found.push(copy)
    }
    if (from + items.length >= (devices?.total || 0) || !items.length) break
  }
  return found
}

// These devices' copies, each from its Device.copies: one query for them all.
export async function graphQLFetchCopiesOf(ids: string[]): Promise<Map<string, DuplicateCopy[]> | 'ERROR'> {
  const found = new Map<string, DuplicateCopy[]>()
  const identity = await deviceIdentity()
  if (!identity.served.copyCount || !ids.length) return found
  const disabled = await deviceDisableFields()
  if (!disabled) return found
  const response = await graphQLBasicRequest(
    ` query CopiesOf($ids: [String!]!) {
        login {
          id
          device(id: $ids) {
            id
            copies {
              id
              name
              platform
              permissions
              owner { id email }${disabled}${identity.fields}
            }
          }
        }
      }`,
    { ids }
  )
  if (response === 'ERROR') return 'ERROR'
  for (const d of response?.data?.data?.login?.device || [])
    found.set(
      d.id,
      (d.copies || []).map(copyOf).filter((copy: DuplicateCopy | undefined): copy is DuplicateCopy => !!copy)
    )
  return found
}

// Read these devices' copies: each once, unless `again`. A device the read does not answer has none.
export function requestCopiesOf(ids: string[], again?: boolean): Promise<void> {
  const wanted = [...new Set(ids)].filter(id => again || (!byOriginal.has(id) && !readingOf.has(id)))
  if (!wanted.length) return Promise.all(ids.map(id => readingOf.get(id))).then(() => undefined)
  const read = graphQLFetchCopiesOf(wanted).then(result => {
    wanted.forEach(id => readingOf.delete(id))
    if (result === 'ERROR') return
    byOriginal = new Map(byOriginal)
    for (const id of wanted) byOriginal.set(id, result.get(id) || [])
    notify()
  })
  wanted.forEach(id => readingOf.set(id, read))
  return read
}

// Read an account's copies: once, unless `again`. Where the API counts each device's copies, `again` reads those of
// the devices read so far once more, as their copies were kept or removed. A read that fails leaves what was read
// before.
export async function requestDuplicateCopies(accountId: string, again?: boolean): Promise<void> {
  if ((await deviceIdentity()).served.copyCount) {
    if (again && byOriginal.size) await requestCopiesOf([...byOriginal.keys()], true)
    return
  }
  return requestAccountCopies(accountId, again)
}

function requestAccountCopies(accountId: string, again?: boolean): Promise<void> {
  if (!again && copies.has(accountId)) return Promise.resolve()
  const pending = reading.get(accountId)
  if (pending) return pending
  const read = graphQLFetchDuplicateCopies(accountId).then(result => {
    reading.delete(accountId)
    if (result === 'ERROR') return
    copies.set(accountId, result)
    notify()
  })
  reading.set(accountId, read)
  return read
}

// Each original's copies, by the original's id.
export function groupCopies(list: DuplicateCopy[] = []): Map<string, DuplicateCopy[]> {
  const groups = new Map<string, DuplicateCopy[]>()
  for (const copy of list) {
    const id = copy.duplicateOf?.id
    if (!id) continue
    groups.set(id, [...(groups.get(id) || []), copy])
  }
  return groups
}
