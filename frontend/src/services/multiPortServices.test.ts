import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import {
  isMultiPort,
  multiPortServicesOn,
  multiPortServicesServed,
  parsePorts,
  resetMultiPortServices,
} from './multiPortServices'
import { graphQLAddService, graphQLUpdateService } from './graphQLMutation'

const t = ((_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any

const schema = (service: string[], user: string[]) => ({
  data: {
    data: {
      service: { fields: service.map(name => ({ name })) },
      user: { fields: user.map(name => ({ name })) },
    },
  },
})
const sent = (call: number) => request.mock.calls[call][0].data

beforeEach(() => {
  request.mockReset()
  resetMultiPortServices()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('multi-port services: what the API serves', () => {
  it('served only where Service has ports and User has multiPortServices; asked once', async () => {
    request.mockResolvedValueOnce(schema(['id', 'port', 'ports'], ['id', 'multiPortServices']))
    expect(await multiPortServicesServed()).toBe(true)
    expect(await multiPortServicesServed()).toBe(true)
    expect(request).toHaveBeenCalledTimes(1)

    resetMultiPortServices()
    request.mockResolvedValueOnce(schema(['id', 'port'], ['id']))
    expect(await multiPortServicesServed()).toBe(false)

    resetMultiPortServices()
    request.mockResolvedValueOnce(schema(['id', 'port', 'ports'], ['id']))
    expect(await multiPortServicesServed()).toBe(false)
  })

  it('an older API is never asked for the account’s flag', async () => {
    request.mockResolvedValueOnce(schema(['id', 'port'], ['id']))
    expect(await multiPortServicesOn('A')).toBe(false)
    expect(request).toHaveBeenCalledTimes(1)
    expect(sent(0).query).not.toMatch(/login|multiPortServices/)
  })

  it('the account’s answer, read once per account', async () => {
    request
      .mockResolvedValueOnce(schema(['ports'], ['multiPortServices']))
      .mockResolvedValueOnce({ data: { data: { login: { id: 'U', account: { id: 'A', multiPortServices: true } } } } })
      .mockResolvedValueOnce({ data: { data: { login: { id: 'U', account: null } } } })
    expect(await multiPortServicesOn('A')).toBe(true)
    expect(sent(1).variables).toEqual({ accountId: 'A' })
    expect(await multiPortServicesOn('A')).toBe(true)
    expect(await multiPortServicesOn('B')).toBe(false) // an account not visible: off
    expect(await multiPortServicesOn(undefined)).toBe(false)
    expect(request).toHaveBeenCalledTimes(3)
  })
})

describe('multi-port services: the list', () => {
  it('ports and ranges by graphql’s rules, in the order typed', () => {
    expect(parsePorts(t, '5900, 5901-5910')).toEqual({ ports: ['5900', '5901-5910'] })
    expect(parsePorts(t, ' 554 5004-5005,7000 ')).toEqual({ ports: ['554', '5004-5005', '7000'] })
    expect(parsePorts(t, '1-65535')).toEqual({ ports: ['1-65535'] })
    expect(parsePorts(t, '22-22, 080')).toEqual({ ports: ['22', '80'] })
    expect(parsePorts(t, '').error).toBe('At least one port')
    expect(parsePorts(t, '', false)).toEqual({ ports: [] })
    for (const bad of ['0', '65536', '5910-5900', '1-2-3', 'ssh', '-5', '22-'])
      expect(parsePorts(t, bad).error).toMatch(/^.*: a port 1 to 65535/)
    expect(parsePorts(t, Array.from({ length: 101 }, (_, i) => i + 1).join(',')).error).toBe('At most 100 entries')
    expect(parsePorts(t, Array.from({ length: 100 }, (_, i) => i + 1).join(',')).ports).toHaveLength(100)
  })

  it('multi-port: a second entry, or a first that is a range', () => {
    expect(isMultiPort({ ports: ['22'] })).toBe(false)
    expect(isMultiPort({})).toBe(false)
    expect(isMultiPort({ ports: ['22', '2222'] })).toBe(true)
    expect(isMultiPort({ ports: ['5900-5910'] })).toBe(true)
  })

  it('the mutations name ports only when given', async () => {
    request.mockResolvedValue({ data: { data: { addService: { id: 'S' }, updateService: { id: 'S' } } } })
    await graphQLAddService({
      deviceId: 'D',
      name: 'vnc',
      application: 4,
      host: '127.0.0.1',
      port: 5900,
      enabled: true,
    })
    expect(sent(0).query).not.toMatch(/ports/)
    await graphQLUpdateService({ id: 'S', port: 5900 })
    expect(sent(1).query).not.toMatch(/ports/)
    await graphQLUpdateService({ id: 'S', port: 5900, ports: ['5900', '5901-5910'] })
    expect(sent(2).query).toMatch(/\$ports: \[String!\]/)
    expect(sent(2).query).toMatch(/ports: \$ports/)
    expect(sent(2).variables.ports).toEqual(['5900', '5901-5910'])
  })
})
