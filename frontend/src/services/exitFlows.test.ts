import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request, isAxiosError: () => false } }))

import { appendFlows, exitFlowsServed, fetchExitFlows, parseUserExitFlows, resetExitFlows } from './exitFlows'

const scalar = (name: string) => ({ kind: 'SCALAR', name })
const nonNull = (ofType: any) => ({ kind: 'NON_NULL', name: null, ofType })
const arg = (name: string, type: any) => ({ name, type })

// graphql's exitFlows as solo-exit-flows-api serves it (graphql-api docs/PROXY-GROUPS.md §15).
const ARGS = [
  arg('exitId', scalar('String')),
  arg('deviceId', scalar('String')),
  arg('personId', scalar('String')),
  arg('accountId', scalar('String')),
  arg('from', scalar('DateTime')),
  arg('to', scalar('DateTime')),
  arg('limit', scalar('Int')),
  arg('after', scalar('String')),
]
const FIELDS = [
  'id',
  'exitId',
  'exit',
  'exitName',
  'start',
  'end',
  'accountId',
  'clientId',
  'sessionId',
  'proto',
  'address',
  'port',
  'source',
  'destination',
  'up',
  'down',
  'received',
  'localAccount',
  'personId',
  'accountEmail',
  'personEmail',
]

const schema = ({ query = true, args = ARGS, flow = FIELDS, page = ['flows', 'next', 'from', 'to'] } = {}) => ({
  data: {
    data: {
      query: {
        fields: [
          { name: 'adminExitFlows', args: [arg('at', nonNull(scalar('DateTime')))] },
          ...(query ? [{ name: 'exitFlows', args, type: nonNull({ kind: 'OBJECT', name: 'ExitFlowsPage' }) }] : []),
        ],
      },
      flow: { fields: flow.map(name => ({ name })) },
      page: page.length ? { fields: page.map(name => ({ name })) } : null,
    },
  },
})

const FLOW = {
  id: 'f1',
  exitId: 'E1',
  exit: 'pdx1a',
  exitName: 'remote.it pdx1a',
  start: '2026-11-10T18:00:00.000Z',
  end: '2026-11-10T18:02:00.000Z',
  clientId: 'C1',
  destination: '93.184.216.34:443',
  up: 1200,
  down: 34000,
  localAccount: '501',
  personId: 'P1',
  personEmail: 'pat@example.com',
}

const answer = (page: any) => ({ data: { data: { exitFlows: page } } })
const sent = (call: number) => request.mock.calls[call][0].data
const NOW = new Date('2026-11-10T19:00:00.000Z')

beforeEach(() => {
  request.mockReset()
  resetExitFlows()
})

describe('what the API serves of exitFlows', () => {
  it('the query and every field a flow has, with the page’s cursor', () => {
    const served = parseUserExitFlows(schema().data.data)
    expect(served.field?.name).toBe('exitFlows')
    expect(served.selection).toMatch(
      /^flows \{ id exitId start end destination up down exit exitName .*\} next from to$/
    )
    expect(served.selection).toContain('personEmail')
    expect(served.selection).not.toContain('source')
  })

  it('none on an API without it, or without paging, or a flow without its id', () => {
    expect(parseUserExitFlows(schema({ query: false }).data.data).field).toBeUndefined()
    expect(parseUserExitFlows(schema({ args: ARGS.filter(a => a.name !== 'after') }).data.data).field).toBeUndefined()
    expect(parseUserExitFlows(schema({ page: ['flows'] }).data.data).field).toBeUndefined()
    expect(parseUserExitFlows(schema({ flow: FIELDS.filter(f => f !== 'id') }).data.data).field).toBeUndefined()
    expect(parseUserExitFlows(undefined).field).toBeUndefined()
  })

  it('reads the schema once; an older API sends nothing', async () => {
    request.mockResolvedValue(schema({ query: false }))
    expect(await exitFlowsServed()).toBe(false)
    expect(await exitFlowsServed()).toBe(false)
    expect(await fetchExitFlows({ deviceId: 'D1' }, { hours: 24 })).toBe('UNSUPPORTED')
    expect(request).toHaveBeenCalledTimes(1)
  })
})

describe('a page', () => {
  it('a device’s, over the window ending when it was first read, and the next page from next', async () => {
    request
      .mockResolvedValueOnce(schema())
      .mockResolvedValueOnce(
        answer({ flows: [FLOW], next: 'c1', from: '2026-11-09T19:00:00.000Z', to: NOW.toISOString() })
      )
      .mockResolvedValueOnce(answer({ flows: [], next: null, from: '2026-11-09T19:00:00.000Z', to: NOW.toISOString() }))
    const first = await fetchExitFlows({ deviceId: 'D1' }, { hours: 24, now: NOW })
    expect(first).toEqual({ flows: [FLOW], next: 'c1', from: '2026-11-09T19:00:00.000Z', to: NOW.toISOString() })
    const { query, variables } = sent(1)
    expect(variables).toEqual({ deviceId: 'D1', from: '2026-11-09T19:00:00.000Z', to: NOW.toISOString(), limit: 50 })
    expect(query).toContain('exitFlows(deviceId: $deviceId, from: $from, to: $to, limit: $limit)')
    await fetchExitFlows({ deviceId: 'D1' }, { hours: 24, now: NOW }, 'c1')
    expect(sent(2).variables).toMatchObject({ deviceId: 'D1', after: 'c1', to: NOW.toISOString() })
  })

  it('an exit’s', async () => {
    request.mockResolvedValueOnce(schema()).mockResolvedValueOnce(answer({ flows: [], next: null }))
    expect(await fetchExitFlows({ exitId: 'home' }, { hours: 1, now: NOW })).toEqual({
      flows: [],
      next: null,
      from: null,
      to: null,
    })
    expect(sent(1).variables).toMatchObject({ exitId: 'home', from: '2026-11-10T18:00:00.000Z' })
  })

  it('a refusal in graphql’s words; an answer without flows an error', async () => {
    request
      .mockResolvedValueOnce(schema())
      .mockResolvedValueOnce({ data: { errors: [{ message: 'the window is at most 31 days' }] } })
      .mockResolvedValueOnce(answer(null))
    expect(await fetchExitFlows({ deviceId: 'D1' }, { hours: 24 })).toEqual({ reason: 'The window is at most 31 days' })
    expect(await fetchExitFlows({ deviceId: 'D1' }, { hours: 24 })).toBe('ERROR')
  })
})

describe('pages put together', () => {
  it('a flow logged twice, on two pages, is shown once', () => {
    const a = { ...FLOW, id: 'a' }
    const b = { ...FLOW, id: 'b' }
    const c = { ...FLOW, id: 'c' }
    expect(appendFlows([a, b], [b, c, c]).map(f => f.id)).toEqual(['a', 'b', 'c'])
  })
})
