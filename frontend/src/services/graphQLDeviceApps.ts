import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'
import type { SettingState } from './graphQLDeviceSettings'
import { appPolicyFields, settingLockOf, SettingLock } from './productPolicy'

/* A device's apps (presence-server docs/device-apps-design.md, "The portal's Apps section"): each a catalogue entry
   (`<publisher>.<app>`, the console `remoteit.console`) the device has a row for — on or off, its channel, the version
   installed there, whether it runs as root, and its state as the device says: off, starting, running, or unavailable
   with why. Its settings are declared by the app's release and set with the same version rule as a device setting:
   who set each from which side, its administrator's control (`<app>.<name>_control`) and its product's lock. Whether
   it is on may be its product's too (locked), where the API says: graphql refuses a change to either, naming the
   product. graphql's Device.apps, setDeviceApp and setDeviceAppSetting. */

export const CONSOLE = 'remoteit.console'

export type DeviceAppState = 'off' | 'starting' | 'running' | 'unavailable'

// The declaration's types; the list is open, so one this portal does not know is shown and left alone.
export type AppSettingType = 'bool' | 'choice' | 'int' | 'string' | 'list'

export type AppSettingChoice = { value: string; label: string }

export type DeviceAppSetting = SettingState & {
  type: AppSettingType | string
  label: string
  help: string | null
  default: any
  choices: AppSettingChoice[] | null // a choice's
  deprecated: string | null // why, where its release deprecates it
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
  root: boolean // runs as root: full control of the device
  on: boolean
  channel: string | null // stable or beta
  version: string | null // the app installed there
  state: DeviceAppState
  detail: string | null
  serviceId: string | null // the service it is reached as
  locked?: SettingLock | null // on or off as its product holds it: a synced or enforced product that sets it
  rootConsent?: DeviceAppRootConsent | null // the consent to root it runs under, where the API says
  // A newer release that newly runs as root, waiting for a consent: the device stays on its last restricted release
  // until someone consents (turning it on again with consentRoot).
  awaitingRoot?: string | null
  settings: DeviceAppSetting[]
}

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
  'name type label help default value at by onDevice control locked { product level } deprecated choices { value label }'
const FIELDS = `id name publisher root on channel version state detail serviceId settings { ${SETTING_FIELDS} }`

// A setting as read: its value the declared default where none was set, and its lock only where it names a product.
function parsedSetting(setting: any): DeviceAppSetting {
  return {
    ...setting,
    value: setting.value ?? setting.default ?? null,
    locked: setting.locked?.product || setting.locked?.level ? setting.locked : null,
    choices: setting.choices ?? null,
    deprecated: setting.deprecated ?? null,
  }
}

const parsed = (app: any): DeviceApp => ({
  ...app,
  locked: app.locked?.product || app.locked?.level ? settingLockOf(app.locked) : null,
  rootConsent: rootConsentOf(app.rootConsent),
  awaitingRoot: app.awaitingRoot ?? null,
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
  return apps ? apps.map(parsed) : null
}

export type SetDeviceAppOptions = {
  channel?: string
  version?: string
  // A root app is turned on only with this: the person said yes to it having full control of the device.
  consentRoot?: boolean
}

export async function graphQLSetDeviceApp(
  deviceId: string,
  app: string,
  on: boolean,
  { channel, version, consentRoot }: SetDeviceAppOptions = {}
): Promise<DeviceApp | null> {
  const response = await graphQLBasicRequest(
    ` mutation SetDeviceApp(
        $deviceId: String!, $app: String!, $on: Boolean!, $channel: String, $version: String, $consentRoot: Boolean
      ) {
        setDeviceApp(
          deviceId: $deviceId, app: $app, on: $on, channel: $channel, version: $version, consentRoot: $consentRoot
        ) { ${await appFields()} }
      }`,
    { deviceId, app, on, channel, version, consentRoot }
  )
  const answer = response === 'ERROR' ? null : response?.data?.data?.setDeviceApp
  return answer ? parsed(answer) : null
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
