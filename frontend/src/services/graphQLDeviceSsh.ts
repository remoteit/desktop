import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors, graphQLRequestWithReason, refusalOf } from './graphQL'

// SSH certificates (graphql resolvers/device-ssh-resolver.ts): who may log in to a device as which local user — set by
// whoever manages it, checked when graphql signs a certificate for a session.

// login '' is their own account on the device (account), admin or not; otherwise a local user, * for any. existing: their
// own account is one already on the device, named by a device admin — remote.it does not make, lock or admin it.
export type DeviceSshGrant = {
  login: string
  account: string | null
  existing: boolean
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
      sshAccess { fallback grants { login account existing admin user { id email } } }
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

// Names a person's own account on a device: by a handle (the stage's r3 prefix before it), or as an account already
// there (existing, its whole name). The name given, or graphql's reason it could not be.
export async function graphQLSetDeviceSshAccount(
  deviceId: string,
  userId: string,
  name: string,
  existing: boolean
): Promise<{ account: string } | { reason: string }> {
  const result = await graphQLRequestWithReason(
    ` mutation SetDeviceSshAccount($deviceId: String!, $userId: String!, $handle: String, $existingAccount: String) {
        setDeviceSshAccount(deviceId: $deviceId, userId: $userId, handle: $handle, existingAccount: $existingAccount)
      }`,
    { deviceId, userId, ...(existing ? { existingAccount: name } : { handle: name }) }
  )
  const reason = refusalOf(result)
  if (reason !== undefined || result === 'ERROR' || 'reason' in result) return { reason: reason ?? '' }
  return { account: result.data?.data?.setDeviceSshAccount ?? '' }
}

// A handle: what a person's own accounts on devices are named by, after the stage's r3 prefix.
export const validSshHandle = (handle: string) => /^[a-z0-9][a-z0-9_-]{0,15}$/.test(handle) && handle !== 'admins'

// Your handle; null for none (your email's name); undefined where it could not be read — an API without it.
export async function graphQLSshHandle(): Promise<string | null | undefined> {
  const query = `query SshHandle { sshHandle }`
  const response = await post({ query, variables: {} })
  if (response === 'ERROR' || graphQLGetErrors(response, true, { query, variables: {} })) return undefined
  return response.data?.data?.sshHandle ?? null
}

// Sets your handle, or clears it (''). The handle kept, or graphql's reason it could not be.
export async function graphQLSetSshHandle(handle: string): Promise<{ handle: string | null } | { reason: string }> {
  const result = await graphQLRequestWithReason(
    `mutation SetSshHandle($handle: String) { setSshHandle(handle: $handle) }`,
    {
      handle: handle.trim().toLowerCase(),
    }
  )
  const reason = refusalOf(result)
  if (reason !== undefined || result === 'ERROR' || 'reason' in result) return { reason: reason ?? '' }
  return { handle: result.data?.data?.setSshHandle ?? null }
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
