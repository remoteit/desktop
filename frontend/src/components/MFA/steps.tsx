import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Radio, RadioGroup, FormControlLabel, TextField, Typography } from '@mui/material'
import { Gutters } from '../Gutters'
import { CopyCodeBlock } from '../CopyCodeBlock'
import { MfaMethod, METHOD_LABEL } from '../../services/passportSelf'

/* The steps every credential change walks through — re-proving the password, answering a
   relayed code, choosing a factor, keeping the recovery codes — rendered the same way whether
   the change is an MFA method, a passkey or the password itself. Each surface keeps its own
   step machine and hands these the state. */

const Buttons: React.FC<{ primary: string; disabled: boolean; onPrimary: () => void; onCancel: () => void }> = ({
  primary,
  disabled,
  onPrimary,
  onCancel,
}) => {
  const { t } = useTranslation()
  return (
    <Box>
      <Button variant="contained" color="primary" size="small" disabled={disabled} onClick={onPrimary}>
        {primary}
      </Button>
      <Button size="small" onClick={onCancel}>
        {t('common.cancel', 'Cancel')}
      </Button>
    </Box>
  )
}

const ErrorLine: React.FC<{ error?: string }> = ({ error }) =>
  error ? (
    <Typography variant="body2" color="error">
      {error}
    </Typography>
  ) : null

/** Re-prove the password. `children` are fields the change needs first (a phone number). */
export const PasswordStep: React.FC<{
  password: string
  onPassword: (value: string) => void
  error?: string
  busy: boolean
  incomplete?: boolean
  onSubmit: () => void
  onCancel: () => void
  children?: React.ReactNode
}> = ({ password, onPassword, error, busy, incomplete, onSubmit, onCancel, children }) => {
  const { t } = useTranslation()
  return (
    <Gutters bottom="xl" sx={{ '.MuiTextField-root': { marginBottom: 2 } }}>
      <Typography variant="body2" gutterBottom>
        {t(
          'mfa.confirmPassword',
          'Confirm your password to continue — changing a credential re-proves the one you hold.'
        )}
      </Typography>
      {children}
      <TextField
        autoFocus={!children}
        variant="filled"
        type="password"
        label={t('changePassword.currentPassword', 'Current Password')}
        value={password}
        onChange={e => onPassword(e.target.value)}
      />
      <ErrorLine error={error} />
      <Buttons
        primary={t('common.continue', 'Continue')}
        disabled={!password || busy || !!incomplete}
        onPrimary={onSubmit}
        onCancel={onCancel}
      />
    </Gutters>
  )
}

/** Answer a relayed second-factor code. `prompt` says where the code comes from. */
export const CodeStep: React.FC<{
  prompt: React.ReactNode
  code: string
  onCode: (value: string) => void
  error?: string
  busy: boolean
  onSubmit: () => void
  onCancel: () => void
}> = ({ prompt, code, onCode, error, busy, onSubmit, onCancel }) => {
  const { t } = useTranslation()
  return (
    <Gutters bottom="xl" sx={{ '.MuiTextField-root': { marginBottom: 2 } }}>
      {prompt}
      <TextField
        autoFocus
        variant="filled"
        label={t('changePassword.mfaCode', 'Authentication code')}
        value={code}
        onChange={e => onCode(e.target.value.trim())}
      />
      <ErrorLine error={error} />
      <Buttons
        primary={t('common.verify', 'Verify')}
        disabled={code.length < 6 || busy}
        onPrimary={onSubmit}
        onCancel={onCancel}
      />
    </Gutters>
  )
}

/** Choose a factor from the ones the AS offers this account. */
export const ChoiceStep: React.FC<{
  options: MfaMethod[]
  choice: MfaMethod
  onChoice: (value: MfaMethod) => void
  error?: string
  busy: boolean
  onSubmit: () => void
  onCancel: () => void
}> = ({ options, choice, onChoice, error, busy, onSubmit, onCancel }) => {
  const { t } = useTranslation()
  return (
    <Gutters bottom="xl">
      <Typography variant="body2" gutterBottom>
        {t('mfa.choose', 'How would you like to get your code?')}
      </Typography>
      <RadioGroup value={choice} onChange={e => onChoice(e.target.value as MfaMethod)}>
        {options.map(o => (
          <FormControlLabel
            key={o}
            value={o}
            control={<Radio size="small" />}
            label={t(`mfa.method.${o}`, METHOD_LABEL[o] ?? o)}
          />
        ))}
      </RadioGroup>
      <ErrorLine error={error} />
      <Box marginTop={1}>
        <Buttons primary={t('common.continue', 'Continue')} disabled={busy} onPrimary={onSubmit} onCancel={onCancel} />
      </Box>
    </Gutters>
  )
}

/** The recovery codes, shown once. */
export const RecoveryCodes: React.FC<{ codes: string[]; onDone: () => void }> = ({ codes, onDone }) => {
  const { t } = useTranslation()
  return (
    <Gutters bottom="xl">
      <Typography variant="body2" gutterBottom>
        {t(
          'mfa.codesTitle',
          'Save your recovery codes — each can be used once if you lose your authenticator. They will not be shown again.'
        )}
      </Typography>
      <CopyCodeBlock value={codes.join('\n')} sx={{ marginBottom: 2 }} />
      <Button variant="contained" size="small" onClick={onDone}>
        {t('common.done', 'Done')}
      </Button>
    </Gutters>
  )
}
