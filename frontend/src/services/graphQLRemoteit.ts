import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors, graphQLRequestWithReason } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'
import { EXIT_DEVICE_FIELDS, ExitDevice, PROXY_DEVICE_FIELDS, ProxyDevice } from './graphQLDeviceRuns'
import type { Proxy } from './graphQLProxy'
import type { Exit } from './graphQLExits'

/* remote.it's proxies and exits, for its admins (graphql-api docs/PROXY-GROUPS.md §13): at a location each — pdx1a the
   exit and pdx1a the proxy, two objects — run by the same machines, remote.it's devices (its system account's). A
   machine runs at most one proxy and one exit. A new machine installs with the proxy registration code and waits to be
   added to one; one made before the system account, still in someone's account, is moved to remote.it first. The
   admin API refuses anyone else. */

// A machine: a device running remote.it's proxies or exits, or one the registration code registered that runs neither.
export type RemoteitMachine = {
  id: string
  name: string | null
  state: string | null // the device's own: active (online), inactive, connected
  lastReported: string | null
  system: boolean // remote.it's system account owns it, as remote.it's devices must
  owner: string | null // whose account it is in, when not the system account's
  proxy: ProxyDevice | null
  exit: ExitDevice | null
}

const LOCATED = 'id name remoteit location provider activation created'

async function read<T>(query: string, marker: string, pick: (data: any) => T) {
  const response = await post({ query, variables: {} })
  if (response === 'ERROR') return 'ERROR' as const
  const errors = graphQLGetErrors(response, true, { query, variables: {} })
  if (withoutDeviceSessions(errors, marker)) return UNSUPPORTED
  if (errors) return 'ERROR' as const
  return pick(response.data?.data)
}

export const graphQLRemoteitProxies = () =>
  read<(Proxy & { latitude: number | null; longitude: number | null })[]>(
    `query RemoteitProxies { remoteitProxies { ${LOCATED} host latitude longitude devices { ${PROXY_DEVICE_FIELDS} } } }`,
    'remoteitProxies',
    data => data?.remoteitProxies ?? []
  )

// Each with its lan — never open on remote.it's, yet asked, so a machine added says what it opens as anywhere else.
export const graphQLRemoteitExits = () =>
  read<(Exit & { latitude: number | null; longitude: number | null })[]>(
    `query RemoteitExits {
      remoteitExits { ${LOCATED} latitude longitude offered users lan devices { ${EXIT_DEVICE_FIELDS} } }
    }`,
    'remoteitExits',
    data => data?.remoteitExits ?? []
  )

export const graphQLRemoteitMachines = () =>
  read<RemoteitMachine[]>(
    `query RemoteitMachines {
      remoteitProxyDevices { id name state lastReported system owner
        proxy { ${PROXY_DEVICE_FIELDS} proxy { id name host remoteit } } exit { ${EXIT_DEVICE_FIELDS} exit { id name remoteit } } }
    }`,
    'remoteitProxyDevices',
    data => data?.remoteitProxyDevices ?? []
  )

// A location to put one of remote.it's proxies or exits at: our code (three letters after the metro's airport and a
// digit, pdx1), its coordinates, and who and where, for people ("AWS us-west-2 (Boardman)").
export type Location = { location: string; latitude: number; longitude: number; provider?: string }

// Made at a location, named its code and the next free letter: then machines are added to run it.
export const graphQLCreateRemoteit = (kind: 'proxy' | 'exit', at: Location) =>
  graphQLRequestWithReason(
    kind === 'proxy'
      ? ` mutation CreateRemoteitProxy($location: String!, $latitude: Float!, $longitude: Float!, $provider: String) {
          createRemoteitProxy(location: $location, latitude: $latitude, longitude: $longitude, provider: $provider) { id }
        }`
      : ` mutation CreateRemoteitExit($location: String!, $latitude: Float!, $longitude: Float!, $provider: String) {
          createRemoteitExit(location: $location, latitude: $latitude, longitude: $longitude, provider: $provider) { id }
        }`,
    at
  )

// The code a machine installs with to be remote.it's: a secret, asked for only when shown.
export async function graphQLRemoteitProxyCode(): Promise<string | 'ERROR'> {
  const response = await graphQLBasicRequest(` mutation RemoteitProxyCode { remoteitProxyCode }`)
  return response === 'ERROR' ? 'ERROR' : response?.data?.data?.remoteitProxyCode ?? 'ERROR'
}

// A machine made before remote.it's were the system account's, moved into it.
export const graphQLAdoptRemoteitProxy = (deviceId: string) =>
  graphQLRequestWithReason(` mutation AdoptRemoteitProxy($deviceId: String!) { adoptRemoteitProxy(deviceId: $deviceId) }`, {
    deviceId,
  })

/* One of remote.it's devices running a proxy given another number: its own name e<number>-r3 — the old one stops
   reaching it —, the certificate it serves, the stage's for every proxy name, which a number changes nothing of (ready,
   or pending: not issued yet), and whether the new name has an address for its proxy's record (none: left out of it
   until it has; null where the stage does not manage the proxies' DNS). Said first, done with apply. */
export type Renumbered = {
  from: string
  to: string
  certificate: 'ready' | 'pending'
  record: boolean | null
  applied: boolean
}

export async function graphQLRenumberProxyDevice(
  deviceId: string,
  number: number,
  apply: boolean
): Promise<Renumbered | { reason: string }> {
  const result = await graphQLRequestWithReason(
    ` mutation RenumberProxyDevice($deviceId: String!, $number: Int!, $apply: Boolean) {
      renumberProxyDevice(deviceId: $deviceId, number: $number, apply: $apply) { from to certificate record applied }
    }`,
    { deviceId, number, apply }
  )
  if (result === 'ERROR') return { reason: '' }
  if ('reason' in result) return result
  return result.data?.data?.renumberProxyDevice ?? { reason: '' }
}

