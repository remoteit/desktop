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

beforeEach(() => {
  request.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('graphQLDeviceAbout', () => {
  it('reads the device’s about and its history', async () => {
    const about = { os: { name: 'macOS', version: '14.6' }, reported: '2026-10-01T20:00:00Z', hardwareChanged: null }
    const history = [
      { at: '2026-10-01T20:00:00Z', kind: 'field', field: 'software.package', before: '1.0.0', after: '1.0.1' },
    ]
    request.mockResolvedValue({ data: { data: { login: { device: [{ id: 'A', about, aboutHistory: history }] } } } })
    expect(await graphQLDeviceAbout('A')).toEqual({ about, history })
    expect(request.mock.calls[0][0].data.variables).toEqual({ id: ['A'] })
  })

  it('answers none for a device that has said nothing', async () => {
    request.mockResolvedValue({ data: { data: { login: { device: [{ id: 'A', about: null, aboutHistory: [] }] } } } })
    expect(await graphQLDeviceAbout('A')).toEqual({ about: null, history: [] })
  })

  it('asks for the NAT class, and asks again without it of an API from before it', async () => {
    const about = { os: { name: 'macOS' }, reported: '2026-10-01T20:00:00Z', hardwareChanged: null }
    request
      .mockResolvedValueOnce({ data: { errors: [{ message: 'Cannot query field "nat" on type "DeviceAbout".' }] } })
      .mockResolvedValueOnce({ data: { data: { login: { device: [{ id: 'A', about, aboutHistory: [] }] } } } })
    expect(await graphQLDeviceAbout('A')).toEqual({ about, history: [] })
    expect(request.mock.calls[0][0].data.query).toMatch(/nat \{ mapping filtering since note why \}/)
    expect(request.mock.calls[1][0].data.query).not.toMatch(/nat \{/)
    expect(request.mock.calls[1][0].data.query).toMatch(/accounts \{/)
  })

  it('asks for the machine’s accounts and its new administrators', async () => {
    const about = {
      os: { name: 'Ubuntu' },
      accounts: [
        {
          account: '1001',
          name: 'jsmith',
          fullName: 'Jane Smith',
          kind: 'local',
          admin: true,
          hidden: null,
          disabled: null,
          guid: null,
          remoteit: null,
        },
      ],
      accountsMore: 3,
      adminsAdded: [{ name: 'jsmith', at: '2026-11-12T10:00:00Z' }],
      reported: '2026-11-12T10:00:00Z',
      hardwareChanged: null,
    }
    request.mockResolvedValue({ data: { data: { login: { device: [{ id: 'A', about, aboutHistory: [] }] } } } })
    expect(await graphQLDeviceAbout('A')).toEqual({ about, history: [] })
    const query = request.mock.calls[0][0].data.query
    expect(query).toMatch(/accounts \{ account name fullName kind admin hidden disabled guid remoteit \}/)
    expect(query).toMatch(/accountsMore/)
    expect(query).toMatch(/adminsAdded \{ name at \}/)
  })

  it('asks again without the accounts of an API from before them, keeping the NAT class', async () => {
    const about = { os: { name: 'macOS' }, reported: '2026-10-01T20:00:00Z', hardwareChanged: null }
    request
      .mockResolvedValueOnce({
        data: {
          errors: [
            { message: 'Cannot query field "accounts" on type "DeviceAbout".' },
            { message: 'Cannot query field "accountsMore" on type "DeviceAbout".' },
            { message: 'Cannot query field "adminsAdded" on type "DeviceAbout".' },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { data: { login: { device: [{ id: 'A', about, aboutHistory: [] }] } } } })
    expect(await graphQLDeviceAbout('A')).toEqual({ about, history: [] })
    expect(request).toHaveBeenCalledTimes(2)
    expect(request.mock.calls[1][0].data.query).not.toMatch(/accounts|adminsAdded/)
    expect(request.mock.calls[1][0].data.query).toMatch(/nat \{/)
  })

  it('an API without either is asked once more, without both', async () => {
    const about = { os: { name: 'macOS' }, reported: '2026-10-01T20:00:00Z', hardwareChanged: null }
    request
      .mockResolvedValueOnce({
        data: {
          errors: [
            { message: 'Cannot query field "nat" on type "DeviceAbout".' },
            { message: 'Cannot query field "accounts" on type "DeviceAbout".' },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { data: { login: { device: [{ id: 'A', about, aboutHistory: [] }] } } } })
    expect(await graphQLDeviceAbout('A')).toEqual({ about, history: [] })
    expect(request).toHaveBeenCalledTimes(2)
    expect(request.mock.calls[1][0].data.query).not.toMatch(/nat \{|accounts/)
  })

  it('answers UNSUPPORTED where the API does not serve device sessions', async () => {
    request.mockResolvedValue({ data: { errors: [{ message: 'Cannot query field "about" on type "Device".' }] } })
    expect(await graphQLDeviceAbout('A')).toBe(UNSUPPORTED)
  })
})
