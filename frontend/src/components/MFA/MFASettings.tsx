import React, { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Chip, Radio, RadioGroup, FormControlLabel, TextField, Typography } from '@mui/material'
import { Gutters } from '../Gutters'
import {
  selfMfaStanding, selfMfaEnroll, selfMfaConfirm, selfMfaPrefer, selfMfaDisable, selfChallenge,
  MfaMethod, SelfContinuation,
} from '../../services/passportSelf'
import { OAUTH_PASSPORT_RESOURCE } from '../../constants'

/**
 * Two-factor settings over the Passport self-API (plan Phase 2c): BOTH methods can be
 * enrolled with exactly one preferred — the preferred factor drives every sign-in
 * challenge. Every step re-proves possession (password, or the relayed code), and a
 * store that challenges mid-management relays first — including the factor CHOICE
 * (select) when a store holds both factors unpreferred.
 */

type Mode = 'enroll' | 'disable' | 'prefer'

type Step =
  | { at: 'loading' }
  | { at: 'none' } // no credential account here: the user signs in federated (e.g. Google)
  | { at: 'view'; methods: MfaMethod[]; preferred?: MfaMethod; available: MfaMethod[] }
  | { at: 'password'; mode: Mode; method?: MfaMethod; error?: string }
  | { at: 'relay'; pending: { mode: Mode; method?: MfaMethod }; challenge: string; hint?: string; error?: string }
  | { at: 'select'; pending: { mode: Mode; method?: MfaMethod }; challenge: string; options: MfaMethod[] }
  | { at: 'scan'; challenge: string; secret?: string; otpauth?: string; delivery?: 'sms'; error?: string }
  | { at: 'codes'; codes: string[] }

const METHOD_LABEL: Record<MfaMethod, string> = { totp: 'Authenticator app', sms: 'Text message' }

