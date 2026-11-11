import { post } from './post'
import { graphQLGetErrors } from './graphQL'

/* Who is signed in on a device (graphql-api docs/PROXY-GROUPS.md §15): a sign-in belongs to the OS account that made
   it, several at once — each the account (its OS id, and its name there), the person, since when, and whether they
   manage the device. graphql's Device.signIns, for whoever manages the device.

   The exit and Protect are the machine's, chosen on it by a signed-in person who manages it or by its administrator.
   A choice a signed-in person made there lasts while their sign-in does: it is withdrawn at their sign-out, and the
   portal's value stands again. A manager may lend the machine one of their own exits. Who made a choice on the device
   is said by its OS name (Device.exitSetOnDeviceBy, DeviceSetting.by), which is that account's name here: the
   sign-in on it names the person.

   Offered only where the API has it, read from its schema once (as services/deviceDisable): the portal meets graphqls
   without it, where a query naming signIns would fail. */

export type DeviceSignIn = {
  account: string // the OS's id for it: a UID, or a SID on Windows
  name: string | null // the account's name on the machine
  person: { id: string; email: string | null } | null
  since: string | null
  manages: boolean
}

const PROBE = `query DeviceSignInFields { device: __type(name: "Device") { fields { name } } }`

let schema: Promise<boolean> | undefined

export const parseDeviceSignInsServed = (data: any): boolean =>
  !!data?.device?.fields?.some((field: { name: string }) => field.name === 'signIns')

// Whether this API has sign-ins per account. Read once; asked again after a failed request.
export function deviceSignInsServed(): Promise<boolean> {
  if (!schema)
    schema = post({ query: PROBE }).then(response => {
      if (response === 'ERROR') {
        schema = undefined
        return false
      }
      return parseDeviceSignInsServed(response.data?.data)
    })
  return schema
}

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
