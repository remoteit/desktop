import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const api = vi.hoisted(() => ({
  machine: { id: '80:00:00:00:00:00:00:A1', platform: 'mac' } as any,
  read: vi.fn(),
  open: vi.fn(),
  close: vi.fn(),
  ui: {} as any,
  auth: {} as any,
}))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({ ui: api.ui, auth: api.auth }) }))
vi.mock('./useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('../services/browser', () => ({ default: { isIOS: false } }))
vi.mock('../services/thisDevice', () => ({ thisDevice: async () => undefined }))
vi.mock('../services/localSubnet', () => ({ beaconDevice: async () => null }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLRequestWithReason: vi.fn() }))
vi.mock('../services/localPorts', async importOriginal => ({
  ...(await importOriginal<typeof import('../services/localPorts')>()),
  thisMachine: async () => api.machine,
  graphQLLocalPort: (...args: unknown[]) => api.read(...args),
  openLocalPort: (...args: unknown[]) => api.open(...args),
  closeLocalPort: (...args: unknown[]) => api.close(...args),
}))

import { LocalPortState, useLocalPort } from './useLocalPort'

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
    api.ui = {}
    api.auth = { user: { id: 'U1' } }
    api.read.mockReset().mockResolvedValue(null)
    api.open.mockReset()
  })
  afterEach(() => act(() => root.unmount()))

  it("offered on a machine with our daemon, and its local port read", async () => {
    await render()
    expect(seen.offered).toBe(true)
    expect(api.read).toHaveBeenCalledWith(api.machine.id, SERVICE)
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
    api.machine = { ...api.machine, signedIn: 'u1' }
    await render()
    api.open.mockResolvedValue({ port: 33000, open: true, state: 'pending', scope: 'ACCOUNT' })
    await act(() => seen.open())
    expect(api.open).toHaveBeenCalledWith(api.machine.id, SERVICE, undefined, undefined, 'ACCOUNT')
  })

  it("someone else signed in on it, or a browser that cannot say: none asked, the machine's", async () => {
    api.open.mockResolvedValue({ port: 33000, open: true, state: 'pending' })
    for (const signedIn of ['U2', undefined]) {
      api.machine = { id: '80:00:00:00:00:00:00:A1', platform: 'mac', ...(signedIn && { signedIn }) }
      api.open.mockClear()
      await render()
      await act(() => seen.open())
      expect(api.open).toHaveBeenCalledWith(api.machine.id, SERVICE, undefined, undefined, undefined)
    }
  })
})
