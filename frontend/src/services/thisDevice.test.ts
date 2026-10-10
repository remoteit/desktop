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
