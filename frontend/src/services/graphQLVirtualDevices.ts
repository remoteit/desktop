import { post } from './post'
import { store } from '../store'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'
import { withoutDeviceSessions } from './graphQLDaemon'
import { selectVirtualDevices } from '../hooks/useVirtualDevices'
import {
  isSampleId,
  sampleAdd,
  sampleConvert,
  sampleDelete,
  sampleDevices,
  sampleMove,
  sampleUpdate,
} from './virtualDevicesSample'

/* Virtual devices (graphql-api docs/VIRTUAL-DEVICES.md) as the portal reads and changes them. With the flag off
   nothing here asks the API anything and the device queries are as before. With it on, the API is asked once whether
   it serves the virtual fields: if it does, the device queries ask for them and the mutations go to it ('api'); if
   not, the device lists and pages carry sample devices and the mutations change those ('sample',
   services/virtualDevicesSample). */

export type VirtualMode = 'off' | 'api' | 'sample'

// What a device query adds for each device, and what a device's full read adds for a gateway.
export const VIRTUAL_DEVICE_FIELDS = `
  virtual
  host
  hosts
  lastAddress
  hostedBy { visible id name state }`

export const HOSTED_DEVICES_FIELDS = `
  hostedDevices { id name state host platform services { id } }`

let served: Promise<boolean> | undefined

async function probe(): Promise<boolean> {
  const query = 'query VirtualDevicesServed { login { id device(id: []) { id virtual } } }'
  const response = await post({ query })
  if (response === 'ERROR') {
    served = undefined // not answered: ask again next time
    return false
  }
  const errors = graphQLGetErrors(response, true, { query, variables: {} })
  return !withoutDeviceSessions(errors, 'virtual') && !errors
}

export async function virtualDevicesMode(): Promise<VirtualMode> {
  if (!selectVirtualDevices(store.getState())) return 'off'
  served ??= probe()
  return (await served) ? 'api' : 'sample'
}

// For tests, and for a change of API.
export function resetVirtualDevicesMode() {
  served = undefined
}

/* Sample mode's part in the device reads: the list gains the sample devices (at the top of its first page, and only
   while it is not narrowed by a search or filter), and a read naming sample ids is answered from them. */

export function withSampleList(response: any, from?: number, name?: string) {
  const devices = response?.data?.data?.login?.account?.devices
  if (!devices || from || name?.trim()) return response
  const samples = sampleDevices()
  devices.items = [...samples, ...(devices.items || [])] // first, so the sample is seen
  devices.total = (devices.total || 0) + samples.length
  return response
}

// Sample answers wait as a request would: pages that fetch, redirect and fetch again assume a round trip between.
const roundTrip = () => new Promise(resolve => setTimeout(resolve, 150))

export const splitSampleIds = (ids: string[]) => [ids.filter(id => !isSampleId(id)), ids.filter(isSampleId)]

export async function sampleResponse(ids: string[], path: 'account' | 'login') {
  await roundTrip()
  const device = sampleDevices(ids)
  return { data: { data: { login: path === 'account' ? { account: { device } } : { device } } } }
}

export function withSampleDevices(response: any, ids: string[], path: 'account' | 'login') {
  if (!ids.length) return response
  const extra = sampleDevices(ids)
  const login = response?.data?.data?.login
  if (!login) return sampleResponse(ids, path)
  if (path === 'account') login.account = { ...login.account, device: [...(login.account?.device || []), ...extra] }
  else login.device = [...(login.device || []), ...extra]
  return response
}

/* Mutations. Each answers the device it made or changed (its id) or 'ERROR'. */

type Result = { id: string } | 'ERROR'

async function mutate(query: string, variables: ILookup<any>, field: string): Promise<Result> {
  const response = await graphQLBasicRequest(query, variables)
  if (response === 'ERROR') return 'ERROR'
  const id = response?.data?.data?.[field]?.id
  return id ? { id } : 'ERROR'
}

export async function addVirtualDevice(
  gateway: IDevice,
  input: { name: string; host: string; platform?: number; services?: IVirtualServiceInput[] }
): Promise<Result> {
  if ((await virtualDevicesMode()) !== 'api' || isSampleId(gateway.id)) return { id: sampleAdd(gateway, input) }
  return mutate(
    `mutation AddVirtualDevice($gatewayId: String!, $name: String!, $host: String!, $platform: Int, $services: [VirtualServiceInput!]) {
      addVirtualDevice(gatewayId: $gatewayId, name: $name, host: $host, platform: $platform, services: $services) { id }
    }`,
    { gatewayId: gateway.id, ...input },
    'addVirtualDevice'
  )
}

export async function updateVirtualDevice(
  deviceId: string,
  set: { host?: string; platform?: number }
): Promise<Result> {
  if (isSampleId(deviceId)) return sampleUpdate(deviceId, set) ? { id: deviceId } : 'ERROR'
  return mutate(
    `mutation UpdateVirtualDevice($deviceId: String!, $host: String, $platform: Int) {
      updateVirtualDevice(deviceId: $deviceId, host: $host, platform: $platform) { id }
    }`,
    { deviceId, ...set },
    'updateVirtualDevice'
  )
}

export async function moveVirtualDevice(deviceId: string, gateway: IDevice): Promise<Result> {
  if (isSampleId(deviceId)) return sampleMove(deviceId, gateway) ? { id: deviceId } : 'ERROR'
  return mutate(
    `mutation MoveVirtualDevice($deviceId: String!, $gatewayId: String!) {
      moveVirtualDevice(deviceId: $deviceId, gatewayId: $gatewayId) { id }
    }`,
    { deviceId, gatewayId: gateway.id },
    'moveVirtualDevice'
  )
}

// A jump service made into a virtual device for its host: graphql moves every service of the gateway on that host.
export async function convertJumpService(
  gateway: IDevice,
  service: IService,
  name: string,
  platform?: number
): Promise<Result> {
  if ((await virtualDevicesMode()) !== 'api' || isSampleId(gateway.id))
    return { id: sampleConvert(gateway, service, name, platform) }
  return mutate(
    `mutation ConvertJumpService($serviceId: String!, $name: String!, $platform: Int) {
      convertJumpService(serviceId: $serviceId, name: $name, platform: $platform) { id }
    }`,
    { serviceId: service.id, name, platform },
    'convertJumpService'
  )
}

// A sample device's delete; with keepHosted the devices it hosted stay, unhosted. The ids it removed.
export function deleteSampleDevice(deviceId: string, keepHosted?: boolean) {
  return sampleDelete(deviceId, keepHosted)
}
