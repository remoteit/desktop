import { describe, it, expect } from 'vitest'
import type { TFunction } from 'i18next'
import type { ExitDevice, RunCandidate } from '../services/graphQLDeviceRuns'
import type { Exit } from '../services/graphQLExits'
import {
  RUN_ACTION,
  afterActionLine,
  candidateWhy,
  candidatesShown,
  carrierState,
  exitSummary,
  plainActionsFor,
  proxySummary,
  routedLine,
} from './exitWords'

const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
const t = ((_key: string, a: any, b?: any) =>
  typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a)) as TFunction

const run = (id: string, more: Partial<ExitDevice> = {}): ExitDevice => ({
  id,
  name: id,
  state: 'ACTIVE',
  joining: false,
  activeSince: null,
  drainingSince: null,
  checks: [],
  established: true,
  offering: true,
  refusal: null,
  health: null,
  disabled: false,
  lan: false,
  lanReason: null,
  ...more,
})

const candidate = (id: string, more: Partial<RunCandidate> = {}): RunCandidate => ({
  id,
  name: id,
  fit: true,
  refusal: null,
  runs: { proxy: null, exit: null },
  ...more,
})

describe('plain actions', () => {
  it('maps Pause, Resume, Approve, Stop now and Remove onto drain, undrain, retire and remove', () => {
    expect(RUN_ACTION).toEqual({
      PAUSE: 'DRAIN',
      RESUME: 'UNDRAIN',
      APPROVE: 'UNDRAIN',
      STOP: 'RETIRE',
      REMOVE: 'REMOVE',
    })
  })

  it('offers what applies in each state', () => {
    expect(plainActionsFor({ state: 'ACTIVE', joining: false })).toEqual(['PAUSE', 'REMOVE'])
    expect(plainActionsFor({ state: 'DRAINING', joining: false })).toEqual(['RESUME', 'STOP', 'REMOVE'])
    expect(plainActionsFor({ state: 'RETIRED', joining: false })).toEqual(['RESUME', 'REMOVE'])
    expect(plainActionsFor({ state: 'RETIRED', joining: true })).toEqual(['REMOVE'])
    expect(plainActionsFor({ state: 'RETIRED', joining: true }, 'admin')).toEqual(['APPROVE', 'REMOVE'])
  })

  it('names each state in a word or two', () => {
    expect(carrierState(t, run('a'))).toBe('On')
    expect(carrierState(t, run('a', { state: 'DRAINING' }))).toBe('Pausing')
    expect(carrierState(t, run('a', { state: 'RETIRED' }))).toBe('Paused')
    expect(carrierState(t, run('a', { joining: true }))).toBe('Starting')
    expect(carrierState(t, run('a', { offering: false }))).toBe('Not working')
    expect(carrierState(t, run('a', { disabled: true }))).toBe('Disabled')
  })

  it('says where the device stands after an action', () => {
    const exit = { id: 'E', name: 'Home' }
    expect(afterActionLine(t, 'exit', exit, 'rocky', { proxy: null, exit: null })).toBe('rocky was removed from Home.')
    expect(
      afterActionLine(t, 'exit', exit, 'rocky', {
        proxy: null,
        exit: { ...run('R', { state: 'DRAINING' }), exit: { id: 'E', name: 'Home', remoteit: false } },
      })
    ).toBe('rocky is now pausing.')
  })
})

describe('candidates', () => {
  it('leaves out client-only entries and the devices already in it, fit ones first', () => {
    const list = [
      candidate('zeta'),
      candidate('browser', { fit: false, refusal: 'it cannot be an exit (a client only)' }),
      candidate('alpha', { fit: false, refusal: 'its daemon is not online to say whether it can be an exit' }),
      candidate('beta'),
      candidate('in', {
        fit: false,
        refusal: 'it runs Home already',
        runs: { proxy: null, exit: { ...run('in'), exit: { id: 'E', name: 'Home', remoteit: false } } },
      }),
    ]
    expect(candidatesShown('exit', list, 'E').map(each => each.id)).toEqual(['beta', 'zeta', 'alpha'])
  })

  it('says why in words a person can act on, with how to allow it', () => {
    const forbidden = candidate('nas', {
      fit: false,
      refusal: "its administrator's policy forbids exits on this machine: it would never go into service",
    })
    const why = candidateWhy(t, 'exit', forbidden)
    expect(why.reason).toBe('Exits are turned off on this device.')
    expect(why.howTo?.join(' ')).toContain('--cap-add NET_ADMIN --device /dev/net/tun')
    expect(candidateWhy(t, 'exit', candidate('x', { fit: false, refusal: 'its daemon is not online to say' })).reason).toBe(
      'This device is offline. Bring it online to add it.'
    )
    expect(
      candidateWhy(t, 'exit', candidate('x', { fit: false, refusal: 'it uses Lab as its own exit: choose another for it first' }))
        .reason
    ).toBe('This device routes through Lab. Choose another exit for it first.')
  })
})

describe('summaries', () => {
  const exit = (devices: ExitDevice[] | null, more: Partial<Exit> = {}) =>
    ({ devices, offered: false, ...more } as Pick<Exit, 'devices' | 'offered'>)

  it('says whether an exit is ready and which devices carry it', () => {
    expect(exitSummary(t, exit([]))).toBe('No device yet')
    expect(exitSummary(t, exit([run('ux-exit')], { offered: true }))).toBe('Ready · carried by ux-exit')
    expect(exitSummary(t, exit([run('a', { joining: true, state: 'RETIRED' })]))).toBe('Starting · a')
    expect(exitSummary(t, exit([run('a', { state: 'RETIRED' })]))).toBe('Paused · a')
    expect(exitSummary(t, exit(null, { offered: true }))).toBe('Ready')
    expect(routedLine(t, 2)).toBe('2 devices route through it')
    expect(routedLine(t, 0)).toBe('')
  })

  it('says whether a proxy server is ready and how many public addresses it has', () => {
    expect(proxySummary(t, { devices: [], endpointCount: 0 })).toBe('No device yet')
    expect(proxySummary(t, { devices: [run('pi') as any], endpointCount: 1 })).toBe('Ready · on pi · 1 public address')
  })
})
