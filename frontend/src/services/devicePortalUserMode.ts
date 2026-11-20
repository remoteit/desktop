import { graphQLBasicRequest, graphQLRequestWithReason } from './graphQL'
import { PersonRef, portalUserModeServed } from './deviceSignIns'

export type UserModeScope = { name: string | null; account: string | null; requiresOsAdmin: boolean }
type UserModeBinding = UserModeScope & { id: string; person: PersonRef; state: 'pending' | 'active' }

export type PortalUserMode = {
  portalUserMode: UserModeBinding[]
  userModeEligibility: {
    accounts: UserModeScope[]
    canRequestWholeDevice: boolean
    blockedByLocalPolicy: boolean
  }
}

export async function readPortalUserMode(deviceId: string): Promise<PortalUserMode | null | 'ERROR'> {
  const supported = await portalUserModeServed()
  if (supported === 'ERROR') return supported
  if (!supported) return null
  const data = await graphQLBasicRequest(
    `query PortalUserMode($id: [String!]!) {
      login { device(id: $id) {
        portalUserMode { id name account state requiresOsAdmin person { id email } }
        userModeEligibility { accounts { name account requiresOsAdmin } canRequestWholeDevice blockedByLocalPolicy }
      } }
    }`,
    { id: [deviceId] },
    true
  )
  if (data === 'ERROR') return data
  const device = data.data?.data?.login?.device?.[0]
  return Array.isArray(device?.portalUserMode) && device.userModeEligibility ? device : null
}

export async function requestPortalUserMode(deviceId: string, scope: UserModeScope) {
  const response = await graphQLRequestWithReason(
    `mutation RequestDeviceUserMode($deviceId: String!, $name: String, $account: String) {
      requestDeviceUserMode(deviceId: $deviceId, name: $name, account: $account) { id approvalCode }
    }`,
    { deviceId, name: scope.name, account: scope.account }
  )
  if (response === 'ERROR' || 'reason' in response) return response
  return response.data?.data?.requestDeviceUserMode as { id: string; approvalCode?: string } | undefined
}

export async function revokePortalUserMode(deviceId: string, binding: string): Promise<boolean> {
  const data = await graphQLBasicRequest(
    `mutation RevokeDeviceUserMode($deviceId: String!, $binding: String!) {
      revokeDeviceUserMode(deviceId: $deviceId, binding: $binding)
    }`,
    { deviceId, binding }
  )
  return data !== 'ERROR' && data.data?.data?.revokeDeviceUserMode === true
}
