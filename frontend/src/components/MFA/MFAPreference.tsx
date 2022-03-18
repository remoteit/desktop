import React, { useState } from 'react'
import { ApplicationState, Dispatch } from '../../store'
import { Box, Button, Typography, Chip, Divider } from '@material-ui/core'
import { useDispatch, useSelector } from 'react-redux'
import { MFASelectMethod } from './MFASelectMethod'
import { MFAConfigureApp } from './MFAConfigureApp'
import { MFAConfigureSms } from './MFAConfigureSms'
import { MFAMethod } from './MFAMethod'
import { Gutters } from '../Gutters'
import { Notice } from '../Notice'

export const MFAPreference: React.FC = () => {
  const { AWSPhone, AWSUser, mfaMethod, verificationCode, showMFASelection, showSMSConfig } = useSelector(
    (state: ApplicationState) => ({
      AWSPhone: state.auth.AWSUser.phone_number || '',
      AWSUser: state.auth.AWSUser,
      mfaMethod: state.mfa.mfaMethod,
      verificationCode: state.mfa.verificationCode,
      showMFASelection: state.mfa.showMFASelection,
      showSMSConfig: state.mfa.showSMSConfig,
    })
  )
  const { mfa } = useDispatch<Dispatch>()
  const [showEnableSelection, setShowEnableSelection] = useState<boolean>(mfaMethod === 'NO_MFA')
  const [showAuthenticatorConfig, setShowAuthenticatorConfig] = useState<boolean>(false)
  const [totpCode, setTotpCode] = React.useState<string | null>(null)
  const [totpVerified] = React.useState<boolean>(false)
  const [totpVerificationCode, setTotpVerificationCode] = React.useState<string>('')
  const [cancelShowVerificationCode, setCancelShowVerificationCode] = useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const [backupCode, setBackupCode] = React.useState<string>(AWSUser['custom:backup_code'] || '')
  const [loading, setLoading] = React.useState<boolean>(false)
  const [verificationMethod, setVerificationMethod] = React.useState<string>('sms')
  const [hasOldSentVerification, setHasOldSentVerification] = React.useState<boolean>(
    AWSUser && !AWSUser.phone_number_verified
  )

  const loadTotpCode = async () => setTotpCode(await mfa.getTotpCode())
  const setVerificationCode = (verificationCode: string) => mfa.set({ verificationCode })
  const setShowPhone = (showPhone: boolean) => mfa.set({ showPhone })
  const setShowMFASelection = (showMFASelection: boolean) => mfa.set({ showMFASelection })
  const setShowVerificationCode = (showVerificationCode: boolean) => mfa.set({ showVerificationCode })
  const setShowSMSConfig = (showSMSConfig: boolean) => mfa.set({ showSMSConfig })

  const sendVerifyTotp = event => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    mfa
      .verifyTotpCode(totpVerificationCode)
      .then(async (backupCode: string | boolean) => {
        if (typeof backupCode == 'string') {
          setBackupCode(backupCode)
          setShowAuthenticatorConfig(false)
        } else {
          setError('Invalid TOTP Code')
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const cancelTotp = event => {
    setError(null)
    setShowEnableSelection(true)
    setShowAuthenticatorConfig(false)
  }

  const successfulPhoneUpdate = async (orginalNumber, newNumber) => {
    setShowPhone(false)
    setVerificationCode('')
    if (AWSUser && AWSUser.phone_number_verified && orginalNumber === newNumber && mfaMethod !== 'SMS_MFA') {
      //no update to verified phone number, so just enable MFA
      const backupCode = await mfa.setMFAPreference('SMS_MFA')
      setBackupCode(backupCode)
      setShowSMSConfig(false)
    } else if (AWSUser && orginalNumber === newNumber && !AWSUser.phone_number_verified) {
      //not updating the phone but it needs to verify
      setHasOldSentVerification(true)
      setShowVerificationCode(true)
    } else {
      //new phone number and needs to verify
      setHasOldSentVerification(false)
      setShowVerificationCode(true)
    }
  }

  const sendVerifyPhone = event => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    mfa
      .verifyPhone(verificationCode)
      .then(async (backupCode: string) => {
        setVerificationCode('')
        setCancelShowVerificationCode(false)
        setHasOldSentVerification(false)
        setShowPhone(false)
        setShowVerificationCode(false)
        setBackupCode(backupCode)
      })
      .catch(error => {
        console.error(error)
        if (error instanceof Error) setError(error.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const resendCode = event => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    mfa
      .updatePhone(AWSPhone)
      .then(() => {
        setHasOldSentVerification(false)
        setVerificationCode('')
        setShowVerificationCode(true)
        setShowPhone(false)
        setCancelShowVerificationCode(true)
      })
      .catch(error => {
        console.error(error)
        if (error instanceof Error) setError(error.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const cancelEditPhone = () => {
    if (cancelShowVerificationCode) {
      setCancelShowVerificationCode(false)
      setShowPhone(false)
      setShowVerificationCode(true)
    } else {
      setShowPhone(false)
      setShowVerificationCode(false)
      setShowEnableSelection(true)
    }
  }

  const changeVerificationMethod = (type: any) => {
    setVerificationMethod(type)
  }

  const nextVerificationMethod = () => {
    if (verificationMethod === 'sms') {
      setShowMFASelection(false)
      setShowSMSConfig(true)
      setShowPhone(true)
    } else {
      loadTotpCode()
      setShowMFASelection(false)
      setShowAuthenticatorConfig(true)
    }
  }

  const turnOff = () => (
    <form
      onSubmit={e => {
        e.preventDefault()
        // console.log('Disable Software Token MFA')
        setShowEnableSelection(true)
        mfa.setMFAPreference('NO_MFA')
        setError(null)
      }}
    >
      <Box>
        <Button disabled={loading} type="submit" variant="outlined" color="primary">
          Turn off
        </Button>
      </Box>
    </form>
  )

  if (AWSUser && AWSUser.authProvider === 'Google') {
    return (
      <>
        <Typography variant="subtitle1">Two-factor Authentication</Typography>
        <Gutters bottom="xl">
          <Typography variant="body2">
            You are signed in with your Google account. You can enable two-factor authentication in your Google account
            settings. If you also have remote.it login and password, you can sign in with those credentials and then
            enable two-factor authentication.
          </Typography>
        </Gutters>
      </>
    )
  }

  if (AWSUser) {
    // let totp_code = await mfa.getTotpCode()
    return (
      <>
        <Typography variant="subtitle1">Two-factor Authentication</Typography>
        <Gutters bottom="xl">
          <Typography variant="body2" gutterBottom>
            Two-factor authentication adds an additional layer of security to your account by requiring more than just a
            password to sign in.
          </Typography>

          <Divider />

          <MFAMethod
            method={mfaMethod}
            phoneNumber={AWSPhone}
            backupCode={backupCode}
            verified={AWSUser.phone_number_verified}
            turnOff={turnOff}
          />

          {/* Show Enable Two-Factor*/}
          {mfaMethod === 'NO_MFA' && showEnableSelection && (
            <form
              onSubmit={e => {
                e.preventDefault()
                // startEnable()
                setShowEnableSelection(false)
                setShowMFASelection(true)
              }}
            >
              <Box mt={3}>
                <Typography variant="body2" gutterBottom>
                  Two-Factor Authentication is &nbsp;
                  <Chip label="OFF" size="small" variant="outlined" color="primary" />
                </Typography>
                <Button variant="contained" color="primary" type="submit">
                  Turn on
                </Button>
              </Box>
            </form>
          )}

          {/* Select Two-Factor Method */}
          {mfaMethod === 'NO_MFA' && showMFASelection && (
            <MFASelectMethod
              verificationMethod={verificationMethod}
              changeVerificationMethod={changeVerificationMethod}
              nextVerificationMethod={nextVerificationMethod}
              setShowEnableSelection={setShowEnableSelection}
              setShowMFASelection={setShowMFASelection}
            />
          )}
          {/* CONFIGURE Authenticator App */}
          {mfaMethod === 'NO_MFA' && showAuthenticatorConfig && (
            <MFAConfigureApp
              email={AWSUser.email}
              totpCode={totpCode}
              loadTotpCode={loadTotpCode}
              totpVerified={totpVerified}
              sendVerifyTotp={sendVerifyTotp}
              setTotpVerificationCode={setTotpVerificationCode}
              totpVerificationCode={totpVerificationCode}
              loading={loading}
              cancel={cancelTotp}
            />
          )}

          {/* CONFIGURE SMS */}
          {mfaMethod === 'NO_MFA' && showSMSConfig && (
            <MFAConfigureSms
              cancelEditPhone={cancelEditPhone}
              successfulPhoneUpdate={successfulPhoneUpdate}
              sendVerifyPhone={sendVerifyPhone}
              hasOldSentVerification={hasOldSentVerification}
              verificationCode={verificationCode}
              loading={loading}
              resendCode={resendCode}
              setCancelShowVerificationCode={setCancelShowVerificationCode}
            />
          )}

          {/* Display Error */}
          {error && <Notice severity="danger">{error}</Notice>}
        </Gutters>
      </>
    )
  }

  return null
}
