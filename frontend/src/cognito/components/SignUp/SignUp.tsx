import React, { useState } from 'react'
import { Box, Button, Checkbox, TextField, Typography, FormControlLabel } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'
import { SignUpFunc, ResendFunc } from '../../types'
import { AuthLayout } from '../AuthLayout'
import { Captcha } from '../Captcha'
import { Notice } from '../../../components/Notice'
import { Icon } from '../../../components/Icon'
import { Link } from '../../../components/Link'
import { PasswordStrengthInput } from '../PasswordStrengthInput'

export type SignUpProps = {
  onSignUp: SignUpFunc
  onResend: ResendFunc
  hideCaptcha?: boolean
  fullWidth?: boolean
}

export function SignUp({ onSignUp, onResend, hideCaptcha, fullWidth }: SignUpProps): JSX.Element {
  const { t } = useTranslation()
  const history = useHistory()
  const params = useParams<{ email?: string }>()
  const [error, setError] = useState<Error | null>(null)
  const [showResend, setShowResend] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [terms, setTerms] = useState<boolean>(false)
  const [password, setPassword] = React.useState<string>('')
  const [verified, setVerified] = useState<boolean>(hideCaptcha || false)
  const [isValidPassword, setIsValidPassword] = useState<boolean>(false)
  const [email, setEmail] = useState<string>(decodeURIComponent(params?.email || ''))
  const css = useStyles()

  async function resend() {
    onResend(email)
  }

  async function forgotPassword() {
    history.push(`/forgot-password`)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError(null)
    setLoading(true)

    await onSignUp(email, password)
      .then(() => history.push(`/sign-up/verify`))
      .catch((err: Error) => {
        if (err.name == 'UsernameExistsException') {
          setShowResend(true)
        }
        setError(err)
      })

    setLoading(false)
  }

  // Grab possible alerts to show
  let alert
  const { state }: any = window.location
  if (state && state.alert) alert = state.alert

  function setPasswordValidation(password: string, isValidPassword: boolean): void {
    setPassword(password.trim())
    setIsValidPassword(isValidPassword)
  }

  return (
    <AuthLayout back backLink="/sign-in" fullWidth={fullWidth} i18nKey="pages.sign-up.title">
      {alert && (
        <Box my={4}>
          <Notice severity={alert.type}>{alert.message}</Notice>
        </Box>
      )}
      <form onSubmit={handleSubmit}>
        {error && (
          <Notice severity="error" fullWidth gutterBottom>
            {error.message}
          </Notice>
        )}
        {showResend && (
          <>
            <Notice severity="warning" fullWidth gutterBottom>
              If you have not yet confirmed your account choose resend verification. If your account is confirmed but
              you don't know your password you can go to forgot password and set a new one.
              <Box textAlign="right" pt={1}>
                <Button size="small" color="warning" onClick={() => forgotPassword()}>
                  Forgot Password
                </Button>
                <Button size="small" color="warning" variant="contained" onClick={() => resend()}>
                  Resend
                </Button>
              </Box>
            </Notice>
          </>
        )}
        <Box mb={3}>
          <TextField
            autoCapitalize="none"
            autoCorrect="off"
            autoFocus
            disabled={loading}
            fullWidth
            value={email}
            id="sign-up-email"
            label="Email Address"
            onChange={e => setEmail(e.currentTarget.value.toLowerCase().trim())}
            inputProps={{ maxLength: 254 }}
            placeholder="Email address..."
            required
            type="email"
            variant="filled"
          />
        </Box>
        <Box my={1}>
          <PasswordStrengthInput
            isNewPassword={false}
            onChange={(password, isValidPassword) => setPasswordValidation(password, isValidPassword)}
          />
        </Box>
        {!hideCaptcha && (
          <Box className={css.captcha} height={isValidPassword && !verified ? '96px' : '0px'} mt={2}>
            <Captcha id="sign-up-captcha" onVerify={() => setVerified(true)} />
          </Box>
        )}
        <Box ml={1}>
          <FormControlLabel
            control={
              <Checkbox
                onChange={e => setTerms(e.target.checked)}
                checkedIcon={<Icon name="check-square" size="md" type="solid" />}
                icon={<Icon name="square" size="md" type="light" color="grayDark" />}
                color="primary"
              />
            }
            label={
              <Typography variant="caption">
                I agree to the Remote.It
                <Link href="https://link.remote.it/legal/terms-of-use">Terms of Use,</Link>
                <Link href="https://link.remote.it/legal/privacy-policy">Privacy Policy</Link>
                and
                <Link href="https://link.remote.it/legal/fair-use-policy">Fair Use Policy.</Link>
              </Typography>
            }
          />
        </Box>
        <Box my={3}>
          <Button
            color="primary"
            disabled={loading || !verified || !isValidPassword || !terms}
            fullWidth
            type="submit"
            variant="contained"
          >
            {loading ? t('pages.auth.create-account.button-loading') : t('pages.auth.create-account.button-label')}
          </Button>
        </Box>
        {/* <Box mt={4}>
          <Typography variant="caption">
            Already have an account? <Link to="/sign-in">Sign in</Link>
          </Typography>
        </Box> */}
      </form>
    </AuthLayout>
  )
}

const useStyles = makeStyles({
  captcha: { transition: 'height 600ms', overflow: 'hidden', position: 'relative' },
})
