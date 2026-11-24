import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors, graphQLRequestWithReason } from './graphQL'
import type { SettingState } from './graphQLDeviceSettings'
import { appPolicyFields, settingLockOf, SettingLock } from './productPolicy'
import { AppChange, AppHeldBack, AppSettingChoice, choiceOf, refused } from './deviceAppsShared'
import type { RequestFor } from '../selectors/signIns'

export { NEEDS_NEWER, needsNewer, refused } from './deviceAppsShared'
export type { AppChange, AppHeldBack, AppHeldBackReason, Refused } from './deviceAppsShared'

/* A device's apps (presence-server docs/device-apps-design.md, "The portal's Apps section"): each a catalogue entry
   (`<publisher>.<app>`) the device has a row for — enabled or disabled, its channel, the version installed there,
   whether it runs as root, and its state as the device says: disabled, starting, running, unavailable with why, or
   removing. Its settings are declared by the app's release and set with the same version rule as a device setting:
   who set each from which side, its administrator's control (`<app>.<name>_control`) and its product's lock. Whether
   it is on may be its product's too (locked), where the API says: graphql refuses a change to either, naming the
   product. graphql's Device.apps, the lifecycle's mutations and setDeviceAppSetting.

   Every app is drawn from what the API says of it, none by its id (remoteit/apps docs/contract.md, contract 1): how its
   service opens (protocol), what it asks of the platform beyond an ordinary app (capabilities), the key its service
   presents (hostKey), the sessions it serves and what it serves at runtime (features), all from its manifest and its
   own status.json as its device reports them. */

// ScreenView's old install (build step 9), and only that: what becomes of a type-48 service installed before ScreenView
// was an app (oldInstall, conversion). The app itself is drawn as any other.
export const SCREENVIEW = 'remoteit.screenview'

/* An app's state on its device (presence-server docs/device-apps-design.md, "Lifecycle: add, disable, remove"): disabled
   (kept on the device, stopped), starting, running, unavailable (with its detail), or removing — no row any more, and
   the device still reports it until it says it is gone (listed enabled false, with no settings and no actions). */
export type DeviceAppState = 'disabled' | 'starting' | 'running' | 'unavailable' | 'removing'

/* The machine's administrator's control of an app (graphql's DeviceApp.adminControl, the device's `<app>_control`;
   presence-server docs/device-apps-design.md, "The machine's administrator: <app>_control"): cloud+local (the default)
   and cloud take every change from here; local keeps it local — graphql refuses an add, enable, disable or remove from
   here (its channel and pin are taken); off holds it disabled — graphql refuses an add or enable, and takes a disable
   or remove. */
export type AppAdminControl = 'cloud+local' | 'cloud' | 'local' | 'off'

/* How the portal opens an app's service (its manifest's service.protocol): ssh a terminal, http and https a page, vnc
   and rdp a viewer, tcp as its service's type launches, udp as a connection alone — a port for the person's own UDP
   client, never a terminal or a page. None for an app that serves nothing (no listen, or no service). */
export type AppProtocol = 'ssh' | 'http' | 'https' | 'vnc' | 'rdp' | 'tcp' | 'udp'

/* What an app asks of the platform beyond an ordinary app's (its manifest's capabilities; self-contained-apps.md,
   "Capabilities, as the platform keeps them"): people's own accounts kept on the device while it is enabled
   (person-accounts), people signed in to its service by remote.it certificate (person-certificates), and AI commands
   run through it (ssh-exec). The list is open: one this portal does not know is shown by its name. */
export type AppCapability = 'person-accounts' | 'person-certificates' | 'ssh-exec'

/* One of an app's listeners, as its release declares it (remoteit/apps docs/contract.md, listen as a map of named
   listeners): where the app listens on the device. Its port pinned, the owner's (portSetting: the setting whose value
   it is), a range it binds (ports, "low-high"), or none where remote.it picks it or it has none (unix, stdio). */
export type AppListener = {
  name: string | null // none for an app with one listener
  type: string // tcp, udp, unix or stdio
  port: number | null
  portSetting: string | null
  ports: string | null
}

/* One of an app's services (graphql's DeviceAppService), the primary first — the app's single-service fields
   (serviceId, protocol, portSetting) are the primary's. key: none for the primary, else its first listener's name. A
   multi-port service's ports are its listeners' own, in their order, the first its launch port; one of one port has a
   port (or portSetting, the owner's). serviceId: the service on the device, while the app is enabled and the service
   served — where it listens is that service's (IDevice.services: its port and ports), as every connection to it reads
   it. */
