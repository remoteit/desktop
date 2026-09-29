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
let registering: Promise<void> | undefined
let saving: Promise<void> = Promise.resolve()

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

// Chained so unregister can wait out a registration still in flight: landing after it would re-register a signed-out phone
function save({ value }: Token) {
  saving = saving.then(() => saveToken(value)).catch(error => console.warn('PUSH SAVE FAILED', error))
  return saving
}

async function saveToken(token: string) {
  if (!store.getState().auth.user) return
  const apnsEnvironment = store.getState().ui.apis.apnsEnvironment || APNS_ENVIRONMENT
  const result = await graphQLRegisterPushToken(browser.isIOS ? 'ios' : 'android', token, apnsEnvironment, version)
  if (result === 'ERROR') return
  window.localStorage.setItem(TOKEN_KEY, token)
}

// The permission prompt deactivates and reactivates the app, whose foreground handler registers again
function register() {
  registering ??= requestToken().finally(() => (registering = undefined))
  return registering
}

async function requestToken() {
  if (!browser.isMobile || (browser.isAndroid && !FIREBASE_CONFIGURED)) return
  // A support session is someone else's account: their pushes must not reach this phone
  if (!store.getState().auth.user || oidcActor()) return
  try {
    await listen()
    let { receive } = await PushNotifications.checkPermissions()
    if (receive === 'prompt') ({ receive } = await PushNotifications.requestPermissions())
    if (receive !== 'granted') return
    // Android before 8.0 has no channels and the plugin rejects there, which must not stop register()
    if (browser.isAndroid)
      await PushNotifications.createChannel({
        id: PUSH_CHANNEL_ID,
        name: i18n.t('push.channel', 'Notifications'),
      }).catch(() => {})
    await PushNotifications.register()
  } catch (error) {
    console.warn('PUSH REGISTER FAILED', error)
  }
}

async function unregister() {
  try {
    await withTimeout(dropToken(), PUSH_UNREGISTER_TIMEOUT)
  } catch (error) {
    console.warn('PUSH UNREGISTER FAILED', error)
  }
}

async function dropToken() {
  await saving
  const token = window.localStorage.getItem(TOKEN_KEY)
  if (!token) return
  window.localStorage.removeItem(TOKEN_KEY)
  await graphQLUnregisterPushToken(token)
}

export default { listen, teardown, register, unregister }
