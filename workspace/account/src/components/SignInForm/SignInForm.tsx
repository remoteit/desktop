import React, { useState, useEffect } from 'react'
import { CognitoUser } from '@remote.it/types'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { CognitoAuth } from '@remote.it/components'
import theme from '../../styling/theme'
import { SEGMENT_PROJECT_KEY } from '../../helpers/analyticsHelper'
import { CLIENT_ID } from '../../constants'

export function SignInForm() {
  const { signInError, authService, localUsername } = useSelector((state: ApplicationState) => state.auth)
  const appVersion = '0.0.1'//useSelector((state: ApplicationState) => state.binaries.version)
  const [successUser, setSuccessUser] = useState<CognitoUser>()
  const [rememberMe, setRememberMe] = useState<boolean>(false)
  const { auth } = useDispatch<Dispatch>()

 

  useEffect(() => {
    if (successUser) auth.handleSignInSuccess(successUser)
  }, [successUser])

  const onClickCheckboxRemember = (checked: any) => {
  
  }

  const segmentSettings = {
      segmentKey: 'ACCOUNT',
      segmentAppName: SEGMENT_PROJECT_KEY,
      appVersion
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
      checkedCheckboxRemember={rememberMe}
      segmentSettings={segmentSettings}
      clientId={CLIENT_ID}
      showLogo={false}
      fullWidth={true}
    />
  )
}
