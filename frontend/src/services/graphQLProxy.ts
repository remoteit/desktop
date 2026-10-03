import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* Proxies and endpoints (graphql resolvers/proxy-endpoint-resolver.ts, presence-server docs/proxy-plan.md): an
   endpoint is one way into a device service through a proxy — a name on https, or a port for tcp and udp — on
   remote.it's proxies or on a device of yours made one. Device-session API only: an API without it answers
   UNSUPPORTED, for the caller to hide itself. */

export type ProxyCertificate = 'own' | 'ready' | 'pending'

export type Proxy = {
  id: string
  kind: 'remoteit' | 'own'
  region: string | null
  host: string
  name: string | null // an own proxy's, before its account's slug ('' for the slug alone)
  domain: string | null
  publicEndpoints: boolean
  manage: boolean
  certificate: ProxyCertificate
}

export type EndpointKind = 'https' | 'tcp' | 'udp'
export type EndpointAccess = 'public' | 'signed-in' | 'ip-locked' | 'latch' | 'cidr'
export type EndpointLifetime = 'temporary' | 'permanent'

export type Endpoint = {
  id: string
  serviceId: string
  proxy: Pick<Proxy, 'id' | 'kind' | 'host' | 'region'>
  kind: EndpointKind
  lifetime: EndpointLifetime
  access: EndpointAccess
  lockedIp: string | null
  allow: string[] | null
  host: string
  port: number | null
  url: string
  created: string
  expires: string | null
}

export type NewEndpoint = {
  kind: EndpointKind
  access: EndpointAccess
  lifetime: EndpointLifetime
  proxyId?: string
  lockedIp?: string
  allow?: string[]
}

const PROXY_FIELDS = 'id kind region host name domain publicEndpoints manage certificate'
const ENDPOINT_FIELDS =
  'id serviceId proxy { id kind host region } kind lifetime access lockedIp allow host port url created expires'

async function read<T>(query: string, variables: ILookup<any>, marker: string, pick: (data: any) => T) {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR' as const
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, marker)) return UNSUPPORTED
  if (errors) return 'ERROR' as const
  return pick(response.data?.data)
}

export const graphQLProxies = () =>
  read<Proxy[]>(`query Proxies { proxies { ${PROXY_FIELDS} } }`, {}, 'proxies', data => data?.proxies ?? [])

// A service's endpoints: all of them for whoever manages it, otherwise one's own.
export const graphQLServiceEndpoints = (deviceId: string, serviceId: string) =>
  read<Endpoint[]>(
    `query ServiceEndpoints($id: [String!]!) {
      login { device(id: $id) { id services { id endpoints { ${ENDPOINT_FIELDS} } } } }
    }`,
    { id: [deviceId] },
    'endpoints',
    data => data?.login?.device?.[0]?.services?.find((s: { id: string }) => s.id === serviceId)?.endpoints ?? []
  )

export const graphQLCreateEndpoint = (serviceId: string, endpoint: NewEndpoint) =>
  graphQLBasicRequest(
    ` mutation CreateEndpoint($serviceId: String!, $kind: String!, $access: String!, $lifetime: String,
        $proxyId: String, $lockedIp: String, $allow: [String!]) {
        createEndpoint(serviceId: $serviceId, kind: $kind, access: $access, lifetime: $lifetime, proxyId: $proxyId,
          lockedIp: $lockedIp, allow: $allow) { ${ENDPOINT_FIELDS} }
      }`,
    { serviceId, ...endpoint }
  )

export const graphQLRemoveEndpoint = (id: string) =>
  graphQLBasicRequest(` mutation RemoveEndpoint($id: String!) { removeEndpoint(id: $id) }`, { id })

export const graphQLSetProxy = (
  deviceId: string,
  set: { name?: string; domain?: string | null; publicEndpoints?: boolean }
) =>
  graphQLBasicRequest(
    ` mutation SetProxy($deviceId: String!, $name: String, $domain: String, $publicEndpoints: Boolean) {
        setProxy(deviceId: $deviceId, name: $name, domain: $domain, publicEndpoints: $publicEndpoints) { ${PROXY_FIELDS} }
      }`,
    { deviceId, ...set }
  )

export const graphQLRemoveProxy = (deviceId: string) =>
  graphQLBasicRequest(` mutation RemoveProxy($deviceId: String!) { removeProxy(deviceId: $deviceId) }`, { deviceId })

// Where an endpoint is reached, as a person would type it.
export const endpointAddress = (endpoint: Pick<Endpoint, 'kind' | 'url' | 'host' | 'port'>) =>
  endpoint.kind === 'https' ? endpoint.url : `${endpoint.host}:${endpoint.port}`

// Exit nodes (proxy-plan.md §8): using a device as one is its own grant — its owner's always, anyone else's by their
// share or organization role. A share's is set apart from what sharing again resets.
export const graphQLShareExit = (deviceId: string, email: string) =>
  read<boolean>(
    `query ShareExit($id: [String!]!) { login { device(id: $id) { id access { user { email } exit } } } }`,
    { id: [deviceId] },
    'exit',
    data =>
      !!data?.login?.device?.[0]?.access?.find(
        (a: { user?: { email?: string } }) => a.user?.email?.toLowerCase() === email.toLowerCase()
      )?.exit
  )

export const graphQLSetShareExit = (deviceId: string, email: string, exit: boolean) =>
  graphQLBasicRequest(
    ` mutation SetShareExit($deviceId: String!, $email: String!, $exit: Boolean!) {
        setShareExit(deviceId: $deviceId, email: $email, exit: $exit)
      }`,
    { deviceId, email, exit }
  )

// A device's exit (proxy-plan.md §8, phase 3): the exit nodes a person may use, the one a device goes through, and
// whether it offers itself as one.
export type ExitInfo = { offersExit: boolean; exit: { id: string; name: string } | null }

export const graphQLDeviceExit = (deviceId: string) =>
  read<ExitInfo | null>(
    `query DeviceExit($id: [String!]!) { login { device(id: $id) { id offersExit exit { id name } } } }`,
    { id: [deviceId] },
    'offersExit',
    data => data?.login?.device?.[0] ?? null
  )

export const graphQLExits = () =>
  read<{ id: string; name: string }[]>(`query Exits { exits { id name } }`, {}, 'exits', data => data?.exits ?? [])

export const graphQLSetDeviceExit = (deviceId: string, via: string | null) =>
  graphQLBasicRequest(
    ` mutation SetDeviceExit($deviceId: String!, $via: String) { setDeviceExit(deviceId: $deviceId, via: $via) }`,
    { deviceId, via }
  )
