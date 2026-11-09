import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors, graphQLRequestWithReason } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'
import { PROXY_DEVICE_FIELDS, ProxyDevice } from './graphQLDeviceRuns'

/* Proxies and their endpoints (graphql-api docs/PROXY-GROUPS.md §13 and §14, presence-server docs/proxy-plan.md): a
   proxy is reached at its name — its tcp and udp endpoints there, each at a port, and each https endpoint at a name of
   its own —, every name one label under the stage's proxy zone, served under the stage's one certificate. An own proxy
   may be given an own name — a name under a domain its owner controls, verified by DNS records its owner adds, or one
   under its account's base, a subdomain the account delegates to remote.it —, under which its addresses then are,
   served under a certificate of its own that remote.it issues and renews. It is run by devices, every device running
   it serving every endpoint of it. remote.it's are at a location; an own proxy is its account's: made, then devices
   added to run it, and kept — its host and endpoints — until its account deletes it. An own proxy is Internet —
   reached wherever its devices can be reached from the internet — or Local network — reached only on its devices' own
   network, where every device of it must be —, chosen as it is made and never changed; remote.it's are Internet. An
   endpoint is made on a proxy. A slug change moves no proxy: its host keeps the slug it was made or last labelled under
   until its label is set again. A refusal comes back in graphql's words. Device-session API only: an API without it
   answers UNSUPPORTED, for the caller to hide itself. */

// The stage's certificate, for every proxy name: held, or not issued yet.
export type ProxyCertificate = 'ready' | 'pending'

/* An own proxy's own name (§14, decision 48), at least one label under a domain its owner controls: office.example.com,
   never example.com itself. Three CNAMEs prove it is theirs: the name and *.<name> at the proxy's name, and
   _acme-challenge.<name> at a token of remote.it's, through which remote.it issues and renews its certificate. It is
   pending until they are all found, verified once they are (its addresses not moved yet), active once its addresses are
   moved under it and served, and broken once a record is gone or wrong after that: it keeps serving until its
   certificate would need renewing, which then fails. */
export type ProxyNameState = 'pending' | 'verified' | 'active' | 'broken'

// A record to add where the name's DNS is hosted, and what remote.it found of it at the last check: seen is what DNS
// answered instead, where it answered something else.
export type ProxyNameRecord = { name: string; type: string; value: string; found: boolean; seen: string | null }

// The own name's certificate, remote.it's to issue and renew through its _acme-challenge record.
export type ProxyNameCertificate = 'pending' | 'ready' | 'failed'

/* How a proxy has its own name: name, one of its own, claimed on its page by the three CNAMEs above; base, given by
   its account's base (AccountProxyBase) — <label>.<base>, its records and certificate remote.it's to keep —, with no
   records of its own, neither set nor removed on its page. */
export type ProxyNameVia = 'name' | 'base'

export type ProxyOwnName = {
  name: string
  state: ProxyNameState
  via: ProxyNameVia
  records: ProxyNameRecord[] // none for one given by the account's base
  certificate: ProxyNameCertificate | null
  checked: string | null // when its records were last checked
  problem: string | null // what is not right, in graphql's words
}

// An own name as a list of proxies shows it: the name, where it stands, and how it was given.
export type ProxyOwnNameBrief = Pick<ProxyOwnName, 'name' | 'state' | 'via'>

export type Proxy = {
  id: string
  name: string // remote.it's by its location ("remote.it pdx1a"), an own proxy by its name
  host: string // its name, <label>-<the slug it is under>.<proxy zone>: its tcp and udp endpoints are at it
  label: string | null // an own proxy's host's first part, before the slug; none for remote.it's
  remoteit: boolean
  local: boolean // Local network: reached only on its devices' own network. Else Internet. Chosen as it is made
  localNetwork: string | null // a local proxy's network, its first device's (192.168.1.0/24); none before it has one
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
  ownName?: ProxyOwnName | null // an own proxy's, for whoever manages it; its page's
}

