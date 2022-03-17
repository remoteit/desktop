import React, { useEffect, useState } from 'react'
import { ApplicationState, Dispatch } from '../../store'
import { Alert } from '../Alert'
import { useTranslation } from 'react-i18next'
import { connect, useDispatch, useSelector } from 'react-redux'
import { TextBlock } from '../TextBlock'
import { MFAMethod } from './MFAMethod'
import { MFASelectMethod } from './MFASelectMethod'
import { MFAConfigureApp } from './MFAConfigureApp'
import { MFAConfigureSms } from './MFAConfigureSms'
import { Box, Button, Typography, Chip } from '@material-ui/core'
import analyticsHelper from '../../helpers/analyticsHelper'

export type MFASectionProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

const mapState = (state: ApplicationState) => ({
  AWSUser: state.auth.AWSUser,
  mfaMethod: state.mfa.mfaMethod,
})

const mapDispatch = (dispatch: any) => ({
  verifyPhone: dispatch.mfa.verifyPhone,
  updatePhone: dispatch.mfa.updatePhone,
  setMFAPreference: dispatch.mfa.setMFAPreference,
  checkSession: dispatch.mfa.checkSession,
  getLastCode: dispatch.mfa.getLastCode,
  verifyTopCode: dispatch.mfa.verifyTopCode,
})
export const MFAPreference = connect(
  mapState,
  mapDispatch
)(
  ({
    AWSUser,
    mfaMethod,
    verifyPhone,
    updatePhone,
    setMFAPreference,
    getLastCode,
    verifyTopCode,
    checkSession,
  }: MFASectionProps) => {
    const { t } = useTranslation()
    const { mfa } = useDispatch<Dispatch>()
    const [totpVerified] = React.useState<boolean>(false)
    const [cancelShowVerificationCode, setCancelShowVerificationCode] = useState<boolean>(false)
    const [backupCode, setBackupCode] = React.useState<string>(AWSUser['custom:backup_code'] || '')
    const [hasOldSentVerification, setHasOldSentVerification] = React.useState<boolean>(
      AWSUser && !AWSUser.phone_number_verified
    )
    const [showLearnMore, setShowLearnMore] = React.useState<boolean>(false)
    const [verificationMethod, setVerificationMethod] = React.useState<string>('sms')
    const {
      verificationCode,
      showMFASelection,
      showSMSConfig,
      lastCode,
      totpVerificationCode,
      error,
      showAuthenticatorConfig,
      showEnableSelection,
    } = useSelector((state: ApplicationState) => ({
      verificationCode: state.mfa.verificationCode,
      showMFASelection: state.mfa.showMFASelection,
      showSMSConfig: state.mfa.showSMSConfig,
      lastCode: state.mfa.lastCode,
      totpVerificationCode: state.mfa.totpVerificationCode,
      error: state.mfa.error,
      showAuthenticatorConfig: state.mfa.showAuthenticatorConfig,
      showEnableSelection: state.mfa.showEnableSelection,
    }))

    useEffect(() => {
      analyticsHelper.page('mfaMethod')
      mfa.getAuthenticatedUserInfo()
    }, [])

    const loadLastCode = async () => {
      mfa.getLastCode()
      setLastCode(lastCode)
    }

    const setPreferences = (preference: string) => setMFAPreference(preference)

    const setShowEnableSelection = (param: boolean) => {
      mfa.set({ showEnableSelection: param })
    }

    const setShowAuthenticatorConfig = (param: boolean) => {
      mfa.set({ showAuthenticatorConfig: param })
    }

    const setTotpVerificationCode = (param: string) => {
      mfa.set({ totpVerificationCode: param })
    }

    const setError = (param: string | null) => {
      mfa.set({ error: param })
    }

    const setLastCode = (param: string | null) => {
      mfa.set({ lastCode: param })
    }

    const setVerificationCode = (param: string) => {
      mfa.set({ verificationCode: param })
    }

    const setShowPhone = (param: boolean) => {
      mfa.set({ showPhone: param })
    }

    const setShowMFASelection = (param: boolean) => {
      mfa.set({ showMFASelection: param })
    }

    const setShowVerificationCode = (param: boolean) => {
      mfa.set({ showVerificationCode: param })
    }

    const setShowSMSConfig = (param: boolean) => {
      mfa.set({ showSMSConfig: param })
    }

    const sendVerifyTotp = event => {
      event.preventDefault()
      setError(null)
      verifyTopCode(totpVerificationCode)
    }

    const successfulPhoneUpdate = async (orginalNumber, newNumber) => {
      setShowPhone(false)
      setVerificationCode('')
      if (AWSUser && AWSUser.phone_number_verified && orginalNumber === newNumber && mfaMethod !== 'SMS_MFA') {
        //no update to verified phone number, so just enable MFA
        const backupCode = await setMFAPreference('SMS_MFA')
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
      verifyPhone(verificationCode)
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
          setError(t(`pages.auth-mfa.errors.${error.code}`))
        })
    }

    const resendCode = event => {
      console.log('resendCode: ', { event })
      event.preventDefault()
      setError(null)
      updatePhone(AWSUser.phone_number)
        .then(() => {
          setHasOldSentVerification(false)
          setVerificationCode('')
          setShowVerificationCode(true)
          setShowPhone(false)
          setCancelShowVerificationCode(true)
        })
        .catch(error => {
          console.error(error)
          setError(t(`pages.auth-mfa.errors.${error.code}`))
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
              setPreferences('NO_MFA')
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

    if (AWSUser && AWSUser.authProvider === 'Google') {
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
    } else if (AWSUser) {
      return (
        <Box m={4}>
          <Typography variant="subtitle1" style={{ padding: 0 }}>
            Two-factor Authentication
          </Typography>
          <p>
            Two-factor authentication adds an additional layer of security to your account by requiring more than just a
            password to sign in. <a onClick={toggleShowLearnMore}>{showLearnMore ? `Close` : `Learn more`}</a>
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
              totpVerified={totpVerified}
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
    } else {
      checkSession()
      return <></>
    }
  }
)
