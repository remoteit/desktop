import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { agentOwnedMessage } from '@common/agentOwner'

const auth = { signIn: vi.fn(), set: vi.fn(), switchStage: vi.fn() }
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

const owner = { username: 'jamie@remote.it', canSwitch: false, command: 'sudo remoteit signout' }
const screens: Record<string, any> = {
  ready: {},
  waiting: { signingIn: true },
  failed: { signInFailed: true },
  agentOwned: { signInFailed: true, signInErrorCode: 'agentOwned', signInError: agentOwnedMessage(owner) },
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
    Object.values(auth).forEach(fn => fn.mockClear())
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it.each(Object.keys(screens))('shows one primary button on the %s screen', name => {
    render(screens[name])
    expect(container.querySelectorAll('.MuiButton-contained')).toHaveLength(1)
  })

  it('while waiting, puts Cancel before the primary button that reopens the browser', () => {
    render(screens.waiting)
    const reopen = button('Open browser again')!
    const cancel = button('Cancel')!
    expect(reopen.className).toContain('MuiButton-contained')
    expect(buttons().indexOf(cancel)).toBeLessThan(buttons().indexOf(reopen))

    act(() => reopen.click())
    expect(auth.signIn).toHaveBeenCalledTimes(1)
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
