import React, { ReactElement, useEffect } from 'react'
import { rememberMe } from '../../../helpers/userHelper'
import { makeStyles } from '@mui/styles'
import { Box, Button, TextField, Typography, Divider, Checkbox, Grid, FormControlLabel, Collapse } from '@mui/material'
import { useTranslation } from 'react-i18next'
import {
  GoogleSignInFunc,
  OktaSignInFunc,
  SignInFunc,
  SamlSignInFunc,
  UsernameChangeFunc,
  CheckSamlFunc,
} from '../../types'
import { Notice } from '../../../components/Notice'
import { Icon } from '../../../components/Icon'
import { AuthLayout } from '../AuthLayout'
import { GoogleSignInButton } from '../GoogleSignInButton'
import { Link } from '../../../components/Link'
import { spacing } from '../../../styling'
import { useHistory } from 'react-router-dom'

const useStyles = makeStyles({
  or: {
    display: 'flex',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    '& span': { padding: spacing.sm },
    '& hr': { flexGrow: 1 },
  },
})

export type SignInProps = {
  email?: string
  onCheckSaml: CheckSamlFunc
  onUsernameChange?: UsernameChangeFunc
  onGoogleSignIn: GoogleSignInFunc
  onOktaSignIn: OktaSignInFunc
  onSignIn: SignInFunc
  onSamlSignIn: SamlSignInFunc
  showLogo?: boolean
  errorMessage?: string
  fullWidth?: boolean
}

export function SignIn({
  email,
  onCheckSaml,
  onUsernameChange,
  onGoogleSignIn,
  onOktaSignIn,
  onSignIn,
  onSamlSignIn,
  showLogo = true,
  errorMessage = undefined,
  fullWidth,
}: SignInProps): JSX.Element {
  let externalError: Error | null = null
  if (errorMessage) {
    externalError = new Error(errorMessage)
  }
  const { t } = useTranslation()
  const history = useHistory()
  const [username, setUsername] = React.useState<string>(email || rememberMe.username)
  const [password, setPassword] = React.useState<string>('')
  const [error, setError] = React.useState<Error | null>(externalError)
  const [notice, setNotice] = React.useState<ReactElement | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [emailProcessed, setEmailProcessed] = React.useState<boolean>(false)
  const [remember, setRemember] = React.useState<boolean>(rememberMe.checked)
  const passRef = React.useRef<HTMLInputElement>()
  const css = useStyles()

  useEffect(() => {
    if (error && error.name == 'NotAuthorizedException') {
      setNotice(
        <>
          {t('pages.sign-in.notice2.part1')}
          <Link to="/update-password">{t('pages.sign-in.notice2.link')}</Link>
          {t('pages.sign-in.notice2.part2')}
        </>
      )
    } else {
      setNotice(null)
    }
  }, [error])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError(null)

    if (!username || (!password && emailProcessed)) return alert('Please enter a username and password')

    setLoading(true)
    rememberMe.set(remember ? username : '')

    if (emailProcessed) {
      try {
        // await onSignIn(username, password)
        const challenge = await onSignIn(username, password)

        if (onUsernameChange) onUsernameChange(username)

        if (challenge) {
          // They need to recover their account.
          if (challenge === 'CUSTOM_CHALLENGE') {
            history.push('/account-recovery')
            return
          }

          // MFA verification is required, send them to verify.
          if (challenge === 'SMS_MFA' || challenge === 'SOFTWARE_TOKEN_MFA') {
            history.push('/mfa-verify')
            return
          }

          // TODO: handle other challenge options
        }
      } catch (error) {
        console.error(error)
        setError(error)
      }
    } else {
      if (username) {
        const result = await onCheckSaml(username)
        if (result.isSaml && result.orgName) {
          //Its an org!
          onSamlSignIn(result.orgName)
        } else {
          setEmailProcessed(true)
        }
      }
    }

    setLoading(false)
  }

  return (
    <AuthLayout fullWidth={fullWidth} showLogo={showLogo}>
      <Box mt={4} textAlign="center">
        <GoogleSignInButton color="primary" fullWidth onClick={onGoogleSignIn} variant="outlined" />
      </Box>
      <Box className={css.or} mb={3} mt={3}>
        <Divider />
        <Typography variant="caption">{t('pages.sign-in.or')?.toLowerCase()}</Typography>
        <Divider />
      </Box>
      <form onSubmit={handleSubmit}>
        {error?.message && (
          <Notice severity="error" fullWidth gutterBottom>
            {error.message}
            {notice}
          </Notice>
        )}
        <Box mb={1}>
          <TextField
            autoCapitalize="none"
            autoCorrect="off"
            autoFocus={!username}
            disabled={loading}
            fullWidth
            id="sign-in-username"
            label={t('global.user.email')}
            name="email"
            onChange={(e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
              setUsername(e?.currentTarget?.value.trim())
            }}
            required
            value={username}
            variant="filled"
          />
        </Box>
        <Collapse in={emailProcessed} unmountOnExit onEntered={() => passRef.current?.focus()}>
          <Box mb={1}>
            <TextField
              hidden
              fullWidth
              inputRef={passRef}
              autoCapitalize="none"
              autoCorrect="off"
              autoFocus={emailProcessed}
              disabled={loading}
              id="sign-in-password"
              label={t('global.user.password')}
              name="password"
              onChange={(e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setPassword(e?.currentTarget?.value)
              }
              required
              type="password"
              variant="filled"
            />
          </Box>
        </Collapse>
        <Box>
          <Button
            color="primary"
            disabled={loading || !username || (!password && emailProcessed)}
            fullWidth
            type="submit"
            variant="contained"
          >
            {loading ? t('pages.sign-in.signing-in') : t('pages.sign-in.sign-in')}
          </Button>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <Box mb={3} ml={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={remember}
                      onChange={() => setRemember(!remember)}
                      checkedIcon={<Icon name="check-square" size="md" type="solid" />}
                      icon={<Icon name="square" size="md" type="light" color="grayDark" />}
                      color="primary"
                    />
                  }
                  label={<Typography variant="caption">Remember me</Typography>}
                />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box mb={3} mt={1} textAlign="right">
                <Typography variant="caption">
                  <Link to="/forgot-password">{t('pages.sign-in.forgot-password')}</Link>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </form>
      <Box mt={4} textAlign="center">
        <Typography variant="caption">
          {t('pages.sign-in.create-account')}
          <Link to="/sign-up">{t('pages.sign-in.sign-up-link')}</Link>
        </Typography>
      </Box>
      {!emailProcessed && (
        <Box mt={0} textAlign="center">
          <Typography variant="caption">
            <Link
              onClick={() => {
                setEmailProcessed(true)
              }}
            >
              {t('pages.sign-in.user-password-link')}
            </Link>
          </Typography>
        </Box>
      )}
      {emailProcessed && (
        <Box mt={0} textAlign="center">
          <Typography variant="caption">
            <Link
              onClick={() => {
                setEmailProcessed(false)
              }}
            >
              {t('pages.sign-in.saml-link')}
            </Link>
          </Typography>
        </Box>
      )}
    </AuthLayout>
  )
}
