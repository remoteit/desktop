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
import { graphQLDeviceNetworks, initiates, targeted } from './graphQLDeviceNetworks'

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
  it("reads the account's networks, and an API without device networks is UNSUPPORTED, silently", async () => {
    const network = {
      id: 'N',
      name: 'factory',
      kind: 'NETWORK',
      devices: [{ deviceId: 'A', role: 'BOTH', scope: 'ALL', anyPort: true }],
    }
    request.mockResolvedValue({ data: { data: { login: { account: { networks: [network] } } } }, headers: {} })
    expect(await graphQLDeviceNetworks('ACCOUNT')).toEqual([network])

    request.mockResolvedValue({
      data: { errors: [{ message: 'Cannot query field "devices" on type "Network".' }] },
      headers: {},
    })
    expect(await graphQLDeviceNetworks('ACCOUNT')).toBe(UNSUPPORTED)
    expect(uiSet).not.toHaveBeenCalled()
  })

  it('a device that is both initiates and is a target', () => {
    expect([initiates({ role: 'BOTH' }), targeted({ role: 'BOTH' })]).toEqual([true, true])
    expect([initiates({ role: 'TARGET' }), targeted({ role: 'INITIATOR' })]).toEqual([false, false])
  })
})
