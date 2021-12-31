import React, { useState } from 'react'
import { ApplicationState } from '../../store'
import { useTranslation } from 'react-i18next'
import { connect } from 'react-redux'
import { startsWith } from 'lodash'
import 'react-phone-input-2/lib/material.css'
import PhoneInput from 'react-phone-input-2'
import { Typography, makeStyles, Button, Box } from '@material-ui/core'
import { colors } from '../../styling'

export interface Props {
  onClose: () => void
  onSuccess: (orignalNumber, newNumber) => void
}
export type MFAPhoneProps = Props & ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

const mapState = (state: ApplicationState) => ({
  AWSUser: state.auth.AWSUser,
  mfaMethod: state.auth.mfaMethod,
})

const mapDispatch = (dispatch: any) => ({
  updatePhone: dispatch.auth.updatePhone,
  checkSession: dispatch.auth.checkSession,
})
export const MFAPhoneForm = connect(
  mapState,
  mapDispatch
)(({ AWSUser, mfaMethod, updatePhone, onClose, onSuccess }: MFAPhoneProps) => {
  const { t } = useTranslation()
  const css = useStyles()
  const originalPhone = AWSUser.phone_number
  const [phone, setPhone] = useState<string | undefined>(AWSUser && AWSUser.phone_number)
  const [validPhone, setValidPhone] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
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
    if (AWSUser.phone_number !== phone) {
      setError(null)
      setMessage(null)
      console.log('Update phone number')
      updatePhone(phone)
        .then(() => {
          onSuccess(originalPhone, phone)
        })
        .catch(error => {
          console.error(error)
          setError(t(`pages.auth-mfa.errors.${error.code}`))
        })
    } else {
      onSuccess(originalPhone, phone)
    }
  }
  return (
    <>
      {error && <div className="danger my-md fw-bold">{error}</div>}
      {message && <div className="success my-md fw-bold">{message}</div>}
      {AWSUser && AWSUser.phone_number_verified && AWSUser.phone_number && (
        <>
          {mfaMethod === 'SMS_MFA' && (
            <div className="warning my-md fw-bold">Updating your mobile device number will disable two-factor authentication until the number is verified.</div>
          )}
          <Box m={2}>Update your mobile device number and send verification code.</Box>
        </>
      )}
      {AWSUser && !AWSUser.phone_number && (
        <Box m={2}>
          <b>Enter your mobile number so we can send you the verification code</b>
        </Box>
      )}
      <form>
        <Box mt={3}>
          <PhoneInput
            value={phone}
            enableSearch
            country={country}
            preserveOrder={['preferredCountries', 'onlyCountries']}
            preferredCountries={['us', 'jp']}
            searchPlaceholder='Search'
            placeholder='Enter your mobile number'
            onChange={(value, data, event) => {
              handleOnChange(value, data, event)
            }}
            inputProps={{
              required: true,
            }}
          />
        </Box>
        {AWSUser.phone_number_verified && AWSUser.phone_number && AWSUser.phone_number === phone && (
          <Box className={css.success}>Your mobile device is verified.</Box>
        )}
        <Box mt={3}>
          <Typography variant="caption" className={css.caption}>
            remote.it will only use this number for account security. Message and data rates may apply.
          </Typography>
        </Box>
        <Box mt={3}>
          <Button
            disabled={phone === '' || !validPhone}
            onClick={e => {
              updateUsersPhone(e)
            }}
            color='primary'
            variant='contained'
            style={{ borderRadius: 3 }}
          >
            Submit
          </Button>
          <Button onClick={onClose} >
            Cancel
          </Button>
        </Box>
      </form>
    </>
  )
})

const useStyles = makeStyles({
  caption: {
    fontWeight: 400,
    fontSize: 11,
    color: '#999',
  },
  modalMessage: {
    backgroundColor: '#fef4e5',
    padding: 11,
    display: 'flex',
    borderRadius: 4,
    fontSize: 14,
    color: '#efa831',
    marginBottom: 10,
  },
  message: {
    color: '#693e03',
  },
  icon: {
    marginRight: 12,
    padding: '7px 0',
    display: 'flex',
    fontSize: '22px',
    opacity: '0.9',
  },
  success: {
    backgroundColor: colors.success
  }
})
