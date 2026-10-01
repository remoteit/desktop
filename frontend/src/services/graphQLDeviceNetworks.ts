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
  name?: string // another account's devices are not in your device list
  accountId?: string // the account that owns it
  accountName?: string
  services?: { id: string; name: string }[]
  role: NetworkDeviceRole
  scope: NetworkDeviceScope
  anyPort: boolean
}

// A network's devices by tag: an account's devices carrying any (or all) of its tags are members as it says. The
// account is the network owner's, or another whose administrator set the rule — which holds while they still are one.
export type NetworkRule = {
  id: string
  accountId: string
  accountName: string
  holds: boolean
  editable: boolean // you manage the network and administer both accounts
  addedByEmail?: string
  tags: string[]
  tagColors: { name: string; color: number | null }[] // its account's colours, which may not be the viewer's
  operator: 'ANY' | 'ALL'
  initiator: boolean
  allServices: boolean
  anyPort: boolean
  devices: string[] // the devices it makes members
  overridden: string[] // those it matches that are added on their own, which it does not apply to
  named: { id: string; name: string; services: { id: string; name: string }[] }[] // both, named, with services: another account's devices are not in your device list
}

// An account whose devices you may add to a network by its tags.
export type RuleAccount = { id: string; name: string; tags: string[] }

export type RuleChoices = Partial<Pick<NetworkRule, 'tags' | 'operator' | 'initiator' | 'allServices' | 'anyPort'>>

export type DeviceNetwork = {
  id: string
  name: string
  kind: 'NETWORK' | 'LINK'
  permissions: string[]
  owner: { id: string; email: string }
  devices: NetworkMember[]
  deviceRules: NetworkRule[]
  ruleAccounts: RuleAccount[]
  connections: { service: { id: string; name: string; device: { id: string; name: string } } }[]
  access: { user: { id: string; email: string }; role: ShareRole; organizationName?: string | null }[]
  userModeDevices: { userId: string; deviceId: string; name: string }[] // its people's devices in user mode
  accountAccess: AccountAccess[] // who reaches it through an organization: the owner's, and each one it is shared with
}

// An organization role reaching a network — all networks, or those carrying its tags — at a tier, with its members.
export type RoleAccess = {
  roleId: string
  roleName: string
  tier: ShareRole
  byTag: boolean
  tags: string[]
  operator: 'ANY' | 'ALL'
  members: { id: string; email: string }[]
}

// An organization through which people reach a network: the owning one — its owner and roles — or one it is shared
// with, at a tier that caps its members, whose roles (by its own tags on the network) decide which of them get in.
export type AccountAccess = {
  accountId: string
  accountName: string
  email: string // an organization's account email is its owner's
  owner: boolean
  tier: ShareRole
  tags: { name: string; color: number | null }[]
  tagsEditable: boolean
  tagChoices: string[]
  roles: RoleAccess[]
}

// What someone a network is shared with may do: connect to what it reaches; manage it as well — its devices, services
// and switches; or administer it — its people (granting any tier, admin too) and devices by tag. Deleting and
// transferring it are its owner's. A network may be shared with an organization, for its members as their roles allow.
export type ShareRole = 'CONNECT' | 'MANAGE' | 'ADMIN'

export const initiates = (member: { role: NetworkDeviceRole }) => member.role !== 'TARGET'
export const targeted = (member: { role: NetworkDeviceRole }) => member.role !== 'INITIATOR'

// Whether a member exposes anything — all its services, any port, or services the network lists — and so is a target.
// A device added with nothing chosen yet is a member exposing nothing.
export const exposes = (network: Pick<DeviceNetwork, 'connections'>, member: NetworkMember) =>
  targeted(member) &&
  (member.scope === 'ALL' || member.anyPort || network.connections.some(c => c.service.device?.id === member.deviceId))

