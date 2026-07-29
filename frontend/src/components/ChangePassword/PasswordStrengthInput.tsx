import zxcvbn from 'zxcvbn'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '../../constants'
import { TextField } from '@mui/material'
import { ProgressBar } from './ProgressBar'
import { Notice } from '../Notice'

export interface Props {
  onChange: (password: string, isValid: boolean) => void
}

export function PasswordStrengthInput({ onChange }: Props) {
  const { t } = useTranslation()
  const [password, setPassword] = useState<string>('')
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('')
  const [valid, setValid] = useState<boolean>(false)
  const [tooShort, setTooShort] = useState<boolean>(true)
  const [tooLong, setTooLong] = useState<boolean>(false)
  const [hasMatch, setHasMatch] = useState<boolean>(false)

  const checkTestedResult = (pass: string) => {
    return zxcvbn(pass).score
  }

  const checkTooShort = (pass: string) => {
    const value = (pass ? pass.length : 0) < PASSWORD_MIN_LENGTH
    setTooShort(value)
    return value
  }

  const checkTooLong = (pass: string) => {
    const value = (pass ? pass.length : 0) > PASSWORD_MAX_LENGTH
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
        return t('passwordStrengthInput.veryWeak', 'Very Weak')
      case 1:
        return t('passwordStrengthInput.weak', 'Weak')
      case 2:
        return t('passwordStrengthInput.fair', 'Fair')
      case 3:
        return t('passwordStrengthInput.good', 'Good')
      case 4:
        return t('passwordStrengthInput.strong', 'Strong')
      default:
        return t('passwordStrengthInput.veryWeak', 'Very Weak')
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
      <TextField
        variant="filled"
        type="password"
        label={t('passwordStrengthInput.enterNewPassword', 'Enter new password')}
        helperText={t('passwordStrengthInput.helperText', 'Password must be 7-64 characters in length.')}
        onChange={e => checkPassword(e)}
        fullWidth
      />
      <TextField
        fullWidth
        variant="filled"
        type="password"
        label={t('passwordStrengthInput.confirmNewPassword', 'Confirm new password')}
        onChange={e => checkPasswordConfirmation(e)}
      />
      {((password !== '' && !valid) || (passwordConfirmation != '' && !hasMatch)) && (
        <Notice severity="warning" fullWidth>
          {t('passwordStrengthInput.fixProblems', 'Please fix the following problems')}
          {tooShort && (
            <em>
              {t('passwordStrengthInput.tooShort', {
                minLength: PASSWORD_MIN_LENGTH,
                defaultValue: 'The password must be at least {{minLength}} characters long.',
              })}
            </em>
          )}
          {tooLong && (
            <em>
              {t('passwordStrengthInput.tooLong', {
                maxLength: PASSWORD_MAX_LENGTH,
                defaultValue: 'The password must be no more than {{maxLength}} characters long.',
              })}
            </em>
          )}
          {passwordConfirmation != '' && !hasMatch && (
            <em>{t('passwordStrengthInput.noMatch', 'The passwords do not match')}</em>
          )}
        </Notice>
      )}
      {valid && (
        <ProgressBar
          description={t('passwordStrengthInput.strengthDescription', {
            strength: createPasswordStrengthLabel(checkTestedResult(password)),
            defaultValue: 'Password Strength: {{strength}}',
          })}
          value={checkTestedResult(password) * 10}
        />
      )}
    </>
  )
}
