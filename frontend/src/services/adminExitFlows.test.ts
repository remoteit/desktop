import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request, isAxiosError: () => false } }))

import {
  adminExitFlowsServed,
  fetchAdminExitFlows,
  flowOpener,
  parseExitFlows,
  resetAdminExitFlows,
} from './adminExitFlows'

const scalar = (name: string) => ({ kind: 'SCALAR', name })
const nonNull = (ofType: any) => ({ kind: 'NON_NULL', name: null, ofType })
const arg = (name: string, type: any) => ({ name, type })

// graphql's adminExitFlows as solo serves it (ef358c8a): the complaint's address and/or port and time, the window.
const ARGS = [
  arg('at', nonNull(scalar('DateTime'))),
  arg('address', scalar('String')),
  arg('port', scalar('Int')),
  arg('withinMinutes', scalar('Int')),
  arg('laterHours', scalar('Int')),
  arg('limit', scalar('Int')),
]
const BEFORE_15 = [
  'exitId',
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
  'accountEmail',
]
const SINCE_15 = [...BEFORE_15, 'localAccount', 'personId', 'personEmail']

const schema = ({ query = true, args = ARGS, flow = SINCE_15, flows = ['flows', 'truncated', 'from', 'to'] } = {}) => ({
  data: {
    data: {
      query: {
        fields: [
          { name: 'login', args: [] },
          ...(query ? [{ name: 'adminExitFlows', args, type: nonNull({ kind: 'OBJECT', name: 'ExitFlows' }) }] : []),
        ],
      },
      flow: flow.length ? { fields: flow.map(name => ({ name })) } : null,
      flows: { fields: flows.map(name => ({ name })) },
    },
  },
})

const FLOW = {
  exitId: 'X1',
  start: '2026-11-10T18:00:00.000Z',
  end: '2026-11-10T18:02:00.000Z',
  accountId: 'A1',
  accountEmail: 'owner@example.com',
  clientId: 'C1',
  destination: '93.184.216.34:443',
  up: 1200,
  down: 34000,
  localAccount: '501',
  personId: 'P1',
  personEmail: 'pat@example.com',
}

const answer = (found: any) => ({ data: { data: { adminExitFlows: found } } })
const sent = (call: number) => request.mock.calls[call][0].data
const AT = new Date('2026-11-10T18:01:00.000Z')

beforeEach(() => {
  request.mockReset()
  resetAdminExitFlows()
})

describe('what the API serves of the exit flow lookup', () => {
  it('the query, its arguments as declared, and every field of a flow since §15', () => {
    const served = parseExitFlows(schema().data.data)
    expect(served.field?.name).toBe('adminExitFlows')
    expect(served.selection).toContain('localAccount personId personEmail')
    expect(served.selection).toMatch(/^flows \{ exitId start end destination up down .*\} truncated from to$/)
  })

  it('a graphql from before §15: the flows without the OS account and the person', () => {
    const served = parseExitFlows(schema({ flow: BEFORE_15 }).data.data)
    expect(served.field).toBeDefined()
    expect(served.selection).not.toMatch(/localAccount|personId|personEmail/)
    expect(served.selection).toContain('accountEmail')
  })

  it('none where the query, its time, or a flow’s core is missing', () => {
    expect(parseExitFlows(schema({ query: false }).data.data).field).toBeUndefined()
    expect(parseExitFlows(schema({ args: ARGS.slice(1) }).data.data).field).toBeUndefined()
    expect(parseExitFlows(schema({ flow: ['exitId', 'start'] }).data.data).field).toBeUndefined()
    expect(parseExitFlows(schema({ flows: ['truncated'] }).data.data).field).toBeUndefined()
    expect(parseExitFlows(undefined).field).toBeUndefined()
  })

  it('reads the schema once', async () => {
    request.mockResolvedValue(schema())
    expect(await adminExitFlowsServed()).toBe(true)
    expect(await adminExitFlowsServed()).toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
    expect(sent(0).query).toContain('__type(name: "ExitFlow")')
  })

  it('an older API: not served, and no lookup is sent', async () => {
    request.mockResolvedValue(schema({ query: false }))
    expect(await adminExitFlowsServed()).toBe(false)
    expect(await fetchAdminExitFlows({ at: AT, port: 443 })).toBe('UNSUPPORTED')
    expect(request).toHaveBeenCalledTimes(1)
  })
})

describe('a lookup', () => {
  it('passes only what was asked, typed as the API types it, and gives the flows found', async () => {
    request
      .mockResolvedValueOnce(schema())
      .mockResolvedValueOnce(
        answer({ flows: [FLOW], truncated: false, from: '2026-11-10T17:46:00.000Z', to: '2026-11-10T18:16:00.000Z' })
      )
    const found = await fetchAdminExitFlows({ at: AT, address: ' 203.0.113.7 ', withinMinutes: 15 })
    expect(found).toEqual({
      flows: [FLOW],
      truncated: false,
      from: '2026-11-10T17:46:00.000Z',
      to: '2026-11-10T18:16:00.000Z',
    })
    const { query, variables } = sent(1)
    expect(variables).toEqual({ at: '2026-11-10T18:01:00.000Z', address: '203.0.113.7', withinMinutes: 15 })
    expect(query).toContain('$at: DateTime!, $address: String, $withinMinutes: Int')
    expect(query).toContain('adminExitFlows(at: $at, address: $address, withinMinutes: $withinMinutes)')
    expect(query).toContain('localAccount personId personEmail')
  })

  it('says when more matched than were given', async () => {
    request
      .mockResolvedValueOnce(schema())
      .mockResolvedValueOnce(answer({ flows: [], truncated: true, from: null, to: null }))
    expect(await fetchAdminExitFlows({ at: AT, port: 443, limit: 1000 })).toEqual({
      flows: [],
      truncated: true,
      from: null,
      to: null,
    })
    expect(sent(1).variables).toEqual({ at: AT.toISOString(), port: 443, limit: 1000 })
  })

  it('a refusal in graphql’s words', async () => {
    request
      .mockResolvedValueOnce(schema())
      .mockResolvedValueOnce({ data: { errors: [{ message: 'this stage keeps no exit flow log' }] } })
    expect(await fetchAdminExitFlows({ at: AT, port: 443 })).toEqual({ reason: 'This stage keeps no exit flow log' })
  })

  it('an answer without its flows is an error', async () => {
    request.mockResolvedValueOnce(schema()).mockResolvedValueOnce(answer(null))
    expect(await fetchAdminExitFlows({ at: AT, port: 443 })).toBe('ERROR')
  })
})

describe('who opened a flow', () => {
  it('the person on their OS account, by email, else by ID', () => {
    expect(flowOpener(FLOW)).toBe('pat@example.com on account 501')
    expect(flowOpener({ ...FLOW, personEmail: null })).toBe('P1 on account 501')
  })

  it('the OS account alone where no one was signed in; the person alone where the account was not said', () => {
    expect(flowOpener({ localAccount: 'S-1-5-21-1-1001', personId: null })).toBe('OS account S-1-5-21-1-1001')
    expect(flowOpener({ personId: 'P1', personEmail: 'pat@example.com' })).toBe('pat@example.com')
    expect(flowOpener({})).toBeNull()
  })
})