export type DeviceAppService = {
  key: string | null
  name: string
  protocol: AppProtocol | string | null
  multiPort: boolean
  port: number | null
  portSetting: string | null
  listeners: AppListener[]
  serviceId: string | null
}

// Where one of an app's named listeners listens, as the device reports it while the app runs: tcp:<port>,
// udp:<port>, a range (tcp:<low>-<high>, udp:<low>-<high>), unix or stdio.
export type DeviceAppListener = { name: string; listen: string }

// A session the app serves, as it reports it in its status.json: the session id (remote.it's, from the identity line
// or ${remoteit.session}), the account on the device where it knows one, "ai" where an AI opened it, and since when.
// Never a person: who is behind a session is remote.it's to know, not an app's.
export type DeviceAppSession = {
  session: string
  login: string | null
  via: string | null
  since: string | null
}

// The declaration's types; the list is open, so one this portal does not know is shown and left alone.
export type AppSettingType = 'bool' | 'choice' | 'int' | 'string' | 'list'

export type { AppSettingChoice } from './deviceAppsShared'

// A string's rules, and a list item's: at most max characters, and the whole value matching pattern where there is one.
export type AppStringRules = { max: number; pattern: string | null }

// What the release declares of a setting beyond its type and label: a string's or a list item's rules, a list's most
// items, an int's bounds (graphql's DeviceAppSetting.declaration, as app-settings.ts parses it).
export type AppSettingDeclaration = {
  string?: AppStringRules
  item?: AppStringRules
  maxItems?: number
  min?: number | null
  max?: number | null
}

export type DeviceAppSetting = SettingState & {
  type: AppSettingType | string
  label: string
  help: string | null
  default: any
  choices: AppSettingChoice[] | null // a choice's
  deprecated: string | null // why, where its release deprecates it
  declaration?: AppSettingDeclaration | null
}

// A consent to an app running as root (presence-server docs/device-apps-design.md, "Root, shown and consented to"): who,
// when, the release it was given to, and how — a person's (person), its product's (product, for every device in it),
// the console on as the device registered (registration), turned on on the device itself (device), or one kept from
// before consents were (carried).
export type RootConsentVia = 'person' | 'product' | 'registration' | 'device' | 'carried'
export type DeviceAppRootConsent = {
  by: string // a person's id; the OS user for one made on the device
  email: string | null // the person's, where a person consented
  at: string
  version: string | null
  via: RootConsentVia | string
}

export type DeviceApp = {
  id: string // <publisher>.<app>
  name: string
  publisher: string // the publisher's name, shown with the app
  publisherVerifiedDomain?: string | null // the domain its publisher proved: "Verified: example.com"
  root: boolean // runs as root: full control of the device
  enabled: boolean // enabled, or disabled (kept on the device, stopped)
  added?: string | null // when this add happened
  channel: string | null // stable or beta; none: its account's
  pinned?: string | null // a version it is pinned to
  version: string | null // the version the device runs
  release?: string | null // the version graphql gives it now
  latest?: string | null // the version its channel gives this device, its pin aside; none on this stage
  upToDate?: boolean // enabled, and the device runs latest
  heldBack?: AppHeldBack | null // why not, while enabled and not up to date
  grantUntil?: string | null // when the delivery grant last given lapses; none while disabled
  adminControl?: AppAdminControl | string // its administrator's control there (AppAdminControl)
  state: DeviceAppState
  detail: string | null
  serviceId: string | null // the service it is reached as
  contract?: number | null // the app contract its release is written to (1)
  protocol: AppProtocol | string | null // how its service opens; none for one that serves nothing
  icon?: string | null // its icon's URL, a PNG remote.it checked; none: shown with its protocol's (components/AppIcon)
  capabilities: (AppCapability | string)[]
  hostKey: string | null // the key its service presents, as the app reports it (an OpenSSH or TLS SHA-256 fingerprint)
  sessions: DeviceAppSession[] // the open ones the app lists, for those who manage it
  sessionsOpen: number // how many are open
  features?: string[] // what it says it serves at runtime (remoteit-commands@remote.it)
  // The setting whose value is its service's port (service.port "${setting.X}"): the owner chooses the port there, and
  // graphql keeps the service in step — edited in one place, the setting.
  portSetting?: string | null
  services: DeviceAppService[] // its services, the primary first; none for an app that serves nothing
  listen?: string | null // where the single listener is bound, as the device reports it
  listeners?: DeviceAppListener[] // where its named listeners listen, as the device reports it while it runs
  locked?: SettingLock | null // enabled or disabled as its product holds it: a synced or enforced product that sets it
  rootConsent?: DeviceAppRootConsent | null // the consent to root it runs under, where the API says
  // A newer release that newly runs as root, waiting for a consent: the device stays on the version it runs until
  // someone consents (setDeviceAppRelease with consentRoot alone: Update now).
  awaitingRoot?: string | null
  // What the device says is wrong with its settings: its administrator's control of a setting since removed
  // (no-such-setting, "<key>_control: no such setting, removed in <version>"), or a value its manifest refuses.
  problems?: { name: string; error: string; detail: string | null }[]
  // ScreenView installed the old way (installApp) and enabled on this device, while the app is disabled here.
  oldInstall?: boolean
  // ScreenView and its old install (ScreenViewConversion): converting — enabled by itself from the old install, not
  // yet running —; disabled, with the old install: refused (conversionDetail says why), switch, waiting.
  conversion?: ScreenViewConversion | null
  conversionDetail?: string | null
  settings: DeviceAppSetting[]
}

