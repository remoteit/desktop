/* The account's own credentials and sign-in factors, on the authorization server's account API
 * (`permitteer_account`; permitteer docs/as-elevation.md, docs/unified-idp.md): the password it
 * holds, and the factors that prove it's you — an authenticator app, a text-message number, a
 * passkey, or one the credential store holds on a bridged account.
 *
 * Changing a factor is proven by the session's elevation stamp (a code from a factor the account
 * already holds), by a recovery code for that one change, or — for an account's very first factor
 * — by a code the AS emails. The password is asked for only where the credential store insists on
 * it. Every call answers the same shape: the data, or the AS's error code and its sentence. */
import { oidcResourceRequest } from './oidc'
import { OAUTH_ACCOUNT_RESOURCE, OAUTH_ISSUER } from '../constants'

export type FactorKind = 'passkey' | 'totp' | 'sms'

export type Factor = {
  id: string
  kind: FactorKind
  name: string
  createdAt: string
  lastUsedAt: string | null
  preferred: boolean
  /** `store`: held by the credential store (a bridged account) rather than by the AS itself. */
  home: 'here' | 'store'
}

export type ElevationStatus = {
  factors: Factor[]
  /** The credential store, on a bridged account: which factors it holds new ones of, and whether it
   *  answered — when it did not, its factors are unknown, not absent. */
  store: { offers: FactorKind[]; reachable: boolean } | null
  recoveryCodesRemaining: number
  elevated: { until: string; with: string } | null
  lockedUntil: string | null
  smsAvailable: boolean
  smsPhone: string | null
}

export type CredentialStanding =
  | { held: false }
  | { held: true; email: string; emailVerified: boolean; hasPassword: boolean; lockedUntil: string | null }

/** One step of the credential store's conversation. Every answer spends its handle: a wrong code
 *  comes back as the same step, with a fresh handle and `error` set. */
export type StoreStep = { error?: string } & (
  | {
      step: 'relay'
      handle: string
      hint: string | null
      options: FactorKind[]
      asks: 'code' | 'choice' | 'new_password'
    }
  | { step: 'qr'; handle: string; secret: string; otpauth: string; qr: string }
  | { step: 'sms'; handle: string; phone: string | null }
  | { step: 'done'; recoveryCodes?: string[] }
)

export type Elevated = { elevated: { until: string; with: string } }
export type Enrolled = { factor?: Factor; recoveryCodes?: string[] }

export type AccountResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; description?: string }

async function call<T>(method: string, path: string, body?: object): Promise<AccountResult<T>> {
  const r = await oidcResourceRequest<any>(OAUTH_ACCOUNT_RESOURCE, path, {
    method,
    ...(body ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}),
  })
  if (r.status >= 200 && r.status < 300) return { ok: true, data: r.body as T }
  return {
    ok: false,
    status: r.status,
    error: r.body?.error ?? (r.status === 401 ? 'unauthorized' : 'failed'),
    description: r.body?.error_description,
  }
}

// A recovery code manages exactly one change, so it rides the change's own body.
const proof = (recoveryCode?: string) => (recoveryCode ? { recoveryCode } : {})

// The password.
export const credentialStanding = () => call<CredentialStanding>('GET', '/credential')
export const changePassword = (currentPassword: string, newPassword: string) =>
  call<{ changed: true }>('POST', '/credential/password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
/** Where somebody without a password (they sign in with Google, say) sets one: the AS's own page. */
export const setPasswordUrl = () => `${OAUTH_ISSUER}/forgot`

// Where the account stands.
export const elevationStatus = () => call<ElevationStatus>('GET', '/elevation')

// Proving it's you: the first factor by an emailed code; after that, with a factor the account holds.
export const requestConfirmation = () =>
  call<{ sent: true; expiresInSec: number }>('POST', '/elevation/confirmation', {})
export const verifyConfirmation = (code: string) =>
  call<{ confirmed: true }>('POST', '/elevation/confirmation/verify', { code })
export const elevateWithTotp = (code: string) => call<Elevated>('POST', '/elevate/totp', { code })
export const sendElevationText = () => call<{ sent: true; phone: string }>('POST', '/elevate/sms/send', {})
export const elevateWithSms = (code: string) => call<Elevated>('POST', '/elevate/sms', { code })
/** The store's own factor: the password, then the code it asks for. */
export const elevateWithStore = (password: string) => call<StoreStep | Elevated>('POST', '/elevate/store', { password })
export const answerElevationStore = (handle: string, answer: string) =>
  call<StoreStep | Elevated>('POST', '/elevate/store/relay', { handle, answer })
/** A passkey confirms only on the AS's own page (its ceremony is bound to the AS origin): a ticket
 *  there that comes back to `returnTo`, which must be on one of this app's registered web origins. */
/** A link to the AS's page, for what only it can do — a passkey is bound to its host — and back to
 *  `returnTo` when done. `add-passkey` comes back with `passkey=added` or `passkey=cancelled`. */
export const elevationReturnTicket = (returnTo: string, purpose: 'elevate' | 'add-passkey' = 'elevate') =>
  call<{ url: string; expiresInSec: number }>('POST', '/elevation/return-ticket', { return_to: returnTo, purpose })

// Adding a factor the AS holds.
export const totpOptions = () =>
  call<{ secret: string; otpauth: string; qr: string; expiresInSec: number }>('POST', '/elevation/totp/options', {})
export const addTotp = (code: string, recoveryCode?: string) =>
  call<Enrolled>('POST', '/elevation/totp', { code, ...proof(recoveryCode) })
export const smsOptions = (phone: string) =>
  call<{ sent: true; phone: string }>('POST', '/elevation/sms/options', { phone })
export const addSms = (code: string, recoveryCode?: string) =>
  call<Enrolled>('POST', '/elevation/sms', { code, ...proof(recoveryCode) })

// Adding a factor the credential store holds — the one change that still asks for the password.
export const addStoreFactor = (method: FactorKind, password: string, phone?: string, recoveryCode?: string) =>
  call<StoreStep>('POST', '/elevation/store', { method, password, ...(phone ? { phone } : {}), ...proof(recoveryCode) })
export const answerStore = (handle: string, answer: string) =>
  call<StoreStep>('POST', '/elevation/store/relay', { handle, answer })
export const confirmStore = (handle: string, code: string) =>
  call<StoreStep>('POST', '/elevation/store/confirm', { handle, code })

// Changing the factors held — from either home; the id says which.
export const removeFactor = (id: string, recoveryCode?: string) =>
  call<{ removed: true }>('DELETE', `/elevation/factors/${encodeURIComponent(id)}`, proof(recoveryCode))
export const preferFactor = (id: string, recoveryCode?: string) =>
  call<{ preferred: string }>('PUT', `/elevation/factors/${encodeURIComponent(id)}/preferred`, proof(recoveryCode))
export const replaceRecoveryCodes = (recoveryCode?: string) =>
  call<{ recoveryCodes: string[] }>('POST', '/elevation/recovery-codes', proof(recoveryCode))
