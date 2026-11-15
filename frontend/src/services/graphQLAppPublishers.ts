import { post } from './post'
import { graphQLGetErrors, graphQLRequestWithReason, refusalOf } from './graphQL'

/* An account's app publisher (presence-server docs/device-apps-design.md, build step 7; graphql docs/DEVICE-APPS.md,
   "Publishers"): the slug its apps' ids start with, claimed first come, first served — remote.it's and well-known
   names reserved —, the name shown with its apps, its signing keys' public halves (each certified by graphql; a
   revoked key's releases withdrawn), and its private apps with their releases, for the account's own devices. All of
   it the account admin's: graphql's appPublisher, claimAppPublisher, renameAppPublisher, addAppPublisherKey and
   revokeAppPublisherKey. */

export type AppPublisherKey = {
  keyId: string
  publicKey: string
  notAfter: string | null // its certificate's end, renewed while the key stands
  added: string
  revoked: string | null
}

export type AppPublisherRelease = {
  version: string
  manifest: string
  root: boolean
  keyId: string | null
  created: string
  withdrawn: string | null
}

export type AppPublisherApp = {
  id: string
  name: string
  description: string | null
  visibility: string
  releases: AppPublisherRelease[]
  channels: { stage: string; channel: string; current: string | null }[]
}

// A domain the publisher names, and proves with a DNS TXT record (build step 8): record, value — the record to add —, and
// whether it is verified (first seen), when it was last looked up, and lapsed (missing three days running).
export type AppPublisherDomain = {
  domain: string
  record: string
  value: string
  requested: string
  verified: string | null
  checked: string | null
  lapsed: string | null
}

export type AppPublisher = {
  id: string
  name: string
  verifiedDomain: string | null
  created: string
  keys: AppPublisherKey[]
  apps: AppPublisherApp[]
  domains?: AppPublisherDomain[]
}

export type AppPublishing = { certifies: boolean; downloads: string | null }

const FIELDS = `id name verifiedDomain created
  keys { keyId publicKey notAfter added revoked }
  domains { domain record value requested verified checked lapsed }
  apps { id name description visibility releases { version manifest root keyId created withdrawn } channels { stage channel current } }`

// undefined: the API has no publishers (or the read failed); null: the account has not claimed one.
export async function graphQLAppPublisher(accountId?: string): Promise<{ publisher: AppPublisher | null; publishing: AppPublishing } | undefined> {
  const query = `query AppPublisher($accountId: String) { appPublisher(accountId: $accountId) { ${FIELDS} } appPublishing { certifies downloads } }`
  const variables = { accountId }
  const response = await post({ query, variables })
  if (response === 'ERROR') return undefined
  if (graphQLGetErrors(response, true, { query, variables })) return undefined
  const data = response.data?.data
  return data ? { publisher: data.appPublisher ?? null, publishing: data.appPublishing ?? { certifies: false, downloads: null } } : undefined
}

// The publisher after a change, or graphql's reason for refusing it.
export type PublisherChange = { publisher: AppPublisher } | { reason: string }

async function change(mutation: string, field: string, variables: ILookup<any>): Promise<PublisherChange> {
  const result = await graphQLRequestWithReason(`mutation ${mutation} { ${field} { ${FIELDS} } }`, variables)
  const reason = refusalOf(result)
  if (reason !== undefined) return { reason }
  const publisher = (result as any).data?.data?.[field.split('(')[0]]
  return publisher ? { publisher } : { reason: '' }
}

export const graphQLClaimAppPublisher = (id: string, name: string, accountId?: string) =>
  change('ClaimAppPublisher($id: String!, $name: String!, $accountId: String)', 'claimAppPublisher(id: $id, name: $name, accountId: $accountId)', {
    id,
    name,
    accountId,
  })

export const graphQLRenameAppPublisher = (name: string, accountId?: string) =>
  change('RenameAppPublisher($name: String!, $accountId: String)', 'renameAppPublisher(name: $name, accountId: $accountId)', { name, accountId })

export const graphQLAddAppPublisherKey = (publicKey: string, accountId?: string) =>
  change('AddAppPublisherKey($publicKey: String!, $accountId: String)', 'addAppPublisherKey(publicKey: $publicKey, accountId: $accountId)', {
    publicKey,
    accountId,
  })

export const graphQLRevokeAppPublisherKey = (keyId: string, accountId?: string) =>
  change('RevokeAppPublisherKey($keyId: String!, $accountId: String)', 'revokeAppPublisherKey(keyId: $keyId, accountId: $accountId)', {
    keyId,
    accountId,
  })

export const graphQLRequestAppPublisherDomain = (domain: string, accountId?: string) =>
  change('RequestAppPublisherDomain($domain: String!, $accountId: String)', 'requestAppPublisherDomain(domain: $domain, accountId: $accountId)', {
    domain,
    accountId,
  })

export const graphQLVerifyAppPublisherDomain = (domain: string, accountId?: string) =>
  change('VerifyAppPublisherDomain($domain: String!, $accountId: String)', 'verifyAppPublisherDomain(domain: $domain, accountId: $accountId)', {
    domain,
    accountId,
  })

export const graphQLRemoveAppPublisherDomain = (domain: string, accountId?: string) =>
  change('RemoveAppPublisherDomain($domain: String!, $accountId: String)', 'removeAppPublisherDomain(domain: $domain, accountId: $accountId)', {
    domain,
    accountId,
  })

// The releases a key signed that revoking it withdraws.
export const releasesSignedBy = (publisher: AppPublisher, keyId: string) =>
  publisher.apps.flatMap(app => app.releases.filter(release => release.keyId === keyId && !release.withdrawn).map(release => ({ app, release })))
