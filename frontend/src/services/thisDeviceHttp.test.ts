import { describe, it, expect, vi, afterEach } from 'vitest'
import { httpTransport, bridgeURL } from './thisDeviceHttp'
import { BridgeError } from './thisDevice'

// The desktop transport (thisDevice.ts, "Desktop"): POST bridge/<method> beside the page, errors by their code, events
// from bridge/events as server-sent events.

const PAGE = 'http://127.0.0.1:50123/TOKEN/'

const answer = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))

afterEach(() => vi.unstubAllGlobals())

describe('the desktop bridge transport', () => {
  it('posts a method and its args beside the page, the token path kept', async () => {
    const fetcher = answer(200, { stage: 'solo' })
    const t = httpTransport(PAGE + 'index.html', fetcher as any)
    expect(await t.call('status', {})).toEqual({ stage: 'solo' })
    const [url, init] = fetcher.mock.calls[0] as any
    expect(url).toBe(PAGE + 'bridge/status')
    expect(init.method).toBe('POST')
    expect(init.headers['content-type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual({})
    await t.call('exit.set', { id: null })
    expect(JSON.parse((fetcher.mock.calls[1] as any)[1].body)).toEqual({ id: null })
    expect(bridgeURL('events', PAGE + '#/this-device')).toBe(PAGE + 'bridge/events')
  })

  it('throws the shell’s error by its code', async () => {
    const t = httpTransport(PAGE, answer(409, { error: { code: 'busy', message: 'the VPN is starting' } }) as any)
    const error = await t.call('vpn.set', { on: true }).catch(e => e)
    expect(error).toBeInstanceOf(BridgeError)
    expect(error.code).toBe('busy')
    expect(error.message).toBe('the VPN is starting')
    const odd = await httpTransport(PAGE, answer(500, { what: 1 }) as any).call('status', {}).catch(e => e)
    expect(odd.code).toBe('failed')
  })

  it('is unavailable when the app does not answer', async () => {
    const t = httpTransport(PAGE, vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))) as any)
    expect((await t.call('info', {}).catch(e => e)).code).toBe('unavailable')
  })

  it('delivers events from one server-sent stream', async () => {
    const sources: any[] = []
    class FakeEventSource {
      handlers: { [k: string]: ((e: any) => void)[] } = {}
      constructor(public url: string) {
        sources.push(this)
      }
      addEventListener(name: string, fn: (e: any) => void) {
        ;(this.handlers[name] ??= []).push(fn)
      }
      fire(name: string, data: unknown) {
        for (const fn of this.handlers[name] ?? []) fn({ data: JSON.stringify(data) })
      }
    }
    vi.stubGlobal('EventSource', FakeEventSource)
    const t = httpTransport(PAGE, answer(200, {}) as any)
    const status = vi.fn()
    const auth = vi.fn()
    const off = t.on('status', status)
    t.on('auth', auth)
    expect(sources.map(s => s.url)).toEqual([PAGE + 'bridge/events'])
    sources[0].fire('status', { engine: 'online' })
    sources[0].fire('auth', {})
    expect(status).toHaveBeenCalledWith({ engine: 'online' })
    expect(auth).toHaveBeenCalledWith({})
    off()
    sources[0].fire('status', { engine: 'offline' })
    expect(status).toHaveBeenCalledTimes(1)
  })
})
