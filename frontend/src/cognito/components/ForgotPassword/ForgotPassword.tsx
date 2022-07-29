import { Box, TextField } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../Alert'
import { AuthLayout } from '../AuthLayout'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { useHistory } from 'react-router-dom'
import { RecoverPasswordRequestFunc } from '../../types'

export type ForgotPasswordProps = {
  email?: string
  onRecoverPasswordRequest: RecoverPasswordRequestFunc
  titleKey?: string
  buttonKey?: string
  fullWidth?: boolean
}

export function ForgotPassword({
  email,
  onRecoverPasswordRequest,
  titleKey,
  buttonKey,
  fullWidth,
}: ForgotPasswordProps): JSX.Element {
  const { t } = useTranslation()
  const history = useHistory()
  const [stateEmail, setEmail] = React.useState<string>(email ? email : '')
  const [error, setError] = React.useState<Error | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false)

  if (titleKey === undefined) {
    titleKey = 'pages.forgot-password.title'
  }
  if (buttonKey === undefined) {
    buttonKey = 'pages.forgot-password.reset-password'
  }

  function emailChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
    setEmail(e.currentTarget.value.toLowerCase().trim())
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    setError(null)
    setLoading(true)

    try {
      await onRecoverPasswordRequest(stateEmail)
      history.push(`/forgot-password/verify`)
      return
    } catch (error) {
      setError(error)
    }

    setLoading(false)
  }

  return (
    <AuthLayout back backLink="/sign-in" fullWidth={fullWidth} i18nKey={titleKey}>
      <form onSubmit={handleForgotPassword}>
        {error && <Alert my={4}>{error.message}</Alert>}
        <Box my={4}>
          <TextField
            autoCapitalize="none"
            autoCorrect="off"
            autoFocus
            disabled={loading}
            fullWidth
            id="forgot-password-email"
            InputProps={{ disableUnderline: true }}
            label={t('pages.forgot-password.email')}
            onChange={emailChange}
            required
            value={stateEmail}
            variant="filled"
          />
        </Box>
        <Box alignItems="center" display="flex" my={4}>
          <Button disabled={loading} to="/sign-in" variant="text">
            {t('global.actions.cancel')}
          </Button>
          <Box ml="auto">
            <Button disabled={loading || !stateEmail} loading={loading} type="submit">
              {t(buttonKey)}
              <Icon inline name="arrow-right" />
            </Button>
          </Box>
        </Box>
      </form>
    </AuthLayout>
  )
}