// One of the account's proxies as their list reads it: its own name in brief.
export type ListedProxy = Omit<Proxy, 'ownName'> & { ownName?: ProxyOwnNameBrief | null }

export type EndpointKind = 'https' | 'tcp' | 'udp'
export type EndpointAccess = 'public' | 'signed-in' | 'ip-locked' | 'latch' | 'cidr'
export type EndpointLifetime = 'temporary' | 'permanent'

export type Endpoint = {
  id: string
  serviceId: string
  proxy: Pick<Proxy, 'id' | 'name' | 'host' | 'remoteit' | 'local'>
  kind: EndpointKind
  lifetime: EndpointLifetime
  access: EndpointAccess
  lockedIp: string | null
  allow: string[] | null
  host: string
  port: number | null
  url: string
  // On a local proxy, where it is reached besides its public name: the .local name its devices announce on their
  // network, then — a tcp or udp one — each device's IP and port in service. An https one has no address at an IP: a
  // device tells which endpoint a visitor wants by the name asked for. None on an Internet proxy.
  localAddresses: string[]
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
const CHOICE_FIELDS = 'id name host remoteit local publicEndpoints location provider'
const ENDPOINT_FIELDS = `id serviceId proxy { id name host remoteit local } kind lifetime access lockedIp allow host
  port url localAddresses created expires`
const RECORD_FIELDS = 'records { name type value found seen }'
const OWN_NAME_FIELDS = `name state via ${RECORD_FIELDS} certificate checked problem`
// A list's: no endpoints but their count, and its own name in brief. A proxy's page: its endpoints and its own name.
const FIELDS = `${CHOICE_FIELDS} label localNetwork activation manage owner { id email } endpointCount certificate
  devices { ${PROXY_DEVICE_FIELDS} }`
const LIST_FIELDS = `${FIELDS} ownName { name state via }`
const PAGE_FIELDS = `${FIELDS} ownName { ${OWN_NAME_FIELDS} } endpoints { ${ENDPOINT_FIELDS} }`

async function read<T>(query: string, variables: ILookup<any>, marker: string, pick: (data: any) => T) {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR' as const
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, marker)) return UNSUPPORTED
  if (errors) return 'ERROR' as const
  return pick(response.data?.data)
}

// A proxy to make an endpoint on.
export type ProxyChoice = Pick<
  Proxy,
  'id' | 'name' | 'host' | 'remoteit' | 'local' | 'publicEndpoints' | 'location' | 'provider'
