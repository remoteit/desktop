/* Sample virtual devices: what the portal shows with the virtual-devices flag on against an API that does not serve
   them yet (services/graphQLVirtualDevices). Device records shaped as graphql answers them, so they go through the
   same adaptor as real ones, and a small store the sample mutations change — kept for the page's life, nothing sent.
   A gateway, a NAS and a PLC on it, a camera on a gateway the viewer cannot see (shared with them), and a printer
   whose gateway was deleted. */

export const SAMPLE_PREFIX = '80:00:00:5A:4D:50:'
export const SAMPLE_GATEWAY_ID = `${SAMPLE_PREFIX}00:01`
export const PLATFORM_SYNOLOGY = 1210
export const PLATFORM_RASPBERRY_PI = 1072

const MINE = ['VIEW', 'CONNECT', 'SCRIPTING', 'MANAGE']
const SHARED = ['VIEW', 'CONNECT']

type GqlService = {
  id: string
  name: string
  application: number
  title: string
  port: number
  host: string
  protocol?: string
  state: IDevice['state']
}

export type GqlSampleDevice = {
  id: string
  name: string
  state: IDevice['state']
  platform: number
  virtual: boolean
  host: string | null
  lastAddress: string | null
  hostedBy: IHostingGateway | null
  configurable: boolean
  scriptable: boolean
  permissions: string[]
  owner?: { id: string; email: string }
  created: string
  lastReported: string
  license: string
  attributes: ILookup<any>
  tags: { name: string; color: number; created: string }[]
  services: GqlService[]
  version?: number
}

const TITLES: ILookup<string> = {
  1: 'TCP',
  7: 'HTTP',
  8: 'HTTPS',
  28: 'SSH',
  34: 'SMB/CIFS',
  50: 'Printer',
  5: 'RDP',
  4: 'VNC',
}

let serial = 100
const created = new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString()
const tag = (name: string, color: number) => ({ name, color, created })

function service(deviceId: string, n: number, name: string, application: number, port: number, host: string) {
  return {
    // The device's last group, then the service's: unique while devices differ in their last group.
    id: `${SAMPLE_PREFIX}${deviceId.slice(-2)}:${(0xa0 + n).toString(16).toUpperCase()}`,
    name,
    application,
    title: TITLES[application] || 'TCP',
    port,
    host,
    state: 'active' as IDevice['state'],
  }
}

function device(fields: Partial<GqlSampleDevice> & Pick<GqlSampleDevice, 'id' | 'name' | 'platform'>): GqlSampleDevice {
  return {
    state: 'active',
    virtual: true,
    host: null,
    lastAddress: null,
    hostedBy: null,
    configurable: false,
    scriptable: false,
    permissions: MINE,
    created,
    lastReported: new Date().toISOString(),
    license: 'LICENSED',
    attributes: {},
    tags: [],
    services: [],
    ...fields,
  }
}

function initial(): GqlSampleDevice[] {
  const gw = SAMPLE_GATEWAY_ID
  const nas = `${SAMPLE_PREFIX}00:02`
  const plc = `${SAMPLE_PREFIX}00:03`
  const cam = `${SAMPLE_PREFIX}00:04`
  const printer = `${SAMPLE_PREFIX}00:05`
  const lab = `${SAMPLE_PREFIX}00:06`
  const scope = `${SAMPLE_PREFIX}00:07`
  const office: IHostingGateway = { visible: true, id: gw, name: 'Office gateway', state: 'active' }
  return [
    device({
      id: gw,
      name: 'Office gateway',
      platform: PLATFORM_RASPBERRY_PI,
      virtual: false,
      configurable: true,
      scriptable: true,
      version: 5.4,
      tags: [tag('office', 3)],
      services: [service(gw, 1, 'SSH', 28, 22, '127.0.0.1'), service(gw, 2, 'Web', 7, 80, '127.0.0.1')],
    }),
    device({
      id: nas,
      name: 'Office NAS',
      platform: PLATFORM_SYNOLOGY,
      host: 'ds920.local',
      lastAddress: '192.168.1.20',
      hostedBy: office,
      attributes: { description: 'Synology DS920+ in the comms cupboard' },
      tags: [tag('office', 3), tag('storage', 7)],
      services: [
        service(nas, 1, 'Files', 34, 445, 'ds920.local'),
        service(nas, 2, 'Admin page', 7, 5000, 'ds920.local'),
      ],
    }),
    device({
      id: plc,
      name: 'Line 2 PLC',
      platform: 1282,
      host: '192.168.1.71',
      hostedBy: office,
      tags: [tag('plant', 5)],
      services: [service(plc, 1, 'Modbus', 1, 502, '192.168.1.71')],
    }),
    device({
      id: cam,
      name: 'Dock camera',
      platform: 1283,
      state: 'inactive',
      host: 'dock-cam.local',
      lastAddress: '10.0.4.31',
      hostedBy: { visible: false, state: 'inactive' },
      permissions: SHARED,
      owner: { id: 'sample-owner', email: 'pat@example.com' },
      services: [{ ...service(cam, 1, 'Video', 1, 554, 'dock-cam.local'), state: 'inactive' }],
    }),
    device({
      id: printer,
      name: 'Front desk printer',
      platform: 1284,
      state: 'inactive',
      host: '192.168.1.40',
      services: [{ ...service(printer, 1, 'Printer', 50, 631, '192.168.1.40'), state: 'inactive' }],
    }),
    device({
      id: lab,
      name: 'Lab gateway',
      platform: 769,
      virtual: false,
      state: 'inactive',
      configurable: true,
      scriptable: true,
      version: 5.3,
      services: [{ ...service(lab, 1, 'SSH', 28, 22, '127.0.0.1'), state: 'inactive' }],
    }),
    device({
      id: scope,
      name: 'Bench oscilloscope',
      platform: 1285,
      state: 'inactive',
      host: '10.20.0.15',
      hostedBy: { visible: true, id: lab, name: 'Lab gateway', state: 'inactive' },
      tags: [tag('lab', 2)],
      services: [{ ...service(scope, 1, 'Web panel', 7, 80, '10.20.0.15'), state: 'inactive' }],
    }),
  ]
}

