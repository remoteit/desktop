import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/graphQLRequest', () => ({ graphQLFetchSessions: vi.fn() }))
vi.mock('../services/graphQLMutation', () => ({ graphQLDisconnect: vi.fn() }))
vi.mock('../helpers/connectionHelper', () => ({
  setConnection: vi.fn(),
  getManufacturerType: vi.fn(() => 'desktop'),
  getManufacturerUser: vi.fn(() => undefined),
}))
vi.mock('./applicationTypes', () => ({ isReverseProxy: () => false }))
vi.mock('./accounts', () => ({ getAccountIds: () => [] }))

import sessionsModel from './sessions'

const session = (id: string, target: any) => ({
  id,
  timestamp: '2026-10-28T12:00:00.000Z',
  source: 0,
  user: { id: 'user-1', email: 'owner@presence.test' },
  endpoint: { id: 'endpoint-1', platform: 1, manufacturer: 0, proxy: false, geo: null },
  target,
})

describe('sessions — parseSessions', () => {
  const effects = (sessionsModel as any).effects({})

  it('skips a session whose target service was deleted (graphql returns no device)', async () => {
    const data = [
      session('live', { id: 'service-1', name: 'SSH', platform: 1, application: 28, device: { id: 'device-1', name: 'pi' } }),
      session('deleted', { id: 'service-2', name: null, platform: null, application: null, device: null }),
      session('no-target', null),
    ]

    const parsed = await effects.parseSessions({ data, accountId: 'account-1' }, {})

    expect(parsed.map(s => s.id)).toEqual(['live'])
    expect(parsed[0].target).toMatchObject({ id: 'service-1', accountId: 'account-1', deviceId: 'device-1' })
  })
})
