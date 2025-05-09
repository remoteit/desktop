import browser, { windowOpen } from '../services/browser'
// import { OAuth2Client } from '@byteowls/capacitor-oauth2'
import { ICredentials } from '@aws-amplify/core'
import { DEVELOPER_KEY } from '../constants'
import { CognitoHostedUIIdentityProvider, Auth } from '@aws-amplify/auth'
import {
  AuthProvider,
  CodeDeliveryDetails,
  CognitoUser,
  ISignUpResult,
  RecoveryChallengeType,
  CognitoUserResult,
  SamlOrgResult,
} from './types'
import { CognitoUserSession } from 'amazon-cognito-identity-js'
import axios from 'axios'
import brand from '@common/brand/config'

export interface ConfigInterface {
  cognitoAuthDomain: string
  cognitoClientID?: string
  cognitoRegion: string
  cognitoUserPoolID: string
  callbackURL: string
  signoutCallbackURL?: string
  checkSamlURL: string
  redirectURL: string
  urlOpener?: any
}

export class AuthService {
  public username?: string
  private cognitoAuth: typeof Auth
  private config: ConfigInterface
  private cognitoUser?: CognitoUser
  scope = ['email', 'profile', 'openid', 'aws.cognito.signin.user.admin']
  responseType = 'code'

  constructor(config: ConfigInterface) {
    this.config = config
    this.cognitoAuth = this.configureCognito()
  }

  public async checkSaml(username: string): Promise<SamlOrgResult> {
    const response = await axios.post(
      this.config.checkSamlURL,
      { username },
      { headers: { developerKey: DEVELOPER_KEY } }
    )

    // console.log ('setMFAPreference MFA PREF RESPONSE')
    // console.log(response)
    // console.log(response.data)
    if (response.status == 200) {
      return response.data
    } else {
      return { isSaml: false }
    }
  }

  public async forceTokenRefresh(): Promise<void> {
    await this.cognitoAuth.currentAuthenticatedUser({ bypassCache: true })
  }

  public async checkSignIn(
    options: { refreshToken: boolean } = {
      refreshToken: false,
    }
  ): Promise<CognitoUserResult> {
    // Get the main Cognito user first.
    try {
      const cognitoUser: CognitoUser = await this.cognitoAuth.currentAuthenticatedUser()

      if (!cognitoUser) return { error: new Error('No cognito user') }

      const email = cognitoUser?.attributes?.email
      if (!email) throw new Error('no cognito email exists for this user')

      // TODO: this is duplicated also in CognitoAuth.tsx, cleanup
      cognitoUser.authProvider = this.determineAuthProvider(cognitoUser)

      // Check for session
      let currentSession = await this.currentCognitoSession()
      if (options.refreshToken) {
        try {
          const refreshToken = currentSession.getRefreshToken()
          const refreshRequest = new Promise((res, rej) => {
            // @ts-ignore
            cognitoUser.refreshSession(refreshToken, (err: any, data: unknown) => {
              return err ? rej(err) : res(data)
            })
          })
          await refreshRequest // note that rejections will be caught and handled in the catch block.
          currentSession = await this.currentCognitoSession()
        } catch (err) {
          // should not throw because user might just be on guest access or is authenticated through federation
          console.log('Error attempting to refreshing the session', err)
        }
      }
      if (currentSession) {
        currentSession.getAccessToken().getJwtToken()
      } else {
        return { error: new Error('no current session') }
      }
      this.cognitoUser = cognitoUser
      return { cognitoUser }
    } catch (error) {
      // Unable to get cognito user
      return { error }
    }
  }

  public async signIn(username: string, password?: string): Promise<CognitoUserResult> {
    this.username = username

    let cognitoUser: CognitoUser
    try {
      if (!password) {
        cognitoUser = await this.cognitoAuth.signIn(this.username)
      } else {
        cognitoUser = await this.cognitoAuth.signIn(this.username, password)
      }
    } catch (error) {
      return { error }
    }

    // this.user = { cognitoUser, remoteitUser: undefined }

    if (cognitoUser) {
      cognitoUser.authProvider = this.determineAuthProvider(cognitoUser)
    }

    this.cognitoUser = cognitoUser

    return { cognitoUser }
  }

