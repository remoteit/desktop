import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { agentOwnedMessage } from '@common/agentOwner'

const auth = { signIn: vi.fn(), set: vi.fn(), switchStage: vi.fn() }
let authState: any
const { browser, oidcReopen, autoStart } = vi.hoisted(() => ({
  browser: { isElectron: true, isNative: true },
  oidcReopen: vi.fn(),
  autoStart: { spent: false },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_: string, fallback: string) => fallback }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}))
vi.mock('react-redux', () => ({
  useSelector: (select: (state: any) => any) => select({ auth: authState, ui: {} }),
  useDispatch: () => ({ auth, ui: { set: vi.fn() } }),
}))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./CopyCodeBlock', () => ({ CopyCodeBlock: ({ value }: { value: string }) => <code>{value}</code> }))
vi.mock('../services/browser', () => ({ default: browser }))
vi.mock('../services/oidc', () => ({
  oidcAutoStartExhausted: () => autoStart.spent,
  oidcIsSupportTab: () => false,
  oidcLeaveRefused: () => false,
  oidcReopen,
}))

import { SignInApp } from './SignInApp'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const screens: Record<string, any> = {
  ready: {},
  waiting: { signingIn: true },
  failed: { signInFailed: true },
  agentOwned: {
    signInFailed: true,
    signInErrorCode: 'agentOwned',
    signInError: agentOwnedMessage({ username: 'jamie@remote.it', command: 'sudo remoteit signout' }),
  },
}

describe('SignInApp', () => {
  let root: Root
  let container: HTMLDivElement

  const render = (state: any) => {
    authState = { initialized: true, ...state }
    act(() => root.render(<SignInApp />))
  }
  const buttons = () => [...container.querySelectorAll('button')]
  const button = (label: string) => buttons().find(b => b.textContent === label)

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    vi.clearAllMocks()
    Object.assign(browser, { isElectron: true, isNative: true })
    autoStart.spent = false
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it.each(Object.keys(screens))('shows one primary button on the %s screen', name => {
    render(screens[name])
    expect(container.querySelectorAll('.MuiButton-contained')).toHaveLength(1)
  })

  it('while waiting, puts Cancel before the primary button that reopens the outstanding sign-in', () => {
    render(screens.waiting)
    const reopen = container.querySelector<HTMLButtonElement>('.MuiButton-contained')!
    const cancel = button('Cancel')!
    expect(reopen.textContent).toBe('Open again')
    expect(buttons().indexOf(cancel)).toBeLessThan(buttons().indexOf(reopen))

    act(() => reopen.click())
    expect(oidcReopen).toHaveBeenCalledTimes(1)
    expect(auth.signIn).not.toHaveBeenCalled()
    act(() => cancel.click())
    expect(auth.set).toHaveBeenCalledWith({ signingIn: false })
  })

  it('gives the agent owner and a copyable command when another account holds the agent', () => {
    render(screens.agentOwned)
    expect(container.textContent).toContain('is still signed in on this computer')
    expect(container.textContent).toContain('sudo remoteit signout')
    expect(button('Try again')).toBeUndefined()
  })

  it('keeps the waiting actions reachable in the native mobile app', () => {
    Object.assign(browser, { isElectron: false, isNative: true })
    render(screens.waiting)
    expect(container.querySelector('.MuiButton-contained')?.textContent).toBe('Open again')
    expect(button('Cancel')).toBeDefined()
  })

  it.each([
    ['desktop', { isElectron: true, isNative: true }],
    ['web', { isElectron: false, isNative: false }],
  ])('on %s, the ready screen offers email, Google and sign-up, each said once', (_, platform) => {
    Object.assign(browser, platform)
    autoStart.spent = true
    render(screens.ready)
    expect(container.textContent).toBe("Sign inContinue with emailContinue with GoogleDon't have an account? Sign up")
    expect(container.querySelector('.MuiButton-contained')?.textContent).toBe('Continue with email')
  })

  it('starts each sign-in path from its own button', () => {
    render(screens.ready)
    act(() => button('Continue with email')!.click())
    expect(auth.signIn).toHaveBeenLastCalledWith()
    act(() => button('Continue with Google')!.click())
    expect(auth.signIn).toHaveBeenLastCalledWith({ idpHint: 'google' })
    act(() => button('Sign up')!.click())
    expect(auth.signIn).toHaveBeenLastCalledWith({ signUp: true })
  })
})
