import { post } from './post'
import { graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* What a device says it is, and the history of every field of it (graphql's Device.about and Device.aboutHistory;
   presence-server docs/device-about.md): its OS, hardware, identifiers, the manufacturer's product and its agent's
   software, and the NAT it measured itself behind. Everything here is the device's claim — shown, never what identifies
   it. Only an API that serves device sessions has these fields; another answers UNSUPPORTED, for the page to hide them.
   An API from before about.nat is asked again without it: the rest stands, and nat is none. */

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
  data: ILookup<any> // the document itself, as the device said it
  reported: string
  hardwareChanged: string | null
}

export type DeviceAboutChange = {
  at: string
  kind: 'field' | 'update'
  field: string
  before: string | null
  after: string | null
  detail: string | null
  generation: number | null
}

export type DeviceAboutRead = { about: DeviceAbout | null; history: DeviceAboutChange[] }

const query = (nat: boolean) => `query DeviceAbout($id: [String!]!) {
  login {
    device(id: $id) {
      id
      about {
        os { family name id version build kernel edition }
        hardware { arch cpu cores memoryMb manufacturer model board virtual }
        ids { serial hardwareUuid machineId macs { interface mac } diskSerial }
        oem { product productName manufacturer model hardwareRevision firmware serial }
        software { connectd package format }${nat ? '\n        nat { mapping filtering since note why }' : ''}
        data
        reported
        hardwareChanged
      }
      aboutHistory(limit: 100) { at kind field before after detail generation }
    }
  }
}`

export async function graphQLDeviceAbout(
  deviceId: string,
  nat = true
): Promise<DeviceAboutRead | 'ERROR' | typeof UNSUPPORTED> {
  const variables = { id: [deviceId] }
  const QUERY = query(nat)
  const response = await post({ query: QUERY, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query: QUERY, variables })
  if (nat && withoutDeviceSessions(errors, 'nat')) return graphQLDeviceAbout(deviceId, false)
  if (withoutDeviceSessions(errors, 'about')) return UNSUPPORTED
  if (errors) return 'ERROR'
  const device = response.data?.data?.login?.device?.[0]
  return { about: device?.about ?? null, history: device?.aboutHistory ?? [] }
}
