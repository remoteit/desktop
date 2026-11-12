import { post } from './post'
import { graphQLRequestWithReason } from './graphQL'

/* remote.it Protect and its route, apart (graphql-api docs/PROXY-GROUPS.md §13, §15): the device's own app and menu show
   a Protect switch and a Route through picker; the portal does too. Protect is the `protect` setting; the route is the
   device's exit (`exit`), kept while Protect is off. On is setDeviceExit(route), off setDeviceExit(none); the route
   alone, Protect as it is, is setDeviceExit(via, keepProtect) — where the API has keepProtect.

   The device list marks a device with Protect on by the exit it goes through (Device.usesExit: none while Protect is
   off), read in the list's own query — no read per row — where the API has the field.

   Each read from the API's schema once (as services/deviceSignIns): the portal meets graphqls without them, where a
   query or mutation naming them would fail. */

type Served = { keepProtect: boolean; listFields: string }

const NONE: Served = { keepProtect: false, listFields: '' }

const PROBE = `query DeviceProtectFields {
  mutation: __type(name: "Mutation") { fields { name args { name } } }
  device: __type(name: "Device") { fields { name } }
}`

const LIST_FIELDS = `
  usesExit { id name }`

let schema: Promise<Served> | undefined

export function parseDeviceProtect(data: any): Served {
  const setExit = (data?.mutation?.fields || []).find((field: { name: string }) => field.name === 'setDeviceExit')
  const keepProtect = !!setExit?.args?.some((arg: { name: string }) => arg.name === 'keepProtect')
  const usesExit = (data?.device?.fields || []).some((field: { name: string }) => field.name === 'usesExit')
  return { keepProtect, listFields: usesExit ? LIST_FIELDS : '' }
}

function served(): Promise<Served> {
  if (!schema)
    schema = post({ query: PROBE }).then(response => {
      if (response === 'ERROR') {
        schema = undefined
        return NONE
      }
      return parseDeviceProtect(response.data?.data)
    })
  return schema
}

// Whether the API chooses the route alone (setDeviceExit's keepProtect). Read once; asked again after a failed request.
export const keepProtectServed = async () => (await served()).keepProtect

// The fields a device list's query adds for Protect: none where the API has no Device.usesExit.
export const protectListFields = async () => (await served()).listFields

// For tests, and for a change of API or sign-in.
export function resetDeviceProtect() {
  schema = undefined
}

// Protect on, as the list read it: the exit the device goes out through. Nothing where the query did not ask; null for
// Protect off, or a device the reader does not manage (graphql says none then).
export function protectAdaptor(d: any): Partial<IDevice> {
  if (d?.usesExit === undefined) return {}
  const exit = d.usesExit
  return { protectExit: exit?.id ? { id: exit.id, name: exit.name || exit.id } : null }
}

// The route alone — the exit Protect goes through — Protect left on or off as it is.
export const graphQLSetDeviceRoute = (deviceId: string, via: string) =>
  graphQLRequestWithReason(
    ` mutation SetDeviceRoute($deviceId: String!, $via: String) { setDeviceExit(deviceId: $deviceId, via: $via, keepProtect: true) }`,
    { deviceId, via }
  )
