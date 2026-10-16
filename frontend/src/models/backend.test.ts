import { describe, it, expect, vi, beforeEach } from 'vitest'

const { emit, emitWithAck } = vi.hoisted(() => ({ emit: vi.fn(), emitWithAck: vi.fn() }))
vi.mock('../services/Controller', () => ({ emit, default: { emitWithAck } }))
vi.mock('../services/browser', () => ({ default: {}, setLocalStorage: vi.fn(), getOs: vi.fn() }))
vi.mock('../i18n', () => ({ default: { t: (k: string) => k } }))

import backend from './backend'

describe('backend.unregisterThisDevice', () => {
  const state = { backend: { thisId: 'THIS' }, ui: {} }
  let dispatch: any
  let effects: any

  beforeEach(() => {
    vi.resetAllMocks()
    dispatch = { ui: { set: vi.fn() }, backend: { set: vi.fn() }, devices: {} }
    effects = (backend as any).effects(dispatch)
  })

  it('resolves true once the agent answers that no device is registered', async () => {
    emitWithAck.mockResolvedValue('')
    await expect(effects.unregisterThisDevice(undefined, state)).resolves.toBe(true)
    expect(emitWithAck).toHaveBeenCalledWith('registration', 60 * 1000, 'DELETE')
  })

  it('resolves false when the agent answers that the device is still registered', async () => {
    emitWithAck.mockResolvedValue('THIS')
    await expect(effects.unregisterThisDevice(undefined, state)).resolves.toBe(false)
  })

  it('resolves false when no answer comes back', async () => {
    emitWithAck.mockResolvedValue(undefined)
    await expect(effects.unregisterThisDevice(undefined, state)).resolves.toBe(false)
  })

  it('is not settled by an unrelated device broadcast', async () => {
    let answer: (deviceId: string) => void = () => {}
    emitWithAck.mockReturnValue(new Promise(resolve => (answer = resolve)))
    const unregistering = effects.unregisterThisDevice(undefined, state)
    await effects.targetDeviceUpdated('THIS', state)
    answer('')
    await expect(unregistering).resolves.toBe(true)
  })

  it('has nothing to do without a registered device', async () => {
    await expect(effects.unregisterThisDevice(undefined, { backend: { thisId: '' } })).resolves.toBe(true)
    expect(emitWithAck).not.toHaveBeenCalled()
    expect(emit).not.toHaveBeenCalled()
  })
})
