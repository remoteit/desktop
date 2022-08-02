import React, { useState } from 'react'
import { makeStyles } from '@mui/styles'
import { useTranslation } from 'react-i18next'
import { Box, TextField, Typography } from '@mui/material'
import zxcvbn from 'zxcvbn'

const PASSWORD_MIN_LENGTH = process.env.PASSWORD_MIN_LENGTH ? Number(process.env.PASSWORD_MIN_LENGTH) : 7
const PASSWORD_MAX_LENGTH = process.env.PASSWORD_MAX_LENGTH ? Number(process.env.PASSWORD_MAX_LENGTH) : 64

export type Props = {
  isNewPassword?: boolean
  onChange: (password: string, isValid: boolean) => void
}

export function PasswordStrengthInput({ isNewPassword, onChange }: Props): JSX.Element {
  const { t } = useTranslation()
  const css = useStyles()
  const [password, setPassword] = useState<string>('')
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('')
  const [valid, setValid] = useState<boolean>(false)
  const [tooShort, setTooShort] = useState<boolean>(true)
  const [tooLong, setTooLong] = useState<boolean>(false)
  // const [hasDigit, setHasDigit] = useState<boolean>(true)
  // const [hasLower, setHasLower] = useState<boolean>(true)
  // const [hasUpper, setHasUpper] = useState<boolean>(true)
  // const [hasSpecialChar, setHasSpecialChar] = useState<boolean>(true)
  const [hasMatch, setHasMatch] = useState<boolean>(false)

  // const passwordSpecialChars = '^$*.[]{}()?-"!@#%&/,><\':;|_~'

  function checkTestedResult(pass: string): zxcvbn.ZXCVBNScore {
    return zxcvbn(pass).score
  }

  function checkTooShort(pass: string): boolean {
    const value = (pass && pass.length) < PASSWORD_MIN_LENGTH
    setTooShort(value)
    return value
  }

  function checkTooLong(pass: string): boolean {
    const value = (pass && pass.length) > PASSWORD_MAX_LENGTH
    setTooLong(value)
    return value
  }

  // function checkHasDigit(pass: string): boolean {
  //   const value = /(.*\d+.*)/g.test(pass)
  //   setHasDigit(value)
  //   return value
  // }

  // function checkHasLower(pass: string): boolean {
  //   const value = /(.*[a-z]+.*)/g.test(pass)
  //   setHasLower(value)
  //   return value
  // }

  // function checkHasUpper(pass: string): boolean {
  //   const value = /(.*[A-Z]+.*)/g.test(pass)
  //   setHasUpper(value)
  //   return value
  // }

  // function checkHasSpecialChar(pass: string): boolean {
  //   const value = /(.*[$*.{}?"!@#%&/,><\':;|_~`^\]\[\)\(]+.*)/g.test(pass)
  //   setHasSpecialChar(value)
  //   return value
  // }

  function checkMatches(pass: string, passConfirm: string): boolean {
    const value = pass !== '' && passConfirm !== '' && pass === passConfirm
    setHasMatch(value)
    return value
  }

  function checkPasswordConfirmation(e: React.SyntheticEvent<any, Event>): void {
    const val = e.currentTarget.value
    setPasswordConfirmation(val)
    const isValid = checkValid(password)
    const isMatching = checkMatches(password, val)
    sendChange(password, isValid && isMatching)
  }

  function handlePasswordChange(e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>): void {
    const val = e.currentTarget.value
    setPassword(val)
    const isValid = checkValid(val)
    const isMatching = checkMatches(val, passwordConfirmation)
    sendChange(password, isValid && isMatching)
  }

  function createPasswordStrengthLabel(score: number): string {
    switch (score) {
      case 0:
        return t('pages.forgot-password-verify.password-strength-score.0')
      case 1:
        return t('pages.forgot-password-verify.password-strength-score.1')
      case 2:
        return t('pages.forgot-password-verify.password-strength-score.2')
      case 3:
        return t('pages.forgot-password-verify.password-strength-score.3')
      case 4:
        return t('pages.forgot-password-verify.password-strength-score.4')
      default:
        return t('pages.forgot-password-verify.password-strength-score.0')
    }
  }

  //Check full validation disabled for now
  // function checkValid(pass: string): boolean {
  //   const isValid =
  //     !checkTooShort(pass) &&
  //     !checkTooLong(pass) &&
  //     checkHasDigit(pass) &&
  //     checkHasLower(pass) &&
  //     checkHasUpper(pass) &&
  //     checkHasSpecialChar(pass)
  //   setValid(isValid)
  //   return isValid
  // }

  function checkValid(pass: string): boolean {
    const isValid = !checkTooShort(pass) && !checkTooLong(pass)
    setValid(isValid)
    return isValid
  }

  function sendChange(pass: string, isValid: boolean): void {
    onChange(pass, isValid)
  }

  const error = password && !valid
  const confirmError = passwordConfirmation != '' && !hasMatch

  return (
    <>
      <Box mb={1}>
        <TextField
          aria-label={t('global.user.password')}
          autoComplete="off"
          fullWidth
          label={t(`global.user.${isNewPassword ? 'new-' : ''}password-placeholder`)}
          onChange={handlePasswordChange}
          type="password"
          variant="filled"
          error={!!error}
          InputProps={{ disableUnderline: true }}
          helperText={
            error ? (
              <Typography variant="caption">
                {tooShort &&
                  t('pages.forgot-password-verify.password-error.too-short', {
                    min_length: PASSWORD_MIN_LENGTH,
                  })}
                {tooLong &&
                  t('pages.forgot-password-verify.password-error.too-long', {
                    max_length: PASSWORD_MAX_LENGTH,
                  })}
                {/* {!hasDigit && (
                      t(
                        'pages.forgot-password-verify.password-error.missing-number'
                      )}
                  )}
                  {!hasLower && (
                      t(
                        'pages.forgot-password-verify.password-error.missing-lower'
                      )}
                  )}
                  {!hasUpper && (
                      t(
                        'pages.forgot-password-verify.password-error.missing-upper'
                      )}
                  )}
                  {!hasSpecialChar && (
                      t(
                        'pages.forgot-password-verify.password-error.missing-special-char'
                      )}
                      <code className="bg-gray-ListItemghter px-xs py-xxs special-chars">
                        ${passwordSpecialChars.spListItemt('').join(' ')}
                      </code>
                  )} */}
              </Typography>
            ) : (
              t('pages.forgot-password-verify.password-rules-reduced', {
                min_length: PASSWORD_MIN_LENGTH,
                max_length: PASSWORD_MAX_LENGTH,
              })
            )
          }
        />
      </Box>
      <Box mb={1}>
        <TextField
          aria-label={t('global.user.password-confirm')}
          fullWidth
          label={t(`global.user.${isNewPassword ? 'new-' : ''}password-confirm-placeholder`)}
          onChange={e => checkPasswordConfirmation(e)}
          type="password"
          variant="filled"
          InputProps={{ disableUnderline: true }}
          error={!!confirmError}
          helperText={confirmError ? t('pages.forgot-password-verify.password-error.passwords-do-not-match') : ' '}
        />
      </Box>
      <Box className={css.meter + (!!password || valid ? '' : ' ' + css.disabled)} mb={2}>
        <progress
          className={`password-strength-meter strength-${checkTestedResult(password)}`}
          max="4"
          value={checkTestedResult(password)}
        />
        <Typography variant="caption">
          <label className="password-strength-meter-label">
            {t('pages.forgot-password-verify.password-strength-html', {
              strength: createPasswordStrengthLabel(checkTestedResult(password)),
            })}
          </label>
        </Typography>
      </Box>
      {/* <Box
            bgcolor={colors.grayLightest}
            color={colors.grayDarker}
            component="code"
            fontFamily="mono"
            fontSize={12}
            px={1}
            py={0.5}
          >
            {passwordSpecialChars.split('').join(' ')}
          </Box> */}
    </>
  )
}

const useStyles = makeStyles({
  meter: { textAlign: 'right', height: 40, '& progress': { width: '100%' } },
  disabled: { opacity: 0.3 },
})
