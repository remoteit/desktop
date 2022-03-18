import 'react-phone-input-2/lib/material.css'
import PhoneInput from 'react-phone-input-2'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, makeStyles, Button, Box } from '@material-ui/core'
import { startsWith } from 'lodash'
import { Notice } from '../Notice'

export interface Props {
  onClose: () => void
  onSuccess: (orignalNumber, newNumber) => void
}

export const MFAPhoneForm: React.FC<Props> = ({ onClose, onSuccess }) => {
  const css = useStyles()
  const { AWSPhone, AWSUser, mfaMethod } = useSelector((state: ApplicationState) => ({
    AWSPhone: state.auth.AWSUser.phone_number || '',
    AWSUser: state.auth.AWSUser,
    mfaMethod: state.mfa.mfaMethod,
  }))
  const { mfa } = useDispatch<Dispatch>()
  const originalPhone = AWSUser.phone_number
  const [phone, setPhone] = useState<string>(AWSPhone)
  const [validPhone, setValidPhone] = React.useState<boolean>(!!AWSPhone)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false)
  const country = 'us'
  const handleOnChange = (value, data) => {
    const newValue = value.replace(/[^0-9]+/g, '')

    if (newValue !== '' && startsWith(newValue, data.dialCode)) {
      setValidPhone(true)
    } else {
      setValidPhone(false)
    }
    if (phone !== newValue) {
      setPhone('+' + newValue)
    }
  }
  const updateUsersPhone = event => {
    event.preventDefault()
    if (AWSUser.phone_number !== phone) {
      setError(null)
      setMessage(null)
      setLoading(true)
      // console.log('Update phone number')
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
      {error && <Notice severity="danger">{error}</Notice>}
      {message && <Notice severity="success">{message}</Notice>}
      {AWSUser && AWSUser.phone_number_verified && AWSPhone && (
        <>
          {mfaMethod === 'SMS_MFA' && (
            <Notice severity="warning">
              Updating your mobile device number will disable two-factor authentication until the number is verified.
            </Notice>
          )}
          <Typography variant="h3" gutterBottom>
            Update your mobile device number and send verification code.
          </Typography>
        </>
      )}
      {AWSUser && !AWSPhone && (
        <Typography variant="h3" gutterBottom>
          Enter your mobile number so we can send you the verification code
        </Typography>
      )}
      <form>
        <Box mt={3} className={css.phone}>
          <PhoneInput
            value={phone}
            enableSearch
            country={country}
            preserveOrder={['preferredCountries', 'onlyCountries']}
            preferredCountries={['us', 'jp']}
            searchPlaceholder="Search"
            placeholder="Enter your mobile number"
            onChange={handleOnChange}
            inputProps={{ required: true }}
          />
        </Box>
        {AWSUser.phone_number_verified && AWSPhone === phone && (
          <Notice severity="success">Your mobile device is verified.</Notice>
        )}
        <Box mt={3}>
          <Typography variant="caption">
            We will only use this number for account security. Message and data rates may apply.
          </Typography>
        </Box>
        <Box mt={3}>
          <Button disabled={phone === '' || !validPhone} variant="contained" onClick={updateUsersPhone} color="primary">
            {loading ? 'Updating...' : 'Submit'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </Box>
      </form>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  phone: {
    '& .react-tel-input .form-control': {
      backgroundColor: palette.white.main,
      color: palette.grayDarkest.main,
      borderColor: palette.grayLight.main,
    },
    '& .react-tel-input .form-control:hover': { borderColor: palette.primary.main },
    '& .react-tel-input .special-label': { backgroundColor: palette.white.main, color: palette.grayDarkest.main },
    '& .react-tel-input .country-list': {
      backgroundColor: palette.grayLightest.main,
      color: palette.grayDarkest.main,
      maxHeight: 400,
    },
    '& .react-tel-input .country-list .search': { backgroundColor: palette.grayLightest.main },
    '& .react-tel-input .country-list .search-box': {
      color: palette.grayDarkest.main,
      borderColor: palette.grayLight.main,
      backgroundColor: palette.grayLightest.main,
    },
    '& .react-tel-input .country-list .divider': { borderBottomColor: palette.grayLight.main },
    '& .react-tel-input .country-list .country.highlight': {
      backgroundColor: palette.primaryHighlight.main,
      color: palette.grayDarkest.main,
    },
    '& .react-tel-input .country-list .country:hover': {
      backgroundColor: palette.primaryHighlight.main,
      color: palette.grayDarkest.main,
    },
  },
}))
