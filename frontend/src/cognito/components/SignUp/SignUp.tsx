import React, { useCallback, useState } from 'react'
import { Box, TextField, Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { spacing } from '../../styles/variables'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CognitoUserResult, SignUpFunc, ResendFunc } from '../../types'
import { AuthLayout } from '../AuthLayout'
import { Captcha } from '../Captcha'
import { Button } from '../Button'
import { Alert } from '../Alert'
import { Link } from '../Link'
import { PasswordStrengthInput } from '../PasswordStrengthInput'
import analytics from '../../services/analytics'
import { ISegmentSettings } from '../CognitoAuth'

export type SignUpProps = {
  onSignUp: SignUpFunc
  onResend: ResendFunc
  segmentSettings?: ISegmentSettings
  hideCaptcha?: boolean
  fullWidth?: boolean
}

export function SignUp({ onSignUp, onResend, segmentSettings, hideCaptcha, fullWidth }: SignUpProps): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [error, setError] = useState<Error | null>(null)
  const [showResend, setShowResend] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [terms, setTerms] = useState<boolean>(false)
  const [password, setPassword] = React.useState<string>('')
  const [verified, setVerified] = useState<boolean>(hideCaptcha || false)
  const [isValidPassword, setIsValidPassword] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const css = useStyles()

  // const callSignUp = useCallback(() => {
  //   ;(async () => {
  //     const signupResponse = await onSignUp(email, password)
  //     if (signupResponse?.error) {
  //       console.log('Got error, setting error: ', signupResponse.error)
  //       setError(signupResponse.error)
  //     } else {
  //       navigate(`/sign-up/verify`)
  //     }
  //   })()
  // }, [email, password])

  async function resend() {
    onResend(email)
  }

  async function forgotPassword() {
    navigate(`/forgot-password`)
  }
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // try {
    // if (segmentSettings) {
    //   analytics.track(email, segmentSettings)
    // }

    // const signupResponse = await onSignUp(email, password)
    // ;(async () => {
    //   const signupResponse = await onSignUp(email, password)

    // })()
    // let signupResponse: CognitoUserResult
    // ;(async () => (signupResponse = await onSignUp(email, password)))()
    // const signupResponse = { error: { name: 'anerror', message: 'a new error' } }
    await onSignUp(email, password)
      .then(() => navigate(`/sign-up/verify`))
      .catch((err: Error) => {
        if (err.name == 'UsernameExistsException') {
          setShowResend(true)
        }
        setError(err)
      })
    // if (signupResponse?.error) {
    //   console.log('Got error, setting error: ', signupResponse.error)
    //   setError(signupResponse.error.message)
    // } else {
    // }
    // callSignUp()
    // } catch (e) {
    //   setError(e)
    // }

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

  console.log('Render Signup')

  return (
    <AuthLayout back backLink="/sign-in" fullWidth={fullWidth} i18nKey="pages.sign-up.title">
      {alert && (
        <Box my={4}>
          <Alert type={alert.type}>{alert.message}</Alert>
        </Box>
      )}
      <form onSubmit={handleSubmit}>
        {error && <Alert my={4}>{error.message}</Alert>}
        {showResend && (
          <>
            <Alert my={4}>
              {
                "If you have not yet confirmed your account choose resend verification.  If your account is confirmed but you don't know your password you can go to forgot password and set a new one."
              }
            </Alert>
            <button onClick={() => resend()}>Resend</button>
            <button onClick={() => forgotPassword()}>Forgot Password</button>
          </>
        )}
        <Box mb={3}>
          <TextField
            autoCapitalize="none"
            autoCorrect="off"
            autoFocus
            disabled={loading}
            fullWidth
            id="sign-up-email"
            InputProps={{ disableUnderline: true }}
            label="Email Address"
            onChange={e => setEmail(e.currentTarget.value.toLowerCase().trim())}
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
        <Box className={css.terms} my={1}>
          <label>
            <input onChange={e => setTerms(e.target.checked)} type="checkbox" />
            <Typography variant="caption">
              I agree to the remote.it
              <Link href="https://remote.it/terms" rel="noopener noreferrer" target="_blank">
                Terms of Use,
              </Link>
              <Link href="https://remote.it/privacy" rel="noopener noreferrer" target="_blank">
                Privacy Policy
              </Link>
              and
              <Link href="https://remote.it/fairuse" rel="noopener noreferrer" target="_blank">
                Fair Use Policy.
              </Link>
            </Typography>
          </label>
        </Box>
        <Box my={3}>
          <Button
            color="primary"
            disabled={loading || !verified || !isValidPassword || !terms}
            fullWidth
            loading={loading}
            type="submit"
            variant="contained"
          >
            {t('pages.auth.create-account.button-label')}
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
  terms: {
    '& label': { display: 'flex' },
    '& span': { marginLeft: spacing.xs },
  },
})
