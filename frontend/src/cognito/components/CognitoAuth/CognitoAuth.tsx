import React from 'react'
import { CognitoUser, ChallengeOption, SignInSuccessFunc, CognitoUserResult, SamlOrgResult } from '../../types'
import { Theme } from '@mui/material'
import { SplashScreen } from '../SplashScreen'
import { AuthService } from '../../services/auth'
import { Auth } from '../Auth'

export type ISegmentSettings = {
  segmentKey?: string
  segmentAppName?: string
  appVersion?: string
}

export type CognitoAuthProps = {
  onSignInSuccess: SignInSuccessFunc
  clientId?: string
  themeOverride?: Theme
  showLogo?: boolean
  errorMessage?: string
  redirectURL?: string
  callbackURL?: string
  signoutCallbackURL?: string
  hideCaptcha?: boolean
  authService?: AuthService
  inputEmail?: string
  showCheckboxRemember?: boolean
  checkedCheckboxRemember?: boolean
  onClickCheckboxRemember?: (checked: boolean) => void
  segmentSettings?: ISegmentSettings
  fullWidth?: boolean
}

export function CognitoAuth({
  onSignInSuccess,
  clientId,
  themeOverride,
  showLogo,
  errorMessage,
  redirectURL,
  callbackURL,
  signoutCallbackURL,
  authService,
  hideCaptcha,
  inputEmail,
  showCheckboxRemember,
  checkedCheckboxRemember,
  onClickCheckboxRemember = () => {},
  segmentSettings,
  fullWidth,
}: CognitoAuthProps): JSX.Element {
  const [authUser, setAuthUser] = React.useState<CognitoUser>()
  const [loading, setLoading] = React.useState<boolean>(false)
  const [cognito] = React.useState<AuthService>(
    authService ||
      new AuthService({
        cognitoClientID: clientId,
        redirectURL: redirectURL,
        callbackURL: callbackURL,
        signoutCallbackURL: signoutCallbackURL,
      })
  )

  React.useEffect(() => {
    handleCheckSignIn()
  }, [])

  async function handleCheckSignIn(): Promise<void> {
    setLoading(true)
    try {
      const result = await cognito.checkSignIn()
      if (result.cognitoUser) {
        setAuthUser(result.cognitoUser)
        onSignInSuccess(result.cognitoUser)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function handleCheckSaml(username: string): Promise<SamlOrgResult> {
    return await cognito.checkSaml(username)
  }

  async function handleSignIn(username: string, password?: string): Promise<ChallengeOption | undefined> {
    const result = await cognito.signIn(username, password)

    if (result.error) throw result.error

    if (result.cognitoUser) {
      setAuthUser(result.cognitoUser)

      if (result.cognitoUser.challengeName) {
        return result.cognitoUser.challengeName
      }

      onSignInSuccess(result.cognitoUser)
    }

    return
  }

  async function handleRecoverySignIn(username: string, password?: string): Promise<ChallengeOption | undefined> {
    const result = await cognito.signIn(username, password)

    if (result.error) throw result.error

    if (result.cognitoUser) {
      // setAuthUser(result.cognitoUser)

      if (result.cognitoUser.challengeName) {
        return result.cognitoUser.challengeName
      }

      onSignInSuccess(result.cognitoUser)
    }

    return
  }

  async function handleGoogleSignIn(): Promise<any> {
    return await cognito.googleSignIn()
  }

  async function handleSamlSignIn(domain: string): Promise<any> {
    return await cognito.samlSignIn(domain)
  }

  async function handleOktaSignIn(): Promise<any> {
    return await cognito.oktaSignIn()
  }

  async function handleVerifyPasswordChange(email: string, password: string, shortcode: string): Promise<any> {
    return await cognito.forgotPasswordSubmit(shortcode, password, email)
  }

  async function handleRecoverPasswordRequest(email: string): Promise<any> {
    return await cognito.forgotPassword(email)
    // .catch(e => {
    //   //don't give the user the hint that the email doesn't exist to prevent brute force attacks and to avoid possible users listing through a script
    //   console.error('recoverPasswordRequest Error', e)
    // })
  }

  async function handleVerifyRecoveryCode(
    emailVerificationCode: string,
    recoveryCode: string
  ): Promise<CognitoUserResult> {
    return await cognito.verifyRecoveryCode(emailVerificationCode, recoveryCode)
  }

  async function handleConfirmSignIn(code: string, challengeName?: ChallengeOption): Promise<void> {
    await cognito.confirmSignIn(code, challengeName)
  }

  async function handleSendCustomChallengeAnswer(code: string): Promise<CognitoUser> {
    alert('send custom challenge answer')
    return {} as CognitoUser
  }

  async function handleSignUp(username: string, password: string): Promise<void> {
    const response = await cognito.signUp(username, password)
    if (response.error) {
      // await cognito.resendSignUp(username)
      throw response.error
    }

    //return { error: { name: 'anerror', message: 'a new error' } }
  }

  async function handleResend(username: string): Promise<void> {
    await cognito.resendSignUp(username)
  }

  if (loading) {
    return <SplashScreen />
  }

  console.log('COGNITO AUTH RENDER')

  return (
    <Auth
      checkedCheckboxRemember={checkedCheckboxRemember}
      cognitoUser={authUser}
      errorMessage={errorMessage}
      fullWidth={fullWidth}
      hideCaptcha={hideCaptcha}
      inputEmail={inputEmail}
      onCheckSaml={handleCheckSaml}
      onClickCheckboxRemember={onClickCheckboxRemember}
      onConfirmSignIn={handleConfirmSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onOktaSignIn={handleOktaSignIn}
      onRecoverPasswordRequest={handleRecoverPasswordRequest}
      onRecoverySignIn={handleRecoverySignIn}
      onResend={handleResend}
      onSamlSignIn={handleSamlSignIn}
      onSendCustomChallengeAnswer={handleSendCustomChallengeAnswer}
      onSignIn={handleSignIn}
      onSignInSuccess={onSignInSuccess}
      onSignUp={handleSignUp}
      onVerifyPasswordChange={handleVerifyPasswordChange}
      onVerifyRecoveryCode={handleVerifyRecoveryCode}
      segmentSettings={segmentSettings}
      showCheckboxRemember={showCheckboxRemember}
      showLogo={showLogo}
      themeOverride={themeOverride}
    />
  )
}
