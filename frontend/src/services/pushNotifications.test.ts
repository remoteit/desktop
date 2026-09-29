import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { plugin, listeners, state, set, browser, constants, register, unregister, actor } = vi.hoisted(() => {
  const listeners: Record<string, (event: any) => unknown> = {}
  return {
    listeners,
    plugin: {
      addListener: vi.fn(async (name: string, handler: (event: any) => unknown) => {
        listeners[name] = handler
        return { remove: vi.fn() }
      }),
      removeAllListeners: vi.fn(async () => {}),
      checkPermissions: vi.fn(),
      requestPermissions: vi.fn(),
      createChannel: vi.fn(async () => {}),
      register: vi.fn(async () => {}),
    },
    state: { auth: { user: { id: 'user-1' } as any }, ui: { apis: {} as { apnsEnvironment?: string } } },
    set: vi.fn(),
    browser: { isMobile: true, isIOS: true, isAndroid: false },
    constants: {
      APNS_ENVIRONMENT: 'sandbox',
      FIREBASE_CONFIGURED: false,
      PUSH_CHANNEL_ID: 'notifications',
      PUSH_UNREGISTER_TIMEOUT: 3000,
    },
    register: vi.fn(async () => ({ data: {} })),
    unregister: vi.fn(async () => ({ data: {} })),
    actor: vi.fn(() => null as { sub: string } | null),
  }
})

vi.mock('@capacitor/push-notifications', () => ({ PushNotifications: plugin }))
vi.mock('../store', () => ({ store: { getState: () => state, dispatch: { ui: { set } } } }))
vi.mock('./browser', () => ({ default: browser }))
vi.mock('../constants', () => constants)
vi.mock('./graphQLMutation', () => ({ graphQLRegisterPushToken: register, graphQLUnregisterPushToken: unregister }))
vi.mock('./oidc', () => ({ oidcActor: actor }))
vi.mock('../i18n', () => ({ default: { t: (_key: string, value: string) => value } }))
vi.mock('../helpers/versionHelper', () => ({ version: '3.48.10' }))

import pushNotifications from './pushNotifications'

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
  Object.assign(browser, { isMobile: true, isIOS: true, isAndroid: false })
  constants.FIREBASE_CONFIGURED = false
  state.auth.user = { id: 'user-1' }
  state.ui.apis = {}
  plugin.checkPermissions.mockResolvedValue({ receive: 'granted' })
})

afterEach(() => pushNotifications.teardown())

describe('tap routing', () => {
  it('routes a running app and survives a sign-in reload', async () => {
    await pushNotifications.listen()
    listeners.pushNotificationActionPerformed({ actionId: 'tap', notification: { data: { url: '/devices/abc' } } })

    expect(set).toHaveBeenCalledWith({ redirect: '/devices/abc' })
    expect(window.localStorage.getItem('initialRoute')).toBe('/devices/abc')
  })

  it('ignores a url that is not an app path', async () => {
    await pushNotifications.listen()
    listeners.pushNotificationActionPerformed({ actionId: 'tap', notification: { data: { url: 'https://x.test' } } })
    listeners.pushNotificationActionPerformed({ actionId: 'tap', notification: { data: {} } })

    expect(set).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('initialRoute')).toBeNull()
  })

  it('attaches the listeners once however often it is asked', async () => {
    await pushNotifications.listen()
    await pushNotifications.register()
    await pushNotifications.register()

    expect(plugin.addListener).toHaveBeenCalledTimes(3)
  })
})

describe('register', () => {
  it('registers the token with the build environment and keeps it for sign-out', async () => {
    await pushNotifications.register()
    expect(plugin.register).toHaveBeenCalled()
    expect(plugin.createChannel).not.toHaveBeenCalled()

    await listeners.registration({ value: 'apns-token' })

    expect(register).toHaveBeenCalledWith('ios', 'apns-token', 'sandbox', '3.48.10')
    expect(window.localStorage.getItem('app:pushToken')).toBe('apns-token')
  })

  it('sends the Test UI environment override', async () => {
    state.ui.apis = { apnsEnvironment: 'production' }
    await pushNotifications.register()
    await listeners.registration({ value: 'apns-token' })

    expect(register).toHaveBeenCalledWith('ios', 'apns-token', 'production', '3.48.10')
  })

  it('does not keep a token the server refused', async () => {
    register.mockResolvedValueOnce('ERROR' as any)
    await pushNotifications.register()
    await listeners.registration({ value: 'apns-token' })

    expect(window.localStorage.getItem('app:pushToken')).toBeNull()
  })

  it('never touches the plugin on an Android build without Firebase', async () => {
    Object.assign(browser, { isIOS: false, isAndroid: true })
    await pushNotifications.register()

    expect(plugin.checkPermissions).not.toHaveBeenCalled()
    expect(plugin.register).not.toHaveBeenCalled()
  })

  it('creates the notification channel on Android with Firebase', async () => {
    Object.assign(browser, { isIOS: false, isAndroid: true })
    constants.FIREBASE_CONFIGURED = true
    await pushNotifications.register()
    await listeners.registration({ value: 'fcm-token' })

    expect(plugin.createChannel).toHaveBeenCalledWith({ id: 'notifications', name: 'Notifications' })
    expect(register).toHaveBeenCalledWith('android', 'fcm-token', 'sandbox', '3.48.10')
  })

  it('skips a support session and a signed-out app', async () => {
    actor.mockReturnValueOnce({ sub: 'operator' })
    await pushNotifications.register()
    state.auth.user = undefined
    await pushNotifications.register()

    expect(plugin.register).not.toHaveBeenCalled()
  })

  it('asks for permission only the first time', async () => {
    plugin.checkPermissions.mockResolvedValue({ receive: 'prompt' })
    plugin.requestPermissions.mockResolvedValue({ receive: 'denied' })
    await pushNotifications.register()
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1)
    expect(plugin.register).not.toHaveBeenCalled()

    plugin.checkPermissions.mockResolvedValue({ receive: 'prompt-with-rationale' })
    await pushNotifications.register()
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1)
  })

  it('shares one registration between overlapping calls', async () => {
    await Promise.all([pushNotifications.register(), pushNotifications.register()])
    expect(plugin.register).toHaveBeenCalledTimes(1)

    await pushNotifications.register()
    expect(plugin.register).toHaveBeenCalledTimes(2)
  })

  it('never throws into sign-in', async () => {
    plugin.checkPermissions.mockRejectedValue(new Error('not implemented'))
    await expect(pushNotifications.register()).resolves.toBeUndefined()
  })
})

describe('unregister', () => {
  it('drops the kept token from the server', async () => {
    window.localStorage.setItem('app:pushToken', 'apns-token')
    await pushNotifications.unregister()

    expect(unregister).toHaveBeenCalledWith('apns-token')
    expect(window.localStorage.getItem('app:pushToken')).toBeNull()
  })

  it('does nothing without a token', async () => {
    await pushNotifications.unregister()
    expect(unregister).not.toHaveBeenCalled()
  })

  it('gives up on a stalled server', async () => {
    vi.useFakeTimers()
    window.localStorage.setItem('app:pushToken', 'apns-token')
    unregister.mockReturnValueOnce(new Promise(() => {}))
    const done = pushNotifications.unregister()
    await vi.advanceTimersByTimeAsync(3000)

    await expect(done).resolves.toBeUndefined()
    vi.useRealTimers()
  })
})
