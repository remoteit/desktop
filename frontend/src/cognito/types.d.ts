import Auth from '@aws-amplify/auth'

// eslint-disable-next-line import/named
export { CodeDeliveryDetails, ISignUpResult } from 'amazon-cognito-identity-js'

// Export Cognito base types
export interface CognitoUser /*extends CognitoCognitoUser*/ {
  authProvider?: AuthProvider
  id?: string
  attributes?: CognitoUserAttributes
  challengeName?: ChallengeOption
  challengeParam?: {
    challengeType: RecoveryChallengeType
  }
  preferredMFA: MFAMethod
  username: string
  signInUserSession?: unknown
}

export type RecoveryChallengeType = 'BACKUP_CODE' | 'EMAIL_CODE'

export type CognitoAuthInstance = typeof Auth

export interface CognitoUserResult {
  cognitoUser?: CognitoUser
  error?: Error
}

export interface SamlOrgResult {
  isSaml: boolean
  orgName?: string
}

export type AuthProvider = 'Apple' | 'Google' | ''

export interface CognitoUserAttributes {
  email: string
  email_verified?: boolean
  phone_number?: string
  phone_number_verified?: boolean
  given_name?: string //first_name
  family_name?: string //last_name
  gender?: string
  'custom:backup_code'?: string
}

export type MFAMethod = 'SMS' | 'TOTP' | 'NOMFA'

export type AuthErrorCode = 'MFA_REQUIRED' | 'CUSTOM_CHALLENGE'

export type TOTPChallenge = 'SOFTWARE_TOKEN_MFA'

export type SMSChallenge = 'SMS_MFA'

export type ChallengeOption = TOTPChallenge | 'CUSTOM_CHALLENGE' | SMSChallenge | 'NEW_PASSWORD_REQUIRED' | 'MFA_SETUP'

export type SignInFunc = (username: string, password?: string) => Promise<ChallengeOption | undefined>

export type SamlSignInFunc = (domain: string) => Void

export type UsernameChangeFunc = (email: string) => Promise<void>

export type SignInSuccessFunc = (user: CognitoUser) => void

export type CheckSamlFunc = (username: string) => Promise<SamlOrgResult>
export interface SignInError extends Error {
  code?: AuthErrorCode
  user?: {
    challengeName?: ChallengeOption
  }
}

export type SignUpFunc = (username: string, password: string) => Promise<void>

export type ResendFunc = (username: string) => Promise<void>

export type ConfirmSignInFunc = (code: string, challengeName?: ChallengeOption) => Promise<void>

export type GoogleSignInFunc = () => void

export type OktaSignInFunc = () => void

export type SendCustomChallengeAnswerFunc = (code: string) => Promise<CognitoUser>

export type VerifyRecoveryCodeFunc = (emailVerificationCode: string, recoveryCode: string) => Promise<CognitoUserResult>

export type VerifyPasswordChangeFunc = (email: string, password: string, shortcode: string) => Promise<void>

export type RecoverPasswordRequestFunc = (email: string) => Promise<void>

export type AvailableLanguage = 'en' | 'ja'

export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl'

export type IconWeight = 'light' | 'regular' | 'solid'

export type Currency = 'USD'

declare global {
  interface Window {
    MSStream?: boolean
    isEnterprise?: boolean
    opera?: string
  }
}
