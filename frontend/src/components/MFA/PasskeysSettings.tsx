import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Chip, TextField, Typography } from '@mui/material'
import { Gutters } from '../Gutters'
import {
  selfMe, selfPasskeyRegister, selfPasskeyConfirm, selfPasskeyDelete, selfChallenge,
  MfaMethod, SelfContinuation,
} from '../../services/passportSelf'

/**
 * Passkeys (plan Phase 2d): ONE store for both credential lanes — a passkey registered
 * here is the same credential the sign-in's second-factor step asserts, bridge or local.
 * Registration/removal re-prove the password (relayed code included); bridge accounts
 * need a code factor first — sign-ins from older apps rely on it, and the copy says so.
 */

const b64uToBuf = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
const bufToB64u = (b: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

type Key = { id: string; name: string; createdAt?: string; lastUsedAt?: string }

type Step =
  | { at: 'view'; keys: Key[] }
  | { at: 'password'; mode: 'add' | 'remove'; keyId?: string; error?: string }
  | { at: 'relay'; pending: { mode: 'add' | 'remove'; keyId?: string }; challenge: string; hint?: string; isSelect?: boolean; options?: MfaMethod[]; error?: string }
  | { at: 'naming'; codes?: string[] }

export const PasskeysSettings: React.FC = () => {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>({ at: 'view', keys: [] })
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [supported] = useState(() => typeof window !== 'undefined' && !!window.PublicKeyCredential)

  const refresh = async () => {
    const me = (await selfMe()) as SelfContinuation & { passkeys?: Key[]; httpStatus: number }
    setStep({ at: 'view', keys: me.httpStatus === 200 ? (me.passkeys ?? []) : [] })
  }
  useEffect(() => {
    refresh()
  }, [])

  /** The register continuation hands back WebAuthn creation options — run the ceremony. */
  const ceremony = async (r: SelfContinuation) => {
    const options = r.options as Record<string, any>
    try {
      const cred = (await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: b64uToBuf(options.challenge),
          user: { ...options.user, id: b64uToBuf(options.user.id) },
          excludeCredentials: (options.excludeCredentials ?? []).map((c: any) => ({ ...c, id: b64uToBuf(c.id) })),
        } as unknown as PublicKeyCredentialCreationOptions,
      })) as PublicKeyCredential
      const response = cred.response as AuthenticatorAttestationResponse
      const name = t('passkeys.defaultName', 'This device')
      const done = await selfPasskeyConfirm(
        String(r.challenge),
        { attestationObject: bufToB64u(response.attestationObject), clientDataJSON: bufToB64u(response.clientDataJSON) },
        name
      )
      if (done.status === 'ok') setStep({ at: 'naming', codes: done.recovery_codes })
      else setStep({ at: 'password', mode: 'add', error: done.error_description || t('passkeys.failed', 'Registration failed — try again.') })
    } catch (error: any) {
      // The user closing the platform prompt is a cancel, not an error worth shouting.
      if (error?.name === 'NotAllowedError') return refresh()
      setStep({ at: 'password', mode: 'add', error: error?.message || t('passkeys.failed', 'Registration failed — try again.') })
    }
  }

  const follow = async (r: SelfContinuation & { httpStatus: number }, pending: { mode: 'add' | 'remove'; keyId?: string }) => {
    if (r.status === 'register') return ceremony(r)
    if (r.status === 'ok') return refresh()
    if ((r.status === 'mfa' || r.status === 'select') && r.challenge)
      return setStep({
        at: 'relay', pending, challenge: r.challenge, hint: r.hint,
        isSelect: r.status === 'select', options: (r.options as MfaMethod[]) ?? [],
      })
    setStep({
      at: 'password', mode: pending.mode, keyId: pending.keyId,
      error: r.error === 'invalid_password' ? t('mfa.wrongPassword', "That password didn't match.")
        : r.error === 'pool_factor_required' ? r.error_description || t('passkeys.needFactor', 'Set up an authenticator or text codes first.')
        : r.error_description || t('passkeys.failed', 'Something went wrong — try again.'),
    })
  }

  const submitPassword = async (mode: 'add' | 'remove', keyId?: string) => {
    setBusy(true)
    const r = mode === 'add' ? await selfPasskeyRegister(password) : await selfPasskeyDelete(password, keyId ?? '')
    setBusy(false)
    setPassword('')
    await follow(r, { mode, keyId })
  }

  const submitCode = async () => {
    const current = step as Extract<Step, { at: 'relay' }>
    setBusy(true)
    const r = await selfChallenge(current.challenge, current.isSelect ? { choice: code as MfaMethod } : { code })
    setBusy(false)
    setCode('')
    await follow(r, current.pending)
  }

  const title = (
    <Typography variant="subtitle1" gutterBottom>
      {t('passkeys.title', 'Passkeys')}
    </Typography>
  )

  if (!supported) return null

  if (step.at === 'view')
    return (
      <>
        {title}
        <Gutters bottom="xl">
          {step.keys.map(key => (
            <Box key={key.id} display="flex" alignItems="center" gap={2} marginBottom={1}>
              <Chip size="small" color="success" label={key.name} />
              <Button size="small" onClick={() => setStep({ at: 'password', mode: 'remove', keyId: key.id })}>
                {t('common.remove', 'Remove')}
              </Button>
            </Box>
          ))}
          <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
            {t(
              'passkeys.explainer',
              'A passkey signs you in here with a touch instead of a code. Text or authenticator codes still protect sign-ins from older apps.'
            )}
          </Typography>
          <Button variant="contained" size="small" onClick={() => setStep({ at: 'password', mode: 'add' })}>
            {t('passkeys.add', 'Add a Passkey')}
          </Button>
        </Gutters>
      </>
    )

  if (step.at === 'password')
    return (
      <>
        {title}
        <Gutters bottom="xl" sx={{ '.MuiTextField-root': { marginBottom: 2 } }}>
          <Typography variant="body2" gutterBottom>
            {t('mfa.confirmPassword', 'Confirm your password to continue — changing a credential re-proves the one you hold.')}
          </Typography>
          <TextField autoFocus variant="filled" type="password" label={t('changePassword.currentPassword', 'Current Password')} value={password} onChange={e => setPassword(e.target.value)} />
          {step.error && (
            <Typography variant="body2" color="error">
              {step.error}
            </Typography>
          )}
          <Box>
            <Button variant="contained" color="primary" size="small" disabled={!password || busy} onClick={() => submitPassword(step.mode, step.keyId)}>
              {t('common.continue', 'Continue')}
            </Button>
            <Button size="small" onClick={() => refresh()}>
              {t('common.cancel', 'Cancel')}
            </Button>
          </Box>
        </Gutters>
      </>
    )

  if (step.at === 'relay')
    return (
      <>
        {title}
        <Gutters bottom="xl" sx={{ '.MuiTextField-root': { marginBottom: 2 } }}>
          <Typography variant="body2" gutterBottom>
            {step.isSelect
              ? t('mfa.choose', 'How would you like to get your code? (totp or sms)')
              : step.hint
                ? t('mfa.relayHint', 'Enter the code sent to {{hint}}.', { hint: step.hint })
                : t('mfa.relay', 'Enter the 6-digit code from your current second factor.')}
          </Typography>
          <TextField autoFocus variant="filled" label={step.isSelect ? t('mfa.method', 'Method') : t('changePassword.mfaCode', 'Authentication code')} value={code} onChange={e => setCode(e.target.value.trim())} />
          {step.error && (
            <Typography variant="body2" color="error">
              {step.error}
            </Typography>
          )}
          <Box>
            <Button variant="contained" color="primary" size="small" disabled={!code || busy} onClick={submitCode}>
              {t('common.verify', 'Verify')}
            </Button>
            <Button size="small" onClick={() => refresh()}>
              {t('common.cancel', 'Cancel')}
            </Button>
          </Box>
        </Gutters>
      </>
    )

  return (
    <>
      {title}
      <Gutters bottom="xl">
        <Typography variant="body2" gutterBottom>
          {t('passkeys.added', 'Passkey added — next sign-in, use it instead of typing a code.')}
        </Typography>
        {step.codes?.length ? (
          <>
            <Typography variant="body2" gutterBottom>
              {t('mfa.codesTitle', 'Save your recovery codes — each can be used once if you lose your authenticator. They will not be shown again.')}
            </Typography>
            <Box component="pre" sx={{ userSelect: 'all', fontFamily: 'monospace', fontSize: 13 }}>
              {step.codes.join('\n')}
            </Box>
          </>
        ) : null}
        <Button variant="contained" size="small" onClick={() => refresh()}>
          {t('common.done', 'Done')}
        </Button>
      </Gutters>
    </>
  )
}
