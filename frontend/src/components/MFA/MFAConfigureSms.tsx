import React from 'react'
import { Link } from '../Link'
import { Notice } from '../Notice'
import { MFAPhoneForm } from './MFAPhoneForm'
import { Box, Button, TextField, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { State, Dispatch } from '../../store'

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
  const { showPhone, showVerificationCode } = useSelector((state: State) => state.mfa)
  const AWSUser = useSelector((state: State) => state.auth.AWSUser)
  const AWSPhone = AWSUser.phone_number || ''
  const { t } = useTranslation()
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
                  {t(
                    'mfaConfigureSms.previouslySent',
                    'A verification code had previously been sent to your mobile device.'
                  )}{' '}
                  <em>
                    {t(
                      'mfaConfigureSms.previouslySentHint',
                      'A code is only valid for 24 hours. Please request the code again if it has been over 24 hours since requested.'
                    )}
                  </em>
                </>
              ) : (
                <>
                  {t('mfaConfigureSms.sent', { phone: AWSPhone, defaultValue: 'A verification code has been sent to your mobile device. {{phone}}' })}
                  <em>{t('mfaConfigureSms.sentHint', 'This code is only valid for 24 hours.')}</em>
                </>
              )}
            </Notice>
            <Box mt={3} mb={3} display="flex" alignItems="center">
              <TextField
                autoCorrect="off"
                autoCapitalize="none"
                autoComplete="off"
                required
                label={t('mfaConfigureSms.verificationCode', 'Verification Code')}
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
                {loading ? t('mfaConfigureSms.confirming', 'Confirming...') : t('mfaConfigureSms.confirm', 'Confirm')}
              </Button>
              <Button onClick={cancelEditPhone}>{t('common.cancel', 'Cancel')}</Button>
            </Box>
          </form>
          <Typography variant="caption">
            {t('mfaConfigureSms.didNotReceive', "Didn't receive the verification code?")}
            <Link onClick={resendCode}>{t('mfaConfigureSms.resendCode', 'Resend Verification Code')}</Link>{' '}
            {t('common.or', 'or')}
            <Link
              onClick={() => {
                mfa.set({ showPhone: true, showVerificationCode: false })
                setCancelShowVerificationCode(true)
              }}
            >
              {t('mfaConfigureSms.changePhoneNumber', 'Change your verification phone number')}
            </Link>
          </Typography>
        </>
      )}
    </>
  )
}
