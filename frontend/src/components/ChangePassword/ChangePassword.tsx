import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PasswordStrengthInput } from './PasswordStrengthInput'
import { Box, Button, makeStyles, TextField, Typography } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'



export const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isValidPassword, setIsValidPassword] = useState<boolean>(false)
  const { auth } = useDispatch<Dispatch>()
  const css = useStyles()


  const setPasswordValidation = (password: React.SetStateAction<string>, valid: boolean | ((prevState: boolean) => boolean)) => {
    setPassword(password)
    setIsValidPassword(valid)
  }
  const evaluateCurrentPassword = (e: { target: { value: React.SetStateAction<string> } }) => {
    setCurrentPassword(e.target.value)
  }
  const updatePassword = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    auth.changePassword({ currentPassword: currentPassword, password: password })
      .catch(error => {
        console.error(error)
      })
  }
  return (
    <Box m={4}>
      {false ? (
        <p>You are signed in with your Google account. You can change your password in your Google account settings. If you also have remote.it login and password, you can sign in with those credentials and then change your password.</p>
      ) : (
        <form style={{ maxWidth: '360px' }} onSubmit={updatePassword}>
          <Typography variant="subtitle1" gutterBottom style={{ padding: 0 }}>
            Change Password
          </Typography>
          <Typography variant="subtitle1" className={css.subtitle} gutterBottom>
            Current Password
          </Typography>
          <Box mb={0}>
            <TextField
              variant='filled'
              type="password"
              label="Enter current password"
              className={css.input}
              onChange={e => evaluateCurrentPassword(e)}
            />
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

const useStyles = makeStyles( ({ palette }) => ({
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
    color: palette.grayDark.main,
    fontSize: 9
  }
}))