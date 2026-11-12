import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// "remote.it on this computer isn't signed in" (graphql-api docs/PROXY-GROUPS.md §15, "The portal and an installed
// daemon"): Sign in opens the app's own link on the person's click alone, then the daemon is asked again until it serves
// them; with no link, where to sign in is said.
const { open, forget, browser } = vi.hoisted(() => ({
  open: vi.fn(),
  forget: vi.fn(),
  browser: { isMac: true, isWindows: false },
}))
vi.mock('../services/localSubnet', () => ({ openSignInLink: open, forgetLocal: forget }))
vi.mock('../services/browser', () => ({ default: browser }))
vi.mock('./Notice', () => ({
  Notice: ({ children, button }: any) => (
    <div data-notice>
      {children}
      {button}
    </div>
  ),
}))

import { LocalSignInNotice, SIGN_IN_POLL_FOR_MS, SIGN_IN_POLL_MS } from './LocalSignInNotice'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const LINK = 'remoteit-solo://sign-in'

describe('LocalSignInNotice', () => {
  let host: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.useFakeTimers()
    open.mockReset()
    forget.mockReset()
    Object.assign(browser, { isMac: true, isWindows: false })
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  })
  afterEach(() => {
    act(() => root.unmount())
    host.remove()
    vi.useRealTimers()
  })

  const render = (signIn: { link?: string }) => act(() => root.render(<LocalSignInNotice signIn={signIn} />))
  const button = (text: string) => [...host.querySelectorAll('button')].find(b => b.textContent === text)

  it('says so, and opens nothing until Sign in is clicked', () => {
    render({ link: LINK })
    expect(host.textContent).toContain("remote.it on this computer isn't signed in")
    expect(host.textContent).toContain('Connect goes through this browser')
    expect(open).not.toHaveBeenCalled()
    expect(button('Check again')).toBeUndefined()
  })

  it("Sign in opens the app's link, then asks the daemon again until it serves them, a while", () => {
    render({ link: LINK })
    act(() => button('Sign in')!.click())
    expect(open).toHaveBeenCalledWith(LINK)
    expect(host.textContent).toContain('Finish signing in where remote.it opened it')
    expect(host.textContent).toContain('Nothing opened? Open remote.it from the menu bar and choose Sign in.')
    expect(button('Sign in')).toBeUndefined()

    act(() => vi.advanceTimersByTime(SIGN_IN_POLL_MS * 2))
    expect(forget).toHaveBeenCalledTimes(2)
    act(() => vi.advanceTimersByTime(SIGN_IN_POLL_FOR_MS + SIGN_IN_POLL_MS * 3))
    const calls = forget.mock.calls.length
    act(() => vi.advanceTimersByTime(SIGN_IN_POLL_MS * 5))
    expect(forget.mock.calls.length).toBe(calls)
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('no link (no app of the stage here to take it): where to sign in, in its platform words, and Check again', () => {
    Object.assign(browser, { isMac: false, isWindows: true })
    render({})
    expect(button('Sign in')).toBeUndefined()
    expect(host.textContent).toContain('Open remote.it from the notification area and choose Sign in.')
    act(() => button('Check again')!.click())
    expect(forget).toHaveBeenCalledTimes(1)
    expect(open).not.toHaveBeenCalled()
    expect(host.textContent).not.toContain('Finish signing in')
  })
})
