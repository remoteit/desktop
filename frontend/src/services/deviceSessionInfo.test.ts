import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request, state } = vi.hoisted(() => ({ request: vi.fn(), state: { ui: {} } as Record<string, any> }))
vi.mock('../store', () => ({
  store: { getState: () => state, dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({
  apiRequest: vi.fn((_method, _url, send, sub) => send({ authorization: `token-of:${sub ?? 'primary'}` })),
}))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import {
  deviceSessionInfo,
  requestDeviceSessionInfo,
  requestServiceSessionInfo,
  resetDeviceSessionInfo,
  subscribeDeviceSessionInfo,
} from './deviceSessionInfo'

const settled = () =>
  new Promise<void>(resolve => {
    const stop = subscribeDeviceSessionInfo(() => {
      stop()
      resolve()
    })
  })

beforeEach(() => {
  resetDeviceSessionInfo()
  Object.keys(state).forEach(key => delete state[key])
  state.ui = {}
  request.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('device session info', () => {
  it('reads every row that asks in the same moment in one query, and keeps them', async () => {
    request.mockResolvedValue({
      data: {
        data: {
          login: {
            device: [
              {
                id: 'A',
                subnetName: 'kitchen-pi.acme.on.remote.it',
                actsFor: null,
                agent: { running: 'connectd-go 5.6.1.1', update: null },
              },
              {
                id: 'B',
                subnetName: 'laptop.acme.on.remote.it',
                actsFor: { email: 'ada@acme.test' },
                agent: null,
                services: [{ id: 'B-WEB', subnetName: 'web.laptop.acme.on.remote.it' }],
              },
            ],
          },
        },
      },
      headers: {},
    })
    const done = settled()
    requestDeviceSessionInfo('A')
    requestDeviceSessionInfo('B')
    requestDeviceSessionInfo('C')
    await done
    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][0].data.query).toContain('["A","B","C"]')
    expect(deviceSessionInfo('A')).toEqual({
      subnetName: 'kitchen-pi.acme.on.remote.it',
      actsFor: null,
      agent: { running: 'connectd-go 5.6.1.1', update: null },
      services: {},
      serviceNames: {},
    })
    expect(deviceSessionInfo('B')).toEqual({
      subnetName: 'laptop.acme.on.remote.it',
      actsFor: 'ada@acme.test',
      agent: null,
      services: { 'B-WEB': 'web.laptop.acme.on.remote.it' },
      serviceNames: { 'B-WEB': { own: false, port: null, ports: null, defaultLabel: null } },
    })
    expect(deviceSessionInfo('C')).toEqual({ subnetName: null, actsFor: null, agent: null }) // asked, not answered: none, and not asked again
    requestDeviceSessionInfo('A')
    requestDeviceSessionInfo('C')
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('an API without the field is asked once', async () => {
    request.mockResolvedValue({
      data: { errors: [{ message: 'Cannot query field "subnetName" on type "Device".' }] },
      headers: {},
    })
    const done = settled()
    requestDeviceSessionInfo('A')
    await done
    expect(deviceSessionInfo('A')).toEqual({ subnetName: null, actsFor: null, agent: null })
    requestDeviceSessionInfo('B')
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(request).toHaveBeenCalledTimes(1)
  })

  // presence-server docs/subnet-service-names.md: each service's own name and its port, where the API has them.
  it("reads each service's own name and port where the API has them, and again without them where it does not", async () => {
    request.mockResolvedValueOnce({
      data: {
        data: {
          login: {
            device: [
              {
                id: 'A',
                subnetName: 'pi-acme.on.remote.it',
                actsFor: null,
                agent: null,
                services: [
                  {
                    id: 'CONSOLE',
                    subnetName: 'piconsole-acme.on.remote.it',
                    subnetOwnName: true,
                    subnetPort: 22,
                    subnetPorts: ['22 → 2222', '2222'],
                    subnetDefaultLabel: 'piconsole',
                  },
                ],
              },
            ],
          },
        },
      },
      headers: {},
    })
    let done = settled()
    requestDeviceSessionInfo('A')
    await done
    expect(request.mock.calls[0][0].data.query).toContain(
      'services { id subnetName subnetOwnName subnetPort subnetPorts subnetDefaultLabel }'
    )
    expect(deviceSessionInfo('A')?.serviceNames).toEqual({
      CONSOLE: { own: true, port: 22, ports: ['22 → 2222', '2222'], defaultLabel: 'piconsole' },
    })

    // An API with service names but not their ports: asked again without the ports alone.
    resetDeviceSessionInfo()
    request.mockReset()
    request.mockResolvedValueOnce({
      data: { errors: [{ message: 'Cannot query field "subnetPorts" on type "Service".' }] },
      headers: {},
    })
    request.mockResolvedValueOnce({
      data: {
        data: {
          login: {
            device: [
              {
                id: 'A',
                subnetName: null,
                actsFor: null,
                agent: null,
                services: [
                  { id: 'CONSOLE', subnetName: 'piconsole-acme.on.remote.it', subnetOwnName: true, subnetPort: 22 },
                ],
              },
            ],
          },
        },
      },
      headers: {},
    })
    done = settled()
    requestDeviceSessionInfo('A')
    await done
    expect(request.mock.calls[1][0].data.query).toContain('services { id subnetName subnetOwnName subnetPort }')
    expect(deviceSessionInfo('A')?.serviceNames).toEqual({ CONSOLE: { own: true, port: 22 } })

    resetDeviceSessionInfo()
    request.mockReset()
    request.mockResolvedValueOnce({
      data: { errors: [{ message: 'Cannot query field "subnetOwnName" on type "Service".' }] },
      headers: {},
    })
    request.mockResolvedValueOnce({
      data: { data: { login: { device: [{ id: 'A', subnetName: null, actsFor: null, agent: null, services: [] }] } } },
      headers: {},
    })
    done = settled()
    requestDeviceSessionInfo('A')
    await done
    expect(request).toHaveBeenCalledTimes(2)
    expect(request.mock.calls[1][0].data.query).not.toContain('subnetOwnName')
    expect(deviceSessionInfo('A')?.serviceNames).toBeUndefined()
  })

  it('asks who upgrades each agent where the API has it, and again without it where it does not', async () => {
    request.mockResolvedValueOnce({
      data: { errors: [{ message: 'Cannot query field "howToUpdate" on type "DeviceAgent".' }] },
      headers: {},
    })
    request.mockResolvedValueOnce({
      data: {
        data: {
          login: {
            device: [
              { id: 'A', subnetName: null, actsFor: null, agent: { running: 'connectd-go 5.6.1.1', update: null } },
            ],
          },
        },
      },
      headers: {},
    })
    const done = settled()
    requestDeviceSessionInfo('A')
    await done
    expect(request).toHaveBeenCalledTimes(2)
    expect(request.mock.calls[0][0].data.query).toContain('updatedBy howToUpdate available')
    expect(request.mock.calls[1][0].data.query).not.toContain('howToUpdate')
    expect(deviceSessionInfo('A')?.agent?.running).toBe('connectd-go 5.6.1.1')
  })

  it('reads a device again for a service its answer does not list, keeping what it has meanwhile, once', async () => {
    const answer = (services: { id: string; subnetName: string | null }[]) => ({
      data: {
        data: {
          login: { device: [{ id: 'MAC', subnetName: 'mac.on.remote.it', actsFor: null, agent: null, services }] },
        },
      },
      headers: {},
    })
    request.mockResolvedValueOnce(answer([{ id: 'SSH', subnetName: 'ssh.mac.on.remote.it' }]))
    let done = settled()
    requestDeviceSessionInfo('MAC')
    await done

    requestServiceSessionInfo('MAC', 'SSH') // listed: nothing to read
    expect(request).toHaveBeenCalledTimes(1)

    request.mockResolvedValueOnce(
      answer([
        { id: 'SSH', subnetName: 'ssh.mac.on.remote.it' },
        { id: 'VNC', subnetName: 'vnc.mac.on.remote.it' },
      ])
    )
    done = settled()
    requestServiceSessionInfo('MAC', 'VNC')
    expect(deviceSessionInfo('MAC')?.services).toEqual({ SSH: 'ssh.mac.on.remote.it' }) // kept while it is read
    await done
    expect(request).toHaveBeenCalledTimes(2)
    expect(deviceSessionInfo('MAC')?.services).toEqual({
      SSH: 'ssh.mac.on.remote.it',
      VNC: 'vnc.mac.on.remote.it',
    })

    request.mockResolvedValueOnce(answer([{ id: 'SSH', subnetName: 'ssh.mac.on.remote.it' }]))
    done = settled()
    requestServiceSessionInfo('MAC', 'GONE')
    await done
    requestServiceSessionInfo('MAC', 'GONE') // still not listed: not asked again
    await new Promise(resolve => setTimeout(resolve))
    expect(request).toHaveBeenCalledTimes(3)
  })

  it('does not read a device not read yet for a service', () => {
    requestServiceSessionInfo('NEW', 'VNC')
    expect(request).not.toHaveBeenCalled()
  })
})

// The ids are in the query's text, where nothing reads whose they are: each sign-in is asked about its own devices.
describe('with several sign-ins in use', () => {
  it('asks each sign-in about the devices it serves, in a query of its own', async () => {
    Object.assign(state, {
      auth: { user: { id: 'me' } },
      user: { email: 'me@x.test' },
      accounts: {
        membership: [],
        signIns: { 'sub-work': { sub: 'sub-work', id: 'work', email: 'work@x.test', membership: [] } },
      },
      devices: { me: { all: [{ id: 'A', services: [] }] }, work: { all: [{ id: 'B', services: [] }] } },
    })
    request.mockImplementation(async ({ data }: { data: { query: string } }) => ({
      data: {
        data: {
          login: {
            device: ['A', 'B'].filter(id => data.query.includes(`"${id}"`)).map(id => ({ id, subnetName: id })),
          },
        },
      },
      headers: {},
    }))
    requestDeviceSessionInfo('A')
    requestDeviceSessionInfo('B')
    await vi.waitFor(() => expect(deviceSessionInfo('B')?.subnetName).toBe('B'))
    expect(deviceSessionInfo('A')?.subnetName).toBe('A')
    const asked = request.mock.calls.map(([sent]) => [sent.headers.authorization, sent.data.query.match(/\[.*?\]/)[0]])
    expect(asked.sort()).toEqual([
      ['token-of:primary', '["A"]'],
      ['token-of:sub-work', '["B"]'],
    ])
  })
})
