import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors, graphQLRequestWithReason } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'
import { PROXY_DEVICE_FIELDS, ProxyDevice } from './graphQLDeviceRuns'

/* Proxies and their endpoints (graphql-api docs/PROXY-GROUPS.md §13, presence-server docs/proxy-plan.md): a proxy is a
   host under which endpoints into device services are reached — a name on https, a port for tcp and udp — run by
   devices, every device running it serving every endpoint of it. remote.it's are at a location; an own proxy is its
   account's: made, then devices added to run it, and kept — its host and endpoints — until its account deletes it. An
   endpoint is made on a proxy. A slug change moves no proxy: its host keeps the slug it was made or last labelled under
   until its label is set again. A refusal comes back in graphql's words. Device-session API only: an API without it
   answers UNSUPPORTED, for the caller to hide itself. */

export type ProxyCertificate = 'own' | 'ready' | 'pending'

export type Proxy = {
  id: string
  name: string // remote.it's by its location ("remote.it pdx1a"), an own proxy by its name
  host: string // the name its endpoints are under: <label>-<the slug it is under>.<proxy domain>
  label: string | null // an own proxy's host's first part, before the slug; none for remote.it's
  domain: string | null // an own proxy's own domain for its https names
  remoteit: boolean
  publicEndpoints: boolean
  location: string | null
  provider: string
  activation: 'auto' | 'admin'
  manage: boolean
  owner: { id: string; email: string | null } | null
  devices: ProxyDevice[] | null // for whoever manages it
  endpointCount: number | null // for whoever manages it
  endpoints?: Endpoint[] // oldest first: every one for whoever manages it, else those you made on it; its page's
  certificate: ProxyCertificate | null // an own proxy's; remote.it's devices hold their own
}

export type EndpointKind = 'https' | 'tcp' | 'udp'
export type EndpointAccess = 'public' | 'signed-in' | 'ip-locked' | 'latch' | 'cidr'
export type EndpointLifetime = 'temporary' | 'permanent'

export type Endpoint = {
  id: string
  serviceId: string
  proxy: Pick<Proxy, 'id' | 'name' | 'host' | 'remoteit'>
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
  proxy?: string
  lockedIp?: string
  allow?: string[]
}

// What a list of proxies to choose from needs.
const CHOICE_FIELDS = 'id name host domain remoteit publicEndpoints location provider'
const ENDPOINT_FIELDS =
  'id serviceId proxy { id name host remoteit } kind lifetime access lockedIp allow host port url created expires'
// A list's: no endpoints but their count. A proxy's page: its endpoints too.
const FIELDS = `${CHOICE_FIELDS} label activation manage owner { id email } endpointCount certificate
  devices { ${PROXY_DEVICE_FIELDS} }`
const PAGE_FIELDS = `${FIELDS} endpoints { ${ENDPOINT_FIELDS} }`

async function read<T>(query: string, variables: ILookup<any>, marker: string, pick: (data: any) => T) {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR' as const
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, marker)) return UNSUPPORTED
  if (errors) return 'ERROR' as const
  return pick(response.data?.data)
}

// A proxy to make an endpoint on.
export type ProxyChoice = Pick<Proxy, 'id' | 'name' | 'host' | 'domain' | 'remoteit' | 'publicEndpoints' | 'location' | 'provider'>

// The proxies you may make endpoints on, each run in service: remote.it's, your own, and those your role reaches.
export const graphQLProxies = () =>
  read<ProxyChoice[]>(
    `query Proxies { proxies { ${CHOICE_FIELDS} } }`,
    {},
    'proxies',
    data => data?.proxies ?? []
  )

// An account's own proxies you manage, those no device runs too.
export const graphQLAccountProxies = (accountId: string) =>
  read<Proxy[]>(
    `query AccountProxies($accountId: String) { login { id account(id: $accountId) { id proxies { ${FIELDS} } } } }`,
    { accountId },
    'proxies',
    data => data?.login?.account?.proxies ?? []
  )

// One proxy, with its endpoints: one you manage, or one you may make endpoints on. None for another.
export const graphQLProxy = (id: string) =>
  read<Proxy | null>(
    `query Proxy($id: String!) { proxy(id: $id) { ${PAGE_FIELDS} } }`,
    { id },
    'proxy',
    data => data?.proxy ?? null
  )

// Made in your account, or one you manage, under <label>-<slug> of the stage's proxy domain (the label made from the
// name when none is given): then devices are added to run it.
export async function graphQLCreateProxy(set: {
  name: string
  label?: string
  domain?: string
  publicEndpoints?: boolean
  accountId?: string
}): Promise<Proxy | { reason: string }> {
  const result = await graphQLRequestWithReason(
    ` mutation CreateProxy($name: String!, $label: String, $domain: String, $publicEndpoints: Boolean, $accountId: String) {
      createProxy(name: $name, label: $label, domain: $domain, publicEndpoints: $publicEndpoints, accountId: $accountId) { ${FIELDS} }
    }`,
    set
  )
  if (result === 'ERROR') return { reason: '' }
  if ('reason' in result) return result
  return result.data?.data?.createProxy
}

// Its name, for people: no address moves.
export const graphQLRenameProxy = (proxy: string, name: string) =>
  graphQLRequestWithReason(
    ` mutation RenameProxy($proxy: String!, $name: String!) { renameProxy(proxy: $proxy, name: $name) { id } }`,
    { proxy, name }
  )

