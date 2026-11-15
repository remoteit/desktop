/* What graphql's appCatalog and catalogApp answer (graphql step 12e; presence-server docs/device-apps-design.md, API,
   CatalogApp), for the tests only: no build imports it. The apps and devices of the design's wireframes: the console,
   Files, and an account's own Backup. */

const PUBLISHER_REMOTEIT = { id: 'remoteit', name: 'remote.it', verifiedDomain: 'remote.it', remoteit: true, own: false }
const PUBLISHER_ACME = { id: 'acme', name: 'Acme', verifiedDomain: 'acme.com', remoteit: false, own: true }

type MockDevice = {
  deviceId: string
  name: string
  enabled: boolean
  state: string
  detail: string | null
  version: string | null
  release: string | null
  latest: string | null
  channel: string | null
  pinned: string | null
  upToDate: boolean
  heldBack: { reason: string; detail: string } | null
}

const device = (more: Partial<MockDevice> & Pick<MockDevice, 'deviceId' | 'name'>): MockDevice => ({
  enabled: true,
  state: 'running',
  detail: null,
  version: '1.4.0',
  release: '1.4.0',
  latest: '1.4.0',
  channel: 'stable',
  pinned: null,
  upToDate: true,
  heldBack: null,
  ...more,
})

const BACKUP_DEVICES: MockDevice[] = [
  device({ deviceId: '80:00:00:00:01:00:00:01', name: 'pi-kitchen' }),
  device({
    deviceId: '80:00:00:00:01:00:00:02',
    name: 'nas',
    version: '1.3.2',
    release: '1.3.2',
    upToDate: false,
    heldBack: { reason: 'daemon', detail: 'Needs a newer remote.it on this device' },
  }),
  device({
    deviceId: '80:00:00:00:01:00:00:03',
    name: 'kiosk-4',
    pinned: '1.4.0',
    latest: '1.5.0-beta.2',
    channel: 'beta',
    upToDate: false,
    heldBack: { reason: 'pinned', detail: 'Pinned to 1.4.0' },
  }),
  device({
    deviceId: '80:00:00:00:01:00:00:04',
    name: 'gw-3',
    enabled: false,
    state: 'disabled',
    version: null,
    release: null,
    channel: 'beta',
    latest: '1.5.0-beta.2',
    upToDate: false,
  }),
]

export type MockCatalogApp = {
  id: string
  name: string
  description: string | null
  publisher: typeof PUBLISHER_REMOTEIT
  runsAs: string
  root: boolean
  capabilities: string[]
  protocol: string | null
  kind: string
  serves: string
  platforms: string[]
  version: string | null
  accountChannel: string | null
  channels: { channel: string; current: string | null; candidate: string | null; share: number }[]
  releases: {
    version: string
    created: string
    notes: string | null
    root: boolean
    capabilities: string[]
    protocol: string | null
    platforms: string[]
    withdrawn: string | null
    channels: string[]
  }[]
  fleet: {
    total: number
    enabled: number
    disabled: number
    upToDate: number
    heldBack: number
    versions: { version: string | null; count: number }[]
    heldBackBy: { reason: string; count: number }[]
  }
  devices: MockDevice[]
}

const fleetOf = (devices: MockDevice[]) => {
  const enabled = devices.filter(d => d.enabled)
  const versions = new Map<string | null, number>()
  devices.forEach(d => versions.set(d.version, (versions.get(d.version) ?? 0) + 1))
  const reasons = new Map<string, number>()
  enabled.forEach(d => d.heldBack && reasons.set(d.heldBack.reason, (reasons.get(d.heldBack.reason) ?? 0) + 1))
  return {
    total: devices.length,
    enabled: enabled.length,
    disabled: devices.length - enabled.length,
    upToDate: enabled.filter(d => d.upToDate).length,
    heldBack: enabled.filter(d => !d.upToDate).length,
    versions: [...versions].map(([version, count]) => ({ version, count })),
    heldBackBy: [...reasons].map(([reason, count]) => ({ reason, count })),
  }
}

