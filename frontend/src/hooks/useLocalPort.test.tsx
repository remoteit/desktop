import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const api = vi.hoisted(() => ({
  machine: { id: '80:00:00:00:00:00:00:A1', platform: 'mac' } as any,
  first: undefined as any, // the machine as first read, where it has changed since
  read: vi.fn(),
  open: vi.fn(),
  close: vi.fn(),
  ui: {} as any,
  auth: {} as any,
  accounts: undefined as any,
  devices: undefined as any,
  shell: undefined as any,
  agent: new Set<() => void>(),
}))
vi.mock('react-redux', () => ({
  useSelector: (select: any) => select({ ui: api.ui, auth: api.auth, accounts: api.accounts, devices: api.devices }),
}))
vi.mock('./useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('../services/browser', () => ({ default: { isIOS: false } }))
vi.mock('../services/thisDevice', () => ({ thisDevice: async () => api.shell }))
vi.mock('../services/localSubnet', () => ({
  beaconDevice: async () => null,
  onLocalAgent: (listener: () => void) => {
    api.agent.add(listener)
    return () => api.agent.delete(listener)
  },
}))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLRequestWithReason: vi.fn() }))
vi.mock('../services/localPorts', async importOriginal => ({
  ...(await importOriginal<typeof import('../services/localPorts')>()),
  thisMachine: async () => api.first ?? api.machine,
  thisMachineNow: async () => api.machine,
  graphQLLocalPort: (...args: unknown[]) => api.read(...args),
  openLocalPort: (...args: unknown[]) => api.open(...args),
  closeLocalPort: (...args: unknown[]) => api.close(...args),
}))

import { LocalPortState, useLocalPort } from './useLocalPort'
import { rowKey } from '../helpers/rowKey'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const SERVICE = '80:00:00:00:00:00:00:B2'
const PI = '80:00:00:00:00:00:00:C1'