/* Its names: its host, <label>-<the account's slug now> — a changed label, or the same one after the account's slug
   changed, which is how a proxy takes the new slug —, and its own domain for its https names, or none. Each says first
   what it would do — every endpoint address that moves, before and after, and the certificate its https endpoints are
   served with after: own (the domain's, put on its devices by its owner), ready, or pending (issued within a day: until
   then its https endpoints are not served) — and is done with apply. The old host's certificate goes. */
export type NamesMove = {
  host: string
  domain: string | null
  addresses: { endpoint: string; kind: string; from: string; to: string }[]
  certificate: ProxyCertificate
  applied: boolean
}

const NAMES_FIELDS = 'host domain addresses { endpoint kind from to } certificate applied'

async function names(field: string, mutation: string, variables: ILookup<any>): Promise<NamesMove | { reason: string }> {
  const result = await graphQLRequestWithReason(mutation, variables)
  if (result === 'ERROR') return { reason: '' }
  if ('reason' in result) return result
  return result.data?.data?.[field] ?? { reason: '' }
}

export const graphQLSetProxyLabel = (proxy: string, label: string, apply: boolean) =>
  names(
    'setProxyLabel',
    ` mutation SetProxyLabel($proxy: String!, $label: String!, $apply: Boolean) {
      setProxyLabel(proxy: $proxy, label: $label, apply: $apply) { ${NAMES_FIELDS} }
    }`,
    { proxy, label, apply }
  )

export const graphQLSetProxyDomain = (proxy: string, domain: string | null, apply: boolean) =>
  names(
    'setProxyDomain',
    ` mutation SetProxyDomain($proxy: String!, $domain: String, $apply: Boolean) {
      setProxyDomain(proxy: $proxy, domain: $domain, apply: $apply) { ${NAMES_FIELDS} }
    }`,
    { proxy, domain, apply }
  )

// Whether it takes public endpoints. Off while it has public endpoints, refused unless confirmed, saying how many:
// confirmed, they are removed.
export const graphQLSetProxyPublicEndpoints = (proxy: string, publicEndpoints: boolean, confirm: boolean) =>
  graphQLRequestWithReason(
    ` mutation SetProxyPublicEndpoints($proxy: String!, $publicEndpoints: Boolean!, $confirm: Boolean) {
      setProxyPublicEndpoints(proxy: $proxy, publicEndpoints: $publicEndpoints, confirm: $confirm) { id publicEndpoints }
    }`,
    { proxy, publicEndpoints, confirm }
  )

// How its new devices go into service: auto, by themselves once their checks pass; admin, when an admin puts them in.
export const graphQLSetProxyActivation = (proxy: string, activation: 'auto' | 'admin') =>
  graphQLRequestWithReason(
    ` mutation SetProxyActivation($proxy: String!, $activation: String!) {
      setProxyActivation(proxy: $proxy, activation: $activation) { id }
    }`,
    { proxy, activation }
  )

// One no device runs. With endpoints, refused unless confirmed: confirmed, they are removed.
export const graphQLDeleteProxy = (proxy: string, confirm: boolean) =>
  graphQLRequestWithReason(
    ` mutation DeleteProxy($proxy: String!, $confirm: Boolean) { deleteProxy(proxy: $proxy, confirm: $confirm) }`,
    { proxy, confirm }
  )

// The endpoints of a proxy no device runs, to another proxy of its account: each address before and after, and,
// applied, done. Refused on a name or port clash.
export type EndpointsMove = { addresses: { endpoint: string; kind: string; from: string; to: string }[]; applied: boolean }

export async function graphQLMoveProxyEndpoints(
  from: string,
  to: string,
  apply: boolean
): Promise<EndpointsMove | { reason: string }> {
  const result = await graphQLRequestWithReason(
    ` mutation MoveProxyEndpoints($from: String!, $to: String!, $apply: Boolean) {
      moveProxyEndpoints(from: $from, to: $to, apply: $apply) { addresses { endpoint kind from to } applied }
    }`,
    { from, to, apply }
  )
  if (result === 'ERROR') return { reason: '' }
  if ('reason' in result) return result
  return result.data?.data?.moveProxyEndpoints ?? { reason: '' }
}

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

// Made on the proxy named, or remote.it's nearest the device in service.
export const graphQLCreateEndpoint = (serviceId: string, endpoint: NewEndpoint) =>
  graphQLBasicRequest(
    ` mutation CreateEndpoint($serviceId: String!, $kind: String!, $access: String!, $lifetime: String,
        $proxy: String, $lockedIp: String, $allow: [String!]) {
        createEndpoint(serviceId: $serviceId, kind: $kind, access: $access, lifetime: $lifetime, proxy: $proxy,
          lockedIp: $lockedIp, allow: $allow) { ${ENDPOINT_FIELDS} }
      }`,
    { serviceId, ...endpoint }
  )

export const graphQLRemoveEndpoint = (id: string) =>
  graphQLBasicRequest(` mutation RemoveEndpoint($id: String!) { removeEndpoint(id: $id) }`, { id })

// Where an endpoint is reached, as a person would type it.
export const endpointAddress = (endpoint: Pick<Endpoint, 'kind' | 'url' | 'host' | 'port'>) =>
  endpoint.kind === 'https' ? endpoint.url : `${endpoint.host}:${endpoint.port}`
