import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/graphQLRequest', () => ({ graphQLFetchSessions: vi.fn() }))
vi.mock('../services/graphQLMutation', () => ({ graphQLDisconnect: vi.fn() }))
vi.mock('../helpers/connectionHelper', () => ({
  setConnection: vi.fn(),
  getManufacturerType: vi.fn(() => 'desktop'),
  getManufacturerUser: vi.fn(() => undefined),
}))
vi.mock('./applicationTypes', () => ({ isReverseProxy: () => false }))
vi.mock('./accounts', () => ({
  getAccountIds: () => ['me', 'work'],
  accountIdsByReach: () => [
    ['', ['me']],
    ['sub-work', ['work']],
  ],
}))
vi.mock('../selectors/connections', () => ({
  selectSessions: (state: any) => state.sessions.all,
  selectLookedAtSessions: (state: any) => state.sessions.all,
}))

import sessionsModel from './sessions'
import { graphQLFetchSessions } from '../services/graphQLRequest'
import { setConnection } from '../helpers/connectionHelper'

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

/* Each sign-in is asked about the sessions of the accounts it reaches, and a session is kept as the sign-in that was
   given it (`sub`). One that cannot be asked says nothing of its sessions. */
describe('sessions — fetch with several sign-ins', () => {
  const stored = (id: string, accountId: string, sub: string) => ({ id, sub, target: { id: `svc-${id}`, accountId } })
  const state = () => ({
    sessions: { all: [stored('s-me', 'me', ''), stored('s-work', 'work', 'sub-work')] },
    connections: {
      all: [
        { id: 'svc-s-me', sessionId: 's-me', public: true, enabled: true, connected: true, connecting: false },
        { id: 'svc-s-work', sessionId: 's-work', public: true, enabled: true, connected: true, connecting: false },
      ],
    },
  })
  const fetching = () => {
    const dispatch: any = { sessions: { set: vi.fn(), parse: vi.fn(async () => []) } }
    const effects = (sessionsModel as any).effects(dispatch)
    dispatch.sessions.updatePublicConnections = vi.fn((all: unknown) => effects.updatePublicConnections(all, state()))
    return { dispatch, fetch: () => effects.fetch(undefined, state()) }
  }

  it('keeps the sessions of a sign-in whose read failed, and its public connections as they were', async () => {
    vi.mocked(setConnection).mockClear()
    vi.mocked(graphQLFetchSessions).mockImplementation(async (_ids, requestFor: any) =>
      requestFor.sub ? 'ERROR' : ({} as any)
    )
    const { dispatch, fetch } = fetching()
    await fetch()
    // The primary answered with none: its session ended. Work's was not answered: kept.
    expect(dispatch.sessions.set).toHaveBeenCalledWith({ all: [stored('s-work', 'work', 'sub-work')] })
    expect(vi.mocked(setConnection).mock.calls.map(([connection]) => connection.id)).toEqual(['svc-s-me'])
  })

  it('tags what each sign-in is given with it, and asks for each as a read kept by row', async () => {
    vi.mocked(graphQLFetchSessions).mockResolvedValue({} as any)
    const { dispatch, fetch } = fetching()
    const given = (id: string) => ({ id, target: { id: `svc-${id}`, accountId: 'work' } })
    const effects = (sessionsModel as any).effects(dispatch)
    dispatch.sessions.parseSessions = vi.fn(async () => [given('s-new')])
    dispatch.sessions.parse = (params: any) => effects.parse(params)
    vi.mocked(graphQLFetchSessions).mockResolvedValue({ data: { data: { login: { _0: { sessions: [] } } } } } as any)
    await fetch()
    expect(vi.mocked(graphQLFetchSessions).mock.calls.map(([, requestFor]) => requestFor)).toEqual([
      { sub: '', about: ['me'], row: true },
      { sub: 'sub-work', about: ['work'], row: true },
    ])
    expect(dispatch.sessions.set.mock.calls[0][0].all.map((s: ISession) => s.sub)).toEqual(['', 'sub-work'])
  })

  it('a session two rows hold is kept once for each, and ends in both', () => {
    const reducers = (sessionsModel as any).reducers
    let all = { all: [] as ISession[] }
    all = reducers.setSession(all, { id: 's1', sub: '', target: { id: 'svc', accountId: 'acme' } })
    all = reducers.setSession(all, { id: 's1', sub: 'sub-work', target: { id: 'svc', accountId: 'acme' } })
    all = reducers.setSession(all, { id: 's1', sub: 'sub-work', target: { id: 'svc', accountId: 'acme' }, geo: {} })
    expect(all.all.map((s: ISession) => s.sub)).toEqual(['', 'sub-work'])
    expect(reducers.removeSession(all, 's1').all).toEqual([])
  })

  it('changes nothing when no sign-in could be asked', async () => {
    vi.mocked(graphQLFetchSessions).mockResolvedValue('ERROR')
    const { dispatch, fetch } = fetching()
    await fetch()
    expect(dispatch.sessions.set).not.toHaveBeenCalled()
    expect(dispatch.sessions.updatePublicConnections).not.toHaveBeenCalled()
  })
})
