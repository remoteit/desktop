import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request, browser, openInSystem } = vi.hoisted(() => ({
  request: vi.fn(),
  browser: { isIOSDeviceApp: false },
  openInSystem: vi.fn(),
}))
vi.mock('./graphQL', () => ({ graphQLBasicRequest: request }))
vi.mock('./browser', () => ({ default: browser, openInSystem }))

import { gatewayURL, openThroughGateway } from './browserGateway'

beforeEach(() => {
  request.mockReset()
  openInSystem.mockReset()
  browser.isIOSDeviceApp = false
})

const handoff = { code: 'CODE-1', presence: ['198.51.100.1:5960'], reflector: 'wss://wsp.remote.it' }
const answer = {
  data: {
    data: {
      deviceSessionServers: { presence: handoff.presence, reflector: handoff.reflector },
      login: { registrationCode: handoff.code },
    },
  },
}

describe('gatewayURL', () => {
  it('the device’s own name, as with an agent: its web service, whatever port it is on', () => {
    expect(gatewayURL('r3devicedebian-owner.on.local.remote.it')).toBe(
      'https://r3devicedebian-owner.on.local.remote.it/'
    )
  })
})

describe('openThroughGateway', () => {
  it('opens the tab on the click, then sends it to the device with the one-time code in the fragment', async () => {
    const tab = { location: { href: '' }, opener: {}, close: vi.fn() }
    vi.spyOn(window, 'open').mockReturnValue(tab as any)
    request.mockResolvedValue(answer)
    expect(await openThroughGateway('web1-owner.on.local.remote.it')).toBe(true)
    expect(window.open).toHaveBeenCalledWith('', '_blank')
    const [base, frag] = tab.location.href.split('#rit=')
    expect(base).toBe('https://web1-owner.on.local.remote.it/')
    const decoded = JSON.parse(atob(frag.replace(/-/g, '+').replace(/_/g, '/')))
    expect(decoded).toEqual(handoff)
    expect(tab.opener).toBeNull()
    // A browser's client is kept for its next visit; one never back is disabled by graphql's expiry after 30 days.
    expect(request.mock.calls[0][0]).toMatch(/registrationCode\(name: "browser", clientOnly: true, userMode: true, oneTimeUse: true, timeout: 2592000, platform: 1231\)/)
  })
  it('closes the tab when there is no code to give it', async () => {
    const tab = { location: { href: '' }, opener: {}, close: vi.fn() }
    vi.spyOn(window, 'open').mockReturnValue(tab as any)
    request.mockResolvedValue('ERROR')
    expect(await openThroughGateway('web1-owner.on.local.remote.it')).toBe(false)
    expect(tab.close).toHaveBeenCalled()
  })

  it.each([true, false])('hands the gateway URL to the system browser on Solo iOS and returns %s', async completed => {
    browser.isIOSDeviceApp = true
    const popup = vi.spyOn(window, 'open').mockClear()
    request.mockResolvedValue(answer)
    openInSystem.mockResolvedValue(completed)

    expect(await openThroughGateway('web1-owner.on.local.remote.it')).toBe(completed)
    expect(openInSystem).toHaveBeenCalledExactlyOnceWith(
      `https://web1-owner.on.local.remote.it/#rit=${btoa(JSON.stringify(handoff))}`
    )
    expect(popup).not.toHaveBeenCalled()
  })
})

/* The browser has one client, the page's own person's. A service only another sign-in reaches is not opened through
   it: no tab, no code — the browser is not registered as that other person, nor a tab opened that cannot reach it. */
describe('with several sign-ins in use', () => {
  it('opens what the page’s own person reaches, asking its code as them, and nothing another sign-in alone reaches', async () => {
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
    const { OTHER_SIGN_IN } = await import('./browserGateway')
    const tab = { close: vi.fn(), location: { href: '' }, opener: {} }
    vi.spyOn(window, 'open').mockReturnValue(tab as any)
    request.mockReset().mockResolvedValue(answer)
    expect(await openThroughGateway('web-work.on.local.remote.it', 's-work')).toBe(OTHER_SIGN_IN)
    expect(window.open).not.toHaveBeenCalled()
    expect(request).not.toHaveBeenCalled()

    expect(await openThroughGateway('web-me.on.local.remote.it', 's-me')).toBe(true)
    expect(request.mock.calls[0].slice(1)).toEqual([{}, false, { sub: '' }])
    readStateWith(() => ({} as any))
  })
})
