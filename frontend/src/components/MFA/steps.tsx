import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Radio, RadioGroup, FormControlLabel, TextField, Typography } from '@mui/material'
import { Gutters } from '../Gutters'
import { CopyCodeBlock } from '../CopyCodeBlock'
import { FactorKind, KIND_LABEL } from '../../services/accountSecurity'

/* The steps a sign-in factor change walks through — a password where the credential store asks for
   one, a code, a choice of factor, keeping the recovery codes — rendered the same way for every
   change. The surface keeps its own step machine and hands these the state. */

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

/** A password, with what it is for. `children` are fields the change needs first (a phone number). */
export const PasswordStep: React.FC<{
  prompt: string
  label?: string
  autoComplete?: string
  password: string
  onPassword: (value: string) => void
  error?: string
  busy: boolean
  incomplete?: boolean
  onSubmit: () => void
  onCancel: () => void
  children?: React.ReactNode
}> = ({ prompt, label, autoComplete, password, onPassword, error, busy, incomplete, onSubmit, onCancel, children }) => {
  const { t } = useTranslation()
  return (
    <Gutters bottom="xl" sx={{ '.MuiTextField-root': { marginBottom: 2 } }}>
      <Typography variant="body2" gutterBottom>
        {prompt}
      </Typography>
      {children}
      <TextField
        autoFocus={!children}
        variant="filled"
        type="password"
        label={label ?? t('changePassword.currentPassword', 'Current Password')}
        inputProps={{ autoComplete: autoComplete ?? 'current-password' }}
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
        label={t('mfa.code', 'Code')}
        inputProps={{ inputMode: 'numeric', autoComplete: 'one-time-code' }}
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
  options: FactorKind[]
  choice: FactorKind
  onChoice: (value: FactorKind) => void
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
      <RadioGroup value={choice} onChange={e => onChoice(e.target.value as FactorKind)}>
        {options.map(o => (
          <FormControlLabel
            key={o}
            value={o}
            control={<Radio size="small" />}
            label={t(`mfa.method.${o}`, KIND_LABEL[o] ?? o)}
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
          'Save your recovery codes — each manages one change when your phone or key is gone. They will not be shown again.'
        )}
      </Typography>
      <CopyCodeBlock value={codes.join('\n')} sx={{ marginBottom: 2 }} />
      <Button variant="contained" size="small" onClick={onDone}>
        {t('common.done', 'Done')}
      </Button>
    </Gutters>
  )
}
