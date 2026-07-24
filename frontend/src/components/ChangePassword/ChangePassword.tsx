import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { PasswordStrengthInput } from './PasswordStrengthInput'
import { Button, TextField, Typography } from '@mui/material'
import { useDispatch } from 'react-redux'
import { ConfirmButton } from '../../buttons/ConfirmButton'
import { Dispatch } from '../../store'
import { Gutters } from '../Gutters'

export const ChangePassword = () => {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isValid, setValid] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [key, setKey] = useState<number>(0)
  const { auth } = useDispatch<Dispatch>()
  const history = useHistory()

  const evaluateCurrentPassword = (e: { target: { value: React.SetStateAction<string> } }) => {
    setCurrentPassword(e.target.value.toString())
  }
  const updatePassword = async () => {
    setSaving(true)
    const success = await auth.changePassword({ currentPassword, password })
    setSaving(false)
    if (success) {
      setCurrentPassword('')
      setPassword('')
      setValid(false)
      setKey(k => k + 1)
    }
  }
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
                  {t('changePassword.noticeBefore', 'Changing your password will')} <b>{t('changePassword.noticeEmphasis', 'NOT')}</b>{' '}
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
