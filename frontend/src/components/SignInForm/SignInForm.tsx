import React, { useState, useEffect } from 'react'
import { CognitoUser } from '@remote.it/types'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { CognitoAuth } from '@remote.it/components'
import { CHECKBOX_REMEMBER_KEY } from '../../models/auth'
import { SEGMENT_PROJECT_KEY, SEGMENT_PROJECT_PORTAL_KEY } from '../../shared/constants'
import { isPortal } from '../../services/Browser'

export function SignInForm() {
  const { signInError, authService, localUsername } = useSelector((state: ApplicationState) => state.auth)
  const { appVersion, theme } = useSelector((state: ApplicationState) => ({
    appVersion: state.binaries.version,
    theme: state.ui.theme,
  }))
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

  const segmentSettings = {
    segmentKey: 'DESKTOP',
    segmentAppName: isPortal() ? SEGMENT_PROJECT_PORTAL_KEY : SEGMENT_PROJECT_KEY,
    appVersion,
  }

  const onSignInSuccess = (user: CognitoUser) => {
    setTimeout(() => auth.handleSignInSuccess(user), 100)
  }

  console.log('DESKTOP SIGN IN FORM RENDER')

  return (
    <CognitoAuth
      fullWidth
      hideCaptcha
      showCheckboxRemember
      authService={authService}
      checkedCheckboxRemember={rememberMe}
      errorMessage={signInError}
      inputEmail={localUsername}
      onClickCheckboxRemember={onClickCheckboxRemember}
      onSignInSuccess={onSignInSuccess}
      segmentSettings={segmentSettings}
      themeOverride={theme}
    />
  )
}