/* What becomes of ScreenView's old install (graphql's conversion): a device whose old install is enabled converts by
   itself, once, when its daemon can first run the app — turned on as remote.it's, its root carried over from the old
   install —, unless its product keeps ScreenView off, its administrator refuses it, or there is no release for it.
     waiting     its daemon cannot run the app yet: nothing to show
     converting  turned on by itself, not yet running: "Converting from the old install"
     refused     it will not convert, and why (conversionDetail): the old install keeps running
     switch      nothing refuses it, but it did not convert by itself: a person may switch, consenting to root */
export type ScreenViewConversion = 'waiting' | 'converting' | 'refused' | 'switch'

const conversionOf = (value: unknown): ScreenViewConversion | null =>
  value === 'waiting' || value === 'converting' || value === 'refused' || value === 'switch' ? value : null

export const rootConsentOf = (consent: any): DeviceAppRootConsent | null =>
  consent?.by
    ? {
        by: consent.by,
        email: consent.user?.email ?? null,
        at: consent.at,
        version: consent.version ?? null,
        via: consent.via ?? 'person',
      }
    : null

const SETTING_FIELDS =
  'name type label help default value at by onDevice control locked { product level } deprecated choices { value label } declaration'
// The lifecycle's fields (enabled, added, latest, upToDate, heldBack, grantUntil) as the design pins them.
const SESSION_FIELDS = 'session login via since'
// An app's services as its release declares them (AppService), and which of the device's services each is
// (DeviceAppService).
const DECLARED_SERVICE_FIELDS =
  'key name protocol multiPort port portSetting listeners { name type port portSetting ports }'
const SERVICE_FIELDS = `${DECLARED_SERVICE_FIELDS} serviceId`
const FIELDS = `id name publisher publisherVerifiedDomain oldInstall conversion conversionDetail root enabled added channel pinned version release latest upToDate heldBack { reason detail } grantUntil adminControl state detail serviceId contract protocol icon capabilities hostKey sessions { ${SESSION_FIELDS} } sessionsOpen features portSetting services { ${SERVICE_FIELDS} } listen listeners { name listen } problems { name error detail } settings { ${SETTING_FIELDS} }`

// A setting as read: its value the declared default where none was set, and its lock only where it names a product.
function parsedSetting(setting: any): DeviceAppSetting {
  return {
    ...setting,
    value: setting.value ?? setting.default ?? null,
    locked: setting.locked?.product || setting.locked?.level ? setting.locked : null,
    choices: setting.choices ? setting.choices.map(choiceOf) : null,
    deprecated: setting.deprecated ?? null,
    declaration: setting.declaration ?? null,
  }
}

