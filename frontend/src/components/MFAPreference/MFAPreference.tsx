import React, { useEffect, useState } from 'react'
import { ApplicationState, Dispatch } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, Typography, Chip } from '@material-ui/core'
import { MFASelectMethod } from './MFASelectMethod'
import { MFAConfigureApp } from './MFAConfigureApp'
import { MFAConfigureSms } from './MFAConfigureSms'
import { TextBlock } from '../TextBlock'
import { MFAMethod } from './MFAMethod'
import { Alert } from '../Alert'
import analyticsHelper from '../../helpers/analyticsHelper'

export const MFAPreference: React.FC = () => {
  const {
    AWSUser,
    mfaMethod,
    verificationCode,
    showMFASelection,
    showSMSConfig,
    lastCode,
    totpVerificationCode,
    showAuthenticatorConfig,
    showEnableSelection,
    error,
  } = useSelector((state: ApplicationState) => ({
    AWSUser: state.auth.AWSUser,
    mfaMethod: state.mfa.mfaMethod,
    verificationCode: state.mfa.verificationCode,
    showMFASelection: state.mfa.showMFASelection,
    showSMSConfig: state.mfa.showSMSConfig,
    lastCode: state.mfa.lastCode,
    totpVerificationCode: state.mfa.totpVerificationCode,
    showAuthenticatorConfig: state.mfa.showAuthenticatorConfig,
    showEnableSelection: state.mfa.showEnableSelection,
    error: state.mfa.error,
  }))
  const { mfa } = useDispatch<Dispatch>()
  const [cancelShowVerificationCode, setCancelShowVerificationCode] = useState<boolean>(false)
  const [backupCode, setBackupCode] = useState<string>(AWSUser['custom:backup_code'] || '')
  const [showLearnMore, setShowLearnMore] = useState<boolean>(false)
  const [verificationMethod, setVerificationMethod] = useState<string>('sms')
  const [hasOldSentVerification, setHasOldSentVerification] = useState<boolean>(
    AWSUser && !AWSUser.phone_number_verified
  )

  useEffect(() => {
    analyticsHelper.page('mfaMethod')
    mfa.getAuthenticatedUserInfo()
  }, [])

  const loadLastCode = async () => {
    mfa.getLastCode()
    setLastCode(lastCode)
  }
  const setShowEnableSelection = (showEnableSelection: boolean) => mfa.set({ showEnableSelection })
  const setShowAuthenticatorConfig = (showAuthenticatorConfig: boolean) => mfa.set({ showAuthenticatorConfig })
  const setTotpVerificationCode = (totpVerificationCode: string) => mfa.set({ totpVerificationCode })
  const setError = (error: string | null) => mfa.set({ error })
  const setLastCode = (lastCode: string | null) => mfa.set({ lastCode })
  const setVerificationCode = (verificationCode: string) => mfa.set({ verificationCode })
  const setShowPhone = (showPhone: boolean) => mfa.set({ showPhone })
  const setShowMFASelection = (showMFASelection: boolean) => mfa.set({ showMFASelection })
  const setShowVerificationCode = (showVerificationCode: boolean) => mfa.set({ showVerificationCode })
  const setShowSMSConfig = (showSMSConfig: boolean) => mfa.set({ showSMSConfig })

  const sendVerifyTotp = event => {
    event.preventDefault()
    setError(null)
    mfa.verifyTopCode(totpVerificationCode)
  }

  const successfulPhoneUpdate = async (orginalNumber, newNumber) => {
    setShowPhone(false)
    setVerificationCode('')
    if (AWSUser && AWSUser.phone_number_verified && orginalNumber === newNumber && mfaMethod !== 'SMS_MFA') {
      //no update to verified phone number, so just enable MFA
      const backupCode = await mfa.setMFAPreference('SMS_MFA')
      // setBackupCode(backupCode) // uncomment if we have a backup code
      console.log('IS THERE A BACKUP CODE? -> ', backupCode)
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

  const sendVerifyPhone = async event => {
    event.preventDefault()
    setError(null)
    try {
      const backupCode = await mfa.verifyPhone(verificationCode)
      setVerificationCode('')
      setCancelShowVerificationCode(false)
      setHasOldSentVerification(false)
      setShowPhone(false)
      setShowVerificationCode(false)
      console.log('IS THERE A BACKUP CODE? -> ', backupCode)
      // setBackupCode(backupCode) // uncomment if we have a backup code
    } catch (error) {
      console.error(error)
      if (error instanceof Error) setError(error.message)
    }
  }

  const resendCode = async event => {
    console.log('resendCode: ', { event })
    event.preventDefault()
    setError(null)
    try {
      await mfa.updatePhone(AWSUser.phone_number)
      setHasOldSentVerification(false)
      setVerificationCode('')
      setShowVerificationCode(true)
      setShowPhone(false)
      setCancelShowVerificationCode(true)
    } catch (error) {
      console.error(error)
      if (error instanceof Error) setError(error.message)
    }
  }

  const cancelEditPhone = () => {
    if (cancelShowVerificationCode) {
      setCancelShowVerificationCode(false)
      setShowPhone(false)
      setShowVerificationCode(true)
    } else {
      setShowPhone(false)
      setShowVerificationCode(false)
    }
  }

  const toggleShowLearnMore = event => {
    event.preventDefault()
    setShowLearnMore(!showLearnMore)
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
      loadLastCode()
      setShowMFASelection(false)
      setShowAuthenticatorConfig(true)
    }
  }

  const turnOff = () => {
    return (
      <>
        <form
          onSubmit={e => {
            e.preventDefault()
            setShowEnableSelection(true)
            mfa.setMFAPreference('NO_MFA')
            setError(null)
          }}
        >
          <Box mt={0}>
            <Button type="submit" variant="outlined" style={{ borderRadius: 3 }} color="primary">
              TURN OFF
            </Button>
          </Box>
        </form>
      </>
    )
  }

  if (AWSUser && AWSUser.authProvider === 'Google')
    return (
      <Box m={4}>
        <Typography variant="subtitle1">Two-factor Authentication</Typography>
        <TextBlock>
          You are signed in with your Google account. You can enable two-factor authentication in your Google account
          settings. If you also have remote.it login and password, you can sign in with those credentials and then
          enable two-factor authentication.
        </TextBlock>
      </Box>
    )

  if (AWSUser)
    return (
      <Box m={4}>
        <Typography variant="subtitle1" style={{ padding: 0 }}>
          Two-factor Authentication
        </Typography>
        <p>
          Two-factor authentication adds an additional layer of security to your account by requiring more than just a
          password to sign in. <a onClick={toggleShowLearnMore}>{showLearnMore ? 'Close' : 'Learn more'}</a>
        </p>

        <MFAMethod
          method={mfaMethod}
          phoneNumber={AWSUser.phone_number?.toString()}
          backupCode={backupCode}
          verified={AWSUser.phone_number_verified}
          turnOff={turnOff}
        />

        {/* Show Enable Two-Factor*/}
        {mfaMethod === 'NO_MFA' && showEnableSelection && (
          <form
            onSubmit={e => {
              e.preventDefault()
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
            lastCode={lastCode || ''}
            loadLastCode={loadLastCode}
            totpVerified={false}
            sendVerifyTotp={sendVerifyTotp}
            setTotpVerificationCode={setTotpVerificationCode}
            totpVerificationCode={totpVerificationCode}
            setShowEnableSelection={setShowEnableSelection}
            setShowAuthenticatorConfig={setShowAuthenticatorConfig}
          />
        )}

        {/* CONFIGURE SMS */}
        {mfaMethod === 'NO_MFA' && showSMSConfig && (
          <MFAConfigureSms
            cancelEditPhone={cancelEditPhone}
            setShowEnableSelection={setShowEnableSelection}
            successfulPhoneUpdate={successfulPhoneUpdate}
            sendVerifyPhone={sendVerifyPhone}
            hasOldSentVerification={hasOldSentVerification}
            verificationCode={verificationCode}
            resendCode={resendCode}
            setCancelShowVerificationCode={setCancelShowVerificationCode}
          />
        )}

        {/* Display Error */}
        {error && (
          <Alert className="my-md" type="danger">
            {error}
          </Alert>
        )}
      </Box>
    )

  return null
}
