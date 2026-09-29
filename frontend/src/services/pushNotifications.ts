import { PushNotifications, ActionPerformed, Token } from '@capacitor/push-notifications'
import { APNS_ENVIRONMENT, FIREBASE_CONFIGURED, PUSH_CHANNEL_ID, PUSH_UNREGISTER_TIMEOUT } from '../constants'
import { graphQLRegisterPushToken, graphQLUnregisterPushToken } from './graphQLMutation'
import { version } from '../helpers/versionHelper'
import { withTimeout } from '../helpers/sleep'
import { oidcActor } from './oidc'
import { store } from '../store'
import browser from './browser'
import i18n from '../i18n'

const TOKEN_KEY = 'app:pushToken'

let listening: Promise<unknown> | undefined

function listen() {
  listening ??= Promise.all([
    PushNotifications.addListener('pushNotificationActionPerformed', open),
    PushNotifications.addListener('registration', save),
    PushNotifications.addListener('registrationError', error => console.warn('PUSH REGISTRATION FAILED', error)),
  ])
  return listening
}

function teardown() {
  listening = undefined
  PushNotifications.removeAllListeners()
}

// Both: the in-memory redirect serves a running app, initialRoute survives the webview reload of a mobile sign-in
function open({ notification }: ActionPerformed) {
  const url = notification.data?.url
  if (typeof url !== 'string' || !url.startsWith('/')) return
  console.log('PUSH OPENED', url)
  window.localStorage.setItem('initialRoute', url)
  store.dispatch.ui.set({ redirect: url })
}

function apnsEnvironment(): IApnsEnvironment {
  return store.getState().ui.apis.apnsEnvironment || APNS_ENVIRONMENT
}

async function save({ value }: Token) {
  const result = await graphQLRegisterPushToken(browser.isIOS ? 'ios' : 'android', value, apnsEnvironment(), version)
  if (result === 'ERROR') return
  window.localStorage.setItem(TOKEN_KEY, value)
}

async function register() {
  if (!browser.isMobile || (browser.isAndroid && !FIREBASE_CONFIGURED)) return
  // A support session is someone else's account: their pushes must not reach this phone
  if (!store.getState().auth.user || oidcActor()) return
  try {
    await listen()
    let { receive } = await PushNotifications.checkPermissions()
    if (receive === 'prompt') ({ receive } = await PushNotifications.requestPermissions())
    if (receive !== 'granted') return
    if (browser.isAndroid)
      await PushNotifications.createChannel({ id: PUSH_CHANNEL_ID, name: i18n.t('push.channel', 'Notifications') })
    await PushNotifications.register()
  } catch (error) {
    console.warn('PUSH REGISTER FAILED', error)
  }
}

async function unregister() {
  const token = window.localStorage.getItem(TOKEN_KEY)
  if (!token) return
  window.localStorage.removeItem(TOKEN_KEY)
  await withTimeout(graphQLUnregisterPushToken(token), PUSH_UNREGISTER_TIMEOUT)
}

export default { listen, teardown, register, unregister }
