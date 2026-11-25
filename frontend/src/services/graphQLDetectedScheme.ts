import { post } from './post'
import { graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* What the device carrying a service found it really answers (graphql's Service.detectedScheme): a service typed
   `set` (http or https) that answers `serves` (https or http) on `port` — none when nothing was found or the type
   already matches. Not in the device query: that query runs on every API, and only one that detects schemes has the
   field. So it is read on its own, per device, and an API without it answers UNSUPPORTED — asked once a session.
   `redirect` says the service was found by a redirect to https:// on the same host, and how that went: `followed` by
   its device, or `passed` back to the browser, which then loops on the service's name. An API from before it is asked
   again without it. */

export type DetectedScheme = {
  set: string
  serves: string
  port: number
  detected: string | null
  redirect?: 'followed' | 'passed' | null
}

export type DetectedSchemes = ILookup<DetectedScheme | null> // by service id

const query = (redirect: boolean) => `query DetectedScheme($id: [String!]!) {
  login {
    device(id: $id) {
      id
      services { id detectedScheme { set serves port detected${redirect ? ' redirect' : ''} } }
    }
  }
}`

let unsupported = false
let withRedirect = true

export async function graphQLDetectedSchemes(
  deviceId: string
): Promise<DetectedSchemes | 'ERROR' | typeof UNSUPPORTED> {
  if (unsupported) return UNSUPPORTED
  const variables = { id: [deviceId] }
  const QUERY = query(withRedirect)
  const response = await post({ query: QUERY, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query: QUERY, variables })
  if (withoutDeviceSessions(errors, 'detectedScheme')) {
    unsupported = true
    return UNSUPPORTED
  }
  if (withRedirect && withoutDeviceSessions(errors, 'redirect')) {
    withRedirect = false
    return graphQLDetectedSchemes(deviceId)
  }
  if (errors) return 'ERROR'
  const device = response.data?.data?.login?.device?.[0]
  return Object.fromEntries((device?.services || []).map((s: any) => [s.id, s.detectedScheme ?? null]))
}

/* A passed redirect to the same HTTPS endpoint loops while the service still has the wrong scheme or port. */
export const redirectLoops = (
  detected: DetectedScheme | null | undefined,
  service: Pick<IService, 'typeID' | 'port'> | undefined,
  launchPort: number
): boolean =>
  !!detected &&
  !!service &&
  detected.redirect === 'passed' &&
  detected.serves?.toLowerCase() === 'https' &&
  detected.port === launchPort &&
  !(service.typeID === HTTPS_TYPE && service.port === detected.port)

export const HTTP_TYPE = 7
export const HTTPS_TYPE = 8

// The shared name's HTTPS entry forwards to a plain HTTP service on port 80, where no service of the device has port 443.
export const defaultHttpOnName = (service?: IService, device?: IDevice): boolean =>
  service?.typeID === HTTP_TYPE &&
  service.port === 80 &&
  !device?.services?.some(other => other.id !== service.id && other.enabled !== false && other.port === 443)
