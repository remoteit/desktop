import { post } from './post'
import { graphQLGetErrors, graphQLRequestWithReason } from './graphQL'
import type { AppHeldBack, AppChange } from './deviceAppsShared'
import type { AppCapability, AppProtocol } from './graphQLDeviceApps'

/* The account's app catalogue (presence-server docs/device-apps-design.md, "Lifecycle: add, disable, remove", API, and
   "The Apps pages"): every app the account may take — remote.it's, its own publisher's —, each with its publisher, how
   it runs, its platforms, the release its channel gives on this stage, its channels and releases with their notes, and
   its fleet: the account's devices that have it, at which versions, up to date or held back and why. graphql's
   appCatalog, catalogApp and setAccountAppChannel.

   graphql serves the reads from its step 12e on; they are asked only where its schema has them, probed once, so a
   server from before says it does not have them yet. The mutations are always graphql's own. */

export type CatalogAppPublisher = {
  id: string
  name: string
  verifiedDomain: string | null
  remoteit: boolean // remote.it's own
  own: boolean // the account's own publisher: its releases are managed on the Publisher page
}

export type CatalogAppChannel = { channel: string; current: string | null; candidate: string | null; share: number }

export type CatalogAppRelease = {
  version: string
  created: string
  notes: string | null // its manifest's notes, as its publisher signed them
  root: boolean
  capabilities: (AppCapability | string)[] // what it asks of the platform beyond an ordinary app's
  protocol: AppProtocol | string | null // how its service opens; none for one that serves nothing
  contract: number | null // the app contract its manifest is written to (1); none for one from before contracts
  platforms: string[]
  withdrawn: string | null
  channels: string[] // where this stage points at it: "stable", "beta", "beta candidate"
}

export type CatalogAppFleet = {
  total: number // devices with the app: enabled + disabled
  enabled: number
  disabled: number
  upToDate: number
  heldBack: number
  versions: { version: string | null; count: number }[] // version null: not reported
  // The held back by why (AppHeldBack.reason), the most first, adding up to heldBack: read for one app's page only,
  // as graphql works it out per held-back device.
  heldBackBy?: { reason: string; count: number }[]
}

export type CatalogAppDevice = {
  deviceId: string
  name: string
  enabled: boolean
  state: string
  detail: string | null
  version: string | null // running
  release: string | null // offered
  latest: string | null
  channel: string | null
  pinned: string | null
  upToDate: boolean
  heldBack: AppHeldBack | null
}

export type CatalogAppDevicePage = { items: CatalogAppDevice[]; total: number; next: string | null }

export type CatalogApp = {
  id: string
  name: string
  description: string | null
  publisher: CatalogAppPublisher
  runsAs: string // restricted | root, of version
  root: boolean
  capabilities: (AppCapability | string)[] // of version, as root is
  protocol: AppProtocol | string | null // of version: how its service opens, none for one that serves nothing
  contract: number | null // of version
  platforms: string[] // version's archive keys
  version: string | null // the release the account's channel gives here; none: none here yet
  accountChannel: string | null // none: stable
  channels: CatalogAppChannel[]
  releases: CatalogAppRelease[] // newest first
  fleet: CatalogAppFleet
  devices?: CatalogAppDevicePage
}

// A device page's filter: held back or up to date (heldBack false), held back for one reason (heldBackReason), and a
// version running — "" none reported; absent, any.
export type CatalogDeviceFilter = { heldBack?: boolean; heldBackReason?: string; version?: string }

export type Unserved = 'UNSERVED'
export const UNSERVED: Unserved = 'UNSERVED'
export type CatalogRead<T> = T | Unserved | 'ERROR'

// Whether the API has the catalogue's reads. Read once; asked again after a failed request.
let probe: Promise<boolean | 'ERROR'> | undefined
export function appCatalogServed(): Promise<boolean | 'ERROR'> {
  if (!probe)
    probe = post({ query: 'query AppCatalogFields { query: __type(name: "Query") { fields { name } } }' }).then(
      response => {
        if (response === 'ERROR') {
          probe = undefined
          return 'ERROR'
        }
        const fields: { name: string }[] = response.data?.data?.query?.fields ?? []
        return fields.some(field => field.name === 'appCatalog') && fields.some(field => field.name === 'catalogApp')
      }
    )
  return probe
}

// For tests, and for a change of API or sign-in.
export function resetAppCatalog() {
  probe = undefined
}

