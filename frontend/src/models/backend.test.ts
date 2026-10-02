import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { emit } = vi.hoisted(() => ({ emit: vi.fn() }))
vi.mock('../services/Controller', () => ({ emit }))
vi.mock('../services/browser', () => ({ default: {}, setLocalStorage: vi.fn(), getOs: vi.fn() }))
vi.mock('../i18n', () => ({ default: { t: (k: string) => k } }))

import backend from './backend'

describe('backend.unregisterThisDevice', () => {
  const state = { backend: { thisId: 'THIS' }, ui: {} }
  let dispatch: any
  let effects: any

  beforeEach(() => {
    emit.mockReset().mockReturnValue(true)
    dispatch = { ui: { set: vi.fn() }, backend: { set: vi.fn() }, devices: {} }
    effects = (backend as any).effects(dispatch)
  })
  afterEach(() => vi.useRealTimers())

  it('resolves true once the agent reports this device gone', async () => {
    const unregistering = effects.unregisterThisDevice(undefined, state)
    expect(emit).toHaveBeenCalledWith('registration', 'DELETE')
    await effects.targetDeviceUpdated('', state)
    await expect(unregistering).resolves.toBe(true)
  })

  it('resolves false when the device is still registered afterwards', async () => {
    const unregistering = effects.unregisterThisDevice(undefined, state)
    await effects.targetDeviceUpdated('THIS', state)
    await expect(unregistering).resolves.toBe(false)
  })

  it('resolves false when the local backend is not connected', async () => {
    emit.mockReturnValue(false)
    await expect(effects.unregisterThisDevice(undefined, state)).resolves.toBe(false)
  })

  it('resolves false when the agent never answers', async () => {
    vi.useFakeTimers()
    const unregistering = effects.unregisterThisDevice(undefined, state)
    await vi.advanceTimersByTimeAsync(60 * 1000)
    await expect(unregistering).resolves.toBe(false)
  })

  it('has nothing to do without a registered device', async () => {
    await expect(effects.unregisterThisDevice(undefined, { backend: { thisId: '' } })).resolves.toBe(true)
    expect(emit).not.toHaveBeenCalled()
  })
})
