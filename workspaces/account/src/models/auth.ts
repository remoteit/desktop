import { CognitoUser } from '@remote.it/types'
import { RemoteItPlanName } from 'remote.it'
import { r3 } from '../services/remote.it'
import { createModel } from '@rematch/core'
import Domain from '../Domain'
import { RootModel } from './rootModel'
import { AuthService } from '@remote.it/services'
import { Dispatch, store } from '../store'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { CALLBACK_URL, CLIENT_ID } from '../constants'
import { graphQLUpdateNotification } from '../services/graphQLMutation'

export const CHECKBOX_REMEMBER_KEY = 'remember-username'
const USER_KEY = 'user'


export const EMAIL_COOKIE = 'remoteit.email'
export const SPLASH_DATE = 'splash'
export const SPLASH_TO_BE_DISPLAYED = 'splash_to_display'
export const S_HOSTURL = 's.remote.it'

export interface PlanChangeResponse {
  expires: string
  plan: string // remot3.it.FREE
  status: boolean
  type: RemoteItPlanName
}

export interface RecoveryCode {
  emailVerificationCode: string
  recoveryCode: string
}





export interface AuthState {
  // initialized: boolean
  authenticated: boolean
  backendAuthenticated: boolean
  localUsername?: string
  signInError?: string
  commercialDomain: boolean
  partnerPortalAccess: boolean
  transactions?: Transaction[]
  showBetaFeatures: boolean
  signInStarted: boolean
  user?: IUser
  limits?: ILimit[]
  licenses?: ILicenses[]
  loggedIn?: boolean
  preferences: { [key: string]: any }
  verificationEmail?: string
  mfaMethod: string
  AWSUser: AWSUser
  cognitoUser?: CognitoUser
  authService?: AuthService
  stripeCard: StripeCard
  notificationSettings: INotificationSetting
  loading?: boolean
}

export interface AWSUser {
  authProvider: string
  email?: string
  email_verified?: boolean
  phone_number?: string
  phone_number_verified?: boolean
  given_name?: string //first_name
  family_name?: string //last_name
  gender?: string
  'custom:backup_code'?: string
}

export interface StripeCard {
  id?: string
  type?: string
  brand?: string
  expireMonth?: string
  expireYear?: string
  lastFour?: string
}

const state: AuthState = {
  // initialized: false,
  authenticated: false,
  backendAuthenticated: false,
  localUsername: undefined,
  commercialDomain: Domain.isEnterprise,
  partnerPortalAccess: false,
  showBetaFeatures: false,
  signInStarted: false,
  transactions: undefined,
  user: undefined,
  limits: undefined,
  licenses: undefined,
  loggedIn: false,
  preferences: {},
  mfaMethod: '',
  AWSUser: {
    authProvider: '',
  } as AWSUser,
  cognitoUser: {} as CognitoUser,
  stripeCard: {} as StripeCard,
  notificationSettings: {},
  loading: false,
}

