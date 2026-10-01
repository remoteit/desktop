import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'
import { UNSUPPORTED } from './graphQLDaemon'

/* Networks of devices (presence-server docs/device-principals.md §2, §8): each network's devices — initiators, targets
   or both, and what a target exposes (the services the network lists, all of them, any port of its own) — its tag
   rules, the services it lists, and the people it is shared with. The fields exist only where the API serves device
   sessions, so the read is silent and an API without them answers UNSUPPORTED. */

export type NetworkDeviceRole = 'INITIATOR' | 'TARGET' | 'BOTH'
export type NetworkDeviceScope = 'LISTED' | 'ALL'

export type NetworkMember = {
  deviceId: string
  role: NetworkDeviceRole
  scope: NetworkDeviceScope
  anyPort: boolean
}

export type NetworkRule = {
  role: NetworkDeviceRole
  scope: NetworkDeviceScope
  operator: 'ANY' | 'ALL'
  tags: string[]
}

export type DeviceNetwork = {
  id: string
  name: string
  kind: 'NETWORK' | 'LINK'
  permissions: string[]
  owner: { id: string; email: string }
  devices: NetworkMember[]
  deviceRules: NetworkRule[]
  connections: { service: { id: string; name: string; device: { id: string; name: string } } }[]
  access: { user: { id: string; email: string }; role: ShareRole }[]
  userModeDevices: { userId: string; deviceId: string; name: string }[] // its people's devices in user mode
}

// What someone a network is shared with may do: connect to what it reaches, or manage it as well.
export type ShareRole = 'CONNECT' | 'MANAGE'

export const initiates = (member: { role: NetworkDeviceRole }) => member.role !== 'TARGET'
export const targeted = (member: { role: NetworkDeviceRole }) => member.role !== 'INITIATOR'

// Whether a member exposes anything — all its services, any port, or services the network lists — and so is a target.
// A device added with nothing chosen yet is a member exposing nothing.
export const exposes = (network: Pick<DeviceNetwork, 'connections'>, member: NetworkMember) =>
  targeted(member) &&
  (member.scope === 'ALL' || member.anyPort || network.connections.some(c => c.service.device?.id === member.deviceId))

// The role a member's choices make: an initiator when switched on, a target when it exposes something. Neither yet:
// kept as a target exposing nothing, which reaches nothing and is reached by nothing.
export const roleFor = (initiator: boolean, exposing: boolean): NetworkDeviceRole =>
  initiator && exposing ? 'BOTH' : initiator ? 'INITIATOR' : 'TARGET'

export async function graphQLDeviceNetworks(
  accountId?: string
): Promise<DeviceNetwork[] | 'ERROR' | typeof UNSUPPORTED> {
  const query = `query DeviceNetworks($accountId: String) {
    login {
      account(id: $accountId) {
        networks {
          id
          name
          kind
          permissions
          owner { id email }
          devices { deviceId role scope anyPort }
          deviceRules { role scope operator tags }
          connections { service { id name device { id name } } }
          access { user { id email } role }
          userModeDevices { userId deviceId name }
        }
      }
    }
  }`
  const variables = { accountId }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (errors?.some(error => /Cannot query field/.test(error.message || ''))) return UNSUPPORTED
  if (errors) return 'ERROR'
  return response.data?.data?.login?.account?.networks ?? []
}

// A device you manage onto a network you manage — or a change of its role or what it exposes there.
export const graphQLAddNetworkDevice = (
  networkId: string,
  deviceId: string,
  set: { role: NetworkDeviceRole; scope?: NetworkDeviceScope; anyPort?: boolean }
) =>
  graphQLBasicRequest(
    `mutation AddNetworkDevice($networkId: String!, $deviceId: String!, $role: NetworkDeviceRole!, $scope: NetworkDeviceScope, $anyPort: Boolean) {
      addNetworkDevice(networkId: $networkId, deviceId: $deviceId, role: $role, scope: $scope, anyPort: $anyPort) { deviceId }
    }`,
    { networkId, deviceId, ...set }
  )

export const graphQLRemoveNetworkDevice = (networkId: string, deviceId: string) =>
  graphQLBasicRequest(
    `mutation RemoveNetworkDevice($networkId: String!, $deviceId: String!) {
      removeNetworkDevice(networkId: $networkId, deviceId: $deviceId)
    }`,
    { networkId, deviceId }
  )

// A service the network lists: what a target exposing the listed services exposes.
export const graphQLListNetworkService = (networkId: string, serviceId: string, listed: boolean) =>
  graphQLBasicRequest(
    listed
      ? `mutation AddNetworkConnection($networkId: String!, $serviceId: String!) {
          addNetworkConnection(networkId: $networkId, serviceId: $serviceId)
        }`
      : `mutation RemoveNetworkConnection($networkId: String!, $serviceId: String!) {
          removeNetworkConnection(networkId: $networkId, serviceId: $serviceId)
        }`,
    { networkId, serviceId }
  )

// A device's Any port setting: the ports of its own it takes beyond its services ('' for none).
export const graphQLSetDeviceAnyPort = (deviceId: string, set: { tcp?: string; udp?: string }) =>
  graphQLBasicRequest(
    `mutation SetDeviceAnyPort($deviceId: String!, $tcp: String, $udp: String) {
      setDeviceAnyPort(deviceId: $deviceId, tcp: $tcp, udp: $udp) { tcp udp }
    }`,
    { deviceId, ...set }
  )

export async function graphQLDeviceAnyPort(deviceId: string) {
  const query = `query DeviceAnyPort { login { device(id: ${JSON.stringify([deviceId])}) { anyPort { tcp udp } } } }`
  const response = await post({ query })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query, variables: {} })
  if (errors?.some(error => /Cannot query field/.test(error.message || ''))) return UNSUPPORTED
  if (errors) return 'ERROR'
  return (response.data?.data?.login?.device?.[0]?.anyPort ?? null) as { tcp: string | null; udp: string | null } | null
}

// A network's device membership by tag, one rule per role (replacing the role's): the owner's devices carrying any —
// or all — of the tags. Account administrators only.
export const graphQLSetNetworkDeviceRule = (
  networkId: string,
  rule: { role: NetworkDeviceRole; tags: string[]; operator: 'ANY' | 'ALL'; scope?: NetworkDeviceScope }
) =>
  graphQLBasicRequest(
    `mutation SetNetworkDeviceRule($networkId: String!, $role: NetworkDeviceRole!, $tags: [String!]!, $operator: ListOperator, $scope: NetworkDeviceScope) {
      setNetworkDeviceRule(networkId: $networkId, role: $role, tags: $tags, operator: $operator, scope: $scope) { role }
    }`,
    { networkId, ...rule }
  )

export const graphQLRemoveNetworkDeviceRule = (networkId: string, role: NetworkDeviceRole) =>
  graphQLBasicRequest(
    `mutation RemoveNetworkDeviceRule($networkId: String!, $role: NetworkDeviceRole!) {
      removeNetworkDeviceRule(networkId: $networkId, role: $role)
    }`,
    { networkId, role }
  )

export const graphQLSetNetworkShareRole = (networkId: string, email: string, role: ShareRole) =>
  graphQLBasicRequest(
    `mutation SetNetworkShareRole($networkId: String!, $email: String!, $role: String!) {
      setNetworkShareRole(networkId: $networkId, email: $email, role: $role)
    }`,
    { networkId, email, role }
  )
