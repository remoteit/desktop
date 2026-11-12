import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { read, setApp, settings } = vi.hoisted(() => ({
  read: vi.fn(),
  setApp: vi.fn(),
  settings: { console: undefined as any, set: vi.fn() },
}))
vi.mock('../services/graphQLDeviceApps', () => ({ graphQLDeviceApps: read, graphQLSetDeviceApp: setApp }))
vi.mock('../services/graphQLDeviceSettings', () => ({ settingOn: (s: any) => s.value === true }))
vi.mock('./useDeviceSettings', () => ({
  useDeviceSettings: () => ({ setting: () => settings.console, set: settings.set }),
}))

import { DeviceApps, useDeviceApps } from './useDeviceApps'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const app = (state: string, on = state !== 'off') => ({
  id: 'console',
  on,
  state,
  detail: null,
  serviceId: on ? 'S1' : null,
  port: on ? 22 : null,
  hostKey: null,
  version: null,
})

let root: Root
const seen: Record<string, DeviceApps> = {}
const Apps = ({ deviceId, name }: { deviceId?: string; name: string }) => {
  seen[name] = useDeviceApps(deviceId)
  return null
}

async function render(children: React.ReactNode) {
  root = createRoot(document.createElement('div'))
  await act(async () => root.render(children))
}

beforeEach(() => {
  read.mockReset().mockResolvedValue([app('off')])
  setApp.mockReset().mockResolvedValue(app('running'))
  settings.console = undefined
  settings.set.mockReset().mockResolvedValue(true)
})
afterEach(() => act(() => root.unmount()))

describe('useDeviceApps', () => {
  it('reads a device’s apps once for every part asking in the same moment, and none without a device', async () => {
    await render(
      <>
        <Apps deviceId="D1" name="a" />
        <Apps deviceId="D1" name="b" />
        <Apps name="none" />
      </>
    )
    expect(read).toHaveBeenCalledTimes(1)
    expect(seen.a.console?.state).toBe('off')
    expect(seen.b.console?.state).toBe('off')
    expect(seen.none.apps).toBeUndefined()
  })

  it('turns the console on by its app where there is no setting, and every part sees what the device said', async () => {
    await render(
      <>
        <Apps deviceId="D1" name="a" />
        <Apps deviceId="D1" name="b" />
      </>
    )
    read.mockResolvedValue([app('running')])
    await act(async () => seen.a.turn(seen.a.console!, true))
    expect(setApp).toHaveBeenCalledWith('D1', 'console', true)
    expect(settings.set).not.toHaveBeenCalled()
    expect(seen.a.console?.state).toBe('running')
    expect(seen.b.console?.state).toBe('running')
    expect(seen.a.switching).toBeUndefined()
  })

  it('turns it on by its device setting where there is one, whose override holds', async () => {
    settings.console = { name: 'console', value: false, control: 'off' }
    await render(<Apps deviceId="D1" name="a" />)
    expect(seen.a.isOn(app('running') as any)).toBe(false)
    read.mockResolvedValue([app('running')])
    await act(async () => seen.a.turn(seen.a.console!, true))
    expect(settings.set).toHaveBeenCalledWith('console', true)
    expect(setApp).not.toHaveBeenCalled()
  })
})
