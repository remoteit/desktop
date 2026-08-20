import React, { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Chip, TextField, Typography } from '@mui/material'
import { Gutters } from '../Gutters'
import {
  selfMe, selfMfaEnroll, selfMfaConfirm, selfMfaDisable, selfChallenge, SelfContinuation,
} from '../../services/passportSelf'

/**
 * Two-factor settings over the Passport self-API (Phase 2b) — replaces the Cognito-era
 * MFAPreference. Every step re-proves possession: the password starts enroll/disable,
 * the authenticator code lands it; a store that already challenges relays its code
 * first. One component, one small state machine mirroring the API's continuations.
 */

type Step =
  | { at: 'loading' }
  | { at: 'view'; enabled: boolean }
  | { at: 'password'; mode: 'enroll' | 'disable'; error?: string }
  | { at: 'relay'; mode: 'enroll' | 'disable'; challenge: string; hint?: string; error?: string }
  | { at: 'scan'; challenge: string; secret: string; otpauth: string; error?: string }
  | { at: 'codes'; codes: string[] }

export const MFASettings: React.FC = () => {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>({ at: 'loading' })
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    const me = (await selfMe()) as SelfContinuation & { mfaEnabled?: boolean }
    setStep({ at: 'view', enabled: !!me.mfaEnabled })
  }
  useEffect(() => {
    refresh()
  }, [])

  const submitPassword = async (mode: 'enroll' | 'disable') => {
    setBusy(true)
    const r = mode === 'enroll' ? await selfMfaEnroll(password) : await selfMfaDisable(password)
    setBusy(false)
    setPassword('')
    if (r.status === 'ok') return refresh()
    if (r.status === 'confirm' && r.challenge && r.secret && r.otpauth)
      return setStep({ at: 'scan', challenge: r.challenge, secret: r.secret, otpauth: r.otpauth })
    if (r.status === 'mfa' && r.challenge) return setStep({ at: 'relay', mode, challenge: r.challenge, hint: r.hint })
    setStep({
      at: 'password', mode,
      error: r.error === 'invalid_password'
        ? t('mfa.wrongPassword', "That password didn't match.")
        : r.error_description || t('mfa.failed', 'Something went wrong — try again.'),
    })
  }

  const submitCode = async () => {
    setBusy(true)
    const current = step as Extract<Step, { at: 'relay' | 'scan' }>
    const r = current.at === 'scan' ? await selfMfaConfirm(current.challenge, code) : await selfChallenge(current.challenge, code)
    setBusy(false)
    setCode('')
    if (r.status === 'ok') {
      if (r.recovery_codes?.length) return setStep({ at: 'codes', codes: r.recovery_codes })
      return refresh()
    }
    if (r.status === 'confirm' && r.challenge && r.secret && r.otpauth)
      return setStep({ at: 'scan', challenge: r.challenge, secret: r.secret, otpauth: r.otpauth })
    // invalid_code re-arms the same step under a fresh handle
    if (r.challenge) {
      const error = t('mfa.wrongCode', "That code didn't match — try again.")
      if (current.at === 'scan') setStep({ ...current, challenge: r.challenge, error })
      else setStep({ ...current, challenge: r.challenge, error })
      return
    }
    setStep({ at: 'view', enabled: false })
  }

  const title = (
    <Typography variant="subtitle1" gutterBottom>
      {t('mfa.title', 'Two-Factor Authentication')}
    </Typography>
  )

  if (step.at === 'loading') return title

  if (step.at === 'view')
    return (
      <>
        {title}
        <Gutters bottom="xl">
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              size="small"
              color={step.enabled ? 'success' : 'default'}
              label={step.enabled ? t('mfa.on', 'On') : t('mfa.off', 'Off')}
            />
            <Typography variant="body2" color="textSecondary">
              {step.enabled
                ? t('mfa.protects', 'Your authenticator protects every sign-in with this account.')
                : t('mfa.suggest', 'Protect your account with an authenticator app.')}
            </Typography>
          </Box>
          <Box marginTop={2}>
            <Button
              variant="contained"
              size="small"
              color={step.enabled ? 'inherit' : 'primary'}
              onClick={() => setStep({ at: 'password', mode: step.enabled ? 'disable' : 'enroll' })}
            >
              {step.enabled ? t('mfa.disable', 'Turn Off') : t('mfa.enable', 'Set Up')}
            </Button>
          </Box>
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
          <TextField
            autoFocus
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
            <Button variant="contained" color="primary" size="small" disabled={!password || busy} onClick={() => submitPassword(step.mode)}>
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
            <>
              <Typography variant="body2" gutterBottom>
                {t('mfa.scan', 'Scan with your authenticator app, then enter its 6-digit code.')}
              </Typography>
              <Box marginY={2} bgcolor="white" padding={2} width="fit-content" borderRadius={1}>
                <QRCodeSVG value={step.otpauth} size={168} />
              </Box>
              <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                {t('mfa.secret', 'Or enter the key manually:')} <code>{step.secret}</code>
              </Typography>
            </>
          ) : (
            <Typography variant="body2" gutterBottom>
              {step.hint
                ? t('mfa.relayHint', 'Enter the code sent to {{hint}}.', { hint: step.hint })
                : t('mfa.relay', 'Enter the 6-digit code from your current authenticator.')}
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
