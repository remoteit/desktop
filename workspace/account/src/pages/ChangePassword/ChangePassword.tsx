import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '../../components/Input'
import { TextBlock } from '../../components/TextBlock'
import { PasswordStrengthInput } from '../../components/PasswordStrengthInput'
import { Section } from '../../components/Section'
import { Button, Typography } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { Alerts } from '../../components/Alert'



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
    <Section title="Change Password">
      {false ? (
        <TextBlock>{t('pages.change-password.is-google-user')}</TextBlock>
      ) : (
        <form style={{ maxWidth: '360px' }} onSubmit={updatePassword}>
          {error && (
            <Alerts
              type="danger"
              stayOpen={true}
            >
              {error} 
            </Alerts>
          )}
          {message && (
            <Alerts
              type="info"
              stayOpen={true}
            >
              {message}
            </Alerts>
          )}
          <Typography variant="subtitle2" gutterBottom>
            Current Password
          </Typography>
          <Input
            block
            type="password"
            placeholder="Enter current password"
          />
          <Typography variant="subtitle2" gutterBottom>
            New Password
          </Typography>
          <PasswordStrengthInput
            onChange={(password: React.SetStateAction<string>, valid: boolean | ((prevState: boolean) => boolean)) =>
              setPasswordValidation(password, valid)
            }
            isNewPassword={true}
          />
          <Button variant="contained" color="primary" type="submit" >
            SAVE
          </Button>
          <Button color="default">
            CANCEL
          </Button>
        </form>
      )}
    </Section>
  )
}
