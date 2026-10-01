import { describe, it, expect, vi, beforeEach } from 'vitest'

const { uiSet, request } = vi.hoisted(() => ({ uiSet: vi.fn(), request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: uiSet, deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import { UNSUPPORTED, graphQLDeviceDaemon, runningVersion, updating } from './graphQLDaemon'
import { selectDeviceSessions } from '../hooks/useDeviceSessions'
import { exposes, graphQLDeviceNetworks, initiates, roleFor, targeted } from './graphQLDeviceNetworks'

const daemon = {
  deviceId: '80:00:00:00:00:00:00:01',
  running: '5.6.1.1',
  target: { version: '5.6.1.2', rollback: false },
  update: { version: '5.6.1.2', state: 'downloading', detail: null },
  channel: 'stable',
  hold: false,
}

beforeEach(() => {
  request.mockReset()
  uiSet.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('reading the device agent', () => {
  it('returns what graphql says', async () => {
    request.mockResolvedValue({ data: { data: { deviceDaemon: daemon } }, headers: {} })
    expect(await graphQLDeviceDaemon(daemon.deviceId)).toEqual(daemon)
  })

  it('an API without device sessions: UNSUPPORTED, and no error banner', async () => {
    request.mockResolvedValue({
      data: { errors: [{ message: 'Cannot query field "deviceDaemon" on type "Query".' }] },
      headers: {},
    })
    expect(await graphQLDeviceDaemon(daemon.deviceId)).toBe(UNSUPPORTED)
    expect(uiSet).not.toHaveBeenCalled()
  })

  it('a field this build asks for that the API lacks, beside device sessions: ERROR, not UNSUPPORTED', async () => {
    request.mockResolvedValue({
      data: { errors: [{ message: 'Cannot query field "pinned" on type "DeviceDaemon".' }] },
      headers: {},
    })
    expect(await graphQLDeviceDaemon(daemon.deviceId)).toBe('ERROR')
  })

  it('any other error: ERROR, still silent', async () => {
    request.mockResolvedValue({ data: { errors: [{ message: 'boom' }] }, headers: {} })
    expect(await graphQLDeviceDaemon(daemon.deviceId)).toBe('ERROR')
    expect(uiSet).not.toHaveBeenCalled()
  })
})

describe('runningVersion', () => {
  it("drops the daemon's name", () => {
    expect(runningVersion({ ...daemon, running: 'connectd-go 5.6.1.20261001' } as any)).toBe('5.6.1.20261001')
    expect(runningVersion({ ...daemon, running: null } as any)).toBe(null)
  })
})

describe('updating', () => {
  it('is true while an upgrade is under way, and not once it settles', () => {
    for (const state of ['pending', 'started', 'downloading', 'installing'])
      expect(updating({ ...daemon, update: { ...daemon.update, state } } as any)).toBe(true)
    for (const state of ['installed', 'failed', 'refused'])
      expect(updating({ ...daemon, update: { ...daemon.update, state } } as any)).toBe(false)
    expect(updating({ ...daemon, update: null } as any)).toBe(false)
  })
})

describe('the device-sessions flag', () => {
  it('is on only with Test UI on as well', () => {
    const at = (ui: object) => selectDeviceSessions({ ui } as any)
    expect(at({ testUI: 'HIGHLIGHT', deviceSessions: true })).toBe(true)
    expect(at({ testUI: 'ON', deviceSessions: true })).toBe(true)
    expect(at({ testUI: undefined, deviceSessions: true })).toBe(false)
    expect(at({ testUI: 'ON', deviceSessions: undefined })).toBe(false)
  })
})

describe('device networks', () => {
  it("reads the account's networks; an API without device networks is UNSUPPORTED, silently; any other refused field is an ERROR", async () => {
    const network = {
      id: 'N',
      name: 'factory',
      kind: 'NETWORK',
      devices: [{ deviceId: 'A', role: 'BOTH', scope: 'ALL', anyPort: true }],
    }
    request.mockResolvedValue({ data: { data: { login: { account: { networks: [network] } } } }, headers: {} })
    expect(await graphQLDeviceNetworks('ACCOUNT')).toEqual([network])

    request.mockResolvedValue({
      data: {
        errors: [
          { message: 'Cannot query field "kind" on type "Network".' },
          { message: 'Cannot query field "devices" on type "Network".' },
        ],
      },
      headers: {},
    })
    expect(await graphQLDeviceNetworks('ACCOUNT')).toBe(UNSUPPORTED)
    expect(uiSet).not.toHaveBeenCalled()

    // An API with device networks that lacks one field this build asks for: the build and the API disagree.
    request.mockResolvedValue({
      data: { errors: [{ message: 'Cannot query field "tagsEditable" on type "Network".' }] },
      headers: {},
    })
    expect(await graphQLDeviceNetworks('ACCOUNT')).toBe('ERROR')
  })

  it('a device that is both initiates and is a target', () => {
    expect([initiates({ role: 'BOTH' }), targeted({ role: 'BOTH' })]).toEqual([true, true])
    expect([initiates({ role: 'TARGET' }), targeted({ role: 'INITIATOR' })]).toEqual([false, false])
  })
})

describe("a network member's choices", () => {
  const member = (fields: object) =>
    ({ deviceId: 'A', role: 'TARGET', scope: 'LISTED', anyPort: false, ...fields } as any)
  const network = (listed: string[] = []) =>
    ({ connections: listed.map(id => ({ service: { id: `${id}-S`, device: { id } } })) } as any)

  it('is a target once it exposes something: all its services, any port, or a service the network lists', () => {
    expect(exposes(network(), member({}))).toBe(false) // just added: nothing chosen
    expect(exposes(network(), member({ scope: 'ALL' }))).toBe(true)
    expect(exposes(network(), member({ anyPort: true }))).toBe(true)
    expect(exposes(network(['A']), member({}))).toBe(true)
    expect(exposes(network(['B']), member({}))).toBe(false)
    expect(exposes(network(), member({ role: 'INITIATOR', scope: 'ALL' }))).toBe(false) // an initiator's stored scope
  })

  it('makes the role: initiator switched on, target when exposing, both, or a target exposing nothing', () => {
    expect([roleFor(true, true), roleFor(true, false), roleFor(false, true), roleFor(false, false)]).toEqual([
      'BOTH',
      'INITIATOR',
      'TARGET',
      'TARGET',
    ])
  })
})
