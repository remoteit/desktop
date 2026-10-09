import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'
import { refreshDeviceSessionInfo, requestDeviceSessionInfo } from './deviceSessionInfo'

/* Names in device subnets (graphql services/subnet-names.ts): <name>-<owner slug>.<domain>, one DNS label. A device's
   name is made from its first name and kept through renames; changing it — or the account's slug — is done here, and
   the one replaced keeps resolving for 30 days. graphql decides who may: these show its refusal as any other. */

export const NAME_MAX = 29
export const FORMER_RESOLVES_DAYS = 30

// The name graphql makes from a device's: lower case letters and digits only, at most 29 (graphql subnetLabel).
export const subnetLabel = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, NAME_MAX)

// Whether a name can be had by its form (graphql labelProblem). graphql lower-cases and trims what it is given.
export const validLabel = (label: string) => /^[a-z0-9]{1,29}$/.test(label.trim().toLowerCase())

// Whether a slug can be had by its form (graphql slugProblem; graphql also says which are reserved, and taken).
export const validSlug = (slug: string) => /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(slug) && !slug.includes('--')

// A full name's parts: the name is up to its first dash (a name never has one), the rest is -<slug>.<domain>.
export const splitSubnetName = (subnetName: string) => {
  const dash = subnetName.indexOf('-')
  return dash < 0 ? { label: subnetName, rest: '' } : { label: subnetName.slice(0, dash), rest: subnetName.slice(dash) }
}

// Naming a device; the device's name is read anew. Refused (taken, held, not this person's to change), the app says why.
export async function setDeviceSubnetLabel(deviceId: string, label: string) {
  const result = await graphQLBasicRequest(
    `mutation SetDeviceSubnetLabel($deviceId: String!, $label: String!) { setDeviceSubnetLabel(deviceId: $deviceId, label: $label) }`,
    { deviceId, label: label.trim().toLowerCase() }
  )
  requestDeviceSessionInfo(deviceId, true)
  return result !== 'ERROR'
}

// An account's slug: none until one is chosen or assigned, or where this person may not manage the account.
export async function graphQLAccountSlug(accountId?: string): Promise<string | null | 'ERROR' | typeof UNSUPPORTED> {
  const query = `query AccountSlug($accountId: String) { accountSlug(accountId: $accountId) }`
  const variables = { accountId }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, 'accountSlug')) return UNSUPPORTED
  if (errors) return 'ERROR'
  return response.data?.data?.accountSlug ?? null
}

// Whether the account can have a slug: well formed, not reserved, held by nobody else. Undefined when it could not be asked.
export async function accountSlugAvailable(slug: string, accountId?: string): Promise<boolean | undefined> {
  const query = `query AccountSlugAvailable($slug: String!, $accountId: String) { accountSlugAvailable(slug: $slug, accountId: $accountId) }`
  const variables = { slug, accountId }
  const response = await post({ query, variables })
  if (response === 'ERROR' || graphQLGetErrors(response, true, { query, variables })) return undefined
  return response.data?.data?.accountSlugAvailable ?? undefined
}

// Choosing the account's slug: every one of its devices' names changes; the old slug keeps resolving for 30 days.
export async function setAccountSlug(slug: string, accountId?: string): Promise<string | undefined> {
  const result = await graphQLBasicRequest(
    `mutation SetAccountSlug($slug: String!, $accountId: String) { setAccountSlug(slug: $slug, accountId: $accountId) }`,
    { slug: slug.trim().toLowerCase(), accountId }
  )
  if (result === 'ERROR') return undefined
  refreshDeviceSessionInfo()
  return result.data?.data?.setAccountSlug
}
