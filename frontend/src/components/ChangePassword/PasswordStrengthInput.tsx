import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import zxcvbn from 'zxcvbn'
import { Box, Grid, makeStyles, TextField, Typography } from '@material-ui/core'
import { ProgressBar } from './ProgressBar'

export interface Props {
  isNewPassword?: boolean
  onChange: (password: string, isValid: boolean) => void
}

export function PasswordStrengthInput({ isNewPassword, onChange }: Props) {
  const { t } = useTranslation()
  const PASSWORD_MIN_LENGTH = Number(process.env.PASSWORD_MIN_LENGTH)
  const PASSWORD_MAX_LENGTH = Number(process.env.PASSWORD_MAX_LENGTH)
  const [password, setPassword] = useState<string>('')
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('')
  const [valid, setValid] = useState<boolean>(false)
  const [tooShort, setTooShort] = useState<boolean>(true)
  const [tooLong, setTooLong] = useState<boolean>(false)
  const [hasMatch, setHasMatch] = useState<boolean>(false)
  const css = useStyles()

  const checkTestedResult = (pass: string) => {
    return zxcvbn(pass).score
  }

  const checkTooShort = (pass: string) => {
    const value = (pass && pass.length) < PASSWORD_MIN_LENGTH
    setTooShort(value)
    return value
  }
  const checkTooLong = (pass: string) => {
    const value = (pass && pass.length) > PASSWORD_MAX_LENGTH
    setTooLong(value)
    return value
  }


  const checkMatches = (pass: string, passConfirm: string) => {
    const value = pass !== '' && passConfirm !== '' && pass === passConfirm
    setHasMatch(value)
    return value
  }
  const checkPasswordConfirmation = (e: any) => {
    setPasswordConfirmation(e.target.value)
    const isValid = checkValid(password)
    const isMatching = checkMatches(password, e.target.value)
    sendChange(password, isValid && isMatching)
  }
  const checkPassword = (e: any) => {
    setPassword(e.target.value)
    const isValid = checkValid(e.target.value)
    const isMatching = checkMatches(e.target.value, passwordConfirmation)
    sendChange(password, isValid && isMatching)
  }
  const createPasswordStrengthLabel = (score: any) => {
    switch (score) {
      case 0:
        return 'Very Weak'
      case 1:
        return 'Weak'
      case 2:
        return 'Fair'
      case 3:
        return 'Good'
      case 4:
        return 'Strong'
      default:
        return 'Very Weak'
    }
  }

  const checkValid = (pass: string) => {
    const isValid = !checkTooShort(pass) && !checkTooLong(pass)
    setValid(isValid)
    return isValid
  }

  const sendChange = (pass: string, isValid: boolean) => {
    onChange(pass, isValid)
  }
  return (
    <>
      <div className={css.mBottom}>

        {((password !== '' && !valid) ||
          (passwordConfirmation != '' && !hasMatch)) && (
            <div className={css.danger}>
              Please fix the following problems:
              <ul>
                {tooShort && (
                  <li>
                    The password must be at least {{ PASSWORD_MIN_LENGTH }} characters long.
                  </li>
                )}
                {tooLong && (
                  <li>
                    The password must be no more than {{ PASSWORD_MAX_LENGTH }} characters long.
                  </li>
                )}

                {passwordConfirmation != '' && !hasMatch && (
                  <li>
                    The passwords do not match
                  </li>
                )}
              </ul>
            </div>
          )}
        <div className="meter">

          <Box mb={0}>
            <Grid container wrap="nowrap" >
              <Grid item >
                <TextField variant='filled' type="password" label="Enter new password" className={css.input} onChange={e => checkPassword(e)} />
              </Grid>
              <Grid item >
                <Typography variant="caption" display="block" className={css.caption} gutterBottom>Passwords must be 7-64 characters in length.</Typography>
              </Grid>
            </Grid>


          </Box>
          <div>
            {valid && (
              <>
                <ProgressBar description={`Password Strength: ${createPasswordStrengthLabel(checkTestedResult(password))}`} value={checkTestedResult(password) * 10} />
              </>
            )}
          </div>
        </div>
      </div>

      <Box mb={4}>
        <TextField variant="filled" type="password" label="Confirm new password" className={css.input} />
      </Box>
    </>
  )
}

const useStyles = makeStyles({
  mBottom: {
    marginBottom: 'var(--spacing-lg)!important',
  },
  danger: {
    color: 'var(--color-danger)!important',
    fontSize: 11,
    marginBottom: 10
  },
  input: {
    minWidth: 350,
  },
  caption: {
    minWidth: 150,
    paddingTop: 15
  }
})
