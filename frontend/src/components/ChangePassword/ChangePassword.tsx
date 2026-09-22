import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { PasswordStrengthInput } from './PasswordStrengthInput'
import { Button, TextField, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { ConfirmButton } from '../../buttons/ConfirmButton'
import { Dispatch, State } from '../../store'
import { Gutters } from '../Gutters'
import { CodeStep } from '../MFA/steps'

export const ChangePassword = () => {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isValid, setValid] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [key, setKey] = useState<number>(0)
  const { auth } = useDispatch<Dispatch>()
  const passwordChallenge = useSelector((state: State) => state.auth.passwordChallenge)
  const [code, setCode] = useState<string>('')
  const history = useHistory()

  const evaluateCurrentPassword = (e: { target: { value: React.SetStateAction<string> } }) => {
    setCurrentPassword(e.target.value.toString())
  }
  const reset = () => {
    setCurrentPassword('')
    setPassword('')
    setCode('')
    setValid(false)
    setKey(k => k + 1)
  }
  const updatePassword = async () => {
    setSaving(true)
    const success = await auth.changePassword({ currentPassword, password })
    setSaving(false)
    if (success) reset()
  }
  const verifyCode = async () => {
    setSaving(true)
    const success = await auth.completePasswordChallenge(code)
    setSaving(false)
    if (success) reset()
    else setCode('')
  }

  // The credential store challenged (pool MFA): the change is staged server-side and
  // completes with the authenticator code — same proof the console relays.
  if (passwordChallenge)
    return (
      <>
        <Typography variant="subtitle1" gutterBottom>
          {t('changePassword.title', 'Change Password')}
        </Typography>
        <CodeStep
          prompt={
            <Typography variant="body2" gutterBottom>
              {passwordChallenge.hint
                ? t('mfa.relayHint', 'Enter the code sent to {{hint}}.', { hint: passwordChallenge.hint })
                : t(
                    'changePassword.mfaPrompt',
                    'Enter the 6-digit code from your authenticator to finish changing your password.'
                  )}
            </Typography>
          }
          code={code}
          onCode={setCode}
          busy={saving}
          onSubmit={verifyCode}
          onCancel={() => auth.set({ passwordChallenge: undefined })}
        />
      </>
    )

  return (
    <>
      <Typography variant="subtitle1" gutterBottom>
        {t('changePassword.title', 'Change Password')}
      </Typography>
      <Gutters key={key} sx={{ '.MuiTextField-root': { marginBottom: 2 } }}>
        <TextField
          fullWidth
          variant="filled"
          type="password"
          label={t('changePassword.currentPassword', 'Current Password')}
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
          title={t('common.save', 'Save')}
          variant="contained"
          color="primary"
          size="small"
          disabled={!isValid || saving}
          onClick={updatePassword}
          confirmProps={{
            title: t('changePassword.noticeTitle', 'Notice'),
            children: (
              <>
                <Typography variant="body2" gutterBottom>
                  {t('changePassword.noticeBefore', 'Changing your password will')}{' '}
                  <b>{t('changePassword.noticeEmphasis', 'NOT')}</b>{' '}
                  {t('changePassword.noticeAfter', 'automatically sign you out of other sessions.')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {t('changePassword.noticeSignOut', 'You can manually sign out from all sessions below.')}
                </Typography>
              </>
            ),
          }}
        />
        <Button size="small" onClick={() => history.goBack()}>
          {t('common.cancel', 'Cancel')}
        </Button>
      </Gutters>
    </>
  )
}

// <p>
//   You are signed in with your Google account. You can change your password in your Google account settings. If
//   you also have Remote.It login and password, you can sign in with those credentials and then change your
//   password.
// </p>
