import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextBlock } from '../../components/TextBlock'
import { PasswordStrengthInput } from './PasswordStrengthInput'
import { Box, Button, makeStyles, TextField, Typography } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { Alert } from '../Alert'
import { colors } from '../../styling'



export const ChangePassword = () => {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isValidPassword, setIsValidPassword] = useState<boolean>(false)
  const [disabled, setDisabled] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const { t } = useTranslation()
  const { auth } = useDispatch<Dispatch>()
  const css = useStyles()


  const setPasswordValidation = (password: React.SetStateAction<string>, valid: boolean | ((prevState: boolean) => boolean)) => {
    setPassword(password)
    setIsValidPassword(valid)
    setDisabled(valid && currentPassword !== '')
  }
  const evaluateCurrentPassword = (e: { target: { value: React.SetStateAction<string> } }) => {
    setCurrentPassword(e.target.value)
    setDisabled(isValidPassword && e.target.value !== '')
  }
  const updatePassword = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setLoading(true)
    auth.changePassword({ currentPassword: currentPassword, password: password })
      .then(() => {
        setMessage('Password Changed Successfully')
      })
      .catch(error => {
        console.error(error)
        setError(t(`pages.change-password.errors.${error.code}`))
      })
      .finally(() => {
        setLoading(false)
      })
  }
  return (
    <Box m={4}>
      {false ? (
        <TextBlock>{t('pages.change-password.is-google-user')}</TextBlock>
      ) : (
        <form style={{ maxWidth: '360px' }} onSubmit={updatePassword}>
          {error && (
            <Alert
              type="danger"
            >
              {error}
            </Alert>
          )}
          {message && (
            <Alert
              type="info"
            >
              {message}
            </Alert>
          )}
          <Typography variant="subtitle1" gutterBottom style={{ padding: 0 }}>
            Change Password
          </Typography>
          <Typography variant="subtitle1" className={css.subtitle} gutterBottom>
            Current Password
          </Typography>
          <Box mb={0}>
            <TextField variant='filled' type="password" label="Enter current password" className={css.input} />
          </Box>
          <Typography variant="subtitle1" className={css.subtitle} gutterBottom>
            New Password
          </Typography>
          <PasswordStrengthInput
            onChange={(password: React.SetStateAction<string>, valid: boolean | ((prevState: boolean) => boolean)) =>
              setPasswordValidation(password, valid)
            }
            isNewPassword={true}
          />
          <Button variant="contained" color="primary" type="submit" className={css.button} >
            SAVE
          </Button>
          <Button color="default" className={css.button}>
            CANCEL
          </Button>
        </form>
      )}
    </Box>
  )
}

const useStyles = makeStyles({
  input: {
    // fontSize: 10,
    minWidth: 350,
  },
  button: {
    borderRadius: 3
  },
  subtitle: {
    margin: 0,
    padding: 0,
    color: colors.grayDark,
    fontSize: 9
  }
})