const PUBLISHER = 'publisher { id name verifiedDomain remoteit own }'
const FLEET_COUNTS = 'total enabled disabled upToDate heldBack versions { version count }'
const BASE = `id name description ${PUBLISHER} runsAs root capabilities protocol contract platforms version accountChannel`
const LIST = `${BASE} fleet { ${FLEET_COUNTS} }`
const ONE = `${BASE} fleet { ${FLEET_COUNTS} heldBackBy { reason count } }`
const RELEASES =
  'releases(first: $releases) { version created notes root capabilities protocol contract platforms withdrawn channels }'
const CHANNELS = 'channels { channel current candidate share }'
const DEVICE = 'deviceId name enabled state detail version release latest channel pinned upToDate heldBack { reason detail }'
const DEVICES = `devices(first: 100, after: $after, heldBack: $heldBack, heldBackReason: $heldBackReason, version: $version) { items { ${DEVICE} } total next }`

const publisherOf = (publisher: any): CatalogAppPublisher => ({
  id: publisher?.id ?? '',
  name: publisher?.name ?? publisher?.id ?? '',
  verifiedDomain: publisher?.verifiedDomain ?? null,
  remoteit: !!publisher?.remoteit,
  own: !!publisher?.own,
})

const fleetOf = (fleet: any): CatalogAppFleet => ({
  total: fleet?.total ?? (fleet?.enabled ?? 0) + (fleet?.disabled ?? 0),
  enabled: fleet?.enabled ?? 0,
  disabled: fleet?.disabled ?? 0,
  upToDate: fleet?.upToDate ?? 0,
  heldBack: fleet?.heldBack ?? 0,
  versions: (fleet?.versions ?? []).map((v: any) => ({ version: v.version ?? null, count: v.count ?? 0 })),
  ...(fleet?.heldBackBy && {
    heldBackBy: fleet.heldBackBy.map((r: any) => ({ reason: r.reason, count: r.count ?? 0 })),
  }),
})

export const catalogDeviceOf = (device: any): CatalogAppDevice => ({
  deviceId: device.deviceId,
  name: device.name ?? device.deviceId,
  enabled: !!device.enabled,
  state: device.state ?? 'disabled',
  detail: device.detail ?? null,
  version: device.version ?? null,
  release: device.release ?? null,
  latest: device.latest ?? null,
  channel: device.channel ?? null,
  pinned: device.pinned ?? null,
  upToDate: !!device.upToDate,
  heldBack: device.heldBack?.reason ? { reason: device.heldBack.reason, detail: device.heldBack.detail ?? '' } : null,
})

export const catalogAppOf = (app: any): CatalogApp => ({
  id: app.id,
  name: app.name ?? app.id,
  description: app.description ?? null,
  publisher: publisherOf(app.publisher),
  runsAs: app.runsAs ?? (app.root ? 'root' : 'restricted'),
  root: !!app.root,
  capabilities: app.capabilities ?? [],
  protocol: app.protocol ?? null,
  contract: app.contract ?? null,
  platforms: app.platforms ?? [],
  version: app.version ?? null,
  accountChannel: app.accountChannel ?? null,
  channels: (app.channels ?? []).map((c: any) => ({
    channel: c.channel,
    current: c.current ?? null,
    candidate: c.candidate ?? null,
    share: c.share ?? 0,
  })),
  releases: (app.releases ?? []).map((r: any) => ({
    version: r.version,
    created: r.created,
    notes: r.notes ?? null,
    root: !!r.root,
    capabilities: r.capabilities ?? [],
    protocol: r.protocol ?? null,
    contract: r.contract ?? null,
    platforms: r.platforms ?? [],
    withdrawn: r.withdrawn ?? null,
    channels: r.channels ?? [],
  })),
  fleet: fleetOf(app.fleet),
  ...(app.devices && {
    devices: {
      items: (app.devices.items ?? []).map(catalogDeviceOf),
      total: app.devices.total ?? 0,
      next: app.devices.next ?? null,
    },
  }),
})

// Served, else UNSERVED.
async function source(): Promise<'api' | Unserved | 'ERROR'> {
  const served = await appCatalogServed()
  if (served === true) return 'api'
  return served === 'ERROR' ? 'ERROR' : UNSERVED
}

