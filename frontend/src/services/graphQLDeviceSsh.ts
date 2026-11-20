import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors, graphQLRequestWithReason, refusalOf } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

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

const query = (existing: boolean) => `query DeviceSsh($id: [String!]!) {
  login {
    device(id: $id) {
      id
      sshAccess { fallback grants { login account ${existing ? 'existing ' : ''}admin user { id email } } }
    }
  }
}`

// null: not a device this person manages, or an API without it. An API from before named accounts (no `existing`) is
// read without it: every own account then is one remote.it keeps, and the panel works as before.
export async function graphQLDeviceSsh(deviceId: string): Promise<DeviceSshRead | null> {
  const variables = { id: [deviceId] }
  for (const existing of [true, false]) {
    const response = await post({ query: query(existing), variables })
    if (response === 'ERROR') return null
    const errors = graphQLGetErrors(response, true, { query: query(existing), variables })
    if (existing && withoutDeviceSessions(errors, 'existing')) continue
    if (errors) return null
    const access = response.data?.data?.login?.device?.[0]?.sshAccess
    if (!access) return null
    return { ...access, grants: access.grants.map((g: DeviceSshGrant) => ({ ...g, existing: !!g.existing })) }
  }
  return null
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
// there (existing, its whole name). graphql's reason it could not be ('' for none said), or undefined once it is.
export async function graphQLSetDeviceSshAccount(
  deviceId: string,
  userId: string,
  name: string,
  existing: boolean
): Promise<string | undefined> {
  const result = await graphQLRequestWithReason(
    ` mutation SetDeviceSshAccount($deviceId: String!, $userId: String!, $handle: String, $existingAccount: String) {
        setDeviceSshAccount(deviceId: $deviceId, userId: $userId, handle: $handle, existingAccount: $existingAccount)
      }`,
    { deviceId, userId, ...(existing ? { existingAccount: name } : { handle: name }) }
  )
  return refusalOf(result)
}

// A handle: what a person's own accounts on devices are named by, after the stage's r3 prefix (graphql validHandle).
export const validSshHandle = (handle: string) => /^[a-z0-9][a-z0-9_-]{0,15}$/.test(handle) && handle !== 'admins'

// An account already on a device, by its whole name, that a device admin may make a person's own: a local user's name,
// never one of remote.it's r3 names (graphql validLogin and remoteitName).
export const validExistingAccount = (name: string) =>
  /^[a-z_][a-z0-9_.-]{0,31}$/i.test(name) && !/^r3[a-z]{0,3}-/i.test(name)

// Your handle; null for none (your email's name); UNSUPPORTED from an API without handles; 'ERROR' where it could not be
// read.
export async function graphQLSshHandle(): Promise<string | null | 'ERROR' | typeof UNSUPPORTED> {
  const query = `query SshHandle { sshHandle }`
  const response = await post({ query, variables: {} })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query, variables: {} })
  if (withoutDeviceSessions(errors, 'sshHandle')) return UNSUPPORTED
  if (errors) return 'ERROR'
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
  if (reason !== undefined) return { reason }
  return { handle: (result as { data?: any }).data?.data?.setSshHandle ?? null }
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
