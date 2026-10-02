import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'

// SSH certificates (graphql resolvers/device-ssh-resolver.ts): who may log in to a device as which local user — set by
// whoever manages it, checked when graphql signs a certificate for a session — and whether the device takes them.

export type DeviceSshGrant = { login: string; user: { id: string; email: string | null } }
// on, localOnly and refused are what the device says (about.ssh); certificates is the account's switch, null when it
// leaves it to the device.
export type DeviceSshRead = {
  on: boolean
  localOnly: boolean
  refused: string | null
  certificates: boolean | null
  fallback: boolean
  grants: DeviceSshGrant[]
}

const QUERY = `query DeviceSsh($id: [String!]!) {
  login {
    device(id: $id) {
      id
      about { data }
      sshAccess { fallback certificates grants { login user { id email } } }
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
  const ssh = device.about?.data?.ssh
  return {
    on: ssh?.certificates === true,
    localOnly: ssh?.local_only === true,
    refused: ssh?.refused || null,
    ...device.sshAccess,
  }
}

export async function graphQLGrantDeviceSsh(deviceId: string, login: string, email: string) {
  return await graphQLBasicRequest(
    ` mutation GrantDeviceSsh($deviceId: String!, $login: String!, $email: String!) {
        grantDeviceSsh(deviceId: $deviceId, login: $login, email: $email)
      }`,
    { deviceId, login, email }
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

export async function graphQLSetDeviceSshCertificates(deviceId: string, on: boolean) {
  return await graphQLBasicRequest(
    ` mutation SetDeviceSshCertificates($deviceId: String!, $on: Boolean!) {
        setDeviceSshCertificates(deviceId: $deviceId, on: $on)
      }`,
    { deviceId, on }
  )
}
