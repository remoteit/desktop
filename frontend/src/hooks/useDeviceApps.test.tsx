import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { read, setApp, addApp, setRelease, removeApp, setSetting, available } = vi.hoisted(() => ({
  available: vi.fn(),
  read: vi.fn(),
  setApp: vi.fn(),
  addApp: vi.fn(),
  setRelease: vi.fn(),
  removeApp: vi.fn(),
  setSetting: vi.fn(),
}))
vi.mock('../services/graphQLDeviceApps', () => ({
  CONSOLE: 'remoteit.console',
  graphQLDeviceApps: read,
  graphQLAvailableApps: available,
  graphQLSetDeviceAppEnabled: setApp,
  graphQLAddDeviceApp: addApp,
  graphQLSetDeviceAppRelease: setRelease,
  graphQLRemoveDeviceApp: removeApp,
  graphQLSetDeviceAppSetting: setSetting,
  refused: (r: any) => !!r && typeof r === 'object' && 'reason' in r,
}))

import { DeviceApps, useDeviceApps } from './useDeviceApps'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const aiCommands = (value: boolean) => ({
  name: 'ai_commands',
  type: 'bool',
  label: 'AI commands',
  help: null,
  default: true,
  value,
  at: null,
  by: null,
  onDevice: false,
  control: 'cloud+local',
  locked: null,
  choices: null,
  deprecated: null,
})

const app = (state: string, enabled = state !== 'disabled') => ({
  id: 'remoteit.console',
  name: 'Console',
  publisher: 'remote.it',
  root: true,
  enabled,
  channel: 'stable',
  state,
  detail: null,
  serviceId: enabled ? 'S1' : null,
  version: null,
  settings: [aiCommands(true)],
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
  read.mockReset().mockResolvedValue([app('disabled')])
  available.mockReset().mockResolvedValue([])
  setApp.mockReset().mockResolvedValue(app('running'))
  addApp.mockReset().mockResolvedValue(app('running'))
  setRelease.mockReset().mockResolvedValue(app('running'))
  removeApp.mockReset().mockResolvedValue(true)
  setSetting.mockReset().mockResolvedValue(aiCommands(false))
})
afterEach(() => act(() => root.unmount()))

