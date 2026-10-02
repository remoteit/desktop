import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('./graphQL', () => ({ graphQLBasicRequest: request }))

import { gatewayURL, openThroughGateway } from './browserGateway'

beforeEach(() => request.mockReset())

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
    request.mockResolvedValue({
      data: {
        data: {
          deviceSessionServers: { presence: ['198.51.100.1:5960'], reflector: 'wss://wsp.remote.it' },
          login: { registrationCode: 'CODE-1' },
        },
      },
    })
    expect(await openThroughGateway('web1-owner.on.local.remote.it')).toBe(true)
    expect(window.open).toHaveBeenCalledWith('', '_blank')
    const [base, frag] = tab.location.href.split('#rit=')
    expect(base).toBe('https://web1-owner.on.local.remote.it/')
    const decoded = JSON.parse(atob(frag.replace(/-/g, '+').replace(/_/g, '/')))
    expect(decoded).toEqual({ code: 'CODE-1', presence: ['198.51.100.1:5960'], reflector: 'wss://wsp.remote.it' })
    expect(tab.opener).toBeNull()
  })
  it('closes the tab when there is no code to give it', async () => {
    const tab = { location: { href: '' }, opener: {}, close: vi.fn() }
    vi.spyOn(window, 'open').mockReturnValue(tab as any)
    request.mockResolvedValue('ERROR')
    expect(await openThroughGateway('web1-owner.on.local.remote.it')).toBe(false)
    expect(tab.close).toHaveBeenCalled()
  })
})