export const MOCK_CATALOG: MockCatalogApp[] = [
  {
    id: 'remoteit.console',
    name: 'Console',
    description: 'SSH to this device in the browser, and the commands an AI runs through it',
    publisher: PUBLISHER_REMOTEIT,
    runsAs: 'root',
    root: true,
    capabilities: ['person-accounts', 'person-certificates', 'ssh-exec'],
    protocol: 'ssh',
    kind: 'binary',
    serves: 'inetd',
    platforms: ['linux-amd64', 'linux-arm64', 'darwin-arm64', 'windows-amd64'],
    version: '1.4.0',
    accountChannel: null,
    channels: [
      { channel: 'stable', current: '1.4.0', candidate: null, share: 0 },
      { channel: 'beta', current: '1.5.0-beta.1', candidate: null, share: 0 },
    ],
    releases: [
      {
        version: '1.5.0-beta.1',
        created: '2026-11-10T18:00:00.000Z',
        notes: 'Detached commands keep running when the browser closes.',
        root: true,
        capabilities: ['person-accounts', 'person-certificates', 'ssh-exec'],
        protocol: 'ssh',
        platforms: ['linux-amd64', 'linux-arm64', 'darwin-arm64', 'windows-amd64'],
        withdrawn: null,
        channels: ['beta'],
      },
      {
        version: '1.4.0',
        created: '2026-11-01T18:00:00.000Z',
        notes: 'AI commands are a setting of their own.',
        root: true,
        capabilities: ['person-accounts', 'person-certificates', 'ssh-exec'],
        protocol: 'ssh',
        platforms: ['linux-amd64', 'linux-arm64', 'darwin-arm64', 'windows-amd64'],
        withdrawn: null,
        channels: ['stable'],
      },
    ],
    fleet: fleetOf(BACKUP_DEVICES.slice(0, 2)),
    devices: BACKUP_DEVICES.slice(0, 2),
  },
  {
    id: 'remoteit.files',
    name: 'Files',
    description: 'Browse and move files on the device',
    publisher: PUBLISHER_REMOTEIT,
    runsAs: 'restricted',
    root: false,
    capabilities: [],
    protocol: 'https',
    kind: 'binary',
    serves: 'socket',
    platforms: ['linux-amd64', 'linux-arm64'],
    version: '1.2.0',
    accountChannel: null,
    channels: [{ channel: 'stable', current: '1.2.0', candidate: null, share: 0 }],
    releases: [
      {
        version: '1.2.0',
        created: '2026-10-28T18:00:00.000Z',
        notes: null,
        root: false,
        capabilities: [],
        protocol: 'https',
        platforms: ['linux-amd64', 'linux-arm64'],
        withdrawn: null,
        channels: ['stable'],
      },
    ],
    fleet: fleetOf([]),
    devices: [],
  },
  {
    id: 'acme.backup',
    name: 'Backup',
    description: 'Nightly backups to your bucket.',
    publisher: PUBLISHER_ACME,
    runsAs: 'restricted',
    root: false,
    capabilities: [],
    protocol: null,
    kind: 'binary',
    serves: 'none',
    platforms: ['linux-amd64', 'linux-arm64', 'linux-arm64-musl'],
    version: '1.4.0',
    accountChannel: 'stable',
    channels: [
      { channel: 'stable', current: '1.4.0', candidate: null, share: 0 },
      { channel: 'beta', current: '1.5.0-beta.2', candidate: '1.5.0-rc.1', share: 10 },
    ],
    releases: [
      {
        version: '1.5.0-beta.2',
        created: '2026-11-12T18:00:00.000Z',
        notes: 'Adds S3-compatible targets.\nA bucket on any S3-compatible service can be the target.',
        root: false,
        capabilities: [],
        protocol: null,
        platforms: ['linux-amd64', 'linux-arm64', 'linux-arm64-musl'],
        withdrawn: null,
        channels: ['beta'],
      },
      {
        version: '1.4.0',
        created: '2026-11-01T18:00:00.000Z',
        notes: 'Fixes the retry after a lost connection.',
        root: false,
        capabilities: [],
        protocol: null,
        platforms: ['linux-amd64', 'linux-arm64', 'linux-arm64-musl'],
        withdrawn: null,
        channels: ['stable'],
      },
      {
        version: '1.3.2',
        created: '2026-10-20T18:00:00.000Z',
        notes: null,
        root: false,
        capabilities: [],
        protocol: null,
        platforms: ['linux-amd64', 'linux-arm64'],
        withdrawn: '2026-10-25T18:00:00.000Z',
        channels: [],
      },
    ],
    fleet: fleetOf(BACKUP_DEVICES),
    devices: BACKUP_DEVICES,
  },
]

// One app with a page of its devices, filtered as catalogApp's devices are: held back (or up to date), a version.
export function mockCatalogApp(id: string, filter: { heldBack?: boolean; heldBackReason?: string; version?: string } = {}) {
  const app = MOCK_CATALOG.find(a => a.id === id)
  if (!app) return null
  const items = app.devices.filter(
    d =>
      (filter.heldBack === undefined || (d.enabled && !d.upToDate) === filter.heldBack) &&
      (filter.heldBackReason === undefined || d.heldBack?.reason === filter.heldBackReason) &&
      (filter.version === undefined || (d.version ?? '') === filter.version)
  )
  return { ...app, devices: { items, total: items.length, next: null } }
}
