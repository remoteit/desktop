// import { Auth } from 'aws-amplify'
import Auth from '@aws-amplify/auth'
import setup, { IUser } from 'remote.it'
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
// export type CodeDeliveryDetails = CognitoCodeDeliveryDetails
// export type ISignUpResult = CognitoISignUpResult

export type RecoveryChallengeType = 'BACKUP_CODE' | 'EMAIL_CODE'

export type CognitoAuthInstance = typeof Auth

export type RemoteitLib = ReturnType<typeof setup>

// export interface AuthUser {
//   remoteitUser?: RemoteitUser
//   cognitoUser?: CognitoUser
// }

// export interface AuthUserResult {
//   authUser?: AuthUser
//   error?: Error
// }

export interface CognitoUserResult {
  cognitoUser?: CognitoUser
  error?: Error
}

export interface SamlOrgResult {
  isSaml: boolean
  orgName?: string
}

// export interface RemoteitUser extends IUser {
//   partnerPortalAccess?: boolean
// }

export type AuthProvider = 'Apple' | 'Google' | ''

// export interface CognitoUser {
// authProvider?: AuthProvider
// id?: string
// attributes?: CognitoUserAttributes
// challengeName?: ChallengeOption
// preferredMFA: MFAMethod
// username: string
// pool: CognitoUserPool {userPoolId: "us-west-2_UsaYxTMNN", clientId: "5tf7k7v74qrnghuv4gmt1nm1oj", client: Client, advancedSecurityDataCollectionFlag: true, storage: Storage}
// Session: null
// client: Client {endpoint: "https://cognito-idp.us-west-2.amazonaws.com/", userAgent: "aws-amplify/0.1.x js"}
// signInUserSession: CognitoUserSession {idToken: CognitoIdToken, refreshToken: CognitoRefreshToken, accessToken: CognitoAccessToken, clockDrift: 0}
// authenticationFlowType: "USER_SRP_AUTH"
// storage: Storage {CognitoIdentityServiceProvider.5tf7k7v74qrnghuv4gmt1nm1oj.8b6067fa-5414-44bb-9113-98a67f35b236.refreshToken: "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUl…uaQwIR-y_gJM7LwqlEMBrC-kxl.zKX3uAiapLt8kO8UP82pkA", CognitoIdentityServiceProvider.5tf7k7v74qrnghuv4gmt1nm1oj.8b6067fa-5414-44bb-9113-98a67f35b236.clockDrift: "0", amplify-signin-with-hostedUI: "false", CognitoIdentityServiceProvider.5tf7k7v74qrnghuv4gmt1nm1oj.8b6067fa-5414-44bb-9113-98a67f35b236.deviceGroupKey: "-cpVlfF1x", CognitoIdentityServiceProvider.5tf7k7v74qrnghuv4gmt1nm1oj.8b6067fa-5414-44bb-9113-98a67f35b236.idToken: "eyJraWQiOiI2ZWFYcHB0blptaFczV0hpcDB6Y09yUkd4Tk8yNF…25Fwf-lHDdJc_EOFXbPckm4IDd9z4FZgjnF_vrqIZdSqPJ45A", …}
// keyPrefix: string
// userDataKey: string
// deviceKey: string
// }

export interface CognitoUserAttributes {
  email: string
  email_verified?: boolean
  phone_number?: string
  phone_number_verified?: boolean
  given_name?: string //first_name
  family_name?: string //last_name
  gender?: string
  'custom:backup_code'?: string
  // [key: string]: any
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

export interface RemoteitUserInfo extends IUser {
  partnerPortalAccess: boolean
}

export type RecoverPasswordRequestFunc = (email: string) => Promise<void>

export type AvailableLanguage = 'en' | 'ja'

export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl'

export type IconWeight = 'light' | 'regular' | 'solid'

export type Currency = 'USD'

declare global {
  interface Window {
    isEnterprise?: boolean
    opera?: string
  }
}

