import { describe, it, expect, vi } from 'vitest'
import { createMockBridge } from './thisDeviceMock'

// thisDeviceKnown: the answer the boot already has, for a first render that must not wait a turn for it.

describe('thisDeviceKnown', () => {
  it('is undefined until asked, then the shell — or null where there is none', async () => {
    vi.resetModules()
    const td = await import('./thisDevice')
    expect(td.thisDeviceKnown()).toBeUndefined()
    await td.thisDevice()
    expect(td.thisDeviceKnown()).toBeNull()

    td.registerBridgeTransport(async () => createMockBridge().transport)
    expect(td.thisDeviceKnown()).toBeUndefined()
    const device = await td.thisDevice()
    expect(device).toBeDefined()
    expect(td.thisDeviceKnown()).toBe(device)
  })
})

// 1.7.0: info is kept current from the shell's info event, and asked once more after the listening.
describe('ThisDevice info', () => {
  it('follows the info event: has() and onInfo say what the shell offers now', async () => {
    vi.resetModules()
    const td = await import('./thisDevice')
    const bridge = createMockBridge({ capabilities: ['status'] })
    td.registerBridgeTransport(async () => bridge.transport)
    const device = (await td.thisDevice())!
    const told: string[][] = []
    device.onInfo(i => told.push(i.capabilities))
    expect(device.has('services')).toBe(false)
    bridge.offer(['status', 'services'])
    expect(device.has('services')).toBe(true)
    expect(device.info.capabilities).toEqual(['status', 'services'])
    // The same offer in another order is no change.
    bridge.offer(['services', 'status'])
    bridge.offer(['status'])
    expect(device.has('services')).toBe(false)
    expect(told).toEqual([['status', 'services'], ['status']])
  })

  it('asks info once more once it listens: a change before that is not lost', async () => {
    vi.resetModules()
    const td = await import('./thisDevice')
    const bridge = createMockBridge({ capabilities: ['status'] })
    const on = bridge.transport.on
    // The daemon answers between info's first answer and the listening: its event reaches no one.
    bridge.transport.on = (event, listener) => {
      if (event === 'info') bridge.offer(['status', 'services'])
      return on(event, listener)
    }
    td.registerBridgeTransport(async () => bridge.transport)
    const device = (await td.thisDevice())!
    await new Promise(r => setTimeout(r))
    expect(device.has('services')).toBe(true)
  })

  it('compares info in one form', async () => {
    const td = await import('./thisDevice')
    const a = {
      bridgeVersion: '1.7.0',
      platform: 'mac',
      shell: 'menu',
      shellVersion: 'x',
      stage: 's',
      capabilities: ['status', 'auth'],
    } as const
    const b = {
      capabilities: ['auth', 'status'],
      stage: 's',
      shellVersion: 'x',
      shell: 'menu',
      platform: 'mac',
      bridgeVersion: '1.7.0',
    } as const
    expect(td.infoKey(a as any)).toEqual(td.infoKey(b as any))
    expect(td.infoKey(a as any)).not.toEqual(td.infoKey({ ...a, capabilities: ['status'] } as any))
  })
})
