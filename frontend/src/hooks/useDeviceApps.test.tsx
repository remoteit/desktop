import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { read, setApp, addApp, setRelease, removeApp, setSetting, available, fetchSingleFull } = vi.hoisted(() => ({
  fetchSingleFull: vi.fn(),
  available: vi.fn(),
  read: vi.fn(),
  setApp: vi.fn(),
  addApp: vi.fn(),
  setRelease: vi.fn(),
  removeApp: vi.fn(),
  setSetting: vi.fn(),
}))
vi.mock('../services/graphQLDeviceApps', () => ({
  graphQLDeviceApps: read,
  graphQLAvailableApps: available,
  graphQLSetDeviceAppEnabled: setApp,
  graphQLAddDeviceApp: addApp,
  graphQLSetDeviceAppRelease: setRelease,
  graphQLRemoveDeviceApp: removeApp,
  graphQLSetDeviceAppSetting: setSetting,
  refused: (r: any) => !!r && typeof r === 'object' && 'reason' in r,
}))
// The device in the store, read again where an app's services may have moved.
vi.mock('react-redux', () => ({ useDispatch: () => ({ devices: { fetchSingleFull } }) }))

import { DeviceApps, ServiceApp, useDeviceApps, useServiceApp } from './useDeviceApps'
import { withServices } from '../test/deviceApps'
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

const rawApp = (state: string, enabled = state !== 'disabled') => ({
  id: 'remoteit.console',
  name: 'Console',
  publisher: 'remote.it',
  root: true,
  enabled,
  channel: 'stable',
  state,
  detail: null,
  serviceId: enabled ? 'S1' : null,
  protocol: 'ssh',
  version: null,
  settings: [aiCommands(true)],
})
const app = (state: string, enabled?: boolean) => withServices(rawApp(state, enabled) as any)

let root: Root
const seen: Record<string, DeviceApps> = {}
const Apps = ({ deviceId, name, offers }: { deviceId?: string; name: string; offers?: boolean }) => {
  seen[name] = useDeviceApps(deviceId, offers === undefined ? { accountId: 'A1' } : { offers, accountId: 'A1' })
  return null
}
const served: Record<string, ServiceApp> = {}
const Serving = ({ service, name }: { service: Partial<IService>; name: string }) => {
  served[name] = useServiceApp({ id: 'D1', accountId: 'A1' } as IDevice, service as IService)
  return null
}

async function render(children: React.ReactNode) {
  root = createRoot(document.createElement('div'))
  await act(async () => root.render(children))
}