describe('useDeviceApps', () => {
  it('reads what the device may add once its apps are read, and again once its apps change; none where the API has no apps', async () => {
    available.mockResolvedValue([{ id: 'remoteit.files', name: 'Files' }])
    await render(<Apps deviceId="D1" name="a" />)
    expect(available).toHaveBeenCalledWith('D1')
    expect(seen.a.available).toEqual([{ id: 'remoteit.files', name: 'Files' }])
    read.mockResolvedValue([app('disabled'), { ...app('running'), id: 'remoteit.files' }])
    available.mockResolvedValue([])
    await act(async () => {
      await seen.a.turn(seen.a.console!, true)
    })
    expect(available).toHaveBeenCalledTimes(2)
    expect(seen.a.available).toEqual([])
    act(() => root.unmount())
    available.mockClear()
    read.mockResolvedValue(null)
    await render(<Apps deviceId="D2" name="b" />)
    expect(available).not.toHaveBeenCalled()
  })

  it('reads a device’s apps once for every part asking in the same moment, and none without a device', async () => {
    await render(
      <>
        <Apps deviceId="D1" name="a" />
        <Apps deviceId="D1" name="b" />
        <Apps name="none" />
      </>
    )
    expect(read).toHaveBeenCalledTimes(1)
    expect(seen.a.console?.state).toBe('disabled')
    expect(seen.b.console?.state).toBe('disabled')
    expect(seen.none.apps).toBeUndefined()
  })

  it('enables an app by setDeviceAppEnabled, and every part sees what the device said', async () => {
    await render(
      <>
        <Apps deviceId="D1" name="a" />
        <Apps deviceId="D1" name="b" />
      </>
    )
    read.mockResolvedValue([app('running')])
    let done: unknown
    await act(async () => {
      done = await seen.a.turn(seen.a.console!, true)
    })
    expect(done).toBe(true)
    expect(setApp).toHaveBeenCalledWith('D1', 'remoteit.console', true, undefined)
    expect(seen.a.console?.state).toBe('running')
    expect(seen.b.console?.state).toBe('running')
    expect(seen.a.switching).toBeUndefined()
  })

  it('passes the person’s consent to a root app’s full control', async () => {
    await render(<Apps deviceId="D1" name="a" />)
    read.mockResolvedValue([app('running')])
    await act(async () => {
      await seen.a.turn(seen.a.console!, true, true)
    })
    expect(setApp).toHaveBeenCalledWith('D1', 'remoteit.console', true, true)
  })

  it('waits while the device says the app is starting', async () => {
    vi.useFakeTimers()
    try {
      await render(<Apps deviceId="D1" name="a" />)
      read.mockResolvedValueOnce([app('starting')]).mockResolvedValue([app('running')])
      let turning: Promise<unknown> | undefined
      act(() => {
        turning = seen.a.turn(seen.a.console!, true)
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000)
      })
      await act(async () => {
        await turning
      })
      expect(read).toHaveBeenCalledTimes(3) // the first read, then starting, then running
      expect(seen.a.console?.state).toBe('running')
    } finally {
      vi.useRealTimers()
    }
  })

  it('nothing re-read when the API refused the change: its refusal answered', async () => {
    await render(<Apps deviceId="D1" name="a" />)
    setApp.mockResolvedValue({ reason: 'Managed by its product Kiosks' })
    let done: unknown
    await act(async () => {
      done = await seen.a.turn(seen.a.console!, true)
    })
    expect(done).toEqual({ reason: 'Managed by its product Kiosks' })
    expect(read).toHaveBeenCalledTimes(1)
    expect(seen.a.switching).toBeUndefined()
  })

  it('an app the device has no row for is added (addDeviceApp), with the yes to root where given', async () => {
    await render(<Apps deviceId="D1" name="a" />)
    read.mockResolvedValue([app('disabled'), { ...app('running'), id: 'remoteit.files' }])
    await act(async () => {
      await seen.a.turn({ ...app('disabled'), id: 'remoteit.files' } as any, true, true)
    })
    expect(addApp).toHaveBeenCalledWith('D1', 'remoteit.files', { consentRoot: true })
    expect(setApp).not.toHaveBeenCalled()
  })

  it('the channel and pin by setDeviceAppRelease; removed by removeDeviceApp, waited for until the device says it is gone', async () => {
    vi.useFakeTimers()
    try {
      await render(<Apps deviceId="D1" name="a" />)
      await act(async () => {
        await seen.a.setRelease(seen.a.console!, { version: '' })
      })
      expect(setRelease).toHaveBeenCalledWith('D1', 'remoteit.console', { version: '' })
      read.mockResolvedValueOnce([app('removing', false)]).mockResolvedValue([])
      let removing: Promise<unknown> | undefined
      act(() => {
        removing = seen.a.remove(seen.a.console!)
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000)
      })
      await act(async () => {
        await removing
      })
      expect(removeApp).toHaveBeenCalledWith('D1', 'remoteit.console')
      expect(seen.a.apps).toEqual([])
    } finally {
      vi.useRealTimers()
    }
  })

  it('sets an app’s setting by setDeviceAppSetting, every part seeing the answer', async () => {
    await render(
      <>
        <Apps deviceId="D1" name="a" />
        <Apps deviceId="D1" name="b" />
      </>
    )
    await act(async () => {
      await seen.a.setSetting(seen.a.console!, 'ai_commands', false)
    })
    expect(setSetting).toHaveBeenCalledWith('D1', 'remoteit.console', 'ai_commands', false)
    expect(seen.a.console?.settings[0].value).toBe(false)
    expect(seen.b.console?.settings[0].value).toBe(false)
  })
})
