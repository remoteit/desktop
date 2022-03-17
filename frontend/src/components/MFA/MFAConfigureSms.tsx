import React from 'react'
import { Icon } from '../Icon'
import { MFAPhoneForm } from './MFAPhoneForm'
import { Box, Button, Input, makeStyles } from '@material-ui/core'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'

type Props = {
  cancelEditPhone: () => void
  setShowEnableSelection: (event: any) => void
  successfulPhoneUpdate: (orginalNumber: any, newNumber: any) => Promise<void>
  sendVerifyPhone: (event: any) => void
  hasOldSentVerification: boolean
  verificationCode: string
  resendCode: (event: any) => void
  setCancelShowVerificationCode: (event: any) => void
}

export const MFAConfigureSms: React.FC<Props> = ({
  cancelEditPhone,
  setShowEnableSelection,
  successfulPhoneUpdate,
  sendVerifyPhone,
  hasOldSentVerification,
  verificationCode,
  resendCode,
  setCancelShowVerificationCode,
}) => {
  const css = useStyles()
  const { mfa } = useDispatch<Dispatch>()
  const { showPhone, showVerificationCode, phone_number } = useSelector((state: ApplicationState) => ({
    showPhone: state.mfa.showPhone,
    showVerificationCode: state.mfa.showVerificationCode,
    phone_number: state.auth.AWSUser.phone_number,
  }))
  return (
    <>
      {showPhone && (
        <MFAPhoneForm
          onClose={() => {
            cancelEditPhone()
            setShowEnableSelection(true)
            mfa.set({ showSMSConfig: false })
          }}
          onSuccess={successfulPhoneUpdate}
        />
      )}
      {showVerificationCode && (
        <>
          <div>
            <form onSubmit={sendVerifyPhone} style={{ maxWidth: '360px' }}>
              <div className={css.modalMessage}>
                <Icon name="info-circle" className={css.icon} fixedWidth size="md" />
                <div className={css.message}>
                  {hasOldSentVerification
                    ? `A verification code had previously been sent to your mobile device. A code is only valid for 24 hours; please request the code again if it has been over 24 hours since requested.`
                    : `A verification code has been sent to your mobile device. ${phone_number?.toString()} This code is only valid for 24 hours.`}
                </div>
              </div>

              <Box mt={3} mb={3}>
                <Input
                  autoCorrect="off"
                  autoCapitalize="none"
                  autoComplete="off"
                  required
                  onChange={e => mfa.set({ verificationCode: e.currentTarget.value.trim() })}
                  value={verificationCode}
                  style={{ marginRight: 3 }}
                  placeholder="Enter verification code"
                />
                <Button
                  disabled={verificationCode === '' || verificationCode.length < 6}
                  type="submit"
                  color="primary"
                  variant="contained"
                  style={{ borderRadius: 3 }}
                >
                  Submit
                </Button>
              </Box>
            </form>
            <Box mt={2}>
              Didn't receive the verification code?{' '}
              <a onClick={resendCode} data-force-resend="true">
                Resend Verification Code
              </a>
            </Box>
          </div>
          <Box mt={3}>
            <a
              onClick={() => {
                mfa.set({
                  showPhone: true,
                  showVerificationCode: false,
                })
                setCancelShowVerificationCode(true)
              }}
            >
              Change your verification phone number
            </a>
          </Box>
        </>
      )}
    </>
  )
}

const useStyles = makeStyles({
  modalMessage: {
    backgroundColor: '#e9f6fd',
    padding: 11,
    display: 'flex',
    borderRadius: 4,
    fontSize: 14,
    color: '#3aa1db',
    marginBottom: 10,
    minWidth: 500,
    marginTop: 10,
  },
  message: {
    color: '',
    fontWeight: 500,
  },
  icon: {
    marginRight: 12,
  },
})
