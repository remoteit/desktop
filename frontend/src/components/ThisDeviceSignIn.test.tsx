import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { auth, authState, oidc } = vi.hoisted(() => ({
  auth: { signIn: vi.fn(), set: vi.fn() },
  authState: { current: {} as Record<string, unknown>, offline: undefined as object | undefined },
  oidc: { signedIn: false },
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, text: string) => text }),
}))
vi.mock('react-redux', () => ({
  useSelector: (pick: any) => pick({ auth: authState.current, ui: { offline: authState.offline } }),
  useDispatch: () => ({ auth }),
}))
vi.mock('../services/oidc', () => ({ oidcSignedIn: () => oidc.signedIn }))
vi.mock('./SignInApp', () => ({ SignInError: ({ code }: any) => <div data-sign-in-error={code} /> }))

import { ThisDeviceSignIn } from './ThisDeviceSignIn'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// This device's sign-in, signed out in an app: the shell's sign-in, offered beside the machine's own controls; and
// signed in on the app but remote.it out of reach, said apart with a retry.

async function render(state: Record<string, unknown> = {}, offline?: object) {
  authState.offline = offline
  authState.current = { authenticated: false, ...state }
  const container = document.createElement('div')
  await act(async () => createRoot(container).render(<ThisDeviceSignIn />))
  return container
}
const button = (c: HTMLElement, name: string) => c.querySelector(`[data-control="${name}"]`) as HTMLButtonElement | null

beforeEach(() => {
  auth.signIn.mockReset()
  auth.set.mockReset()
  oidc.signedIn = false
})

describe('This device’s sign-in', () => {
  it('offers the sign-in, which goes to the app', async () => {
    const c = await render()
    expect(c.querySelector('[data-sign-in]')!.getAttribute('data-sign-in')).toBe('signedOut')
    expect(c.textContent).toContain('Not signed in')
    expect(c.textContent).toContain('work without signing in')
    await act(async () => button(c, 'signIn')!.click())
    expect(auth.signIn).toHaveBeenCalledTimes(1)
  })

  it('waits while the app signs in, and can stop waiting', async () => {
    const c = await render({ signingIn: true })
    expect(c.querySelector('[data-sign-in]')!.getAttribute('data-sign-in')).toBe('waiting')
    expect(button(c, 'signIn')).toBeNull()
    const cancel = [...c.querySelectorAll('button')].find(b => b.textContent === 'Cancel')!
    await act(async () => cancel.click())
    expect(auth.set).toHaveBeenCalledWith({ signingIn: false })
  })

  it('says why a sign-in failed, and offers it again', async () => {
    const c = await render({ signInFailed: true, signInErrorCode: 'unreachable' })
    expect(c.querySelector('[data-sign-in-error]')!.getAttribute('data-sign-in-error')).toBe('unreachable')
    expect(button(c, 'signIn')!.textContent).toBe('Try again')
  })

  it('offline: says so, the sign-in still there', async () => {
    const c = await render({}, { title: 'Disconnected' })
    expect(c.textContent).toContain('This device is offline')
    expect(button(c, 'signIn')).not.toBeNull()
    oidc.signedIn = true
    const d = await render({}, { title: 'Disconnected' })
    expect(d.textContent).toContain('You’re signed in, but this device is offline')
    expect(button(d, 'retry')).not.toBeNull()
  })

  it('signed in on the app but remote.it not reached: says so, a retry and no sign-in', async () => {
    oidc.signedIn = true
    const c = await render()
    expect(c.querySelector('[data-sign-in]')!.getAttribute('data-sign-in')).toBe('unreachable')
    expect(c.textContent).toContain('can’t be reached')
    expect(button(c, 'signIn')).toBeNull()
    expect(button(c, 'retry')).not.toBeNull()
  })
})
