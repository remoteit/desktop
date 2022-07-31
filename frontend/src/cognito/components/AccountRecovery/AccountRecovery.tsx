import { Box, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../Alert'
import { AuthLayout } from '../AuthLayout'
import { BannerNotices } from '../BannerNotices'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { VerifyRecoveryCodeFunc, SignInFunc } from '../../types'

export type AccountRecoveryProps = {
  onVerifyRecoveryCode: VerifyRecoveryCodeFunc
  onSignIn: SignInFunc
  email: string
  fullWidth?: boolean
}

export function AccountRecovery({
  onSignIn,
  onVerifyRecoveryCode,
  email,
  fullWidth,
}: AccountRecoveryProps): JSX.Element {
  const { t } = useTranslation()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [sentEmailVerifyRequest, setSentEmailVerifyRequest] = useState<boolean>(false)
  const [emailVerificationCode, setEmailVerificationCode] = useState<string>('')
  const [recoveryCode, setRecoveryCode] = useState<string>('')

  async function handleSendEmailVerifyRequest(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    if (!email) return

    setError('')
    setLoading(true)

    try {
      const challenge = await onSignIn(email)
      console.log('SIGN IN RETURNED')
      console.log('Challenge:')
      console.log(challenge)
      if (challenge && challenge.includes('CUSTOM_CHALLENGE')) {
        console.log('setSentEmail')
        setSentEmailVerifyRequest(true)
      }
    } catch (localError) {
      // console.log('Error: ')
      // console.log(error)
      setError(localError.message)
    }

    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    if (!email) return

    setError('')
    setLoading(true)

    try {
      const result = await onVerifyRecoveryCode(emailVerificationCode, recoveryCode)
      if (result.error) {
        setError(result.error.message)
      } else {
        window.location.href = '/#devices'
      }
    } catch (error) {
      setError(t(`pages.auth-mfa.errors.${error.code}`))
    }

    setLoading(false)
  }

  if (!email) return <></>
  console.log('sentEmailVerifyRequest:')
  console.log(sentEmailVerifyRequest)

  return (
    <>
      <AuthLayout i18nKey="pages.account-recovery.title" fullWidth={fullWidth}>
        {sentEmailVerifyRequest ? (
          <>
            <form onSubmit={handleSubmit}>
              {error && <Alert my={4}>{error}</Alert>}
              <Box my={4}>{t('pages.account-recovery.description')}</Box>
              <Box my={2}>
                <TextField
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  autoFocus
                  disabled={loading}
                  fullWidth
                  id="verification-code"
                  // maxLength={6}
                  label={t('pages.account-recovery.email-recovery-code-placeholder')}
                  onChange={e => setEmailVerificationCode(e.currentTarget.value.trim())}
                  InputProps={{ disableUnderline: true }}
                  required
                  value={emailVerificationCode}
                  variant="filled"
                />
              </Box>
              <Box my={2}>
                <TextField
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  disabled={loading}
                  fullWidth
                  id="recovery-code"
                  // maxLength={36}
                  label={t('pages.account-recovery.recovery-code-placeholder')}
                  onChange={e => setRecoveryCode(e.currentTarget.value.trim())}
                  InputProps={{ disableUnderline: true }}
                  required
                  value={recoveryCode}
                  variant="filled"
                />
              </Box>
              <Box my={4} textAlign="right">
                <Button
                  disabled={loading || emailVerificationCode.length < 6 || recoveryCode.length < 36}
                  loading={loading}
                  type="submit"
                >
                  {t('global.actions.submit')}
                  <Icon inline name="arrow-right" />
                </Button>
              </Box>
            </form>
            <SupportRecoveryRequest />
          </>
        ) : (
          <>
            <form onSubmit={handleSendEmailVerifyRequest}>
              <Box mt={4}>
                <Typography>{t('pages.account-recovery.account-recovery-code')} </Typography>
              </Box>
              <Box mb={4} mt={2}>
                <Button loading={loading} type="submit">
                  {t('pages.account-recovery.start-recovery')}
                </Button>
              </Box>
            </form>
            <Box my={4}>
              <SupportRecoveryRequest />
            </Box>
          </>
        )}
      </AuthLayout>
    </>
  )
}

function SupportRecoveryRequest(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Box>
      <Box my={2}>
        <Typography>
          <strong>{t('pages.account-recovery.lost-recovery-code-heading')}</strong>
        </Typography>
      </Box>
      <Typography>{t('pages.account-recovery.lost-recovery-code')}</Typography>
      <Box mt={2}>
        <Button
          href={encodeURI(
            'mailto:support@remote.it?subject=Recover my remote.it account&body=Please reset my account preferences.\n\nI no longer have access to the recovery code and the mobile device to receive verification codes.'
          )}
        >
          {t('pages.account-recovery.lost-recovery-code-button')}
        </Button>
      </Box>
    </Box>
  )
}
