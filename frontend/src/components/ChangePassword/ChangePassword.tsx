import React, { useState } from 'react'
import { makeStyles } from '@mui/styles'
import { useHistory } from 'react-router-dom'
import { PasswordStrengthInput } from './PasswordStrengthInput'
import { Button, TextField, Typography } from '@mui/material'
import { useDispatch } from 'react-redux'
import { ConfirmButton } from '../../buttons/ConfirmButton'
import { Dispatch } from '../../store'
import { Gutters } from '../Gutters'
import { spacing } from '../../styling'

export const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isValid, setValid] = useState<boolean>(false)
  const { auth } = useDispatch<Dispatch>()
  const history = useHistory()
  const css = useStyles()

  const evaluateCurrentPassword = (e: { target: { value: React.SetStateAction<string> } }) => {
    setCurrentPassword(e.target.value.toString())
  }
  const updatePassword = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    auth.changePassword({ currentPassword: currentPassword, password: password })
  }
  return (
    <>
      <Typography variant="subtitle1" gutterBottom>
        Change Password
      </Typography>
      <form onSubmit={updatePassword} className={css.form}>
        <Gutters>
          <TextField
            fullWidth
            variant="filled"
            type="password"
            label="Current Password"
            onChange={e => evaluateCurrentPassword(e)}
          />
          <PasswordStrengthInput
            onChange={(password: string, isValid: boolean) => {
              setPassword(password)
              setValid(isValid)
            }}
          />
        </Gutters>
        <Gutters bottom="xl">
          <ConfirmButton
            confirm
            title="Save"
            variant="contained"
            color="primary"
            type="submit"
            size="small"
            disabled={!isValid}
            confirmProps={{
              title: 'Notice',
              children: (
                <>
                  <Typography variant="body2" gutterBottom>
                    Changing your password will <b>NOT</b> automatically sign you out of other sessions.
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    You can manually sign out from all sessions below.
                  </Typography>
                </>
              ),
            }}
          />
          <Button size="small" onClick={() => history.goBack()}>
            Cancel
          </Button>
        </Gutters>
      </form>
    </>
  )
}

const useStyles = makeStyles({
  form: {
    maxWidth: 422,
    '& .MuiTextField-root': { marginRight: spacing.lg, marginBottom: spacing.sm },
  },
})

// <p>
//   You are signed in with your Google account. You can change your password in your Google account settings. If
//   you also have Remote.It login and password, you can sign in with those credentials and then change your
//   password.
// </p>
