import React from 'react'
import { Link } from '../Link'
import { Notice } from '../Notice'
import { MFAPhoneForm } from './MFAPhoneForm'
import { Box, Button, TextField, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'

type Props = {
  cancelEditPhone: () => void
  successfulPhoneUpdate: (orginalNumber: any, newNumber: any) => Promise<void>
  sendVerifyPhone: (event: any) => void
  hasOldSentVerification: boolean
  verificationCode: string
  loading: boolean
  resendCode: (event: any) => void
  setCancelShowVerificationCode: (event: any) => void
}

export const MFAConfigureSms: React.FC<Props> = ({
  cancelEditPhone,
  successfulPhoneUpdate,
  sendVerifyPhone,
  hasOldSentVerification,
  verificationCode,
  loading,
  resendCode,
  setCancelShowVerificationCode,
}) => {
  const { mfa } = useDispatch<Dispatch>()
  const { showPhone, showVerificationCode, AWSPhone } = useSelector((state: ApplicationState) => ({
    showPhone: state.mfa.showPhone,
    showVerificationCode: state.mfa.showVerificationCode,
    AWSPhone: state.auth.AWSUser.phone_number || '',
  }))
  return (
    <>
      {showPhone && (
        <MFAPhoneForm
          onClose={() => {
            cancelEditPhone()
            mfa.set({ showSMSConfig: false })
          }}
          onSuccess={successfulPhoneUpdate}
        />
      )}
      {showVerificationCode && (
        <>
          <form onSubmit={sendVerifyPhone}>
            <Notice severity="success" gutterTop fullWidth>
              {hasOldSentVerification ? (
                <>
                  A verification code had previously been sent to your mobile device.{' '}
                  <em>
                    A code is only valid for 24 hours. Please request the code again if it has been over 24 hours since
                    requested.
                  </em>
                </>
              ) : (
                <>
                  A verification code has been sent to your mobile device. {AWSPhone}
                  <em>This code is only valid for 24 hours.</em>
                </>
              )}
            </Notice>
            <Box mt={3} mb={3} display="flex" alignItems="center">
              <TextField
                autoCorrect="off"
                autoCapitalize="none"
                autoComplete="off"
                required
                label="Verification Code"
                variant="filled"
                onChange={e => mfa.set({ verificationCode: e.currentTarget.value.trim() })}
                value={verificationCode}
              />
              &nbsp; &nbsp;
              <Button
                disabled={verificationCode === '' || verificationCode.length < 6}
                variant="contained"
                color="primary"
                type="submit"
              >
                {loading ? 'Confirming...' : 'Confirm'}
              </Button>
              <Button onClick={cancelEditPhone}>Cancel</Button>
            </Box>
          </form>
          <Typography variant="caption">
            Didn't receive the verification code?
            <Link onClick={resendCode}>Resend Verification Code</Link> or
            <Link
              onClick={() => {
                mfa.set({ showPhone: true, showVerificationCode: false })
                setCancelShowVerificationCode(true)
              }}
            >
              Change your verification phone number
            </Link>
          </Typography>
        </>
      )}
    </>
  )
}
