import { describe, it, expect, vi } from 'vitest'

const { handoff } = vi.hoisted(() => ({ handoff: vi.fn() }))
vi.mock('./browserGateway', () => ({ handoff }))

import { clientChannel, clientOrigin } from './browserClient'

// The portal's frame of the shared client (connectd web/client.html), played here: what it says to the page.
const frameSays = (data: unknown) => {
  const frame = document.querySelector('iframe')!
  window.dispatchEvent(new MessageEvent('message', { origin: clientOrigin(), source: frame.contentWindow, data }))
}
const tick = () => new Promise(r => setTimeout(r, 0))

describe('clientChannel', () => {
  it('a frame loaded again — a newer client published — connects anew, its port the channel from then on', async () => {
    const first = new MessageChannel().port1
    const pending = clientChannel()
    frameSays({ type: 'port', port: first })
    expect(await pending).toBe(first)

    // The old client told its frame to reload: the frame says client-ready again, is connected, and hands a new port.
    const frame = document.querySelector('iframe')!
    const post = vi.spyOn(frame.contentWindow!, 'postMessage')
    frameSays({ type: 'client-ready' })
    expect(post).toHaveBeenCalledWith({ type: 'connect' }, clientOrigin())
    const second = new MessageChannel().port1
    frameSays({ type: 'port', port: second })
    expect(await clientChannel()).toBe(second)
  })

  it('a client asking for a handoff again — its device deleted, say — is given a new code each time', async () => {
    handoff.mockResolvedValueOnce({ code: 'CODE-1', presence: [], reflector: 'wss://r' })
    handoff.mockResolvedValueOnce({ code: 'CODE-2', presence: [], reflector: 'wss://r' })
    const post = vi.spyOn(document.querySelector('iframe')!.contentWindow!, 'postMessage')
    frameSays({ type: 'state', state: 'needs-handoff' })
    await tick()
    frameSays({ type: 'state', state: 'needs-handoff' })
    await tick()
    const codes = post.mock.calls.filter(([m]) => (m as any)?.type === 'handoff').map(([m]) => (m as any).handoff.code)
    expect(codes).toEqual(['CODE-1', 'CODE-2'])
  })

  it('what another origin or another frame says is not the client', async () => {
    const channel = await clientChannel()
    window.dispatchEvent(new MessageEvent('message', { origin: 'https://evil.example', data: { type: 'port', port: new MessageChannel().port1 } }))
    window.dispatchEvent(new MessageEvent('message', { origin: clientOrigin(), source: window, data: { type: 'port', port: new MessageChannel().port1 } }))
    expect(await clientChannel()).toBe(channel)
  })
})
