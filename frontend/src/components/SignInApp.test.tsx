import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { agentOwnedMessage } from '@common/agentOwner'

const auth = { signIn: vi.fn(), reopenSignIn: vi.fn(), set: vi.fn(), switchStage: vi.fn() }
let authState: any

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
vi.mock('../services/browser', () => ({ default: { isElectron: true, isNative: true } }))
vi.mock('../services/oidc', () => ({
  oidcAutoStartExhausted: () => false,
  oidcIsSupportTab: () => false,
  oidcLeaveRefused: () => false,
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
    signInError: agentOwnedMessage({ username: 'jamie@remote.it', canSwitch: false, command: 'sudo remoteit signout' }),
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
    expect(reopen.textContent).toBe('Open browser again')
    expect(buttons().indexOf(cancel)).toBeLessThan(buttons().indexOf(reopen))

    act(() => reopen.click())
    expect(auth.reopenSignIn).toHaveBeenCalledTimes(1)
    expect(auth.signIn).not.toHaveBeenCalled()
    act(() => cancel.click())
    expect(auth.set).toHaveBeenCalledWith({ signingIn: false })
  })

  it('gives the agent owner and a copyable command when another account holds the agent', () => {
    render(screens.agentOwned)
    expect(container.textContent).toContain('This computer is in use')
    expect(container.textContent).toContain('sudo remoteit signout')
    expect(button('Try again')).toBeUndefined()
  })
})
