import { describe, it, expect, vi, beforeEach } from 'vitest'

const { env, build, windowOpen } = vi.hoisted(() => ({
  env: { isNative: false },
  build: { embedded: false },
  windowOpen: vi.fn(),
}))
vi.mock('../services/browser', () => ({ default: env, windowOpen }))
vi.mock('../constants', () => ({
  PORTAL_URL: 'https://app.remote.it',
  TERMINAL_PATH: '/terminal',
  get EMBEDDED() {
    return build.embedded
  },
}))

import { openTerminal, portalOrigin, terminalURL } from './terminalHelper'

const target = { name: 'pi-evan.on.dev.remote.it', port: 2222, title: 'Console', service: 'S1' }

beforeEach(() => {
  env.isNative = false
  build.embedded = false
  windowOpen.mockReset()
})

describe('portalOrigin', () => {
  it('is the web portal of the name’s stage', () => {
    expect(portalOrigin('pi-evan.on.remote.it')).toBe('https://app.remote.it')
    expect(portalOrigin('pi-evan.on.dev.remote.it')).toBe('https://app.dev.remote.it')
    expect(portalOrigin('Pi-Evan.on.Local.remote.it')).toBe('https://app.local.remote.it')
  })
  it('is the build’s portal for a name that does not say', () => {
    expect(portalOrigin('pi.example.com')).toBe('https://app.remote.it')
  })
})

describe('terminalURL', () => {
  it('on the web, this page’s own app — the name, port, title and service in the hash route', () => {
    const url = new URL(terminalURL(target))
    expect(`${url.origin}${url.pathname}`).toBe(`${location.origin}${location.pathname}`)
    expect(url.hash.startsWith('#/terminal?')).toBe(true)
    const query = new URLSearchParams(url.hash.slice('#/terminal?'.length))
    expect(Object.fromEntries(query)).toEqual({ name: target.name, port: '2222', title: 'Console', service: 'S1' })
  })
  it('the title is the name when there is none, and no service is named without one', () => {
    const query = new URLSearchParams(terminalURL({ name: 'pi-evan.on.remote.it', port: 22 }).split('#/terminal?')[1])
    expect(Object.fromEntries(query)).toEqual({
      name: 'pi-evan.on.remote.it',
      port: '22',
      title: 'pi-evan.on.remote.it',
    })
  })
  it('from the desktop or mobile app, the web portal of the name’s stage: the app’s own page is no portal’s', () => {
    env.isNative = true
    expect(terminalURL(target)).toBe(
      'https://app.dev.remote.it/#/terminal?name=pi-evan.on.dev.remote.it&port=2222&title=Console&service=S1'
    )
  })
})

/* The menu app's portal is at its local server's 127.0.0.1, which the browser's client takes no channel from: opened
   there, the terminal asked another stage's client and said it "did not answer". */
describe('from the portal embedded in the menu app', () => {
  it('opens in the web portal of the name’s stage, in the system browser, whoever’s service it is', async () => {
    build.embedded = true
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const { terminalReaches } = await import('./terminalHelper')
    expect(terminalReaches(target.service)).toBe(true)
    expect(openTerminal(target)).toBe(true)
    expect(windowOpen).toHaveBeenCalledWith(
      'https://app.dev.remote.it/#/terminal?name=pi-evan.on.dev.remote.it&port=2222&title=Console&service=S1',
      '_blank',
      true
    )
    expect(open).not.toHaveBeenCalled()
    open.mockRestore()
  })
})

describe('openTerminal', () => {
  it('opens a tab of its own on the web', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    openTerminal(target)
    expect(open).toHaveBeenCalledWith(terminalURL(target), '_blank')
    expect(windowOpen).not.toHaveBeenCalled()
    open.mockRestore()
  })
  it('opens the system browser from the desktop or mobile app', () => {
    env.isNative = true
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    openTerminal(target)
    expect(windowOpen).toHaveBeenCalledWith(terminalURL(target), '_blank', true)
    expect(open).not.toHaveBeenCalled()
    open.mockRestore()
  })
})

/* In this page's own app the terminal's session is the browser's one client's, which is the page's own person's. A
   service only another sign-in reaches is not opened in it — said, not a tab that cannot connect. */
describe('a service another sign-in serves', () => {
  it('is not opened in this browser’s terminal; from the desktop app it opens in the web portal as ever', async () => {
    const { readStateWith } = await import('../selectors/signIns')
    readStateWith(
      () =>
        ({
          auth: { user: { id: 'me' } },
          accounts: {
            membership: [],
            signIns: { 'sub-work': { sub: 'sub-work', id: 'work', email: 'work@x.test', membership: [] } },
          },
          devices: {
            me: { all: [{ id: 'd-me', services: [{ id: 's-me' }] }] },
            work: { all: [{ id: 'd-work', services: [{ id: 's-work' }] }] },
          },
        } as any)
    )
    const { terminalReaches } = await import('./terminalHelper')
    const opened = vi.spyOn(window, 'open').mockReturnValue(null)
    env.isNative = false
    expect(openTerminal({ name: 'pi-acme.on.remote.it', port: 22, service: 's-work' })).toBe('OTHER_SIGN_IN')
    expect(opened).not.toHaveBeenCalled()
    expect(terminalReaches('s-work')).toBe(false)
    expect(openTerminal({ name: 'mac-me.on.remote.it', port: 22, service: 's-me' })).toBe(true)
    expect(opened).toHaveBeenCalledTimes(1)
    // The page's own person's service, held in the other's list too with that account selected: still theirs.
    expect(terminalReaches('s-me')).toBe(true)
    expect(terminalReaches('s-unknown')).toBe(true)
    env.isNative = true
    expect(terminalReaches('s-work')).toBe(true)
    env.isNative = false
    readStateWith(() => ({} as any))
    opened.mockRestore()
  })
})
