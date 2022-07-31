import { Box, TextField, Typography, Divider, Checkbox, Grid } from '@mui/material'
import { makeStyles } from '@mui/styles'
import React, { ReactElement, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  GoogleSignInFunc,
  OktaSignInFunc,
  SignInFunc,
  SamlSignInFunc,
  UsernameChangeFunc,
  CheckSamlFunc,
} from '../../types'
import { Alert } from '../Alert'
import { AuthLayout } from '../AuthLayout'
import { BannerNotices } from '../BannerNotices'
import { Button } from '../Button'
import { GoogleSignInButton } from '../GoogleSignInButton'
// import { OktaSignInButton } from '../OktaSignInButton'
import { Link } from '../Link'
import { spacing } from '../../styles/variables'
import { useHistory } from 'react-router-dom'

const useStyles = makeStyles({
  or: {
    display: 'flex',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    '& span': { padding: spacing.sm },
    '& hr': { flexGrow: 1 },
  },
  remember: {
    cursor: 'pointer',
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
  showBanners?: boolean
  errorMessage?: string
  showCheckboxRemember?: boolean
  checkedCheckboxRemember?: boolean
  onClickCheckboxRemember?: (checked: boolean) => void
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
  showBanners = false,
  errorMessage = undefined,
  showCheckboxRemember,
  checkedCheckboxRemember,
  onClickCheckboxRemember,
  fullWidth,
}: SignInProps): JSX.Element {
  let externalError: Error | null = null
  if (errorMessage) {
    externalError = new Error(errorMessage)
  }
  const { t } = useTranslation()
  const history = useHistory()
  const [username, setUsername] = React.useState<string>(email ? email : '')
  const [password, setPassword] = React.useState<string>('')
  const [error, setError] = React.useState<Error | null>(externalError)
  const [notice, setNotice] = React.useState<ReactElement | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [emailProcessed, setEmailProcessed] = React.useState<boolean>(false)
  // const [isSaml, setIsSaml] = React.useState<boolean>(false)
  const [remember, setRemember] = React.useState<boolean>(checkedCheckboxRemember || false)
  const css = useStyles()

  // const orgs: any = {
  //   'funmusiclessons.com': {
  //     samlOnly: true,
  //     name: 'mtme',
  //   },
  //   'remote.it': {
  //     samlOnly: true,
  //     name: 'remoteit',
  //   },
  // }

  let banners: React.ReactElement | null = null
  if (showBanners) {
    banners = <BannerNotices></BannerNotices>
  }

  useEffect(() => {
    if (error && error.name == 'NotAuthorizedException') {
      setNotice(
        <React.Fragment>
          <br></br>
          <br></br>
          {t('pages.sign-in.notice2.part1')}
          <Link to="/update-password">{t('pages.sign-in.notice2.link')}</Link>
          {t('pages.sign-in.notice2.part2')}
        </React.Fragment>
      )
    } else {
      setNotice(null)
    }
  }, [error])

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError(null)

    if (!username || (!password && emailProcessed)) return alert('Please enter a username and password')

    setLoading(true)
    setError(null)

    if (emailProcessed) {
      try {
        // await onSignIn(username, password)
        const challenge = await onSignIn(username, password)

        if (onClickCheckboxRemember) onClickCheckboxRemember(remember)
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

  function handleGoogleSignIn(): void {
    onGoogleSignIn()
  }

  function handleOktaSignIn(): void {
    onOktaSignIn()
  }

  return (
    <>
      {banners}
      <AuthLayout fullWidth={fullWidth} showLogo={showLogo}>
        {/* <Box mt={4} textAlign="center">
          <OktaSignInButton color="primary" fullWidth onClick={handleOktaSignIn} variant="outlined" />
        </Box> */}
        <Box mt={4} textAlign="center">
          <GoogleSignInButton color="primary" fullWidth onClick={handleGoogleSignIn} variant="outlined" />
        </Box>
        <Box className={css.or} mb={3} mt={3}>
          <Divider />
          <Typography variant="caption">{t('pages.sign-in.or')?.toLowerCase()}</Typography>
          <Divider />
        </Box>
        <form onSubmit={handleSignIn}>
          {error?.message && (
            <Alert my={4}>
              {error.message}
              {notice}
            </Alert>
          )}
          <Box my={1}>
            <TextField
              autoCapitalize="none"
              autoCorrect="off"
              autoFocus={!username}
              disabled={loading}
              fullWidth
              id="sign-in-username"
              InputProps={{ disableUnderline: true }}
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
          {emailProcessed && (
            <Box my={1}>
              <TextField
                autoCapitalize="none"
                autoCorrect="off"
                autoFocus={!!username}
                disabled={loading}
                fullWidth
                hidden
                id="sign-in-password"
                InputProps={{ disableUnderline: true }}
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
          )}
          <Box mb={0} mt={1}>
            <Button
              color="primary"
              disabled={!username || (!password && emailProcessed)}
              fullWidth
              loading={loading}
              type="submit"
              variant="contained"
            >
              {loading ? t('pages.sign-in.signing-in') : t('pages.sign-in.sign-in')}
            </Button>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                {showCheckboxRemember && (
                  <Box mb={3} textAlign="left">
                    <Typography className={css.remember} variant="caption">
                      <span onClick={() => setRemember(!remember)}>
                        <Checkbox checked={remember} color="primary" /> Remember me
                      </span>
                    </Typography>
                  </Box>
                )}
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
            <Link to="/sign-up"> {t('pages.sign-in.sign-up-link')}</Link>
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
    </>
  )
}
