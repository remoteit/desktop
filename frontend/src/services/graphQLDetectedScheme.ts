import { post } from './post'
import { graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* What the device carrying a service found it really answers (graphql's Service.detectedScheme): a service typed
   `set` (http or https) that answers `serves` (https or http) on `port` — none when nothing was found or the type
   already matches. Not in the device query: that query runs on every API, and only one that detects schemes has the
   field. So it is read on its own, per device, and an API without it answers UNSUPPORTED — asked once a session. */

export type DetectedScheme = { set: string; serves: string; port: number; detected: string | null }

export type DetectedSchemes = ILookup<DetectedScheme | null> // by service id

const QUERY = `query DetectedScheme($id: [String!]!) {
  login {
    device(id: $id) {
      id
      services { id detectedScheme { set serves port detected } }
    }
  }
}`

let unsupported = false

export async function graphQLDetectedSchemes(
  deviceId: string
): Promise<DetectedSchemes | 'ERROR' | typeof UNSUPPORTED> {
  if (unsupported) return UNSUPPORTED
  const variables = { id: [deviceId] }
  const response = await post({ query: QUERY, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query: QUERY, variables })
  if (withoutDeviceSessions(errors, 'detectedScheme')) {
    unsupported = true
    return UNSUPPORTED
  }
  if (errors) return 'ERROR'
  const device = response.data?.data?.login?.device?.[0]
  return Object.fromEntries((device?.services || []).map((s: any) => [s.id, s.detectedScheme ?? null]))
}
