import { oidcAccessToken } from './oidc'
import { OAUTH_PASSPORT_RESOURCE } from '../constants'

/**
 * Passport's self API (door C) — the account's OWN credential surface, called with a
 * token minted for the passport audience (`resource` on refresh; the client requests the
 * passport_account details at authorize). Every WRITE carries its own proof of
 * possession — the current password or the relayed second-factor code — mirroring the
 * console's re-authentication (permitteer docs/remoteit-desktop-login.md Phase 2b).
 */

export type SelfContinuation = {
  status?: 'ok' | 'mfa' | 'confirm'
  challenge?: string
  hint?: string
  secret?: string
  otpauth?: string
  recovery_codes?: string[]
  error?: string
  error_description?: string
}

const call = async (path: string, body?: Record<string, string>): Promise<SelfContinuation & { httpStatus: number }> => {
  const token = await oidcAccessToken(OAUTH_PASSPORT_RESOURCE)
  if (!token) return { httpStatus: 401, error: 'unauthorized' }
  const response = await fetch(OAUTH_PASSPORT_RESOURCE + path, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: 'Bearer ' + token, ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const parsed = (await response.json().catch(() => ({}))) as SelfContinuation
  return { ...parsed, httpStatus: response.status }
}

export const selfMe = () => call('')
export const selfChangePassword = (current_password: string, new_password: string) =>
  call('/password', { current_password, new_password })
export const selfChallenge = (challenge: string, code: string) => call('/challenge', { challenge, code })
export const selfMfaEnroll = (password: string) => call('/mfa/enroll', { password })
export const selfMfaConfirm = (challenge: string, code: string) => call('/mfa/confirm', { challenge, code })
export const selfMfaDisable = (password: string) => call('/mfa/disable', { password })