  /**
   * Confirm the sign in of a MFA session by providing the given
   * verification code. This is the second step in a MFA flow.
   */
  public async confirmSignIn(code: string, challengeName?: any): Promise<CognitoUserResult> {
    if (!this.cognitoUser) return { error: new Error('no user set, cannot finish signin') } //throw new Error('no user set, cannot finish signin')

    try {
      const cognitoUser: CognitoUser = await this.cognitoAuth.confirmSignIn(this.cognitoUser, code, challengeName)

      if (!cognitoUser || !this.username) return { error: new Error('confirm signin failed, not enough information') }

      // Update the Cognito user from the sign in response since
      // now we have all of their account details.
      this.cognitoUser = cognitoUser
    } catch (error) {
      return { error }
    }

    return { cognitoUser: this.cognitoUser }
  }

  public async googleSignIn() {
    if (browser.isMobile) {
      this.mobileAuth(CognitoHostedUIIdentityProvider.Google)
    } else {
      await this.cognitoAuth.federatedSignIn({
        customState: this.config.redirectURL,
        provider: CognitoHostedUIIdentityProvider.Google,
      })
    }
  }

  // async loginWithCognito() {
  //   const oauth2Options = {
  //     appId: '4r5la59beqqc82gkefqmq3pejh',
  //     authorizationBaseUrl: 'https://auth.remote.it/oauth2/authorize',
  //     accessTokenEndpoint: 'https://auth.remote.it/oauth2/token',
  //     responseType: 'code', // You're using authorization code flow
  //     redirectUrl: 'remoteit://authCallback', // Must match the registered redirect URI
  //     scope: 'openid profile email', // Adjust the scope to match what is required for your Cognito setup
  //     additionalParameters: {
  //       // These parameters should reflect the Cognito and Google setup
  //       response_type: 'code',
  //       client_id: '4r5la59beqqc82gkefqmq3pejh',
  //       redirect_uri: 'remoteit://authCallback',
  //       identity_provider: 'Google',
  //     },
  //     pkceEnabled: true,
  //     android: {
  //       responseType: 'code', // Set to 'code' to ensure the use of the authorization code flow
  //     },
  //     ios: {
  //       responseType: 'code', // Set to 'code' to ensure the use of the authorization code flow
  //     },
  //   }

  //   try {
  //     const result = await OAuth2Client.authenticate(oauth2Options)
  //     console.log('OAuth result:', result)

  //     // The result object will contain "access_token" among other tokens
  //   } catch (e) {
  //     console.error('OAuth failed:', e)
  //   }
  // }

  public async oktaSignIn(): Promise<ICredentials> {
    return this.cognitoAuth.federatedSignIn({
      customState: this.config.redirectURL,
      customProvider: 'Okta',
    })
  }

  public async appleSignIn() {
    if (browser.isMobile) {
      this.mobileAuth(CognitoHostedUIIdentityProvider.Apple)
    } else {
      this.cognitoAuth.federatedSignIn({
        customState: this.config.redirectURL,
        provider: CognitoHostedUIIdentityProvider.Apple,
      })
    }
  }

  public async amazonSignIn(): Promise<ICredentials> {
    return this.cognitoAuth.federatedSignIn({
      customState: this.config.redirectURL,
      provider: CognitoHostedUIIdentityProvider.Amazon,
    })
  }

  public async samlSignIn(domain: string): Promise<ICredentials> {
    return this.cognitoAuth.federatedSignIn({
      customState: this.config.redirectURL,
      customProvider: domain,
    })
  }

  public async mobileAuth(provider: string) {
    const params = [
      `identity_provider=${provider}`,
      `redirect_uri=${this.config.callbackURL}`,
      `client_id=${this.config.cognitoClientID}`,
      `response_type=${this.responseType}`,
      `scope=${this.scope.join('+')}`,
    ]
    const authUrl = `https://${this.config.cognitoAuthDomain}/oauth2/authorize?${params.join('&')}`
    await windowOpen(authUrl, 'auth')
    // await this.loginWithCognito() @TODO implement with oauth2
  }

