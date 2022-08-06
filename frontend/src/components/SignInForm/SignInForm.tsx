import React, { useState, useEffect } from 'react'
import { CognitoUser } from '../../cognito/types'
import { CognitoAuth } from '../../cognito/components/CognitoAuth'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { CHECKBOX_REMEMBER_KEY } from '../../models/auth'

export function SignInForm() {
  const { signInError, authService, localUsername } = useSelector((state: ApplicationState) => state.auth)
  const [rememberMe, setRememberMe] = useState<boolean>(false)
  const { auth } = useDispatch<Dispatch>()

  useEffect(() => {
    auth.getUsernameLocal()
    const remember = window.localStorage.getItem(CHECKBOX_REMEMBER_KEY)
    setRememberMe(!!remember)
  }, [])

  const onClickCheckboxRemember = checked => {
    setRememberMe(!!checked)
    if (checked) {
      window.localStorage.setItem(CHECKBOX_REMEMBER_KEY, 'true')
    } else {
      window.localStorage.removeItem(CHECKBOX_REMEMBER_KEY)
    }
  }

  const onSignInSuccess = (user: CognitoUser) => {
    setTimeout(() => auth.handleSignInSuccess(user), 100)
  }

  return (
    <CognitoAuth
      fullWidth
      hideCaptcha
      showCheckboxRemember
      checkedCheckboxRemember={rememberMe}
      onClickCheckboxRemember={onClickCheckboxRemember}
      inputEmail={localUsername}
      authService={authService}
      errorMessage={signInError}
      onSignInSuccess={onSignInSuccess}
    />
  )
}
