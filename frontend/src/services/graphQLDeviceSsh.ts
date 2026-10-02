import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'

// SSH certificates (graphql resolvers/device-ssh-resolver.ts): who may log in to a device as which local user — set by
// whoever manages it, checked when graphql signs a certificate for a session.

// login '' is their own account on the device (account), admin or not; otherwise a local user, * for any.
export type DeviceSshGrant = {
  login: string
  account: string | null
  admin: boolean
  user: { id: string; email: string | null }
}
export type DeviceSshRead = {
  fallback: boolean
  grants: DeviceSshGrant[]
}

const QUERY = `query DeviceSsh($id: [String!]!) {
  login {
    device(id: $id) {
      id
      sshAccess { fallback grants { login account admin user { id email } } }
    }
  }
}`

// null: not a device this person manages, or an API without it.
export async function graphQLDeviceSsh(deviceId: string): Promise<DeviceSshRead | null> {
  const variables = { id: [deviceId] }
  const response = await post({ query: QUERY, variables })
  if (response === 'ERROR') return null
  if (graphQLGetErrors(response, true, { query: QUERY, variables })) return null
  const device = response.data?.data?.login?.device?.[0]
  if (!device?.sshAccess) return null
  return device.sshAccess
}

export async function graphQLGrantDeviceSsh(deviceId: string, email: string, login: string, admin: boolean) {
  return await graphQLBasicRequest(
    ` mutation GrantDeviceSsh($deviceId: String!, $email: String!, $login: String, $admin: Boolean) {
        grantDeviceSsh(deviceId: $deviceId, email: $email, login: $login, admin: $admin)
      }`,
    { deviceId, email, login, admin }
  )
}

export async function graphQLRevokeDeviceSsh(deviceId: string, login: string, userId: string) {
  return await graphQLBasicRequest(
    ` mutation RevokeDeviceSsh($deviceId: String!, $login: String!, $userId: String!) {
        revokeDeviceSsh(deviceId: $deviceId, login: $login, userId: $userId)
      }`,
    { deviceId, login, userId }
  )
}

// An organization role's SSH admin setting: its members are admins (sudo) on their own accounts on the devices it
// reaches. null: an API without it.
export async function graphQLRoleSshAdmin(accountId: string, roleId: string): Promise<boolean | null> {
  const query = `query RoleSshAdmin($accountId: String) {
    login { account(id: $accountId) { organization { roles { id sshAdmin } } } }
  }`
  const response = await post({ query, variables: { accountId } })
  if (response === 'ERROR') return null
  if (graphQLGetErrors(response, true, { query, variables: { accountId } })) return null
  const roles: { id: string; sshAdmin: boolean }[] = response.data?.data?.login?.account?.organization?.roles ?? []
  return roles.find(role => role.id === roleId)?.sshAdmin ?? null
}

export async function graphQLSetRoleSshAdmin(accountId: string, id: string, sshAdmin: boolean) {
  return await graphQLBasicRequest(
    ` mutation SetRoleSshAdmin($accountId: String, $id: String!, $sshAdmin: Boolean!) {
        setRoleSshAdmin(accountId: $accountId, id: $id, sshAdmin: $sshAdmin)
      }`,
    { accountId, id, sshAdmin }
  )
}