const parsedService = (service: any): DeviceAppService => ({
  key: service.key ?? null,
  name: service.name,
  protocol: service.protocol ?? null,
  multiPort: !!service.multiPort,
  port: service.port ?? null,
  portSetting: service.portSetting ?? null,
  listeners: (service.listeners ?? []).map((listener: any) => ({
    name: listener.name ?? null,
    type: listener.type,
    port: listener.port ?? null,
    portSetting: listener.portSetting ?? null,
    ports: listener.ports ?? null,
  })),
  serviceId: service.serviceId ?? null,
})

export const parsedDeviceApp = (app: any): DeviceApp => ({
    ...app,
    enabled: !!app.enabled,
    added: app.added ?? null,
    pinned: app.pinned ?? null,
    release: app.release ?? null,
    latest: app.latest ?? null,
    upToDate: !!app.upToDate,
    heldBack: app.heldBack?.reason ? { reason: app.heldBack.reason, detail: app.heldBack.detail ?? '' } : null,
    grantUntil: app.grantUntil ?? null,
    adminControl: app.adminControl ?? 'cloud+local',
    locked: app.locked?.product || app.locked?.level ? settingLockOf(app.locked) : null,
    rootConsent: rootConsentOf(app.rootConsent),
    awaitingRoot: app.awaitingRoot ?? null,
    problems: app.problems ?? [],
    conversion: conversionOf(app.conversion),
    conversionDetail: app.conversionDetail ?? null,
    contract: app.contract ?? null,
    protocol: app.protocol ?? null,
    icon: app.icon ?? null,
    capabilities: app.capabilities ?? [],
    hostKey: app.hostKey ?? null,
    sessions: (app.sessions ?? []).map((session: any) => ({
      session: session.session,
      login: session.login ?? null,
      via: session.via ?? null,
      since: session.since ?? null,
    })),
    sessionsOpen: app.sessionsOpen ?? app.sessions?.length ?? 0,
    features: app.features ?? [],
    portSetting: app.portSetting ?? null,
    services: (app.services ?? []).map(parsedService),
    listen: app.listen ?? null,
    listeners: app.listeners ?? [],
    settings: (app.settings ?? []).map(parsedSetting),
  })

// An app's fields, with its product's lock and its root consent where the API has them.
const appFields = async () => [FIELDS, await appPolicyFields()].filter(Boolean).join(' ')

// null: an API without apps, or a device this person cannot see.
export async function graphQLDeviceApps(deviceId: string): Promise<DeviceApp[] | null> {
  const query = `query DeviceApps($id: [String!]!) { login { device(id: $id) { id apps { ${await appFields()} } } } }`
  const variables = { id: [deviceId] }
  const response = await post({ query, variables })
  if (response === 'ERROR') return null
  if (graphQLGetErrors(response, true, { query, variables })) return null
  const apps = response.data?.data?.login?.device?.[0]?.apps
  return apps ? apps.map(parsedDeviceApp) : null
}

/* What the catalogue offers a device under "Add an app" (graphql's Device.availableApps): remote.it's apps and its own
   account's that it has no row for, each with whether it runs as root, the release its stage gives (none: it cannot be
   turned on yet), why its administrator refuses it there and its administrator's control of it (said up front: local
   and off refuse an add), and whether its remote.it is too old to run it. What it asks of the platform (capabilities)
   and how its service opens (protocol) are its catalogue entry's (graphQLAppCatalog), where the page has read it. */
export type AvailableApp = {
  id: string
  name: string
  publisher: string
  publisherVerifiedDomain?: string | null
  description: string | null
  root: boolean
  version: string | null
  refused: string | null
  adminControl?: AppAdminControl | string // its administrator's control there (AppAdminControl)
  needsNewer: boolean
  oldInstall?: boolean // ScreenView installed the old way, and enabled, here
  conversion?: ScreenViewConversion | null // what becomes of it (ScreenViewConversion)
  conversionDetail?: string | null // why it does not convert (refused)
  // Of the release its stage gives: how its service opens, what it asks of remote.it, the contract it is written to.
  protocol?: AppProtocol | string | null
  icon?: string | null // its icon's URL; none: shown with its protocol's
  capabilities?: (AppCapability | string)[]
  contract?: number | null
  services?: DeviceAppService[] // as the release declares them, the primary first; none on the device yet
}