  public async signUp(username: string, password: string): Promise<CognitoUserResult> {
    // r3.user.create(email)
    try {
      const resp: ISignUpResult = await this.cognitoAuth.signUp({
        username,
        password,
        attributes: { 'custom:brand': brand.name },
      })

      this.cognitoUser = {
        ...resp.user,
        username,
        preferredMFA: 'NOMFA',
      }

      return { cognitoUser: this.cognitoUser }
    } catch (error) {
      return { error }
    }
  }

  public async resendSignUp(username: string): Promise<void> {
    await this.cognitoAuth.resendSignUp(username)
  }

  public async forgotPassword(email: string): Promise<CodeDeliveryDetails> {
    const resp: CodeDeliveryDetails = await this.cognitoAuth.forgotPassword(email)
    return resp
  }

  public async forgotPasswordSubmit(shortcode: string, password: string, email?: string): Promise<string> {
    email = email || this.username
    if (!email) throw new Error('Cannot send password reset, no email provided!')
    this.username = email
    return this.cognitoAuth.forgotPasswordSubmit(email, shortcode, password)
  }

  /**
   * requestAccountRecovery attempts to signin without password which sends
   * an email to the user with a verification code. They can then use this
   * code along with their two-factor account recovery code using the
   * method "verifyRecoveryCode" to turn off two-factor and sign in.
   */
  public async requestAccountRecovery(email?: string): Promise<CognitoUserResult> {
    email = email || this.username
    if (!email) return { error: new Error('Cannot request account recovery, no email provided!') }

    this.username = email

    // Signing in without a password triggers a request to reset
    // the account.
    const result = await this.signIn(email)

    if (result.error) {
      return { error: result.error }
    }

    this.cognitoUser = result.cognitoUser

    // This shouldn't happen, but handle it anyways.
    if (!result.cognitoUser?.challengeName)
      return { error: new Error('No challenge code provided, cannot reset account!') }

    const recoveryType: RecoveryChallengeType | undefined = this.cognitoUser?.challengeParam?.challengeType

    if (
      !this.cognitoUser?.challengeParam?.challengeType ||
      !['EMAIL_CODE', 'BACKUP_CODE'].includes(this.cognitoUser?.challengeParam?.challengeType)
    )
      return { error: new Error('Invalid recovery type returned: ' + recoveryType) }

    return { cognitoUser: this.cognitoUser }
  }

  /**
   * verifyRecoveryCode is the second part of a two-factor account recovery process.
   * The first step is to call "requestAccountRecovery" which will send a recovery email
   * to the user. They then take that code and their two-factor recovery code and pass it
   * into this method which allows them to login and change their settings.
   */
  public async verifyRecoveryCode(emailVerificationCode: string, recoveryCode: string): Promise<CognitoUserResult> {
    if (!emailVerificationCode) return { error: new Error('No email verification code provided!') }

    if (!this.username || !this.cognitoUser)
      return { error: new Error('no user instance exists, please attempt signin first!') }

    try {
      // This is an email only account recovery
      let newUser: CognitoUser = await this.cognitoAuth.sendCustomChallengeAnswer(
        this.cognitoUser,
        emailVerificationCode
      )

      // Update the local copy of the Cognito user
      this.cognitoUser = newUser

      // If only a the email verification code was provided,
      // we assume that the user does not have two-factor setup
      // and thus does not need the secondary challenge.
      // if (recoveryCode) {
      newUser = await this.cognitoAuth.sendCustomChallengeAnswer(this.cognitoUser, recoveryCode)

      // Update the local copy of the Cognito user
      this.cognitoUser = newUser
    } catch (error) {
      return { error }
    }

    if (this.cognitoUser.challengeName === 'CUSTOM_CHALLENGE') {
      return { error: new Error('Backup code is invalid, please double check and try again!') }
    }

    // Now get the Remote.It specific account information and
    // then return the full user object.
    // Removing this check for now
    // this.user.remoteitUser = await this.getRemoteitUserInfo(this.username)

    return { cognitoUser: this.cognitoUser }
  }

  public async currentCognitoSession(): Promise<CognitoUserSession> {
    return this.cognitoAuth.currentSession()
  }

  public async currentUserInfo(): Promise<CognitoUser> {
    return await this.cognitoAuth.currentUserInfo()
  }

