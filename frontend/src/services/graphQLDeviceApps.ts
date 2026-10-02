import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'

// A device's apps (graphql services/device-apps.ts): the console first — SSH by OpenSSH, run by the device's daemon.
// Its state is what the device says: off, starting, running, or unavailable with why.

export type DeviceApp = {
  id: string
  on: boolean
  state: 'off' | 'starting' | 'running' | 'unavailable'
  detail: string | null
  serviceId: string | null
  port: number | null
  hostKey: string | null
}

const FIELDS = 'id on state detail serviceId port hostKey'

// null: an API without apps, or a device this person cannot see.
export async function graphQLDeviceApps(deviceId: string): Promise<DeviceApp[] | null> {
  const query = `query DeviceApps($id: [String!]!) { login { device(id: $id) { id apps { ${FIELDS} } } } }`
  const variables = { id: [deviceId] }
  const response = await post({ query, variables })
  if (response === 'ERROR') return null
  if (graphQLGetErrors(response, true, { query, variables })) return null
  return response.data?.data?.login?.device?.[0]?.apps ?? null
}

export async function graphQLSetDeviceApp(deviceId: string, app: string, on: boolean): Promise<DeviceApp | null> {
  const response = await graphQLBasicRequest(
    ` mutation SetDeviceApp($deviceId: String!, $app: String!, $on: Boolean!) {
        setDeviceApp(deviceId: $deviceId, app: $app, on: $on) { ${FIELDS} }
      }`,
    { deviceId, app, on }
  )
  return response === 'ERROR' ? null : response?.data?.data?.setDeviceApp ?? null
}
