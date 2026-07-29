import { MuiTelInput, matchIsValidTel } from 'mui-tel-input'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../../store'
import { Typography, Button, Box } from '@mui/material'
import { Notice } from '../Notice'

export interface Props {
  onClose: () => void
  onSuccess: (orignalNumber, newNumber) => void
}

export const MFAPhoneForm: React.FC<Props> = ({ onClose, onSuccess }) => {
  const { t } = useTranslation()
  const AWSUser = useSelector((state: State) => state.auth.AWSUser)
  const mfaMethod = useSelector((state: State) => state.mfa.mfaMethod)
  const { mfa } = useDispatch<Dispatch>()
  const AWSPhone = AWSUser.phone_number || ''
  const originalPhone = AWSUser.phone_number
  const [phone, setPhone] = useState<string>(AWSPhone)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false)

  const updateUsersPhone = event => {
    event.preventDefault()
    if (AWSUser.phone_number !== phone) {
      setError(null)
      setMessage(null)
      setLoading(true)
      mfa
        .updatePhone(phone)
        .then(() => {
          onSuccess(originalPhone, phone)
        })
        .catch(error => {
          console.error(error)
          setError(error.message)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      onSuccess(originalPhone, phone)
    }
  }
  return (
    <Box mt={4}>
      {error && (
        <Notice severity="error" fullWidth>
          {error}
        </Notice>
      )}
      {message && (
        <Notice severity="success" fullWidth>
          {message}
        </Notice>
      )}
      {AWSUser && AWSUser.phone_number_verified && AWSPhone && (
        <>
          {mfaMethod === 'SMS_MFA' && (
            <Notice severity="warning" fullWidth>
              {t(
                'mfaPhoneForm.disableWarning',
                'Updating your mobile device number will disable two-factor authentication until the number is verified.'
              )}
            </Notice>
          )}
          <Typography variant="h3" gutterBottom>
            {t('mfaPhoneForm.updateTitle', 'Update your mobile device number and send verification code.')}
          </Typography>
        </>
      )}
      {AWSUser && !AWSPhone && (
        <Typography variant="h3" gutterBottom>
          {t('mfaPhoneForm.enterTitle', 'Enter your mobile number so we can send you the verification code')}
        </Typography>
      )}
      {AWSUser.phone_number_verified && AWSPhone === phone && (
        <Notice severity="success" fullWidth gutterBottom>
          {t('mfaPhoneForm.verified', 'Your mobile device is verified.')}
        </Notice>
      )}
      <form onSubmit={updateUsersPhone}>
        <Box mt={3}>
          <MuiTelInput
            required
            label={t('mfaPhoneForm.phoneLabel', 'Phone')}
            variant="filled"
            value={phone}
            defaultCountry="US"
            error={!!error}
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiInputBase-input': { paddingLeft: 0 } }}
            onChange={value => setPhone(value)}
          />
        </Box>
        <Box mt={1}>
          <Typography variant="caption">
            {t(
              'mfaPhoneForm.disclaimer',
              'We will only use this number for account security. Message and data rates may apply.'
            )}
          </Typography>
        </Box>
        <Box mt={3}>
          <Button disabled={!matchIsValidTel(phone)} variant="contained" type="submit" color="primary">
            {loading ? t('mfaPhoneForm.sending', 'Sending...') : t('mfaPhoneForm.submit', 'Submit')}
          </Button>
          <Button onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
        </Box>
      </form>
    </Box>
  )
}