function sleep(ms: number | undefined) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async init(_: void, rootState: any) {
      let { user } = rootState.auth
      console.log('AUTH INIT', { user })
      if (!user) {
        const authService = new AuthService({
          cognitoClientID: CLIENT_ID,
          redirectURL: window.origin + '/v1/callback',
          callbackURL: CALLBACK_URL,
          signoutCallbackURL:  CALLBACK_URL,
        })

        await sleep(500)

        dispatch.auth.setAuthService(authService)
      }
    },
    async fetchUser() {
      const { auth } = dispatch as Dispatch
      try {
        const result = await graphQLRequest(
          ` {
              login {
                id
                email
                authhash
                yoicsId
                created
                subscriptions {
                  device {
                    plan
                  }
                  seat {
                    plan
                  }
                }
                notificationSettings {
                  emailNotifications
                  desktopNotifications
                  urlNotifications
                  notificationEmail
                  notificationUrl
                }
              }
            }`
        )
        graphQLGetErrors(result)
        const data = result?.data?.data?.login
        let planName: RemoteItPlanName = "free"
        if (data.subscriptions.device.plan !== null) planName = "device"
        if (data.subscriptions.seat.plan !== null )planName = "seat"
        this.getCreditCard()
        auth.setUser({
          id: data.id,
          email: data.email,
          authHash: data.authhash,
          yoicsId: data.yoicsId,
          created: data.created,
          plan: { name : planName }
        })
        
        auth.setNotificationSettings(data.notificationSettings)
      } catch (error) {
        await graphQLCatchError(error)
      }
    },

    async checkSession(_: void, rootState: any) {
      const { ui } = store.dispatch
      try {
        const result = await rootState.auth.authService.checkSignIn()
        if (result.authUser) {
          await dispatch.auth.handleSignInSuccess(result.cognitoUser)
        } else {
          console.error('SESSION ERROR', result.error)
          ui.set({ errorMessage: result.error.message })
        }
      } catch (err) {
        console.log('check sign in error:')
        console.log(err)
      }
    },

    async signOut(_: void, _rootState: any) {
      try {
        await window.authService.signOut()
      } catch(error){
        console.log('Signout issue', {error})
      }
      window.localStorage.removeItem('amplify-signin-with-hostedUI')
      dispatch.auth.setAuthenticated(false)
      window.location.href = '/signIn'
    },

    async handleSignInSuccess(cognitoUser: CognitoUser): Promise<void> {
      if (cognitoUser?.username) {
        if (cognitoUser?.attributes?.email && window.localStorage.getItem(CHECKBOX_REMEMBER_KEY)) {
          window.localStorage.setItem('username', cognitoUser?.attributes?.email)
        } else if (!window.localStorage.getItem(CHECKBOX_REMEMBER_KEY)) {
          window.localStorage.removeItem('username')
        }

        if (cognitoUser?.authProvider === 'Google') {
          window.localStorage.setItem('amplify-signin-with-hostedUI', 'true')
        }
        dispatch.auth.setAuthenticated(true)
        dispatch.auth.fetchUser()
      }
    },

    async getUsernameLocal() {
      const localUsername = localStorage.getItem('username') || ''
      dispatch.auth.setUsername(localUsername)
    },

    async fetchTransactions() {
      const { setTransactions } = dispatch.auth
      // TODO: move to remote.it.js

      try {
        const { invoices }: { invoices: RawTransaction[] } = await r3.get(
          '/user/plan/invoices/'
        )

        const cleaned: Transaction[] = invoices.map(t => ({
          id: t.id,
          paid: t.paid,
          currency: t.currency as Currency,
          totalInCents: t.total,
          description: t.description,
          subscriptionID: t.subscription,
          quantity: t.quantity,
          createdAt: new Date(t.created * 1000),
          daysRemaining: t.days_remaining,
          invoiceUrl: t.invoiceUrl,
        }))
        console.log({cleaned})
        setTransactions(cleaned)
        // await this.fetchLimitAndPlan()
      } catch (error) {
        if (
          error &&
          error.message &&
          error.message === 'no payment system id for this user'
        )
          return console.log('User does not have a payment system yet')

        console.error(error)
      }
    },

    async changePassword(passwordValues: IPasswordValue) {
      const existingPassword = passwordValues.currentPassword
      const newPassword = passwordValues.password
      window.authService.changePassword(existingPassword, newPassword)
    },

    async updateUserMetadata(metadata: INotificationSetting, _rootState: any) {
      const { auth } = dispatch as Dispatch
      try {
        auth.setLoading(true)
        const response = await graphQLUpdateNotification(metadata)
        auth.setNotificationSettings(metadata)
        graphQLGetErrors(response)
      } catch (error) {
        await graphQLCatchError(error)
      }
      auth.setLoading(false)
    },
    async changePlan(plan: IPlan, rootState: any) {
      const { auth } = dispatch as Dispatch
      auth.setLoading(true)
      let amount = 0
      let quantity = 1
      let token = 'cancel_token'  
      switch (plan.type) {
        case 'free':
          amount = 0
          quantity = 1
          break
        case 'device':
          amount = 2 * 100 
          break
        case 'seat':
          amount = 50 * 100 
          break
        default:
          break;
      }

      const params: IPlan = {
        type: plan.type,
        amount,
        quantity,
        token
      }
      dispatch.auth.chargeCard(params) 
      auth.setLoading(false)
    },
    async chargeCard(plan: IPlan, _rootState: any){

      let path = plan.type === 'free' ? 'developer' : plan.type
      let planName = plan.type === 'free' ? 'FREE' : plan.type
      let amount = 0
      let quantity = 0
      let token = ''
      

      // If user selects a quantity of zero, make sure to downgrade them
      if (plan.quantity <= 0) {
        amount = 0
        quantity = 0
        planName = 'FREE'
        path = 'developer'
        token = 'cancel_token'
      }

      const resp: PlanChangeResponse = await r3.post(
        `/user/${path}/plan/change/stripe/`,
        {
          new_plan: `remot3.it.${planName}`,
          stripe_amount: amount > 0 ? amount / 100 : amount,
          stripe_quantity: quantity,
          stripe_token: token,
        }
      )
    
      dispatch.auth.updatePlan( {quantity, planName, expires: new Date(resp.expires)})
      await dispatch.auth.fetchTransactions()
      return resp
    },

    async updateCreditCard({ token }: { token: string }) {
      return (
        r3
          .post('/user/change/creditcard/stripe/', { stripe_token: token })
          // .then(r3.processData)
          .catch(r3.processError)
      )
    },
    async removeCreditCard(cardId) {
      return (
        r3
          .delete('/user/stripe/card/', { cardId: cardId })
          // .then(r3.processData)
          .catch(r3.processError)
      )
    },
    async getCreditCard() {
      
      return r3
        .get('user/stripe/cards/')
        .then(resp => {
          if (resp.status && resp.cards.length) {
            // const mockdata =  {"status":"true","cards":[{"id":"card_1HwLhRGZ3qkK0BSh3Yipc70P","type":"card","brand":"Visa","expireMonth":7,"expireYear":2021,"lastFour":"4681"}]}
            dispatch.auth.setUserStripeCard(resp.cards[0])
          } else {
            dispatch.auth.setUserStripeCard({})
          }
        })
        .catch(r3.processError)
    },

  }),
  reducers: {
    setTransactions(state: AuthState, transactions: Transaction[]) {
      state.transactions = transactions
      return state
    },
    setUsername(state: AuthState, username: string) {
      state.localUsername = username
      return state
    },
    setUserStripeCard(state: AuthState, cards: StripeCard) {
      state.stripeCard = cards
      return state
    },
    setAuthenticated(state: AuthState, authenticated: boolean) {
      state.authenticated = authenticated
      return state
    },
    setUser(state: AuthState, user: IUser) {
      state.user = user
      state.signInError = undefined
      window.localStorage.setItem(USER_KEY, JSON.stringify(user))
      return state
    },
    setAuthService(state: AuthState, authService: AuthService) {
      state.authService = authService
      window.authService = authService
      return state
    },
    setLoading(state: AuthState, loading: boolean | undefined) {
      state.loading = loading
      return state
    },
    setNotificationSettings(state: AuthState, notificationSettings: INotificationSetting) {
      state.notificationSettings = notificationSettings
      return state
    },
    setPlan(state: AuthState, planName: RemoteItPlanName) {
      if (!state.user || !state.user.plan) return state
      state.user.plan.name = planName.toLowerCase() as RemoteItPlanName
      return state
    },
    updatePlan( state: AuthState, {
      expires,
      quantity,
      planName,
    }: { expires: Date; quantity: number; planName: RemoteItPlanName }) {
      if (!state.user || !state.user.plan) return state
      state.user.plan.quantity = quantity
      state.user.plan.commercial = isCommercial(planName)
      state.user.plan.name = planName.toLowerCase() as RemoteItPlanName
      state.user.plan.expires = expires
      return state
    },
    

  },
  
})

/**
 * Check to see what type of account the user has. If they are
 * on a "Commercial" domain, meaning one that is under contract,
 * they are considered commercial.
 */
 function isCommercial(plan: RemoteItPlanName): boolean {
  if (Domain.isEnterprise) return true
  return plan.toLowerCase() !== 'free'
}

