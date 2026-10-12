import { PushNotifications, ActionPerformed, Channel, Token } from '@capacitor/push-notifications'
import { APNS_ENVIRONMENT, FIREBASE_CONFIGURED, PUSH_UNREGISTER_TIMEOUT } from '../constants'
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
// Held from sign-out until the next sign-in: a token callback in between would re-register a signed-out phone,
// and a second sign-out path would wait out the same bound again
let unregistering: Promise<void> | undefined

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
  if (unregistering || !store.getState().auth.user) return
  // Kept whatever the answer: a lost response may still have registered it, and sign-out has to clean it up
  window.localStorage.setItem(TOKEN_KEY, token)
  await graphQLRegisterPushToken(browser.isIOS ? 'ios' : 'android', token, apnsEnvironment(), version)
}

function apnsEnvironment(): IApnsEnvironment {
  return store.getState().ui.apis.apnsEnvironment || APNS_ENVIRONMENT
}

function register() {
  unregistering = undefined
  return refresh()
}

// The permission prompt deactivates and reactivates the app, whose foreground handler registers again
function refresh() {
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
    if (browser.isAndroid) await createChannels()
    await PushNotifications.register()
  } catch (error) {
    console.warn('PUSH REGISTER FAILED', error)
  }
}

// The IDs are graphql-api's PUSH_CHANNELS: the server names one on every push, and the manifest's
// default_notification_channel_id catches a push that names none. Android fixes a channel's importance
// once the phone has it: 4 pops up, 3 sounds, 2 stays silent in the shade.
function channels(): Channel[] {
  return [
    { id: 'device-state', importance: 4, name: i18n.t('push.channels.deviceState', 'Device online / offline') },
    { id: 'connect-others', importance: 4, name: i18n.t('push.channels.connectOthers', 'Connections to your devices') },
    { id: 'connect-own', importance: 2, name: i18n.t('push.channels.connectOwn', 'Your connections') },
    { id: 'account', importance: 4, name: i18n.t('push.channels.account', 'Account security') },
    { id: 'access', importance: 3, name: i18n.t('push.channels.access', 'Access changes') },
    { id: 'jobs', importance: 3, name: i18n.t('push.channels.jobs', 'Scripts') },
  ]
}

// Android before 8.0 has no channels and the plugin rejects there, which must not stop register().
// `notifications` was the one channel before there was one per kind: deleted so it leaves the phone's settings
async function createChannels() {
  await PushNotifications.deleteChannel({ id: 'notifications' }).catch(() => {})
  await Promise.all(channels().map(channel => PushNotifications.createChannel(channel).catch(() => {})))
}

function unregister() {
  unregistering ??= release()
  return unregistering
}

async function release() {
  const dropped = await withTimeout(
    dropToken().catch(error => {
      console.warn('PUSH UNREGISTER FAILED', error)
      return false
    }),
    PUSH_UNREGISTER_TIMEOUT
  )
  if (dropped) return
  // Nothing can retry once signed out, so kill the token on the phone or the account's pushes keep arriving
  await PushNotifications.unregister().catch(error => console.warn('PUSH NATIVE UNREGISTER FAILED', error))
}

async function dropToken() {
  await saving
  const token = window.localStorage.getItem(TOKEN_KEY)
  if (!token) return true
  window.localStorage.removeItem(TOKEN_KEY)
  return (await graphQLUnregisterPushToken(token)) !== 'ERROR'
}

export default { listen, teardown, register, refresh, unregister, apnsEnvironment }
