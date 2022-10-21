import React from 'react'
import { CognitoUser } from '../../cognito/types'
import { CognitoAuth } from '../../cognito/components/CognitoAuth'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'

export function SignInForm() {
  const { signInError, authService } = useSelector((state: ApplicationState) => state.auth)
  const { auth } = useDispatch<Dispatch>()

  const onSignInSuccess = (user: CognitoUser) => {
    setTimeout(() => auth.handleSignInSuccess(user), 100)
  }

  return (
    <CognitoAuth
      fullWidth
      hideCaptcha
      authService={authService}
      errorMessage={signInError}
      onSignInSuccess={onSignInSuccess}
    />
  )
}
