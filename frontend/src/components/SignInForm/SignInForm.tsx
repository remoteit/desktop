import React, { useState, useEffect } from 'react'
import { AuthUser } from '@remote.it/types'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { CognitoAuth } from '@remote.it/components'
import theme from '../../styling/theme'

export function SignInForm() {
  const { signInError, authService } = useSelector((state: ApplicationState) => state.auth)
  const [successUser, setSuccessUser] = useState<AuthUser>()
  const { auth } = useDispatch<Dispatch>()

  useEffect(() => {
    if (successUser) auth.handleSignInSuccess(successUser)
  }, [successUser])

  return (
    <CognitoAuth
      themeOverride={theme}
      onSignInSuccess={(user: AuthUser) => setSuccessUser(user)}
      errorMessage={signInError}
      authService={authService}
    />
  )
}
