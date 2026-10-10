import { describe, it, expect, vi } from 'vitest'
import { BridgeError } from './thisDevice'
import { bridgeError, capacitorTransport, type ThisDevicePlugin } from './thisDeviceCapacitor'

function fakePlugin() {
  let emit: (e: { name: string; payload: unknown }) => void = () => {}
  const plugin = {
    call: vi.fn(),
    addListener: vi.fn(async (_: 'event', l: typeof emit) => {
      emit = l
      return { remove: vi.fn() }
    }),
  }
  return { plugin: plugin as unknown as ThisDevicePlugin & typeof plugin, emit: (name: string, payload: unknown) => emit({ name, payload }) }
}

describe('capacitorTransport', () => {
  it('calls the plugin with the method and its args, and answers its result', async () => {
    const { plugin } = fakePlugin()
    plugin.call.mockResolvedValue({ result: { on: true } })
    const t = capacitorTransport(plugin)
    expect(await t.call('vpn.set', { on: true })).toEqual({ on: true })
    expect(plugin.call).toHaveBeenCalledWith({ method: 'vpn.set', args: { on: true } })
  })

  it('a rejection with a bridge code is that BridgeError; anything else is failed', async () => {
    const { plugin } = fakePlugin()
    plugin.call.mockRejectedValueOnce(Object.assign(new Error('the VPN is starting'), { code: 'busy' }))
    const t = capacitorTransport(plugin)
    const e = await t.call('vpn.set', { on: false }).catch(e => e)
    expect(e).toBeInstanceOf(BridgeError)
    expect(e.code).toBe('busy')
    expect(bridgeError(new Error('boom')).code).toBe('failed')
    expect(bridgeError({ code: 'UNIMPLEMENTED', message: 'no' }).code).toBe('unsupported')
  })

  it('events reach the listeners of their name until they unsubscribe, through one native listener', async () => {
    const { plugin, emit } = fakePlugin()
    const t = capacitorTransport(plugin)
    const status = vi.fn()
    const auth = vi.fn()
    const off = t.on('status', status)
    t.on('auth', auth)
    await Promise.resolve()
    emit('status', { engine: 'online' })
    emit('auth', { active: { sub: 's', active: true } })
    off()
    emit('status', { engine: 'stopped' })
    expect(status).toHaveBeenCalledTimes(1)
    expect(status).toHaveBeenCalledWith({ engine: 'online' })
    expect(auth).toHaveBeenCalledTimes(1)
    expect(plugin.addListener).toHaveBeenCalledTimes(1)
  })
})