// Every app the account may use, from the account's own (accountId: an organization's).
export async function graphQLAppCatalog(accountId?: string): Promise<CatalogRead<CatalogApp[]>> {
  const from = await source()
  if (from !== 'api') return from
  const query = `query AppCatalog($accountId: String) { appCatalog(accountId: $accountId) { ${LIST} } }`
  const variables = { accountId }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  if (graphQLGetErrors(response, true, { query, variables })) return 'ERROR'
  return (response.data?.data?.appCatalog ?? []).map(catalogAppOf)
}

// One app in the catalogue, with its channels, releases (the newest `releases`), fleet and a page of its devices.
// null: not one the account may take.
export async function graphQLCatalogApp(
  id: string,
  {
    accountId,
    releases = 20,
    after,
    ...filter
  }: { accountId?: string; releases?: number; after?: string } & CatalogDeviceFilter = {}
): Promise<CatalogRead<CatalogApp | null>> {
  const from = await source()
  if (from !== 'api') return from
  const query = `query CatalogApp($id: String!, $accountId: String, $releases: Int, $after: String, $heldBack: Boolean, $heldBackReason: String, $version: String) {
    catalogApp(id: $id, accountId: $accountId) { ${ONE} ${CHANNELS} ${RELEASES} ${DEVICES} }
  }`
  const variables = {
    id,
    accountId,
    releases,
    after,
    heldBack: filter.heldBack,
    heldBackReason: filter.heldBackReason,
    version: filter.version,
  }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  if (graphQLGetErrors(response, true, { query, variables })) return 'ERROR'
  const app = response.data?.data?.catalogApp
  return app ? catalogAppOf(app) : null
}

// The channel the account follows for this app: stable or beta; "" none (stable).
export async function graphQLSetAccountAppChannel(
  app: string,
  channel: string,
  accountId?: string
): Promise<AppChange<{ accountChannel: string | null }>> {
  const result = await graphQLRequestWithReason(
    `mutation SetAccountAppChannel($app: String!, $channel: String, $accountId: String) {
      setAccountAppChannel(app: $app, channel: $channel, accountId: $accountId) { id accountChannel }
    }`,
    { app, channel, accountId }
  )
  if (result === 'ERROR') return { reason: '' }
  if ('reason' in result) return result
  return { accountChannel: result.data?.data?.setAccountAppChannel?.accountChannel ?? null }
}

/* The account's devices an app may be added to (Add, "Devices"): each with whether the person may run code there
   (Manage and Scripting), whether it has the app already (enabled, or disabled: adding enables it), and what the catalogue offers it (Device.availableApps:
   refused by its administrator, no release here, a remote.it too old). One the catalogue does not offer the app to at
   all — no build for its platform — has no offer. The first 100 by name, searched by name. */
export type AppTarget = {
  id: string
  name: string
  canRun: boolean
  has: 'enabled' | 'disabled' | null // the app there already, enabled or disabled
  adminControl: string | null // its administrator's control of the app there (DeviceApp's, or its offer's: AvailableApp.adminControl)
  offer: { refused: string | null; version: string | null; needsNewer: boolean } | null
}

export const APP_TARGETS_PAGE = 100

export async function graphQLAppTargets(
  app: string,
  { accountId, name }: { accountId?: string; name?: string } = {}
): Promise<AppTarget[] | 'ERROR'> {
  const query = `query AppTargets($accountId: String, $name: String, $size: Int) {
    login { account(id: $accountId) { devices(size: $size, from: 0, name: $name, sort: "name") {
      items { id name permissions apps { id enabled adminControl } availableApps { id refused adminControl version needsNewer } }
    } } }
  }`
  const variables = { accountId, name: name?.trim() || undefined, size: APP_TARGETS_PAGE }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  if (graphQLGetErrors(response, true, { query, variables })) return 'ERROR'
  return (response.data?.data?.login?.account?.devices?.items ?? []).map((device: any): AppTarget => {
    const permissions: string[] = device.permissions ?? []
    const offer = (device.availableApps ?? []).find((a: any) => a.id === app)
    const there = (device.apps ?? []).find((a: any) => a.id === app)
    return {
      id: device.id,
      name: device.name ?? device.id,
      canRun: permissions.includes('MANAGE') && permissions.includes('SCRIPTING'),
      has: there ? (there.enabled ? 'enabled' : 'disabled') : null,
      adminControl: there?.adminControl ?? offer?.adminControl ?? null,
      offer: offer
        ? { refused: offer.refused ?? null, version: offer.version ?? null, needsNewer: !!offer.needsNewer }
        : null,
    }
  })
}
