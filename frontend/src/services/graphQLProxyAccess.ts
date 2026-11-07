import { post } from './post'
import { graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* A proxy's access log (graphql resolvers/proxy-access-resolver.ts, presence-server docs/proxy-plan.md "Access log"):
   each visitor connection through an endpoint — when, from where, how it ended. A service's managers read its
   endpoints' visitors; a proxy's managers every visitor on it; remote.it admins remote.it's proxies'. The visitor's
   address comes masked (73.92.100.x, an IPv6 /48) to whoever does not manage the proxy. Device-session API only. */

export const ACCESS_OUTCOMES = [
  'served',
  'refused',
  'unanswered',
  'timed-out',
  'busy',
  'password-refused',
  'rate-limited',
  'address-refused',
  'ticket-refused',
  'unknown-endpoint',
  'abandoned',
  'unknown',
] as const

export type AccessOutcome = (typeof ACCESS_OUTCOMES)[number]

export type ProxyAccess = {
  id: string
  proxyId: string | null // the proxy it came through (Proxy.id); none in a record kept before records named it
  deviceId: string // the device that served it
  endpointId: string | null
  serviceId: string | null
  kind: string
  name: string | null
  port: number
  visitor: string
  visitorPort: number | null
  masked: boolean
  started: string
  ended: string
  durationMs: number
  bytesIn: number
  bytesOut: number
  outcome: AccessOutcome
  code: number | null
  reason: string | null
  userEmail: string | null
  passwordFailures: number
}

export type ProxyAccessPage = { items: ProxyAccess[]; hasMore: boolean; last: string | null }

// Whose visitors: a service's, a proxy's, those a device served, or — admins — remote.it's proxies' (one proxy's, one
// device's, or all of them).
export type AccessScope =
  | { serviceId: string }
  | { proxy: string }
  | { deviceId: string }
  | { admin: true; proxy?: string; deviceId?: string }

const FIELDS = `items { id proxyId deviceId endpointId serviceId kind name port visitor visitorPort masked started ended durationMs
  bytesIn bytesOut outcome code reason userEmail passwordFailures } hasMore last`

// Every outcome but served: the filter "not served".
export const FAILURES = ACCESS_OUTCOMES.filter(o => o !== 'served')

export async function graphQLProxyAccess(scope: AccessScope, outcomes?: string[], after?: string, size = 50) {
  const admin = 'admin' in scope
  const field = admin ? 'adminProxyAccess' : 'proxyAccess'
  const query = admin
    ? `query AdminProxyAccess($proxy: String, $deviceId: String, $outcomes: [String!], $after: String, $size: Int) {
        adminProxyAccess(proxy: $proxy, deviceId: $deviceId, outcomes: $outcomes, after: $after, size: $size) {
          ${FIELDS}
        }
      }`
    : `query ProxyAccess($serviceId: String, $proxy: String, $deviceId: String, $outcomes: [String!], $after: String,
        $size: Int) {
        proxyAccess(serviceId: $serviceId, proxy: $proxy, deviceId: $deviceId, outcomes: $outcomes, after: $after,
          size: $size) { ${FIELDS} }
      }`
  const variables = {
    serviceId: 'serviceId' in scope ? scope.serviceId : undefined,
    proxy: 'proxy' in scope ? scope.proxy : undefined,
    deviceId: 'deviceId' in scope ? scope.deviceId : undefined,
    outcomes: outcomes?.length ? outcomes : undefined,
    after,
    size,
  }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR' as const
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, field)) return UNSUPPORTED
  if (errors) return 'ERROR' as const
  return (response.data?.data?.[field] ?? null) as ProxyAccessPage | null
}
