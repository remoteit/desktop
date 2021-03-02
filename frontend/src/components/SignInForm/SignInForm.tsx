import React, { useState, useEffect } from 'react'
import { CognitoUser } from '@remote.it/types'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { CognitoAuth } from '@remote.it/components'
import theme from '../../styling/theme'
import { CHECKBOX_REMEMBER_KEY } from '../../models/auth'

export function SignInForm() {
  const { signInError, authService, localUsername } = useSelector((state: ApplicationState) => state.auth)
  const [successUser, setSuccessUser] = useState<CognitoUser>()
  const { auth } = useDispatch<Dispatch>()

  useEffect(() => {
    auth.getUsernameLocal()
  }, [])

  useEffect(() => {
    if (successUser) auth.handleSignInSuccess(successUser)
  }, [successUser])

  const onClickCheckboxRemember = (checked) => {
    if (checked) {
      window.localStorage.setItem(KEY_CHECKBOX_REMEMBER, 'true')
    } else {
      window.localStorage.removeItem(KEY_CHECKBOX_REMEMBER)
    }
  }

  return (
    <CognitoAuth
      themeOverride={theme}
      onSignInSuccess={(user: CognitoUser) => setSuccessUser(user)}
      errorMessage={signInError}
      authService={authService}
      hideCaptcha={true}
      inputEmail={localUsername}
      showCheckboxRemember={true}
      onClickCheckboxRemember={onClickCheckboxRemember}
    />
  )
}