let store: GqlSampleDevice[] = initial()

export const isSampleId = (id?: string) => !!id?.startsWith(SAMPLE_PREFIX)

// Each with what graphql derives: a gateway's count and list of the devices it hosts (all visible to the viewer here).
export function sampleDevices(ids?: string[]): any[] {
  return store
    .filter(d => !ids || ids.includes(d.id))
    .map(d => {
      const hosted = store.filter(h => h.hostedBy?.id === d.id)
      return {
        ...d,
        hosts: hosted.length,
        hostedDevices: hosted.map(h => ({
          id: h.id,
          name: h.name,
          state: h.state,
          host: h.host,
          platform: h.platform,
          services: h.services.map(s => ({ id: s.id })),
        })),
      }
    })
}

function find(id: string) {
  return store.find(d => d.id === id)
}

function hosting(gateway: IDevice | GqlSampleDevice): IHostingGateway {
  return { visible: true, id: gateway.id, name: gateway.name, state: gateway.state }
}

export function sampleAdd(
  gateway: IDevice,
  input: { name: string; host: string; platform?: number; services?: IVirtualServiceInput[] }
) {
  const id = `${SAMPLE_PREFIX}10:${(serial++).toString(16).toUpperCase()}`
  const state = gateway.state
  const added = device({
    id,
    name: input.name,
    platform: input.platform ?? 1280,
    host: input.host,
    hostedBy: hosting(gateway),
    state,
    services: (input.services || []).map((s, n) => ({
      ...service(id, n + 1, s.name, s.application, s.port, s.host || input.host),
      protocol: s.protocol,
      state,
    })),
  })
  store.push(added)
  return id
}

export function sampleUpdate(id: string, set: { host?: string; platform?: number }) {
  const d = find(id)
  if (!d?.virtual) return false
  if (set.host !== undefined) {
    const was = d.host
    d.host = set.host
    d.services.forEach(s => s.host === was && (s.host = set.host!))
  }
  if (set.platform !== undefined) d.platform = set.platform
  return true
}

export function sampleMove(id: string, gateway: IDevice) {
  const d = find(id)
  if (!d?.virtual) return false
  d.hostedBy = hosting(gateway)
  d.state = gateway.state
  d.services.forEach(s => (s.state = gateway.state))
  return true
}

export function sampleConvert(gateway: IDevice, service: IService, name: string, platform?: number) {
  const host = service.host || ''
  const services = gateway.services
    .filter(s => s.host === host)
    .map(s => ({ name: s.name, application: s.typeID, port: s.port || 1, host }))
  return sampleAdd(gateway, { name, host, platform, services })
}

// keepHosted (the default): the devices it hosted stay, not hosted and offline, until moved.
export function sampleDelete(id: string, keepHosted = true) {
  const hosted = store.filter(d => d.hostedBy?.id === id)
  if (keepHosted)
    hosted.forEach(d => {
      d.hostedBy = null
      d.state = 'inactive'
      d.services.forEach(s => (s.state = 'inactive'))
    })
  const gone = new Set([id, ...(keepHosted ? [] : hosted.map(d => d.id))])
  store = store.filter(d => !gone.has(d.id))
  return [...gone]
}

export function resetSample() {
  store = initial()
}