describe('useLocalPort', () => {
  let root: Root
  let seen: LocalPortState

  const Probe: React.FC<{ serviceId: string; deviceId: string }> = ({ serviceId, deviceId }) => {
    seen = useLocalPort(serviceId, deviceId)
    return null
  }
  const render = async (deviceId = PI) => {
    await act(async () => root.render(<Probe serviceId={SERVICE} deviceId={deviceId} />))
  }

  beforeEach(() => {
    root = createRoot(document.createElement('div'))
    api.machine = { id: '80:00:00:00:00:00:00:A1', platform: 'mac' }
    api.first = undefined
    api.ui = {}
    api.auth = { user: { id: 'U1' } }
    api.accounts = undefined
    api.devices = undefined
    api.read.mockReset().mockResolvedValue(null)
    api.open.mockReset()
    api.shell = undefined
  })
  afterEach(() => act(() => root.unmount()))

  it("offered on a machine with our daemon, and its local port read", async () => {
    await render()
    expect(seen.offered).toBe(true)
    expect(api.read).toHaveBeenCalledWith(api.machine.id, SERVICE)
  })

  it('a daemon found here since the page loaded: offered then', async () => {
    const machine = api.machine
    api.machine = null
    await render()
    expect(seen.offered).toBe(false)
    api.machine = machine
    await act(async () => api.agent.forEach(told => told()))
    expect(seen.offered).toBe(true)
  })

  it("not for a service on this machine's own device", async () => {
    await render(api.machine.id)
    expect(seen.offered).toBe(false)
  })

  it('an iPhone: hidden, unless the Test UI switch is on', async () => {
    api.machine = { id: api.machine.id, platform: 'ios' }
    await render()
    expect(seen.offered).toBe(false)
    api.ui = { testUI: 'ON', localPortsOnPhone: true }
    await render()
    expect(seen.offered).toBe(true)
  })

  it("open: graphql's answer, or its refusal shown", async () => {
    await render()
    api.open.mockResolvedValueOnce({ reason: 'Port 8080 is web-pi\'s on this machine' })
    await act(() => seen.open(8080))
    expect(seen.error).toBe("Port 8080 is web-pi's on this machine")
    api.open.mockResolvedValueOnce({ port: 33000, open: true, state: 'listening' })
    await act(() => seen.open())
    expect(seen.local).toMatchObject({ port: 33000, open: true })
    expect(seen.error).toBeUndefined()
  })

  // Whose a port is (graphql-api docs/PROXY-GROUPS.md §15): opened by the app on this machine, for the person signed in
  // on its account, their account's; anywhere else, the machine's.
  it("the person signed in on this machine's account: their account's", async () => {
    api.machine = { ...api.machine, signIns: ['u1'] }
    await render()
    api.open.mockResolvedValue({ port: 33000, open: true, state: 'pending', scope: 'ACCOUNT' })
    await act(() => seen.open())
    expect(api.open).toHaveBeenCalledWith(api.machine.id, SERVICE, undefined, undefined, 'ACCOUNT')
  })

  it("someone else signed in on it, or a browser that cannot say: none asked, the machine's", async () => {
    api.open.mockResolvedValue({ port: 33000, open: true, state: 'pending' })
    for (const signedIn of ['U2', undefined]) {
      api.machine = { id: '80:00:00:00:00:00:00:A1', platform: 'mac', ...(signedIn && { signIns: [signedIn] }) }
      api.open.mockClear()
      await render()
      await act(() => seen.open())
      expect(api.open).toHaveBeenCalledWith(api.machine.id, SERVICE, undefined, undefined, undefined)
    }
  })

  // Several accounts signed in to the portal: the port is the person's whose sign-in serves the service's row.
  describe('a service another sign-in serves', () => {
    beforeEach(() => {
      api.accounts = {
        membership: [],
        signIns: { 'sub-work': { sub: 'sub-work', id: 'WORK', email: 'work@x.test', membership: [] } },
      }
      api.devices = { [rowKey('WORK', 'sub-work')]: { all: [{ id: PI, services: [{ id: SERVICE }] }] } }
      api.open.mockResolvedValue({ port: 33000, open: true, state: 'pending' })
    })

    it("that person among the people signed in on this machine: their account's", async () => {
      api.machine = { ...api.machine, signIns: ['U1', 'work'] }
      await render()
      await act(() => seen.open())
      expect(api.open).toHaveBeenCalledWith(api.machine.id, SERVICE, undefined, undefined, 'ACCOUNT')
    })

    it("that person signed in on this machine since the page loaded: their account's, read at the open", async () => {
      api.first = { ...api.machine, signIns: ['U1'] }
      await render()
      api.machine = { ...api.machine, signIns: ['U1', 'work'] }
      await act(() => seen.open())
      expect(api.open).toHaveBeenCalledWith(api.machine.id, SERVICE, undefined, undefined, 'ACCOUNT')
    })

    it('another person comes to serve the service while its panel is up: the port is read again as theirs, the one before not left shown', async () => {
      api.read.mockResolvedValue({ port: 33000, open: true, state: 'listening', initiatorId: 'i1' })
      await render()
      expect(seen.local).toMatchObject({ port: 33000, open: true })
      const reads = api.read.mock.calls.length
      // The page's own person now holds the service's row: the port asked about is theirs, and they have none.
      api.devices = { U1: { all: [{ id: PI, services: [{ id: SERVICE }] }] } }
      api.read.mockResolvedValue(null)
      await render()
      expect(api.read.mock.calls.length).toBeGreaterThan(reads)
      expect(seen.local).toBeUndefined()
    })

    it("that person signed out of this machine since: the machine's", async () => {
      api.first = { ...api.machine, signIns: ['U1', 'work'] }
      await render()
      api.machine = { ...api.machine, signIns: ['U1'] }
      await act(() => seen.open())
      expect(api.open).toHaveBeenCalledWith(api.machine.id, SERVICE, undefined, undefined, undefined)
    })

    it("only the page's own person signed in on this machine: the machine's", async () => {
      api.machine = { ...api.machine, signIns: ['U1'] }
      await render()
      await act(() => seen.open())
      expect(api.open).toHaveBeenCalledWith(api.machine.id, SERVICE, undefined, undefined, undefined)
    })
  })

  /* The machine's ports as the daemon lists them to this OS account (graphql-api docs/PROXY-GROUPS.md §15, "Local ports
     listed per account"), through the shell's status: whom the service's port answers here, and its others. */
  describe('listed by the shell', () => {
    const port = (id: string, more: object = {}) => ({
      id,
      port: 33000,
      bind: '127.0.0.1',
      proto: 'tcp',
      target: SERVICE,
      state: 'armed',
      scope: 'machine',
      ...more,
    })
    let status: any
    let listeners: Set<(status: any) => void>
    const shellWith = () => {
      listeners = new Set()
      return {
        compatible: true,
        has: (c: string) => c === 'status',
        call: vi.fn(async () => status),
        on: (_event: string, listener: (status: any) => void) => {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      }
    }
    const OPEN = { initiatorId: 'mine', open: true, state: 'listening', port: 33000, serviceId: SERVICE }

    it('no shell: nothing said, as before', async () => {
      api.read.mockResolvedValue(OPEN)
      await render()
      expect(seen.listed).toBeUndefined()
      expect(seen.others).toEqual([])
    })

    it('a shell or daemon that does not list them: nothing said, as before', async () => {
      api.read.mockResolvedValue(OPEN)
      status = { stage: 'solo' }
      api.shell = shellWith()
      await render()
      expect(api.shell.call).toHaveBeenCalledWith('status', {})
      expect(seen.listed).toBeUndefined()
      expect(seen.others).toEqual([])
    })

    it("the open port as listed here — or null, listed to no one of this account; the service's others beside it", async () => {
      api.read.mockResolvedValue(OPEN)
      status = { ports: [port('mine', { scope: 'account', person: 'U1', yours: true }), port('kim'), port('x', { target: PI })] }
      api.shell = shellWith()
      await render()
      expect(seen.listed).toMatchObject({ id: 'mine', yours: true })
      expect(seen.others.map(p => p.id)).toEqual(['kim'])

      // Another person's account port, answering their accounts alone: no longer listed here.
      await act(async () => listeners.forEach(l => l({ ports: [port('kim')] })))
      expect(seen.listed).toBeNull()
      expect(seen.others.map(p => p.id)).toEqual(['kim'])
    })

    it('closed: nothing to say of it, the others still listed', async () => {
      api.read.mockResolvedValue({ ...OPEN, initiatorId: null, open: false, state: 'closed' })
      status = { ports: [port('kim')] }
      api.shell = shellWith()
      await render()
      expect(seen.listed).toBeUndefined()
      expect(seen.others.map(p => p.id)).toEqual(['kim'])
    })

    it('read again once the port is open: the daemon lists it once it has applied it', async () => {
      status = { ports: [] }
      api.shell = shellWith()
      await render()
      expect(seen.listed).toBeUndefined()
      status = { ports: [port('mine')] }
      api.open.mockResolvedValue(OPEN)
      await act(() => seen.open())
      await act(async () => {})
      expect(seen.listed).toMatchObject({ id: 'mine', scope: 'machine' })
    })
  })
})
