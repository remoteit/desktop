// Keeps remoteit_portal's preview callbacks on the dev login server equal to the open PRs Amplify
// previews. Every other entry belongs to the registry Terraform (authentication
// tf-permitteer-registry) and stays in place.
import crypto from 'node:crypto'
import { pathToFileURL } from 'node:url'

const ISSUER = 'https://login.dev.remote.it'
const CLIENT_ID = 'remoteit_portal'
const OPERATOR_ID = 'svc_preview_callbacks'
const PREVIEW_HOST = 'd20k671nqqv4kl.amplifyapp.com'
// The Amplify branches with pull request previews turned on.
const PREVIEW_BASES = ['main', 'release']

const PREVIEW_URI = new RegExp(`^https://pr-\\d+\\.${PREVIEW_HOST.replaceAll('.', '\\.')}/`)
const previewUri = (pull, path) => `https://pr-${pull}.${PREVIEW_HOST}/${path}`

export async function adminToken(pem, clientId = OPERATOR_ID) {
  const key = crypto.createPrivateKey(pem)
  const jwk = crypto.createPublicKey(key).export({ format: 'jwk' })
  const kid = crypto
    .createHash('sha256')
    .update(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y }))
    .digest('base64url')
    .slice(0, 16)
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const signing = `${encode({ alg: 'ES256', kid })}.${encode({
    iss: clientId,
    sub: clientId,
    aud: ISSUER,
    iat: now,
    exp: now + 120,
    jti: crypto.randomUUID(),
  })}`
  const signature = crypto.sign('sha256', Buffer.from(signing), { key, dsaEncoding: 'ieee-p1363' })
  const response = await fetch(`${ISSUER}/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: `${signing}.${signature.toString('base64url')}`,
      resource: `${ISSUER}/admin/api`,
    }),
  })
  const body = await response.json()
  if (!body.access_token) throw new Error(`token: ${response.status} ${JSON.stringify(body)}`)
  return body.access_token
}

export async function previewPulls(repo, token) {
  const pulls = []
  for (let page = 1; ; page++) {
    const response = await fetch(`https://api.github.com/repos/${repo}/pulls?state=open&per_page=100&page=${page}`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' },
    })
    if (!response.ok) throw new Error(`pulls: ${response.status} ${await response.text()}`)
    const batch = await response.json()
    // A fork's PR is a stranger's code on a preview URL, so it never gets a callback.
    pulls.push(...batch.filter(p => p.head.repo?.full_name === repo && PREVIEW_BASES.includes(p.base.ref)))
    if (batch.length < 100) return pulls.map(p => p.number).sort((a, b) => a - b)
  }
}

export async function portal(token, method = 'GET', body) {
  const response = await fetch(`${ISSUER}/admin/api/clients/${CLIENT_ID}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body && { 'content-type': 'application/json' }) },
    body: body && JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`${method} ${CLIENT_ID}: ${response.status} ${await response.text()}`)
  return response.json()
}

export function desired(client, pulls) {
  const withPreviews = (uris = [], path) => [
    ...uris.filter(uri => !PREVIEW_URI.test(uri)),
    ...pulls.map(pull => previewUri(pull, path)),
  ]
  return {
    redirectUris: withPreviews(client.redirectUris, 'authCallback'),
    postLogoutRedirectUris: withPreviews(client.postLogoutRedirectUris, 'signoutCallback'),
  }
}

export function changes(client, wanted) {
  return Object.entries(wanted).flatMap(([field, uris]) => [
    ...uris.filter(uri => !client[field]?.includes(uri)).map(uri => `+ ${field} ${uri}`),
    ...(client[field] ?? []).filter(uri => !uris.includes(uri)).map(uri => `- ${field} ${uri}`),
  ])
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pulls = await previewPulls(process.env.GITHUB_REPOSITORY, process.env.GITHUB_TOKEN)
  const token = await adminToken(process.env.PREVIEW_CALLBACKS_KEY)
  const client = await portal(token)
  const wanted = desired(client, pulls)
  const diff = changes(client, wanted)
  console.log(`Open previews: ${pulls.map(pull => `#${pull}`).join(' ') || 'none'}`)
  if (!diff.length) console.log(`${CLIENT_ID} is up to date.`)
  else {
    await portal(token, 'PATCH', wanted)
    console.log(diff.join('\n'))
  }
}
