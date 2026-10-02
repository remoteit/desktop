import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import { UNSUPPORTED } from './graphQLDaemon'
import { graphQLDeviceAbout } from './graphQLDeviceAbout'
import { fieldLabel } from '../components/DeviceAbout'

beforeEach(() => {
  request.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('graphQLDeviceAbout', () => {
  it('reads the device’s about and its history', async () => {
    const about = { os: { name: 'macOS', version: '14.6' }, reported: '2026-10-01T20:00:00Z', hardwareChanged: null }
    const history = [{ at: '2026-10-01T20:00:00Z', kind: 'field', field: 'software.package', before: '1.0.0', after: '1.0.1' }]
    request.mockResolvedValue({ data: { data: { login: { device: [{ id: 'A', about, aboutHistory: history }] } } } })
    expect(await graphQLDeviceAbout('A')).toEqual({ about, history })
    expect(request.mock.calls[0][0].data.variables).toEqual({ id: ['A'] })
  })

  it('answers none for a device that has said nothing', async () => {
    request.mockResolvedValue({ data: { data: { login: { device: [{ id: 'A', about: null, aboutHistory: [] }] } } } })
    expect(await graphQLDeviceAbout('A')).toEqual({ about: null, history: [] })
  })

  it('answers UNSUPPORTED where the API does not serve device sessions', async () => {
    request.mockResolvedValue({ data: { errors: [{ message: 'Cannot query field "about" on type "Device".' }] } })
    expect(await graphQLDeviceAbout('A')).toBe(UNSUPPORTED)
  })
})

describe('fieldLabel', () => {
  it('names a field as a person reads it, and leaves one it does not know as its path', () => {
    expect(fieldLabel('os.version')).toBe('OS version')
    expect(fieldLabel('ids.something_new')).toBe('ids.something_new')
  })
})
