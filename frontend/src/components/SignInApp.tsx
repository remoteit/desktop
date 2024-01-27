import React from 'react'
import { CognitoUser } from '../cognito/types'
import { CognitoAuth } from '../cognito/components/CognitoAuth'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'

export function SignInApp() {
  const { signInError, authService } = useSelector((state: State) => state.auth)
  const { auth } = useDispatch<Dispatch>()

  const onSignInSuccess = (user: CognitoUser) => {
    setTimeout(() => auth.handleSignInSuccess(user), 100)
  }

  if (!authService) return null

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
