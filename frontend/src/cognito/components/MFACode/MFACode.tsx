import { Box, Container, TextField, Typography } from '@mui/material'
import {
  CognitoUser,
  ChallengeOption,
  ConfirmSignInFunc,
  SendCustomChallengeAnswerFunc,
  SignInSuccessFunc,
} from '../../types'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../Alert'
import { AuthLayout } from '../AuthLayout'
import { Button } from '../Button'
import { Center } from '../Center'
import { Icon } from '../Icon'
import { Link } from '../Link'

export type MFACodeProps = {
  challengeName?: ChallengeOption
  onConfirmSignIn: ConfirmSignInFunc
  onSendCustomChallengeAnswer: SendCustomChallengeAnswerFunc
  onSignInSuccess: SignInSuccessFunc
  cognitoUser?: CognitoUser
}

export function MFACode({
  challengeName,
  onConfirmSignIn,
  onSendCustomChallengeAnswer,
  onSignInSuccess,
  cognitoUser,
}: MFACodeProps): JSX.Element {
  const { t } = useTranslation()
  const [localCognitoUser, setAuthUser] = useState<CognitoUser | undefined>(cognitoUser)
  const [code, setCode] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!localCognitoUser) return

    // Clear out previous state
    setError('')
    setLoading(true)

    // You need to get the code from the UI inputs
    // and then trigger the following function with a button click
    //const code = 'GET_A_CODE_HERE' //TODO: getCodeFromUserInput()
    // If MFA is enabled, sign-in should be confirmed with the confirmation code

    if (challengeName === 'CUSTOM_CHALLENGE') {
      try {
        const authUser = await onSendCustomChallengeAnswer(code)
        if (localCognitoUser?.challengeName === 'CUSTOM_CHALLENGE') {
          setAuthUser(authUser)
          setCode('')
          return
        }

        onSignInSuccess(authUser)
      } catch (error) {
        console.error('verificationError', error)
        setError(error.message)
      }
    } else {
      try {
        if (challengeName === 'SMS_MFA' || challengeName === 'SOFTWARE_TOKEN_MFA') {
          await onConfirmSignIn(code, challengeName)
          // console.error('challengeReturned: ', localCognitoUser.challengeName)
          // console.error('localCognitoUser: ', localCognitoUser)
          if (!localCognitoUser.signInUserSession) {
            setError(t('pages.auth-mfa-totp.invalid-code'))
          } else {
            onSignInSuccess(localCognitoUser)
          }
        }
      } catch (error) {
        console.error('verificationError', error)
        setError(t(`pages.auth-mfa.errors.${error.code}`))
      }
    }

    setLoading(false)
  }

  let title = 'pages.auth-mfa.title'
  if (challengeName === 'SOFTWARE_TOKEN_MFA') {
    title = 'pages.auth-mfa-totp.title'
  }

  if (!localCognitoUser)
    return (
      <Center>
        <Container maxWidth="sm">
          <Alert>Sorry, something went wrong, please try again.</Alert>
        </Container>
      </Center>
    )

  return (
    <AuthLayout i18nKey={title}>
      <form onSubmit={handleSubmit}>
        {error && <Alert my={4}>{error}</Alert>}
        <Box my={4}>
          {challengeName === 'SMS_MFA' && <Typography>{t('pages.auth-mfa.mfa-verification-sent')}</Typography>}
          {challengeName === 'SOFTWARE_TOKEN_MFA' && (
            <Typography>{t('pages.auth-mfa.totp-mfa-verification')}</Typography>
          )}
          {challengeName === 'CUSTOM_CHALLENGE' && (
            <Typography>{t('CUSTOM CHALLENGE')}</Typography>
            // TODO: No translation key!!!
          )}
        </Box>
        <Box my={4}>
          <TextField
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            autoFocus
            fullWidth
            InputProps={{ disableUnderline: true }}
            label={t('pages.auth-mfa.verification-code-placeholder')}
            onChange={e => setCode(e.currentTarget.value.toLowerCase().trim())}
            required
            value={code}
            variant="filled"
          />
        </Box>
        <Box alignItems="center" display="flex" my={4}>
          <Button disabled={loading} to="/" variant="text">
            {t('global.actions.cancel')}
          </Button>
          <Box ml="auto">
            <Button disabled={loading || code.length < 6} loading={loading} type="submit">
              {t('global.actions.submit')}
              <Icon inline name="arrow-right" />
            </Button>
          </Box>
        </Box>
        <Box>
          <strong>{t('pages.auth-mfa.having-problems')}</strong>
        </Box>
        <Link style={{ display: 'block' }} to="/account-recovery">
          {t('pages.auth-mfa.no-device-access')}
        </Link>
      </form>
    </AuthLayout>
  )
}