// A network's devices, listed or by tag: how many initiate, and how many are targets exposing something.
export const memberCounts = (network: DeviceNetwork) => ({
  initiators:
    network.devices.filter(initiates).length +
    (network.deviceRules || []).filter(rule => rule.initiator).reduce((sum, rule) => sum + rule.devices.length, 0),
  targets:
    network.devices.filter(member => exposes(network, member)).length +
    (network.deviceRules || [])
      .filter(rule => rule.allServices || rule.anyPort)
      .reduce((sum, rule) => sum + rule.devices.length, 0),
})

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
          devices { deviceId role scope anyPort name accountId accountName services { id name } }
          deviceRules { id accountId accountName holds editable addedByEmail tags tagColors { name color } operator initiator allServices anyPort devices overridden named { id name services { id name } } }
          ruleAccounts { id name tags }
          connections { service { id name device { id name } } }
          access { user { id email } role organizationName }
          userModeDevices { userId deviceId name }
          accountAccess { accountId accountName email owner tier tags { name color } tagsEditable tagChoices roles { roleId roleName tier byTag tags operator members { id email } } }
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

// Devices by tag, for the owning account's administrators: a new rule, a change to one (fields left out keep what they
// were), or one gone.
export const graphQLCreateNetworkDeviceRule = (
  networkId: string,
  rule: RuleChoices & { tags: string[]; accountId?: string }
) =>
  graphQLBasicRequest(
    `mutation CreateNetworkDeviceRule($networkId: String!, $tags: [String!]!, $operator: ListOperator, $initiator: Boolean, $allServices: Boolean, $anyPort: Boolean, $accountId: String) {
      createNetworkDeviceRule(networkId: $networkId, tags: $tags, operator: $operator, initiator: $initiator, allServices: $allServices, anyPort: $anyPort, accountId: $accountId) { id }
    }`,
    { networkId, ...rule }
  )

export const graphQLUpdateNetworkDeviceRule = (ruleId: string, rule: RuleChoices) =>
  graphQLBasicRequest(
    `mutation UpdateNetworkDeviceRule($ruleId: String!, $tags: [String!], $operator: ListOperator, $initiator: Boolean, $allServices: Boolean, $anyPort: Boolean) {
      updateNetworkDeviceRule(ruleId: $ruleId, tags: $tags, operator: $operator, initiator: $initiator, allServices: $allServices, anyPort: $anyPort) { id }
    }`,
    { ruleId, ...rule }
  )

// Either side may end a rule: the network's, or an administrator of the account whose devices it takes (withdrawing).
export const graphQLRemoveNetworkDeviceRule = (ruleId: string) =>
  graphQLBasicRequest(
    `mutation RemoveNetworkDeviceRule($ruleId: String!) {
      removeNetworkDeviceRule(ruleId: $ruleId)
    }`,
    { ruleId }
  )

export const graphQLSetNetworkShareRole = (networkId: string, email: string, role: ShareRole) =>
  graphQLBasicRequest(
    `mutation SetNetworkShareRole($networkId: String!, $email: String!, $role: String!) {
      setNetworkShareRole(networkId: $networkId, email: $email, role: $role)
    }`,
    { networkId, email, role }
  )

// Other accounts' networks taking this account's devices by its tags: what its administrators see, and may withdraw.
export type TaggedInto = {
  id: string
  tags: string[]
  operator: 'ANY' | 'ALL'
  initiator: boolean
  allServices: boolean
  anyPort: boolean
  devices: string[]
  addedByEmail?: string
  network: { id: string; name: string; owner: { email: string } } | null
}

export async function graphQLTaggedInto(accountId: string): Promise<TaggedInto[] | 'ERROR' | typeof UNSUPPORTED> {
  const query = `query TaggedInto($accountId: String) {
    login {
      account(id: $accountId) {
        taggedInto { id tags operator initiator allServices anyPort devices addedByEmail network { id name owner { email } } }
      }
    }
  }`
  const variables = { accountId }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (errors?.some(error => /Cannot query field/.test(error.message || ''))) return UNSUPPORTED
  if (errors) return 'ERROR'
  return response.data?.data?.login?.account?.taggedInto ?? []
}

// An account's tags on a network — the owner's, or an organization's it is shared with — which decide which of its
// members reach it by role.
export const graphQLNetworkTag = (networkId: string, accountId: string, name: string, on: boolean) =>
  graphQLBasicRequest(
    on
      ? `mutation AddNetworkTag($networkId: String!, $name: [String!]!, $accountId: String) {
          addNetworkTag(networkId: $networkId, name: $name, accountId: $accountId)
        }`
      : `mutation RemoveNetworkTag($networkId: String!, $name: [String!]!, $accountId: String) {
          removeNetworkTag(networkId: $networkId, name: $name, accountId: $accountId)
        }`,
    { networkId, name: [name], accountId }
  )
