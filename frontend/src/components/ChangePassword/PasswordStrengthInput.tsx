import zxcvbn from 'zxcvbn'
import React, { useState } from 'react'
import { makeStyles } from '@mui/styles'
import { Grid, TextField, Typography } from '@mui/material'
import { ProgressBar } from './ProgressBar'
import { Notice } from '../Notice'

export interface Props {
  onChange: (password: string, isValid: boolean) => void
}

export function PasswordStrengthInput({ onChange }: Props) {
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
      <Grid container wrap="nowrap">
        <Grid item>
          <TextField variant="filled" type="password" label="Enter new password" onChange={e => checkPassword(e)} />
        </Grid>
        <Grid item>
          <Typography variant="caption" display="block" className={css.caption} gutterBottom>
            Passwords must be 7-64 characters in length.
          </Typography>
        </Grid>
      </Grid>
      <TextField
        variant="filled"
        type="password"
        label="Confirm new password"
        onChange={e => checkPasswordConfirmation(e)}
      />
      {((password !== '' && !valid) || (passwordConfirmation != '' && !hasMatch)) && (
        <Notice severity="warning" fullWidth>
          Please fix the following problems
          {tooShort && <em>The password must be at least {PASSWORD_MIN_LENGTH} characters long.</em>}
          {tooLong && <em>The password must be no more than {PASSWORD_MAX_LENGTH} characters long.</em>}
          {passwordConfirmation != '' && !hasMatch && <em>The passwords do not match</em>}
        </Notice>
      )}
      {valid && (
        <ProgressBar
          description={`Password Strength: ${createPasswordStrengthLabel(checkTestedResult(password))}`}
          value={checkTestedResult(password) * 10}
        />
      )}
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  danger: {
    color: palette.error.main,
    fontSize: 11,
    marginBottom: 10,
  },
  caption: {
    minWidth: 150,
    paddingTop: 10,
  },
}))
