// Keeps remoteit_portal's preview callbacks on the dev login server equal to the open PRs Amplify
// previews. Every other entry belongs to the registry Terraform (authentication
// tf-permitteer-registry) and stays in place.
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'

const ISSUER = 'https://login.dev.remote.it'
const CLIENT_ID = 'remoteit_portal'
const OPERATOR_ID = 'svc_preview_callbacks'
// The Amplify branches with pull request previews turned on.
const PREVIEW_BASES = ['main', 'release']
const PREVIEW_URI = /^https:\/\/pr-\d+\.d20k671nqqv4kl\.amplifyapp\.com\/(authCallback|signoutCallback)$/

async function adminToken(pem) {
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
    iss: OPERATOR_ID,
    sub: OPERATOR_ID,
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
      client_id: OPERATOR_ID,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: `${signing}.${signature.toString('base64url')}`,
      resource: `${ISSUER}/admin/api`,
    }),
  })
  const text = await response.text()
  const accessToken = response.ok && JSON.parse(text).access_token
  if (!accessToken) throw new Error(`token: ${response.status} ${text}`)
  return accessToken
}

async function portal(token, method = 'GET', body) {
  const response = await fetch(`${ISSUER}/admin/api/clients/${CLIENT_ID}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body && { 'content-type': 'application/json' }) },
    body: body && JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`${method} ${CLIENT_ID}: ${response.status} ${await response.text()}`)
  return response.json()
}

const open = JSON.parse(
  execFileSync(
    'gh',
    [
      'pr',
      'list',
      '--repo',
      process.env.GITHUB_REPOSITORY,
      '--state',
      'open',
      '--limit',
      '1000',
      '--json',
      'number,baseRefName,isCrossRepository',
    ],
    { encoding: 'utf8' }
  )
)
// A fork's PR is a stranger's code on a preview URL, so it never gets a callback.
const pulls = open
  .filter(p => !p.isCrossRepository && PREVIEW_BASES.includes(p.baseRefName))
  .map(p => p.number)
  .sort((a, b) => a - b)

if (!process.env.PREVIEW_CALLBACKS_KEY)
  throw new Error(
    'PREVIEW_CALLBACKS_KEY is not set: run tf-permitteer-registry/preview-callbacks-key.sh in remoteit/authentication'
  )
const token = await adminToken(process.env.PREVIEW_CALLBACKS_KEY)
const client = await portal(token)
const withPreviews = (uris, path) => [
  ...uris.filter(uri => !PREVIEW_URI.test(uri)),
  ...pulls.map(pull => `https://pr-${pull}.d20k671nqqv4kl.amplifyapp.com/${path}`),
]
const wanted = {
  redirectUris: withPreviews(client.redirectUris, 'authCallback'),
  postLogoutRedirectUris: withPreviews(client.postLogoutRedirectUris, 'signoutCallback'),
}
const diff = Object.entries(wanted).flatMap(([field, uris]) => [
  ...uris.filter(uri => !client[field].includes(uri)).map(uri => `+ ${field} ${uri}`),
  ...client[field].filter(uri => !uris.includes(uri)).map(uri => `- ${field} ${uri}`),
])

console.log(`Open previews: ${pulls.map(pull => `#${pull}`).join(' ') || 'none'}`)
if (!diff.length) console.log(`${CLIENT_ID} is up to date.`)
else {
  await portal(token, 'PATCH', wanted)
  console.log(diff.join('\n'))
}
