import { describe, expect, it } from 'vitest'
import { selectVirtualDevices, selectVirtualDevicesSetting } from './useVirtualDevices'

const state = (ui: { testUI?: string; virtualDevices?: boolean }) => ({ ui } as any)

describe('the virtual-devices gate', () => {
  it('a Test UI setting, off by default, and only while Test UI is on', () => {
    expect(selectVirtualDevices(state({}))).toBe(false)
    expect(selectVirtualDevices(state({ testUI: 'ON' }))).toBe(false)
    expect(selectVirtualDevices(state({ virtualDevices: true }))).toBe(false)
    expect(selectVirtualDevices(state({ testUI: 'ON', virtualDevices: true }))).toBe(true)
    expect(selectVirtualDevicesSetting(state({ virtualDevices: true }))).toBe(true)
  })
})
