import { describe, it, expect, vi, beforeEach } from 'vitest'

const { env, windowOpen } = vi.hoisted(() => ({ env: { isNative: false }, windowOpen: vi.fn() }))
vi.mock('../services/browser', () => ({ default: env, windowOpen }))
vi.mock('../constants', () => ({ PORTAL_URL: 'https://app.remote.it' }))

import { openTerminal, portalOrigin, terminalURL } from './terminalHelper'

const target = { name: 'pi-evan.on.dev.remote.it', port: 2222, title: 'Console', service: 'S1' }

beforeEach(() => {
  env.isNative = false
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