  public async currentAuthenticatedUser(): Promise<CognitoUser> {
    return await this.cognitoAuth.currentAuthenticatedUser()
  }

  public async updateCurrentUserAttributes(attributes: any) {
    const user = this.cognitoUser
    return await Auth.updateUserAttributes(user, attributes)
  }

  public async verifyCurrentUserAttribute(attribute: string) {
    Auth.verifyCurrentUserAttribute(attribute)
  }

  public async verifyCurrentUserAttributeSubmit(attribute: string, verificationCode: string) {
    await Auth.verifyCurrentUserAttributeSubmit(attribute, verificationCode)
    // .then(result => {
    //   console.log('verify number', result)
    // })
  }

  public async setupTOTP() {
    const awsUser = await this.cognitoAuth.currentAuthenticatedUser()
    const code = await Auth.setupTOTP(awsUser) //.then(code => {
    // You can directly display the `code` to the user or convert it to a QR code to be scanned.
    // E.g., use following code sample to render a QR code with `qrcode.react` component:
    //  import QRCode from 'qrcode.react';
    //  const str = "otpauth://totp/AWSCognito:"+ username + "?secret=" + code + "&issuer=" + issuer;
    //  <QRCode value={str}/>
    return code
  }

  public async verifyTotpToken(code: string) {
    const awsUser = await this.cognitoAuth.currentAuthenticatedUser()
    await Auth.verifyTotpToken(awsUser, code)
  }

  public async changePassword(existingPassword: string, newPassword: string) {
    const awsUser = await this.cognitoAuth.currentAuthenticatedUser()
    await Auth.changePassword(awsUser, existingPassword, newPassword)
  }

  public async signOut() {
    try {
      if (browser.isMobile) {
        const params = [
          `client_id=${this.config.cognitoClientID}`,
          `redirect_uri=${this.config.redirectURL}`,
          `logout_uri=${this.config.signoutCallbackURL}`,
          `response_type=${this.responseType}`,
          `scope=${this.scope.join('+')}`,
        ]
        const logoutUrl = `https://${this.config.cognitoAuthDomain}/logout?${params.join('&')}`
        await windowOpen(logoutUrl, 'auth')
      }
      await this.cognitoAuth.signOut()
    } catch {}
  }

  /* ------------------------------------------------------
  Private methods
  ------------------------------------------------------ */

  // private async getRemoteitUserInfo(email: string): Promise<RemoteitUserInfo> {
  //   const [remoteitUser, partnerPortalAccess] = await Promise.all([
  //     this.remoteit?.user
  //       .userData(email)
  //       .catch((e: Error) => console.error(e.message)),
  //     this.remoteit?.entities
  //       .acl()
  //       .then(() => true)
  //       .catch(() => false),
  //   ])
  //   if (!remoteitUser) throw new Error('Could not get Remote.It user info!')
  //   return { ...remoteitUser, partnerPortalAccess }
  // }

  private determineAuthProvider(cognitoUser: CognitoUser): AuthProvider {
    let authProvider: AuthProvider = ''
    if (cognitoUser?.username?.includes('Google') || cognitoUser?.username?.includes('google')) {
      authProvider = 'Google'
    }

    if (cognitoUser?.username?.includes('Apple') || cognitoUser?.username?.includes('apple')) {
      authProvider = 'Apple'
    }
    return authProvider
  }

  private configureCognito() {
    const config = this.config

    Auth.configure({
      Auth: {
        mandatorySignIn: true,
        region: config.cognitoRegion,
        userPoolId: config.cognitoUserPoolID,
        userPoolWebClientId: config.cognitoClientID,
      },
    })

    let oauth = {
      domain: config.cognitoAuthDomain,
      scope: this.scope,
      redirectSignIn: config.callbackURL,
      redirectSignOut: config.signoutCallbackURL ? config.signoutCallbackURL : config.callbackURL,
      responseType: this.responseType, // or 'token', note that REFRESH token will only be generated when the responseType is code
      urlOpener: config.urlOpener,
    }

    // your Cognito Hosted UI configuration
    Auth.configure({ oauth })

    return Auth
  }
}