// [] where the API has none, or the device is not this person's to manage.
export async function graphQLAvailableApps(deviceId: string): Promise<AvailableApp[]> {
  const query = `query AvailableApps($id: [String!]!) { login { device(id: $id) { id availableApps { id name publisher publisherVerifiedDomain description root version refused adminControl needsNewer oldInstall conversion conversionDetail protocol icon capabilities contract services { ${DECLARED_SERVICE_FIELDS} } } } } }`
  const variables = { id: [deviceId] }
  const response = await post({ query, variables })
  if (response === 'ERROR') return []
  if (graphQLGetErrors(response, true, { query, variables })) return []
  return (response.data?.data?.login?.device?.[0]?.availableApps ?? []).map((app: any) => ({
    ...app,
    description: app.description ?? null,
    version: app.version ?? null,
    refused: app.refused ?? null,
    adminControl: app.adminControl ?? 'cloud+local',
    needsNewer: !!app.needsNewer,
    publisherVerifiedDomain: app.publisherVerifiedDomain ?? null,
    oldInstall: !!app.oldInstall,
    conversion: conversionOf(app.conversion),
    conversionDetail: app.conversionDetail ?? null,
    protocol: app.protocol ?? null,
    icon: app.icon ?? null,
    capabilities: app.capabilities ?? [],
    contract: app.contract ?? null,
    services: (app.services ?? []).map(parsedService),
  }))
}

/* The lifecycle (presence-server docs/device-apps-design.md, "Lifecycle: add, disable, remove", API): add, enable or
   disable, the channel and the pin, remove. Each answers the app as it then stands, or graphql's refusal in its own
   words — a product holding it ("Managed by its product <name>"), its administrator, a root release with no consent. */

export type AppRelease = {
  channel?: string // stable or beta; "" none (its account's, else stable); absent, unchanged
  version?: string // a release of the app; "" no pin; absent, unchanged
  // The person's yes to full control of the device: a root release is enabled, added or moved to only with it.
  consentRoot?: boolean
}

// One mutation answering a DeviceApp: the app as parsed, else graphql's refusal ('' where it said none).
async function appMutation(
  name: string,
  declaration: string,
  args: string,
  variables: ILookup<any>,
  selection?: string,
  requestFor?: RequestFor
): Promise<AppChange<any>> {
  const result = await graphQLRequestWithReason(
    `mutation ${name[0].toUpperCase()}${name.slice(1)}(${declaration}) { ${name}(${args})${selection ? ` { ${selection} }` : ''} }`,
    variables,
    requestFor
  )
  if (result === 'ERROR') return { reason: '' }
  if ('reason' in result) return result
  return result.data?.data?.[name]
}

const given = (variables: ILookup<any>) =>
  Object.fromEntries(Object.entries(variables).filter(([, value]) => value !== undefined))

// No row: added and enabled. A disabled row: enabled. An enabled row: left as it is. Then its channel and pin where
// given, and its settings written.
export async function graphQLAddDeviceApp(
  deviceId: string,
  app: string,
  { channel, version, consentRoot, settings }: AppRelease & { settings?: ILookup<any> } = {}
): Promise<AppChange<DeviceApp>> {
  const answer = await appMutation(
    'addDeviceApp',
    '$deviceId: String!, $app: String!, $channel: String, $version: String, $consentRoot: Boolean, $settings: Any',
    'deviceId: $deviceId, app: $app, channel: $channel, version: $version, consentRoot: $consentRoot, settings: $settings',
    given({ deviceId, app, channel, version, consentRoot, settings }),
    await appFields()
  )
  return refused(answer) ? answer : parsedDeviceApp(answer)
}

// true: the release its channel or pin names now, a root one only with consentRoot. false: disabled, kept on the device.
export async function graphQLSetDeviceAppEnabled(
  deviceId: string,
  app: string,
  enabled: boolean,
  consentRoot?: boolean
): Promise<AppChange<DeviceApp>> {
  const answer = await appMutation(
    'setDeviceAppEnabled',
    '$deviceId: String!, $app: String!, $enabled: Boolean!, $consentRoot: Boolean',
    'deviceId: $deviceId, app: $app, enabled: $enabled, consentRoot: $consentRoot',
    given({ deviceId, app, enabled, consentRoot }),
    await appFields()
  )
  return refused(answer) ? answer : parsedDeviceApp(answer)
}

