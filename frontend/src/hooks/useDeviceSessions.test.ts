import { afterEach, describe, expect, it, vi } from 'vitest'

// The gate as each kind of stage builds it: DEVICE_SESSIONS_DEFAULT is read when the module loads.
async function gate(stageDefault: boolean) {
  vi.resetModules()
  vi.doMock('../constants', () => ({ DEVICE_SESSIONS_DEFAULT: stageDefault }))
  return import('./useDeviceSessions')
}
const state = (ui: { testUI?: string; deviceSessions?: boolean }) => ({ ui }) as any

afterEach(() => vi.doUnmock('../constants'))

describe('the device-session gate', () => {
  it('elsewhere: a Test UI setting, and only while Test UI is on', async () => {
    const { selectDeviceSessions, selectDeviceSessionsSetting } = await gate(false)
    expect(selectDeviceSessions(state({}))).toBe(false)
    expect(selectDeviceSessions(state({ deviceSessions: true }))).toBe(false)
    expect(selectDeviceSessions(state({ testUI: 'ON' }))).toBe(false)
    expect(selectDeviceSessions(state({ testUI: 'ON', deviceSessions: true }))).toBe(true)
    expect(selectDeviceSessionsSetting(state({}))).toBe(false)
  })

  it('on a stage that serves device sessions to everyone: on by default, off when turned off', async () => {
    const { selectDeviceSessions, selectDeviceSessionsSetting } = await gate(true)
    expect(selectDeviceSessions(state({}))).toBe(true)
    expect(selectDeviceSessionsSetting(state({}))).toBe(true)
    expect(selectDeviceSessions(state({ deviceSessions: false }))).toBe(false)
    expect(selectDeviceSessions(state({ testUI: 'ON', deviceSessions: false }))).toBe(false)
    expect(selectDeviceSessions(state({ deviceSessions: true }))).toBe(true)
  })
})