beforeEach(() => {
  fetchSingleFull.mockReset().mockResolvedValue(undefined)
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
      await seen.a.turn(seen.a.apps![0], true)
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
    expect(seen.a.apps?.[0].state).toBe('disabled')
    expect(seen.b.apps?.[0].state).toBe('disabled')
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
      done = await seen.a.turn(seen.a.apps![0], true)
    })
    expect(done).toBe(true)
    expect(setApp).toHaveBeenCalledWith('D1', 'remoteit.console', true, undefined)
    expect(seen.a.apps?.[0].state).toBe('running')
    expect(seen.b.apps?.[0].state).toBe('running')
    expect(seen.a.switching).toBeUndefined()
    // Its service added: the device is read again, once, under its account.
    expect(fetchSingleFull).toHaveBeenCalledTimes(1)
    expect(fetchSingleFull).toHaveBeenCalledWith({ id: 'D1', accountId: 'A1', hidden: true, silent: true })
  })

  it('passes the person’s consent to a root app’s full control', async () => {
    await render(<Apps deviceId="D1" name="a" />)
    read.mockResolvedValue([app('running')])
    await act(async () => {
      await seen.a.turn(seen.a.apps![0], true, true)
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
        turning = seen.a.turn(seen.a.apps![0], true)
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000)
      })
      await act(async () => {
        await turning
      })
      expect(read).toHaveBeenCalledTimes(3) // the first read, then starting, then running
      expect(seen.a.apps?.[0].state).toBe('running')
    } finally {
      vi.useRealTimers()
    }
  })

  it('nothing re-read when the API refused the change: its refusal answered', async () => {
    await render(<Apps deviceId="D1" name="a" />)
    setApp.mockResolvedValue({ reason: 'Managed by its product Kiosks' })
    let done: unknown
    await act(async () => {
      done = await seen.a.turn(seen.a.apps![0], true)
    })
    expect(done).toEqual({ reason: 'Managed by its product Kiosks' })
    expect(read).toHaveBeenCalledTimes(1)
    expect(fetchSingleFull).not.toHaveBeenCalled()
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
        await seen.a.setRelease(seen.a.apps![0], { version: '' })
      })
      expect(setRelease).toHaveBeenCalledWith('D1', 'remoteit.console', { version: '' })
      read.mockResolvedValueOnce([app('removing', false)]).mockResolvedValue([])
      let removing: Promise<unknown> | undefined
      act(() => {
        removing = seen.a.remove(seen.a.apps![0])
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
      await seen.a.setSetting(seen.a.apps![0], 'ai_commands', false)
    })
    expect(setSetting).toHaveBeenCalledWith('D1', 'remoteit.console', 'ai_commands', false)
    expect(seen.a.apps?.[0].settings[0].value).toBe(false)
    expect(seen.b.apps?.[0].settings[0].value).toBe(false)
    // Not a port: nothing read again.
    expect(read).toHaveBeenCalledTimes(1)
    expect(fetchSingleFull).not.toHaveBeenCalled()
  })

  it('a port setting — a service’s or a listener’s — reads the device again: its service’s port moved with it', async () => {
    const stream = { key: 'rtsp', name: 'Stream', protocol: 'udp', multiPort: true, port: null, portSetting: null, serviceId: 'S8',
      listeners: [{ name: 'rtsp', type: 'udp', port: null, portSetting: 'rtsp_port', ports: null }] }
    const camera = withServices({ ...rawApp('running'), portSetting: 'port', services: undefined } as any)
    const port = { ...aiCommands(true), name: 'rtsp_port', type: 'int', value: 8554 }
    read.mockResolvedValue([{ ...camera, services: [...camera.services, stream] }])
    await render(<Apps deviceId="D1" name="a" />)
    setSetting.mockResolvedValue({ ...port, value: 9554 })
    let done: unknown
    await act(async () => {
      done = await seen.a.setSetting(seen.a.apps![0], 'rtsp_port', 9554)
    })
    expect(done).toBe(true)
    expect(fetchSingleFull).toHaveBeenCalledWith({ id: 'D1', accountId: 'A1', hidden: true, silent: true })
    // The primary's own port setting too.
    fetchSingleFull.mockClear()
    await act(async () => {
      await seen.a.setSetting(seen.a.apps![0], 'port', 2222)
    })
    expect(fetchSingleFull).toHaveBeenCalledTimes(1)
    // A setting graphql refused: nothing moved, nothing read.
    fetchSingleFull.mockClear()
    setSetting.mockResolvedValue(null)
    await act(async () => {
      await seen.a.setSetting(seen.a.apps![0], 'rtsp_port', 22)
    })
    expect(fetchSingleFull).not.toHaveBeenCalled()
  })
})

describe('useServiceApp: the app a service belongs to', () => {
  const shell = (state: string, more: any = {}) =>
    withServices({
      ...rawApp(state),
      id: 'acme.shell',
      serviceId: state === 'disabled' ? null : 'S5',
      ...more,
    } as any)

  it('the app naming the service; while disabled, the app whose host the service is at', async () => {
    read.mockResolvedValue([app('running'), shell('running')])
    await render(<Serving name="a" service={{ id: 'S5', host: 'remoteit-app-acme-shell' }} />)
    expect(served.a.app?.id).toBe('acme.shell')
    act(() => root.unmount())
    read.mockResolvedValue([app('running'), shell('disabled')])
    await render(<Serving name="b" service={{ id: 'S5', host: 'remoteit-app-acme-shell' }} />)
    expect(served.b.app?.id).toBe('acme.shell')
    act(() => root.unmount())
    // One naming another service is not this one's: an earlier service of it, stopped.
    read.mockResolvedValue([shell('running', { serviceId: 'S9' })])
    await render(<Serving name="c" service={{ id: 'S5', host: 'remoteit-app-acme-shell' }} />)
    expect(served.c.app).toBeUndefined()
  })

  it('reads nothing for a service at no app’s host, and never what the device may add', async () => {
    await render(<Serving name="a" service={{ id: 'S2', host: 'localhost' }} />)
    expect(read).not.toHaveBeenCalled()
    expect(served.a.app).toBeUndefined()
    act(() => root.unmount())
    await render(<Serving name="b" service={{ id: 'S5', host: 'remoteit-app-acme-shell' }} />)
    expect(read).toHaveBeenCalledWith('D1')
    expect(available).not.toHaveBeenCalled()
  })

  it('reads nothing of what the device may add where the part asking offers none', async () => {
    await render(<Apps deviceId="D1" name="a" offers={false} />)
    expect(read).toHaveBeenCalledWith('D1')
    expect(available).not.toHaveBeenCalled()
    expect(seen.a.available).toBeUndefined()
  })
})
