import { post } from './post'
import { graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* What a device says it is, and the history of every field of it (graphql's Device.about and Device.aboutHistory;
   presence-server docs/device-about.md): its OS, hardware, identifiers, the manufacturer's product and its agent's
   software, and the NAT it measured itself behind. Everything here is the device's claim — shown, never what identifies
   it. Only an API that serves device sessions has these fields; another answers UNSUPPORTED, for the page to hide them.
   An API from before about.nat, or the machine's accounts, is asked again without them: the rest stands, and they are
   none.

   graphql serves it by who asks: someone who manages the device has all of it; someone it is shared with has the OS,
   the architecture and whether it is virtual, the software and the console — the rest none, and no history. */

export type DeviceAbout = {
  os: {
    family: string | null
    name: string | null
    id: string | null
    version: string | null
    build: string | null
    kernel: string | null
    edition: string | null
  } | null
  hardware: {
    arch: string | null
    cpu: string | null
    cores: number | null
    memoryMb: number | null
    manufacturer: string | null
    model: string | null
    board: string | null
    virtual: string | null
  } | null
  ids: {
    serial: string | null
    hardwareUuid: string | null
    machineId: string | null
    macs: { interface: string | null; mac: string | null }[] | null
    diskSerial: string | null
  } | null
  oem: {
    product: string | null
    productName: string | null
    manufacturer: string | null
    model: string | null
    hardwareRevision: string | null
    firmware: string | null
    serial: string | null
  } | null
  software: { connectd: string | null; package: string | null; format: string | null } | null
  // The NAT class measured at its sign-ins (presence-server docs/nat-aware-brokering.md §4): mapping and filtering, or
  // why it was not measured; none from an API or a device before it.
  nat?: {
    mapping: string | null
    filtering: string | null
    since: string | null
    note: string | null
    why: string | null
  } | null
  // The machine's OS accounts (device-about.md "The accounts on the machine"): at most 50, administrators first, and how
  // many more there are; none from an API or a daemon before them, a policy that turned them off, or a viewer.
  accounts?: DeviceAboutAccount[] | null
  accountsMore?: number | null
  adminsAdded?: { name: string; at: string }[] | null // the accounts that became administrators in the last 30 days
  data: ILookup<any> | null // the document itself, as the device said it; none for a viewer
  reported: string | null
  hardwareChanged: string | null
}

export type DeviceAboutAccount = {
  account: string // the OS's id for it: a UID, or a SID on Windows — as Device.signIns names it
  name: string
  fullName: string | null
  kind: 'local' | 'domain' | null
  admin: boolean | null
  hidden: boolean | null
  disabled: boolean | null
  guid: string | null
  remoteit: boolean | null // one of the console's own r3-<name> accounts
}

// field: one of what the device says changed; update: an upgrade refused or failed; restore: brought back with a restore
// code; boot: started with a device join key; duplicate: its identity on a second machine (graphql-api
// docs/PROXY-GROUPS.md §11, "Wave 3: device identity").
export type DeviceAboutChange = {
  at: string
  kind: 'field' | 'update' | 'restore' | 'boot' | 'duplicate'
  field: string
  before: string | null
  after: string | null
  detail: string | null
  generation: number | null
}

export type DeviceAboutRead = { about: DeviceAbout | null; history: DeviceAboutChange[] }

// The parts an older API may not have, each asked only while it answers for them.
type Parts = { nat: boolean; accounts: boolean }

const NAT = 'nat { mapping filtering since note why }'
const ACCOUNTS = [
  'accounts { account name fullName kind admin hidden disabled guid remoteit }',
  'accountsMore',
  'adminsAdded { name at }',
]

const query = ({ nat, accounts }: Parts) => {
  const optional = [...(nat ? [NAT] : []), ...(accounts ? ACCOUNTS : [])].map(field => `\n        ${field}`).join('')
  return `query DeviceAbout($id: [String!]!) {
  login {
    device(id: $id) {
      id
      about {
        os { family name id version build kernel edition }
        hardware { arch cpu cores memoryMb manufacturer model board virtual }
        ids { serial hardwareUuid machineId macs { interface mac } diskSerial }
        oem { product productName manufacturer model hardwareRevision firmware serial }
        software { connectd package format }${optional}
        data
        reported
        hardwareChanged
      }
      aboutHistory(limit: 100) { at kind field before after detail generation }
    }
  }
}`
}

export async function graphQLDeviceAbout(
  deviceId: string,
  parts: Parts = { nat: true, accounts: true }
): Promise<DeviceAboutRead | 'ERROR' | typeof UNSUPPORTED> {
  const variables = { id: [deviceId] }
  const QUERY = query(parts)
  const response = await post({ query: QUERY, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query: QUERY, variables })
  // An API says every field it lacks at once: one more ask, without all of them.
  const without = {
    nat: parts.nat && withoutDeviceSessions(errors, 'nat'),
    accounts: parts.accounts && ['accounts', 'accountsMore', 'adminsAdded'].some(f => withoutDeviceSessions(errors, f)),
  }
  if (without.nat || without.accounts)
    return graphQLDeviceAbout(deviceId, {
      nat: parts.nat && !without.nat,
      accounts: parts.accounts && !without.accounts,
    })
  if (withoutDeviceSessions(errors, 'about')) return UNSUPPORTED
  if (errors) return 'ERROR'
  const device = response.data?.data?.login?.device?.[0]
  return { about: device?.about ?? null, history: device?.aboutHistory ?? [] }
}
