import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('./graphQL', () => ({ graphQLBasicRequest: request }))

import { handoff } from './browserGateway'

beforeEach(() => request.mockReset())

const servers = { presence: ['198.51.100.1:5960'], reflector: 'wss://wsp.remote.it' }

describe('handoff', () => {
  it('is a one-time code for the browser’s client, with where to sign in', async () => {
    request.mockResolvedValue({
      data: { data: { deviceSessionServers: servers, login: { registrationCode: 'CODE-1' } } },
    })
    expect(await handoff()).toEqual({ code: 'CODE-1', ...servers })
    // A browser's client is kept for its next visit; one never back is disabled by graphql's expiry after 30 days.
    expect(request.mock.calls[0][0]).toMatch(
      /registrationCode\(name: "browser", clientOnly: true, userMode: true, oneTimeUse: true, timeout: 2592000, platform: 1231\)/
    )
  })

  it('is asked as the page’s own person, whichever account is selected', async () => {
    request.mockResolvedValue('ERROR')
    await handoff()
    expect(request.mock.calls[0].slice(1)).toEqual([{}, false, { sub: '' }])
  })

  it.each([
    ['a failed request', 'ERROR'],
    ['no code', { data: { data: { deviceSessionServers: servers, login: { registrationCode: null } } } }],
    ['nowhere to sign in', { data: { data: { deviceSessionServers: null, login: { registrationCode: 'CODE-1' } } } }],
  ])('is nothing for %s', async (_what, answer) => {
    request.mockResolvedValue(answer)
    expect(await handoff()).toBeNull()
  })
})