export const MFASettings: React.FC = () => {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>({ at: 'loading' })
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [choice, setChoice] = useState<MfaMethod>('totp')
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    const standing = await selfMfaStanding()
    if (standing.httpStatus === 403) return setStep({ at: 'none' })
    setStep({ at: 'view', methods: standing.methods ?? [], preferred: standing.preferred, available: standing.available ?? ['totp'] })
  }
  useEffect(() => {
    refresh()
  }, [])

  const followContinuation = (r: SelfContinuation & { httpStatus: number }, pending: { mode: Mode; method?: MfaMethod }): boolean => {
    if (r.status === 'ok') {
      if (r.recovery_codes?.length) setStep({ at: 'codes', codes: r.recovery_codes })
      else refresh()
      return true
    }
    if (r.status === 'confirm' && r.challenge) {
      setStep({ at: 'scan', challenge: r.challenge, secret: r.secret, otpauth: r.otpauth, delivery: r.delivery })
      return true
    }
    if (r.status === 'mfa' && r.challenge) {
      setStep({ at: 'relay', pending, challenge: r.challenge, hint: r.hint })
      return true
    }
    if (r.status === 'select' && r.challenge) {
      setStep({ at: 'select', pending, challenge: r.challenge, options: (r.options ?? []) as MfaMethod[] })
      return true
    }
    return false
  }

  const submitPassword = async (mode: Mode, method?: MfaMethod) => {
    setBusy(true)
    const r =
      mode === 'enroll' ? await selfMfaEnroll(password, method ?? 'totp', method === 'sms' ? phone : undefined)
      : mode === 'prefer' ? await selfMfaPrefer(password, method ?? 'totp')
      : await selfMfaDisable(password, method)
    setBusy(false)
    setPassword('')
    if (followContinuation(r, { mode, method })) return
    setStep({
      at: 'password', mode, method,
      error: r.error === 'invalid_password'
        ? t('mfa.wrongPassword', "That password didn't match.")
        : r.error_description || t('mfa.failed', 'Something went wrong — try again.'),
    })
  }

  const submitCode = async () => {
    setBusy(true)
    const current = step as Extract<Step, { at: 'relay' | 'scan' }>
    const r = current.at === 'scan'
      ? await selfMfaConfirm(current.challenge, code)
      : await selfChallenge(current.challenge, { code })
    setBusy(false)
    setCode('')
    const pending = current.at === 'relay' ? current.pending : { mode: 'enroll' as Mode }
    if (followContinuation(r, pending)) return
    if (r.challenge) {
      const error = t('mfa.wrongCode', "That code didn't match — try again.")
      if (current.at === 'scan') setStep({ ...current, challenge: r.challenge, error })
      else setStep({ ...current, challenge: r.challenge, error })
      return
    }
    refresh()
  }

  const submitChoice = async () => {
    const current = step as Extract<Step, { at: 'select' }>
    setBusy(true)
    const r = await selfChallenge(current.challenge, { choice })
    setBusy(false)
    if (!followContinuation(r, current.pending)) refresh()
  }

  const title = (
    <Typography variant="subtitle1" gutterBottom>
      {t('mfa.title', 'Two-Factor Authentication')}
    </Typography>
  )

  if (step.at === 'loading') return title

  if (step.at === 'none')
    return (
      <>
        {title}
        <Gutters bottom="xl">
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {t(
              'mfa.federated',
              'You sign in with an identity provider (like Google), so your password and two-factor are managed there. To add a Remote.It password — usable alongside your provider — set one up first.'
            )}
          </Typography>
          <Button variant="contained" size="small" href={`${new URL(OAUTH_PASSPORT_RESOURCE).origin}/forgot`} target="_blank">
            {t('mfa.setPassword', 'Set a Password')}
          </Button>
        </Gutters>
      </>
    )

  if (step.at === 'view')
    return (
      <>
        {title}
        <Gutters bottom="xl">
          {step.available.map(method => {
            const enrolled = step.methods.includes(method)
            const preferred = step.preferred === method
            return (
              <Box key={method} display="flex" alignItems="center" gap={2} marginBottom={1.5}>
                <Box minWidth={160}>
                  <Typography variant="body2">{t(`mfa.method.${method}`, METHOD_LABEL[method])}</Typography>
                </Box>
                <Chip
                  size="small"
                  color={enrolled ? 'success' : 'default'}
                  label={enrolled ? (preferred ? t('mfa.preferred', 'On · preferred') : t('mfa.on', 'On')) : t('mfa.off', 'Off')}
                />
                {enrolled ? (
                  <>
                    {!preferred && (
                      <Button size="small" onClick={() => setStep({ at: 'password', mode: 'prefer', method })}>
                        {t('mfa.prefer', 'Make preferred')}
                      </Button>
                    )}
                    <Button size="small" onClick={() => setStep({ at: 'password', mode: 'disable', method })}>
                      {t('mfa.disable', 'Turn Off')}
                    </Button>
                  </>
                ) : (
                  <Button size="small" variant="contained" color="primary" onClick={() => setStep({ at: 'password', mode: 'enroll', method })}>
                    {t('mfa.enable', 'Set Up')}
                  </Button>
                )}
              </Box>
            )
          })}
          <Typography variant="caption" color="textSecondary">
            {step.methods.length
              ? t('mfa.protects', 'The preferred method challenges every sign-in with this account.')
              : t('mfa.suggest', 'Protect your account with an authenticator app or text messages.')}
          </Typography>
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
          {step.mode === 'enroll' && step.method === 'sms' && (
            <TextField
              autoFocus
              variant="filled"
              type="tel"
              label={t('mfa.phone', 'Mobile number (+15555550123)')}
              value={phone}
              onChange={e => setPhone(e.target.value.trim())}
            />
          )}
          <TextField
            autoFocus={!(step.mode === 'enroll' && step.method === 'sms')}
            variant="filled"
            type="password"
            label={t('changePassword.currentPassword', 'Current Password')}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {step.error && (
            <Typography variant="body2" color="error">
              {step.error}
            </Typography>
          )}
          <Box>
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={!password || busy || (step.mode === 'enroll' && step.method === 'sms' && !phone)}
              onClick={() => submitPassword(step.mode, step.method)}
            >
              {t('common.continue', 'Continue')}
            </Button>
            <Button size="small" onClick={() => refresh()}>
              {t('common.cancel', 'Cancel')}
            </Button>
          </Box>
        </Gutters>
      </>
    )

  if (step.at === 'select')
    return (
      <>
        {title}
        <Gutters bottom="xl">
          <Typography variant="body2" gutterBottom>
            {t('mfa.choose', 'How would you like to get your code?')}
          </Typography>
          <RadioGroup value={choice} onChange={e => setChoice(e.target.value as MfaMethod)}>
            {step.options.map(o => (
              <FormControlLabel key={o} value={o} control={<Radio size="small" />} label={t(`mfa.method.${o}`, METHOD_LABEL[o] ?? o)} />
            ))}
          </RadioGroup>
          <Box marginTop={1}>
            <Button variant="contained" color="primary" size="small" disabled={busy} onClick={submitChoice}>
              {t('common.continue', 'Continue')}
            </Button>
            <Button size="small" onClick={() => refresh()}>
              {t('common.cancel', 'Cancel')}
            </Button>
          </Box>
        </Gutters>
      </>
    )

  if (step.at === 'relay' || step.at === 'scan')
    return (
      <>
        {title}
        <Gutters bottom="xl" sx={{ '.MuiTextField-root': { marginBottom: 2 } }}>
          {step.at === 'scan' ? (
            step.delivery === 'sms' ? (
              <Typography variant="body2" gutterBottom>
                {t('mfa.smsSent', 'We texted a code to your phone — enter it to finish turning on text-message codes.')}
              </Typography>
            ) : (
              <>
                <Typography variant="body2" gutterBottom>
                  {t('mfa.scan', 'Scan with your authenticator app, then enter its 6-digit code.')}
                </Typography>
                {step.otpauth && (
                  <Box marginY={2} bgcolor="white" padding={2} width="fit-content" borderRadius={1}>
                    <QRCodeSVG value={step.otpauth} size={168} />
                  </Box>
                )}
                {step.secret && (
                  <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                    {t('mfa.secret', 'Or enter the key manually:')} <code>{step.secret}</code>
                  </Typography>
                )}
              </>
            )
          ) : (
            <Typography variant="body2" gutterBottom>
              {step.hint
                ? t('mfa.relayHint', 'Enter the code sent to {{hint}}.', { hint: step.hint })
                : t('mfa.relay', 'Enter the 6-digit code from your current second factor.')}
            </Typography>
          )}
          <TextField
            autoFocus
            variant="filled"
            label={t('changePassword.mfaCode', 'Authentication code')}
            value={code}
            onChange={e => setCode(e.target.value.trim())}
          />
          {step.error && (
            <Typography variant="body2" color="error">
              {step.error}
            </Typography>
          )}
          <Box>
            <Button variant="contained" color="primary" size="small" disabled={code.length < 6 || busy} onClick={submitCode}>
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
          {t('mfa.codesTitle', 'Save your recovery codes — each can be used once if you lose your authenticator. They will not be shown again.')}
        </Typography>
        <Box component="pre" sx={{ userSelect: 'all', fontFamily: 'monospace', fontSize: 13 }}>
          {step.codes.join('\n')}
        </Box>
        <Button variant="contained" size="small" onClick={() => refresh()}>
          {t('common.done', 'Done')}
        </Button>
      </Gutters>
    </>
  )
}
