import { oidcResourceRequest } from './oidc'
import { OAUTH_PASSPORT_RESOURCE } from '../constants'

/**
 * Passport's self API (door C) — the account's OWN credential surface, called with a
 * token minted for the passport audience (`resource` on refresh; the client requests the
 * passport_account details at authorize). Every WRITE carries its own proof of
 * possession — the current password or the relayed second-factor code — mirroring the
 * console's re-authentication (permitteer docs/remoteit-desktop-login.md Phase 2b).
 */

export type SelfContinuation = {
  status?: 'ok' | 'mfa' | 'confirm' | 'select' | 'register'
  challenge?: string
  hint?: string
  secret?: string
  otpauth?: string
  delivery?: 'sms'
  options?: string[] | Record<string, any>
  name?: string
  methods?: string[]
  preferred?: string
  recovery_codes?: string[]
  error?: string
  error_description?: string
}

const call = async (
  path: string,
  body?: Record<string, string>
): Promise<SelfContinuation & { httpStatus: number }> => {
  const r = await oidcResourceRequest<SelfContinuation>(
    OAUTH_PASSPORT_RESOURCE,
    path,
    body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}
  )
  return { ...(r.body ?? (r.status === 401 ? { error: 'unauthorized' } : {})), httpStatus: r.status }
}

export type MfaMethod = 'totp' | 'sms'
export type MfaStanding = { methods: MfaMethod[]; preferred?: MfaMethod; available: MfaMethod[] }

export const selfMe = () => call('')
export const selfMfaStanding = () => call('/mfa') as Promise<MfaStanding & { httpStatus: number }>
export const selfChangePassword = (current_password: string, new_password: string) =>
  call('/password', { current_password, new_password })
/** Answer a pending challenge: a code — or, for a factor CHOICE (select), the method. */
export const selfChallenge = (challenge: string, answer: { code?: string; choice?: MfaMethod }) =>
  call('/challenge', { challenge, ...answer })
export const selfMfaEnroll = (password: string, method: MfaMethod = 'totp', phone?: string) =>
  call('/mfa/enroll', { password, method, ...(phone ? { phone } : {}) })
export const selfMfaConfirm = (challenge: string, code: string) => call('/mfa/confirm', { challenge, code })
export const selfMfaPrefer = (password: string, method: MfaMethod) => call('/mfa/prefer', { password, method })
export const selfMfaDisable = (password: string, method?: MfaMethod) =>
  call('/mfa/disable', { password, ...(method ? { method } : {}) })
export const selfPasskeyRegister = (password: string) => call('/passkeys/register', { password })
export const selfPasskeyConfirm = (
  challenge: string,
  attestation: { attestationObject: string; clientDataJSON: string },
  name: string
) => call('/passkeys/confirm', { challenge, ...attestation, name })
export const selfPasskeyDelete = (password: string, id: string) => call('/passkeys/delete', { password, id })
