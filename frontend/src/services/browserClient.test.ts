import { describe, it, expect, vi } from 'vitest'

const { handoff, disable, decommission } = vi.hoisted(() => ({ handoff: vi.fn(), disable: vi.fn(), decommission: vi.fn() }))
vi.mock('./browserGateway', () => ({ handoff }))
vi.mock('./deviceDisable', () => ({ graphQLDisableDevices: disable, graphQLDecommissionDevices: decommission }))

import { browserClientUsed, clientChannel, clientOrigin, forgetBrowserClient, resetBrowserClient } from './browserClient'

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

// The client's end of the portal's channel, answering 'forget' as connectd web/client-worker.js does.
const UID = '90:00:00:00:00:02:EC:52'
const settle = () => new Promise(r => setTimeout(r, 20))
const connectClient = async (uid: string | null = UID) => {
  const ch = new MessageChannel()
  const asked: any[] = []
  ch.port2.onmessage = m => {
    asked.push(m.data)
    if (m.data?.type === 'forget') ch.port2.postMessage({ type: 'forgotten', id: m.data.id, uid })
  }
  frameSays({ type: 'port', port: ch.port1 })
  await clientChannel()
  return asked
}

describe('forgetting this browser’s client', () => {
  it('asks the client to forget itself and hears the UID it was', async () => {
    const asked = await connectClient()
    expect(await forgetBrowserClient()).toBe(UID)
    expect(asked.map(m => m.type)).toEqual(['forget'])
  })

  it('a client that does not answer is not waited on past the bound', async () => {
    const ch = new MessageChannel()
    frameSays({ type: 'port', port: ch.port1 })
    await clientChannel()
    expect(await forgetBrowserClient(30)).toBeNull()
  })

  it('a reset removes its device as the person — disabled, then decommissioned — and the frame stays for the new one', async () => {
    disable.mockResolvedValueOnce({ data: { data: { disableDevices: true } } })
    decommission.mockResolvedValueOnce({ data: { data: { decommissionDevices: true } } })
    await connectClient()
    await resetBrowserClient()
    expect(disable).toHaveBeenCalledWith([UID])
    expect(decommission).toHaveBeenCalledWith([UID])
    expect(document.querySelector('iframe')).not.toBeNull()
    expect(browserClientUsed()).toBe(true) // the new client is forgotten at sign-out too
  })

  it('a device graphql would not disable is left to its expiry, not decommissioned', async () => {
    disable.mockReset().mockResolvedValueOnce('ERROR')
    decommission.mockReset()
    await connectClient()
    await resetBrowserClient()
    expect(decommission).not.toHaveBeenCalled()
  })

  it('signing out: no code for a client that asks meanwhile, the frame gone, and the next client of this page handed off again', async () => {
    disable.mockResolvedValue({ data: { data: { disableDevices: true } } })
    decommission.mockResolvedValue({ data: { data: { decommissionDevices: true } } })
    handoff.mockReset().mockResolvedValue({ code: 'CODE', presence: [], reflector: 'wss://r' })
    await connectClient()
    const signingOut = resetBrowserClient({ signingOut: true })
    frameSays({ type: 'state', state: 'needs-handoff' }) // the forgotten client's next worker, asking
    await signingOut
    await settle()
    expect(handoff).not.toHaveBeenCalled()
    expect(document.querySelector('iframe')).toBeNull()
    expect(browserClientUsed()).toBe(false)

    // The next person signs in on this page and opens a terminal: a frame of its own, handed a code when it asks.
    const opening = clientChannel()
    frameSays({ type: 'state', state: 'needs-handoff' })
    await settle()
    expect(handoff).toHaveBeenCalledTimes(1)
    frameSays({ type: 'port', port: new MessageChannel().port1 })
    await opening
    expect(browserClientUsed()).toBe(true)
  })

  it('a browser that never ran a client is not touched at sign-out', () => {
    localStorage.removeItem('remoteit-browser-client')
    expect(browserClientUsed()).toBe(false)
  })
})
