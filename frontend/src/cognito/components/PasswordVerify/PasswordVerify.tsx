import React, { useState } from 'react'
import { Box, Button, TextField, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useHistory, useLocation } from 'react-router-dom'
import { AuthLayout } from '../AuthLayout'
import { Notice } from '../../../components/Notice'
import { Icon } from '../../../components/Icon'
import { PasswordStrengthInput } from '../PasswordStrengthInput'

export type PasswordVerifyProps = {
  onVerifyPasswordChange: (email: string, password: string, shortcode: string) => Promise<void>
  email?: string
  fullWidth?: boolean
}

export function PasswordVerify({ onVerifyPasswordChange, email, fullWidth }: PasswordVerifyProps): JSX.Element {
  const { t } = useTranslation()
  const history = useHistory()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [shortcode, setShortcode] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isValidPassword, setIsValidPassword] = useState<boolean>(false)
  const [verificationRequestSent, setVerificationRequestSent] = useState<boolean>(true)

  // Get the email from the URL bar
  const { search } = location
  const localEmail = email ? email : ''
  const resetPasswordNeeded = search.includes('resetRequired=true')

  function handlePasswordValidation(password: string, validation: boolean): void {
    setPassword(password)
    setIsValidPassword(validation)
  }

  async function handleVerifyPasswordChange(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    setError(null)
    setLoading(true)
    setVerificationRequestSent(false)

    try {
      await onVerifyPasswordChange(localEmail.trim(), password.trim(), shortcode.trim())
      history.push(`/sign-in`, {
        alert: {
          type: 'success',
          message: t('pages.forgot-password-verify.success-message'),
        },
      })
      return
    } catch (e) {
      console.error(e)
      if (e.code) setError(t(`pages.auth-mfa.errors.${e.code}`))
      else setError(e.message)
    }

    setLoading(false)
  }

  return (
    <AuthLayout back backLink="/forgot-password" i18nKey="pages.forgot-password-verify.title" fullWidth={fullWidth}>
      <form onSubmit={handleVerifyPasswordChange}>
        {verificationRequestSent && resetPasswordNeeded && (
          <Notice severity="info" fullWidth gutterBottom>
            {t('pages.password-reset.cognito-reset-password-required', {
              email,
            })}
          </Notice>
        )}
        {verificationRequestSent && !resetPasswordNeeded && (
          <>
            <Notice severity="success" fullWidth gutterBottom>
              {t('pages.password-reset.verification-code-message', {
                email,
              })}
            </Notice>
            <Typography variant="caption">{t('pages.password-reset.signout-all-text')}</Typography>
          </>
        )}
        {error && (
          <Notice severity="error" fullWidth gutterBottom>
            {error}
          </Notice>
        )}
        <Box mt={4}>
          <TextField
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            autoFocus
            disabled={loading}
            fullWidth
            id="verification-code"
            label={t('pages.password-reset.verification-code')}
            onChange={e => setShortcode(e.currentTarget?.value.trim())}
            InputProps={{ disableUnderline: true }}
            // maxLength={6}
            required
            value={shortcode}
            variant="filled"
          />
        </Box>
        <Box my={2}>
          <PasswordStrengthInput isNewPassword onChange={handlePasswordValidation} />
        </Box>
        <Box mt={4} textAlign="right">
          <Button disabled={loading || (shortcode !== '' && !isValidPassword)} type="submit">
            {t('pages.password-reset.update-button')}
            <Icon inline name="arrow-right" />
          </Button>
        </Box>
      </form>
    </AuthLayout>
  )
}
