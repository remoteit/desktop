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
  onSuccess: (orignalNumber: string, newNumber: string) => void
}

export const MFAPhoneForm: React.FC<Props> = ({ onClose, onSuccess }) => {
  const css = useStyles()
  const { AWSUser, mfaMethod } = useSelector((state: ApplicationState) => ({
    AWSUser: state.auth.AWSUser,
    mfaMethod: state.mfa.mfaMethod,
  }))
  const { mfa } = useDispatch<Dispatch>()
  const originalPhone = AWSUser.phone_number
  const [phone, setPhone] = useState<string | undefined>(AWSUser && AWSUser.phone_number)
  const [validPhone, setValidPhone] = React.useState<boolean>(!!AWSUser.phone_number_verified)
  const country = 'us'
  const handleOnChange = (value, data, event) => {
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
    if (!originalPhone || !phone) {
      console.warn('No phone number to update', { originalPhone, phone })
      return
    }
    if (AWSUser.phone_number !== phone) {
      mfa.updatePhone({ originalPhone, phone })
    } else {
      onSuccess(originalPhone, phone)
    }
  }
  return (
    <>
      {AWSUser && AWSUser.phone_number_verified && AWSUser.phone_number && (
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
      {AWSUser && !AWSUser.phone_number && (
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
        {AWSUser.phone_number_verified && AWSUser.phone_number && AWSUser.phone_number === phone && (
          <Box className={css.success} p={1} mt={1}>
            Your mobile device is verified.
          </Box>
        )}
        <Box mt={3}>
          <Typography variant="caption" className={css.caption}>
            remote.it will only use this number for account security. Message and data rates may apply.
          </Typography>
        </Box>
        <Box mt={3}>
          <Button disabled={!validPhone} onClick={updateUsersPhone} color="primary" variant="contained">
            Submit
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </Box>
      </form>
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  caption: {
    fontWeight: 400,
    fontSize: 11,
    color: palette.grayDark.main,
  },
  success: {
    color: palette.success.main,
    fontWeight: 'bold',
  },
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