>

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
  read<ListedProxy[]>(
    `query AccountProxies($accountId: String) { login { id account(id: $accountId) { id proxies { ${LIST_FIELDS} } } } }`,
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
// name when none is given), Internet or Local network for good: then devices are added to run it.
export async function graphQLCreateProxy(set: {
  name: string
  label?: string
  publicEndpoints?: boolean
  local?: boolean
  accountId?: string
}): Promise<Proxy | { reason: string }> {
  const result = await graphQLRequestWithReason(
    ` mutation CreateProxy($name: String!, $label: String, $publicEndpoints: Boolean, $local: Boolean, $accountId: String) {
      createProxy(name: $name, label: $label, publicEndpoints: $publicEndpoints, local: $local, accountId: $accountId) {
        ${FIELDS}
      }
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

// An endpoint's address before and after a move of its proxy's names or endpoints.
export type AddressMove = { endpoint: string; kind: string; from: string; to: string }

/* Its host: <label>-<the account's slug now> — a changed label, or the same one after the account's slug changed, which
   is how a proxy takes the new slug. Said first what it would do — its host after, every endpoint address that moves
   (its tcp and udp ones: its https ones keep their own names), and the stage's certificate its https endpoints are
   served with after, ready or pending (not issued yet: until it is, its https endpoints are not served) — and done with
   apply. */
export type NamesMove = { host: string; addresses: AddressMove[]; certificate: ProxyCertificate; applied: boolean }

const NAMES_FIELDS = 'host addresses { endpoint kind from to } certificate applied'

async function names<T>(field: string, mutation: string, variables: ILookup<any>): Promise<T | { reason: string }> {
  const result = await graphQLRequestWithReason(mutation, variables)
  if (result === 'ERROR') return { reason: '' }
  if ('reason' in result) return result
  return result.data?.data?.[field] ?? { reason: '' }
}

export const graphQLSetProxyLabel = (proxy: string, label: string, apply: boolean) =>
  names<NamesMove>(
    'setProxyLabel',
    ` mutation SetProxyLabel($proxy: String!, $label: String!, $apply: Boolean) {
      setProxyLabel(proxy: $proxy, label: $label, apply: $apply) { ${NAMES_FIELDS} }
    }`,
    { proxy, label, apply }
  )

/* Its own name claimed — a first one, or another in place of one its addresses are not under yet —: pending until its
   records are found, with the records to add. Refused in graphql's words: a name not under a domain (example.com
   itself), one of remote.it's, another proxy's. */
export const graphQLSetProxyName = (proxy: string, name: string) =>
  names<ProxyOwnName>(
    'setProxyName',
    ` mutation SetProxyName($proxy: String!, $name: String) {
      setProxyName(proxy: $proxy, name: $name) { ${OWN_NAME_FIELDS} }
    }`,
    { proxy, name }
  )

/* Its addresses moved under its own name, or back to remote.it's names: every endpoint address before and after, and
   the certificate its https endpoints are served with after — the own name's moving under it (pending, ready or
   failed: not served until it is ready), the stage's moving back (ready or pending). */
export type OwnNameMove = {
  addresses: AddressMove[]
  certificate: ProxyNameCertificate | ProxyCertificate
  applied: boolean
}

const OWN_NAME_MOVE_FIELDS = 'addresses { endpoint kind from to } certificate applied'

// Its records checked now (its own name's state read again after says what was found): what moving under it would do,
// and with apply — its records right — done.
export const graphQLVerifyProxyName = (proxy: string, apply: boolean) =>
  names<OwnNameMove>(
    'verifyProxyName',
    ` mutation VerifyProxyName($proxy: String!, $apply: Boolean) {
      verifyProxyName(proxy: $proxy, apply: $apply) { ${OWN_NAME_MOVE_FIELDS} }
    }`,
    { proxy, apply }
  )

// Its own name given up: what moving back to remote.it's names would do, and with apply done.
export const graphQLRemoveProxyName = (proxy: string, apply: boolean) =>
  names<OwnNameMove>(
    'removeProxyName',
    ` mutation RemoveProxyName($proxy: String!, $apply: Boolean) {
      removeProxyName(proxy: $proxy, apply: $apply) { ${OWN_NAME_MOVE_FIELDS} }
    }`,
    { proxy, apply }
  )

/* The account's base for its proxies' names (§14, decision 48, wave 3b), a paid feature — a plan that includes it;
   one per account: a subdomain the account controls, proxies.example.com, delegated to remote.it by NS records added
   at its DNS, to a zone remote.it makes for it. Pending until the delegation is seen; verified once it is (no proxy
   moved yet); active once the account's proxies are moved under it — each named <label>.<base>, but one with a name of
   its own, remote.it writing their records and keeping their certificates —; broken once a record is gone or wrong
   after that. For the account's admins: none for anyone else. Refused in graphql's words: a plan without it, a name
   reserved, not a subdomain or taken, a base verified or applied held ("remove … first": a pending one is replaced). */
export type ProxyBaseState = 'pending' | 'verified' | 'active' | 'broken'

export type AccountProxyBase = {
  base: string
  state: ProxyBaseState
  nameServers: string[] // the zone's, remote.it's: what its NS records name
  records: ProxyNameRecord[] // the NS records to add, each as the last check found it
  checked: string | null // when the delegation was last checked
  problem: string | null // what is not right, in graphql's words
  proxies: number // the account's proxies named under it
  removeAt?: string | null // when remote.it takes it away unless something changes first
  removeReason?: 'plan' | 'pending' | null // the plan no longer includes a base, or it is not delegated
}

const BASE_FIELDS = `base state nameServers ${RECORD_FIELDS} checked problem proxies removeAt removeReason`

/* The account's proxies moved under its base, or back to their names before: a names move a proxy — the proxy, its
   name after (under the base, <label>.<base>; back, its host), each endpoint address before and after, and the
   certificate its https endpoints are served with after (under the base, the base's: pending, ready or failed; back,
   the stage's) —, each proxy that moves; a proxy with a name of its own moves neither way. Whether it was done, or only
   said. */
export type ProxyMove = { proxy: { id: string; name: string }; host: string; ownName: string | null } & OwnNameMove
export type BaseMove = { moves: ProxyMove[]; applied: boolean }

const BASE_MOVE_FIELDS = `moves { proxy { id name } host ownName ${OWN_NAME_MOVE_FIELDS} } applied`

// The account's base as it stands, for an admin of it; none for another, or before one is set.
export const graphQLProxyBase = (accountId: string) =>
  read<AccountProxyBase | null>(
    `query ProxyBase($accountId: String) { proxyBase(accountId: $accountId) { ${BASE_FIELDS} } }`,
    { accountId },
    'proxyBase',
    data => data?.proxyBase ?? null
  )

// A base claimed: pending until its delegation is seen, with the NS records to add.
export const graphQLSetAccountProxyBase = (accountId: string, base: string) =>
  names<AccountProxyBase>(
    'setAccountProxyBase',
    ` mutation SetAccountProxyBase($accountId: String, $base: String!) {
      setAccountProxyBase(accountId: $accountId, base: $base) { ${BASE_FIELDS} }
    }`,
    { accountId, base }
  )

// Its delegation checked now (the base read again after says what was found): which proxies' addresses would move
// under it, and with apply — the delegation seen — moved.
export const graphQLVerifyAccountProxyBase = (accountId: string, apply: boolean) =>
  names<BaseMove>(
    'verifyAccountProxyBase',
    ` mutation VerifyAccountProxyBase($accountId: String, $apply: Boolean) {
      verifyAccountProxyBase(accountId: $accountId, apply: $apply) { ${BASE_MOVE_FIELDS} }
    }`,
    { accountId, apply }
  )

// The base given up: which proxies' addresses would move back, and with apply moved, its zone deleted.
export const graphQLRemoveAccountProxyBase = (accountId: string, apply: boolean) =>
  names<BaseMove>(
    'removeAccountProxyBase',
    ` mutation RemoveAccountProxyBase($accountId: String, $apply: Boolean) {
      removeAccountProxyBase(accountId: $accountId, apply: $apply) { ${BASE_MOVE_FIELDS} }
    }`,
    { accountId, apply }
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

// The endpoints of a proxy no device runs, to another proxy of its account: each address before and after — its tcp
// and udp ones move to the other proxy's names, its https ones keep their own — and, applied, done. Refused on a name or
// port clash.
export type EndpointsMove = { addresses: AddressMove[]; applied: boolean }

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

// Where an endpoint is reached, as a person would type it: graphql's url — under its proxy's own name once that is
// active —, an https one's whole, a tcp or udp one's host and port, its scheme dropped.
export const endpointAddress = (endpoint: Pick<Endpoint, 'kind' | 'url' | 'host' | 'port'>) =>
  endpoint.kind === 'https'
    ? endpoint.url
    : endpoint.url.startsWith(`${endpoint.kind}://`)
    ? endpoint.url.slice(endpoint.kind.length + 3)
    : `${endpoint.host}:${endpoint.port}`
