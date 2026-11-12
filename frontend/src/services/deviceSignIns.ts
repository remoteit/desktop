import { post } from './post'
import { graphQLGetErrors } from './graphQL'

/* Who is signed in on a device (graphql-api docs/PROXY-GROUPS.md §15): a sign-in belongs to the OS account that made
   it, several at once — each the account (its OS id, and its name there), the person, since when, and whether they
   manage the device. graphql's Device.signIns, for whoever manages the device.

   The exit and Protect are the machine's, chosen on it by a signed-in person who manages it or by its administrator.
   A choice a signed-in person made there lasts while their sign-in does: it is withdrawn at their sign-out, and the
   portal's value stands again. A manager may lend the machine one of their own exits. graphql says who stands behind
   each: Device.exitSetOnDeviceSignedIn, exitSetOnDeviceAdmin and exitThroughPerson for the exit, DeviceSetting.signedIn
   and admin for Protect.

   Why the exit chosen is not working on the device, by its own report (Device.exitError: its routes could not be set
   there), is read from the same probe: a field of the device's exit, as these are.

   Offered only where the API has them, read from its schema once (as services/deviceDisable): the portal meets graphqls
   without them, where a query naming them would fail. */

export type DeviceSignIn = {
  account: string | null // the OS's id for it: a UID, or a SID on Windows; none for an older daemon's one sign-in
  name: string | null // the account's name on the machine
  person: PersonRef
  since: string
  manages: boolean
}

export type PersonRef = { id: string; email: string | null }

type Served = { signIns: boolean; exit: string; setting: string; exitError: string }

const NONE: Served = { signIns: false, exit: '', setting: '', exitError: '' }

const PROBE = `query DeviceSignInFields {
  device: __type(name: "Device") { fields { name } }
  setting: __type(name: "DeviceSetting") { fields { name } }
}`

let schema: Promise<Served> | undefined

// What the API serves of sign-ins per account: Device.signIns, and the fields a device's exit and its settings add for
// who set them — each only where it is there.
export function parseDeviceSignIns(data: any): Served {
  const names = (type: any) => new Set<string>((type?.fields || []).map((field: { name: string }) => field.name))
  const device = names(data?.device)
  const setting = names(data?.setting)
  return {
    signIns: device.has('signIns'),
    exit: [
      device.has('exitSetOnDeviceSignedIn') && 'exitSetOnDeviceSignedIn { id email }',
      device.has('exitSetOnDeviceAdmin') && 'exitSetOnDeviceAdmin',
      device.has('exitThroughPerson') && 'exitThroughPerson { id email }',
    ]
      .filter(Boolean)
      .join(' '),
    setting: [setting.has('signedIn') && 'signedIn { id email }', setting.has('admin') && 'admin']
      .filter(Boolean)
      .join(' '),
    exitError: device.has('exitError') ? 'exitError { code message at }' : '',
  }
}

function served(): Promise<Served> {
  if (!schema)
    schema = post({ query: PROBE }).then(response => {
      if (response === 'ERROR') {
        schema = undefined
        return NONE
      }
      return parseDeviceSignIns(response.data?.data)
    })
  return schema
}

// Whether this API has sign-ins per account. Read once; asked again after a failed request.
export const deviceSignInsServed = async () => (await served()).signIns

// The fields a device's exit query adds (who chose it on the machine), and a device setting's: none where not served.
export const exitSignInFields = async () => (await served()).exit
export const settingSignInFields = async () => (await served()).setting

// The field a device's exit query adds for why its exit is not working on it: none where not served.
export const exitErrorFields = async () => (await served()).exitError

// One read per device for every part of a page that asks in the same moment.
const reading = new Map<string, Promise<DeviceSignIn[] | null>>()

// A device's sign-ins, by account; null where the API has none, the device is not one the caller manages, or it failed.
export function graphQLDeviceSignIns(deviceId: string): Promise<DeviceSignIn[] | null> {
  let answer = reading.get(deviceId)
  if (!answer) {
    answer = readSignIns(deviceId).finally(() => reading.delete(deviceId))
    reading.set(deviceId, answer)
  }
  return answer
}

async function readSignIns(deviceId: string): Promise<DeviceSignIn[] | null> {
  if (!(await deviceSignInsServed())) return null
  const query = `query DeviceSignIns($id: [String!]!) {
    login { device(id: $id) { id signIns { account name person { id email } since manages } } }
  }`
  const variables = { id: [deviceId] }
  const response = await post({ query, variables })
  if (response === 'ERROR') return null
  if (graphQLGetErrors(response, true, { query, variables })) return null
  const signIns = response.data?.data?.login?.device?.[0]?.signIns
  return Array.isArray(signIns) ? signIns : null
}

// For tests, and for a change of API or sign-in.
export function resetDeviceSignIns() {
  schema = undefined
  reading.clear()
}