// Its channel and its pin; consentRoot alone, where awaitingRoot names a release, is Update now.
export async function graphQLSetDeviceAppRelease(
  deviceId: string,
  app: string,
  { channel, version, consentRoot }: AppRelease
): Promise<AppChange<DeviceApp>> {
  const answer = await appMutation(
    'setDeviceAppRelease',
    '$deviceId: String!, $app: String!, $channel: String, $version: String, $consentRoot: Boolean',
    'deviceId: $deviceId, app: $app, channel: $channel, version: $version, consentRoot: $consentRoot',
    given({ deviceId, app, channel, version, consentRoot }),
    await appFields()
  )
  return refused(answer) ? answer : parsedDeviceApp(answer)
}

// Removed from the device, its files and data deleted there: true where a row was removed, false where there was none.
export async function graphQLRemoveDeviceApp(deviceId: string, app: string): Promise<AppChange<boolean>> {
  const answer = await appMutation(
    'removeDeviceApp',
    '$deviceId: String!, $app: String!',
    'deviceId: $deviceId, app: $app',
    { deviceId, app }
  )
  return refused(answer) ? answer : !!answer
}

/* Many devices at once (addDeviceApps, setDeviceAppsRelease): each device alone, a refusal that device's result and
   never the call's. At most 500 devices a call. */
export type DeviceAppOutcome = 'added' | 'enabled' | 'changed' | 'unchanged' | 'refused'
export type DeviceAppChange = { deviceId: string; name: string | null; outcome: DeviceAppOutcome | string; error: string | null }
export const MANY_DEVICES_MAX = 500

const CHANGE_FIELDS = 'deviceId name outcome error'
const changesOf = (answer: any): DeviceAppChange[] =>
  (answer ?? []).map((change: any) => ({
    deviceId: change.deviceId,
    name: change.name ?? null,
    outcome: change.outcome,
    error: change.error ?? null,
  }))

export type TagFilter = { operator: 'ANY' | 'ALL'; values: string[] }

// To the devices named and those a tag has now (their union), of the caller's account or accountId's.
export async function graphQLAddDeviceApps(
  app: string,
  {
    deviceIds,
    tags,
    accountId,
    channel,
    version,
    consentRoot,
    settings,
  }: AppRelease & { deviceIds?: string[]; tags?: TagFilter; accountId?: string; settings?: ILookup<any> }
): Promise<AppChange<DeviceAppChange[]>> {
  const answer = await appMutation(
    'addDeviceApps',
    '$app: String!, $deviceIds: [String!], $tags: ListFilter, $accountId: String, $channel: String, $version: String, $consentRoot: Boolean, $settings: Any',
    'app: $app, deviceIds: $deviceIds, tags: $tags, accountId: $accountId, channel: $channel, version: $version, consentRoot: $consentRoot, settings: $settings',
    given({ app, deviceIds, tags, accountId, channel, version, consentRoot, settings }),
    CHANGE_FIELDS
  )
  return refused(answer) ? answer : changesOf(answer)
}

// version "" with nothing else: Update now, each device to its channel's release, unpinned.
export async function graphQLSetDeviceAppsRelease(
  app: string,
  deviceIds: string[],
  { channel, version, consentRoot }: AppRelease,
  // The account whose devices they are listed as, on the app's page: they may be in no stored list.
  accountId?: string
): Promise<AppChange<DeviceAppChange[]>> {
  const answer = await appMutation(
    'setDeviceAppsRelease',
    '$app: String!, $deviceIds: [String!]!, $channel: String, $version: String, $consentRoot: Boolean',
    'app: $app, deviceIds: $deviceIds, channel: $channel, version: $version, consentRoot: $consentRoot',
    given({ app, deviceIds, channel, version, consentRoot }),
    CHANGE_FIELDS,
    accountId ? { orAccount: accountId } : undefined
  )
  return refused(answer) ? answer : changesOf(answer)
}

export async function graphQLSetDeviceAppSetting(
  deviceId: string,
  app: string,
  name: string,
  value: any
): Promise<DeviceAppSetting | null> {
  const response = await graphQLBasicRequest(
    ` mutation SetDeviceAppSetting($deviceId: String!, $app: String!, $name: String!, $value: Any) {
        setDeviceAppSetting(deviceId: $deviceId, app: $app, name: $name, value: $value) { ${SETTING_FIELDS} }
      }`,
    { deviceId, app, name, value }
  )
  const answer = response === 'ERROR' ? null : response?.data?.data?.setDeviceAppSetting
  return answer ? parsedSetting(answer) : null
}
