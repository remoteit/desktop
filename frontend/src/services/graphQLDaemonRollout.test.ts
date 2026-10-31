import { describe, it, expect, vi, beforeEach } from 'vitest'

const { uiSet, request } = vi.hoisted(() => ({ uiSet: vi.fn(), request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: uiSet, deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql', getApiRestURL: () => '' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import { UNSUPPORTED } from './graphQLDaemon'
import {
  buildCall,
  graphQLDaemonChannels,
  graphQLDaemonRollout,
  graphQLDaemonRollouts,
  graphQLRolloutMutation,
  parseRolloutSchema,
  resetRolloutSchema,
  typeString,
} from './graphQLDaemonRollout'

const scalar = (name: string) => ({ kind: 'SCALAR', name })
const nonNull = (ofType: any) => ({ kind: 'NON_NULL', ofType })
const list = (ofType: any) => ({ kind: 'LIST', ofType })
const object = (name: string) => ({ kind: 'OBJECT', name })
const fields = (...names: string[]) => ({ fields: names.map(name => ({ name })) })

// The contract's schema, as graphql's introspection answers it.
const CONTRACT = {
  query: {
    fields: [
      { name: 'daemonChannels', args: [] },
      {
        name: 'daemonRollouts',
        args: [
          { name: 'channel', type: scalar('String') },
          { name: 'limit', type: scalar('Int') },
          { name: 'active', type: scalar('Boolean') },
        ],
      },
      { name: 'daemonRollout', args: [{ name: 'id', type: nonNull(scalar('ID')) }] },
    ],
  },
  mutation: {
    fields: [
      {
        name: 'startDaemonRollout',
        type: nonNull(object('DaemonRolloutRun')),
        args: [
          { name: 'channel', type: nonNull(scalar('String')) },
          { name: 'candidateVersion', type: nonNull(scalar('String')) },
          { name: 'candidateManifest', type: nonNull(scalar('String')) },
          { name: 'ladder', type: list(nonNull(scalar('Int'))) },
          { name: 'failureThreshold', type: scalar('Int') },
          { name: 'promoteWhenDone', type: scalar('Boolean') },
        ],
      },
      {
        name: 'abortDaemonRollout',
        type: nonNull(object('DaemonRolloutRun')),
        args: [
          { name: 'id', type: nonNull(scalar('ID')) },
          { name: 'reason', type: scalar('String') },
        ],
      },
      {
        name: 'pauseDaemonRollout',
        type: nonNull(scalar('Boolean')),
        args: [{ name: 'id', type: nonNull(scalar('ID')) }],
      },
      { name: 'setDaemonChannel', type: object('DaemonChannel'), args: [] },
    ],
  },
  run: {
    fields: [
      ...['id', 'channel', 'mode', 'version', 'fromVersion', 'state', 'reason', 'percent', 'ladder', 'startedAt'].map(
        name => ({ name, args: [], type: scalar('String') })
      ),
      { name: 'startedBy', args: [], type: scalar('String') },
      { name: 'steps', args: [], type: list(object('DaemonRolloutStep')) },
      { name: 'events', args: [{ name: 'limit' }], type: list(object('DaemonRolloutEvent')) },
      { name: 'rollout', args: [], type: object('DaemonRollout') },
      { name: 'gates', args: [], type: object('DaemonRolloutGates') },
    ],
  },
  step: fields('percent', 'deliveredAt', 'peakCpu'),
  event: fields('at', 'kind', 'message'),
  gates: fields('presenceCpuMax', 'failures', 'stuck'),
  failure: fields('reason', 'devices'),
}

beforeEach(() => {
  request.mockReset()
  uiSet.mockReset()
  resetRolloutSchema()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

const answer = (data: any) => ({ data: { data }, headers: {} })
const sent = (call: number) => request.mock.calls[call][0].data

describe('the schema read', () => {
  it('asks a run only for the fields the API has', () => {
    const schema = parseRolloutSchema(CONTRACT)
    expect(schema.runs).toBe(true)
    expect(schema.list).toContain('fromVersion')
    expect(schema.list).not.toContain('rateCeiling') // not served here
    expect(schema.list).not.toContain('failureThreshold')
    expect(schema.list).toContain('steps { percent deliveredAt peakCpu }')
    expect(schema.list).toContain('gates { presenceCpuMax failures stuck }')
    expect(schema.list).not.toContain('events')
    expect(schema.detail).toContain('events(limit: 200) { at kind message }')
    expect(schema.detail).toContain('rollout {')
    expect(schema.detail).not.toContain('deviceIds')
    expect(Object.keys(schema.mutations).sort()).toEqual([
      'abortDaemonRollout',
      'pauseDaemonRollout',
      'startDaemonRollout',
    ])
  })

  it("reads startedBy's email where it is a user, and the failing devices and reviewed failures where served", () => {
    const schema = parseRolloutSchema({
      ...CONTRACT,
      run: {
        fields: [
          ...CONTRACT.run.fields.filter(f => f.name !== 'startedBy'),
          { name: 'startedBy', args: [], type: object('User') },
          { name: 'reviewedFailures', args: [], type: list(object('DaemonRolloutFailure')) },
          { name: 'failureThreshold', args: [], type: scalar('Int') },
        ],
      },
      failure: fields('reason', 'devices', 'deviceIds'),
    })
    expect(schema.list).toContain('startedBy { email }')
    expect(schema.list).toContain('failureThreshold')
    expect(schema.list).toContain('reviewedFailures { reason devices deviceIds }')
    expect(schema.detail).toContain('failures { reason devices deviceIds }')
  })

  it('an API without the controller has no runs', () => {
    expect(parseRolloutSchema({ query: fields('daemonChannels') }).runs).toBe(false)
  })
})

describe('calls built from the declared arguments', () => {
  it('types each variable as the API does and passes only those given (and the required)', () => {
    const schema = parseRolloutSchema(CONTRACT)
    const call = buildCall(
      'mutation',
      schema.mutations.startDaemonRollout!,
      {
        channel: 'beta',
        candidateVersion: '1.2',
        candidateManifest: 'https://m',
        ladder: [1, 50, 100],
        soakMinutes: 10,
      },
      schema.returns
    )
    expect(call.query).toContain('$ladder: [Int!]')
    expect(call.query).toContain('$channel: String!')
    expect(call.query).not.toContain('soakMinutes') // the API does not take it
    expect(call.query).not.toContain('failureThreshold') // not given
    expect(call.query).toContain('{ id state reason percent }')
    expect(call.variables).toEqual({
      channel: 'beta',
      candidateVersion: '1.2',
      candidateManifest: 'https://m',
      ladder: [1, 50, 100],
    })
  })

  it('selects nothing from a scalar result', () => {
    const schema = parseRolloutSchema(CONTRACT)
    const call = buildCall('mutation', schema.mutations.pauseDaemonRollout!, { id: 'R' }, schema.returns)
    expect(call.query).toMatch(/pauseDaemonRollout\(id: \$id\)\s*}/)
  })

  it('renders list and non-null types', () => {
    expect(typeString(nonNull(list(nonNull(scalar('Int')))))).toBe('[Int!]!')
  })
})

describe('reads', () => {
  it('channels: an API without them is UNSUPPORTED, silently', async () => {
    request.mockResolvedValue({
      data: { errors: [{ message: 'Cannot query field "daemonChannels" on type "Query".' }] },
      headers: {},
    })
    expect(await graphQLDaemonChannels()).toBe(UNSUPPORTED)
    expect(uiSet).not.toHaveBeenCalled()
  })

  it('runs: false where the API has no controller, without asking for them', async () => {
    request.mockResolvedValueOnce(answer({ query: fields('daemonChannels'), mutation: fields() }))
    expect(await graphQLDaemonRollouts()).toBe(false)
    expect(await graphQLDaemonRollout('R')).toBe(false)
    expect(request).toHaveBeenCalledTimes(1) // the schema, read once
  })

  it('runs: newest first, the id typed as declared', async () => {
    request.mockResolvedValueOnce(answer(CONTRACT))
    request.mockResolvedValueOnce(
      answer({
        daemonRollouts: [
          { id: 'A', state: 'done', startedAt: '2026-10-01T00:00:00Z' },
          { id: 'B', state: 'running', startedAt: '2026-10-30T00:00:00Z' },
        ],
      })
    )
    expect((await graphQLDaemonRollouts({ limit: 5 })) as any).toMatchObject([{ id: 'B' }, { id: 'A' }])
    expect(sent(1).variables).toEqual({ limit: 5 })
    request.mockResolvedValueOnce(answer({ daemonRollout: { id: 'B', state: 'running' } }))
    await graphQLDaemonRollout('B')
    expect(sent(2).query).toContain('$id: ID!')
  })
})

describe('mutations', () => {
  it("returns graphql's reason for a refusal", async () => {
    request.mockResolvedValueOnce(answer(CONTRACT))
    request.mockResolvedValueOnce({
      data: { errors: [{ message: 'refused', extensions: { message: 'a rollout is already running on beta' } }] },
      headers: {},
    })
    expect(await graphQLRolloutMutation('abortDaemonRollout', { id: 'R', reason: 'cpu' })).toEqual({
      ok: false,
      reason: 'A rollout is already running on beta',
    })
  })

  it('one the API lacks is not sent', async () => {
    request.mockResolvedValueOnce(answer(CONTRACT))
    expect(await graphQLRolloutMutation('skipDaemonRolloutStep', { id: 'R' })).toEqual({
      ok: false,
      reason: 'This API has no skipDaemonRolloutStep.',
    })
    expect(request).toHaveBeenCalledTimes(1)
  })
})
