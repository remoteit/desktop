import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors, graphQLRequestWithReason } from './graphQL'
import type { SettingState } from './graphQLDeviceSettings'
import { appPolicyFields, settingLockOf, SettingLock } from './productPolicy'
import { AppChange, AppHeldBack, refused } from './deviceAppsShared'

export { NEEDS_NEWER, needsNewer, refused } from './deviceAppsShared'
export type { AppChange, AppHeldBack, AppHeldBackReason, Refused } from './deviceAppsShared'

/* A device's apps (presence-server docs/device-apps-design.md, "The portal's Apps section"): each a catalogue entry
   (`<publisher>.<app>`, the console `remoteit.console`) the device has a row for — enabled or disabled, its channel, the version
   installed there, whether it runs as root, and its state as the device says: disabled, starting, running, unavailable
   with why, or removing. Its settings are declared by the app's release and set with the same version rule as a device setting:
   who set each from which side, its administrator's control (`<app>.<name>_control`) and its product's lock. Whether
   it is on may be its product's too (locked), where the API says: graphql refuses a change to either, naming the
   product. graphql's Device.apps, the lifecycle's mutations and setDeviceAppSetting. */

export const CONSOLE = 'remoteit.console'
// ScreenView as an app (build step 9): root, served on its socket as a type-48 service.
export const SCREENVIEW = 'remoteit.screenview'

/* An app's state on its device (presence-server docs/device-apps-design.md, "Lifecycle: add, disable, remove"): disabled
   (kept on the device, stopped), starting, running, unavailable (with its detail), or removing — no row any more, and
   the device still reports it until it says it is gone (listed enabled false, with no settings and no actions). */
export type DeviceAppState = 'disabled' | 'starting' | 'running' | 'unavailable' | 'removing'


// The declaration's types; the list is open, so one this portal does not know is shown and left alone.
export type AppSettingType = 'bool' | 'choice' | 'int' | 'string' | 'list'

export type AppSettingChoice = { value: string; label: string }

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
  state: DeviceAppState
  detail: string | null
  serviceId: string | null // the service it is reached as
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
const FIELDS = `id name publisher publisherVerifiedDomain oldInstall conversion conversionDetail root enabled added channel pinned version release latest upToDate heldBack { reason detail } grantUntil state detail serviceId problems { name error detail } settings { ${SETTING_FIELDS} }`

// A setting as read: its value the declared default where none was set, and its lock only where it names a product.
function parsedSetting(setting: any): DeviceAppSetting {
  return {
    ...setting,
    value: setting.value ?? setting.default ?? null,
    locked: setting.locked?.product || setting.locked?.level ? setting.locked : null,
    choices: setting.choices ?? null,
    deprecated: setting.deprecated ?? null,
    declaration: setting.declaration ?? null,
  }
}

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
  locked: app.locked?.product || app.locked?.level ? settingLockOf(app.locked) : null,
  rootConsent: rootConsentOf(app.rootConsent),
  awaitingRoot: app.awaitingRoot ?? null,
  problems: app.problems ?? [],
  conversion: conversionOf(app.conversion),
  conversionDetail: app.conversionDetail ?? null,
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
   turned on yet), why its administrator refuses it there, and whether its remote.it is too old to run it. */
export type AvailableApp = {
  id: string
  name: string
  publisher: string
  publisherVerifiedDomain?: string | null
  description: string | null
  root: boolean
  version: string | null
  refused: string | null
  needsNewer: boolean
  oldInstall?: boolean // ScreenView installed the old way, and enabled, here
  conversion?: ScreenViewConversion | null // what becomes of it (ScreenViewConversion)
  conversionDetail?: string | null // why it does not convert (refused)
}

// [] where the API has none, or the device is not this person's to manage.
export async function graphQLAvailableApps(deviceId: string): Promise<AvailableApp[]> {
  const query = `query AvailableApps($id: [String!]!) { login { device(id: $id) { id availableApps { id name publisher publisherVerifiedDomain description root version refused needsNewer oldInstall conversion conversionDetail } } } }`
  const variables = { id: [deviceId] }
  const response = await post({ query, variables })
  if (response === 'ERROR') return []
  if (graphQLGetErrors(response, true, { query, variables })) return []
  return (response.data?.data?.login?.device?.[0]?.availableApps ?? []).map((app: any) => ({
    ...app,
    description: app.description ?? null,
    version: app.version ?? null,
    refused: app.refused ?? null,
    needsNewer: !!app.needsNewer,
    publisherVerifiedDomain: app.publisherVerifiedDomain ?? null,
    oldInstall: !!app.oldInstall,
    conversion: conversionOf(app.conversion),
    conversionDetail: app.conversionDetail ?? null,
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
  selection?: string
): Promise<AppChange<any>> {
  const result = await graphQLRequestWithReason(
    `mutation ${name[0].toUpperCase()}${name.slice(1)}(${declaration}) { ${name}(${args})${selection ? ` { ${selection} }` : ''} }`,
    variables
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
  { channel, version, consentRoot }: AppRelease
): Promise<AppChange<DeviceAppChange[]>> {
  const answer = await appMutation(
    'setDeviceAppsRelease',
    '$app: String!, $deviceIds: [String!]!, $channel: String, $version: String, $consentRoot: Boolean',
    'app: $app, deviceIds: $deviceIds, channel: $channel, version: $version, consentRoot: $consentRoot',
    given({ app, deviceIds, channel, version, consentRoot }),
    CHANGE_FIELDS
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

// The host key the console's service should show, as its device reports it: the console's own extra (graphql
// sshHostKey). null where the device has not said, or for a service that is not the console's.
export async function graphQLSshHostKey(serviceId: string): Promise<string | null> {
  const response = await graphQLBasicRequest(
    ` query SshHostKey($serviceId: String!) {
        sshHostKey(serviceId: $serviceId)
      }`,
    { serviceId },
    true
  )
  return response === 'ERROR' ? null : response?.data?.data?.sshHostKey ?? null
}
