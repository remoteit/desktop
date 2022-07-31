import React from 'react'
import { Route, Switch } from 'react-router-dom'
import {
  CheckSamlFunc,
  CognitoUser,
  ChallengeOption,
  ConfirmSignInFunc,
  GoogleSignInFunc,
  RecoverPasswordRequestFunc,
  SendCustomChallengeAnswerFunc,
  SignInFunc,
  SignInSuccessFunc,
  SignUpFunc,
  SamlSignInFunc,
  VerifyPasswordChangeFunc,
  VerifyRecoveryCodeFunc,
  ResendFunc,
  OktaSignInFunc,
  CognitoUserResult,
} from '../../types'
import { AccountRecovery } from '../AccountRecovery'
import { ForgotPassword } from '../ForgotPassword'
import { MFACode } from '../MFACode'
import { PasswordVerify } from '../PasswordVerify'
import { SignIn } from '../SignIn'
import { SignUp } from '../SignUp'
import { SignUpVerify } from '../SignUpVerify'
import { Wrapper } from '../Wrapper'
import { ISegmentSettings } from '../CognitoAuth'
export type AuthProps = {
  onConfirmSignIn: ConfirmSignInFunc
  onGoogleSignIn: GoogleSignInFunc
  onOktaSignIn: OktaSignInFunc
  onRecoverPasswordRequest: RecoverPasswordRequestFunc
  onSendCustomChallengeAnswer: SendCustomChallengeAnswerFunc
  onSignIn: SignInFunc
  onCheckSaml: CheckSamlFunc
  onRecoverySignIn: SignInFunc
  onSignInSuccess: SignInSuccessFunc
  onSamlSignIn: SamlSignInFunc
  onSignUp: SignUpFunc
  onResend: ResendFunc
  onVerifyPasswordChange: VerifyPasswordChangeFunc
  onVerifyRecoveryCode: VerifyRecoveryCodeFunc
  cognitoUser?: CognitoUser
  showLogo?: boolean
  errorMessage?: string
  hideCaptcha?: boolean
  inputEmail?: string
  showCheckboxRemember?: boolean
  checkedCheckboxRemember?: boolean
  onClickCheckboxRemember?: (checked: boolean) => void
  segmentSettings?: ISegmentSettings
  fullWidth?: boolean
}

export function Auth(props: AuthProps): JSX.Element {
  console.log('AUTH WRAPPER render')
  return (
    <Wrapper>
      <Routes {...props} />
    </Wrapper>
  )
}

function Routes({
  onCheckSaml,
  onConfirmSignIn,
  onGoogleSignIn,
  onOktaSignIn,
  onRecoverPasswordRequest,
  onSendCustomChallengeAnswer,
  onSignIn,
  onSamlSignIn,
  onRecoverySignIn,
  onSignInSuccess,
  onSignUp,
  onResend,
  onVerifyPasswordChange,
  onVerifyRecoveryCode,
  cognitoUser,
  showLogo,
  errorMessage,
  hideCaptcha,
  inputEmail,
  showCheckboxRemember,
  checkedCheckboxRemember,
  onClickCheckboxRemember,
  segmentSettings,
  fullWidth,
}: AuthProps): JSX.Element {
  const [challenge, setChallenge] = React.useState<ChallengeOption>()
  const [email, setEmail] = React.useState<string>(inputEmail || '')

  async function handleSignIn(username: string, password?: string): Promise<ChallengeOption | undefined> {
    const challenge = await onSignIn(username, password)
    if (challenge) setChallenge(challenge)
    return challenge
  }

  async function handleSamlSignIn(domain: string) {
    onSamlSignIn(domain)
  }

  async function handleSignIn2(username: string) {
    const challenge = await onRecoverySignIn(username)
    return challenge
  }

  async function handleRecoverPasswordRequest(recoveryEmail: string): Promise<void> {
    setEmail(recoveryEmail)
    onRecoverPasswordRequest(recoveryEmail)
  }

  async function handleUsernameChange(username: string): Promise<void> {
    setEmail(username)
  }

  async function handleSignup(newEmail: string, password: string): Promise<void> {
    await onSignUp(newEmail, password)
    setEmail(newEmail)
  }

  async function handleResend(newEmail: string): Promise<void> {
    await onResend(newEmail)
  }

  return (
    <>
      <Switch>
        <Route
          component={() => (
            <PasswordVerify email={email} fullWidth={fullWidth} onVerifyPasswordChange={onVerifyPasswordChange} />
          )}
          path="/forgot-password/verify"
        />
        <Route
          component={() => (
            <ForgotPassword
              email={email}
              fullWidth={fullWidth}
              onRecoverPasswordRequest={handleRecoverPasswordRequest}
            />
          )}
          path="/forgot-password"
        />
        <Route
          component={() => (
            <ForgotPassword
              buttonKey="pages.update-password.reset-password"
              fullWidth={fullWidth}
              onRecoverPasswordRequest={handleRecoverPasswordRequest}
              titleKey="pages.update-password.title"
            />
          )}
          path="/update-password"
        />
        <Route component={() => <SignUpVerify email={email} onResend={onResend} />} path="/sign-up/verify" />
        <Route
          component={() => (
            <SignUp
              fullWidth={fullWidth}
              onResend={handleResend}
              hideCaptcha={hideCaptcha}
              onSignUp={handleSignup}
              segmentSettings={segmentSettings}
            />
          )}
          path="/sign-up"
        />
        <Route
          component={() => (
            <AccountRecovery
              email={email}
              fullWidth={fullWidth}
              onSignIn={handleSignIn2}
              onVerifyRecoveryCode={onVerifyRecoveryCode}
            />
          )}
          path="/account-recovery"
        />
        <Route
          component={() => (
            <MFACode
              challengeName={challenge}
              cognitoUser={cognitoUser}
              onConfirmSignIn={onConfirmSignIn}
              onSendCustomChallengeAnswer={onSendCustomChallengeAnswer}
              onSignInSuccess={onSignInSuccess}
            />
          )}
          path="/mfa-verify"
        />
        <Route
          component={() => (
            <SignIn
              checkedCheckboxRemember={checkedCheckboxRemember}
              email={email}
              errorMessage={errorMessage}
              fullWidth={fullWidth}
              onCheckSaml={onCheckSaml}
              onClickCheckboxRemember={onClickCheckboxRemember}
              onGoogleSignIn={onGoogleSignIn}
              onOktaSignIn={onOktaSignIn}
              onSamlSignIn={handleSamlSignIn}
              onSignIn={handleSignIn}
              onUsernameChange={handleUsernameChange}
              showCheckboxRemember={showCheckboxRemember}
              showLogo={showLogo}
            />
          )}
          path={['/', '/sign-in']}
        />
      </Switch>
    </>
  )
}
