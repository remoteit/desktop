import { describe, it, expect, vi, beforeEach } from 'vitest'

const { socket, emitWithAck } = vi.hoisted(() => {
  const emitWithAck = vi.fn()
  const socket = {
    connected: true,
    on: vi.fn(),
    emit: vi.fn(),
    removeAllListeners: vi.fn(),
    close: vi.fn(),
    open: vi.fn(),
    timeout: vi.fn(() => ({ emitWithAck })),
  }
  return { socket, emitWithAck }
})
vi.mock('socket.io-client', () => ({ default: vi.fn(() => socket) }))
vi.mock('./browser', () => ({ default: { hasBackend: true } }))
vi.mock('./Network', () => ({ default: { on: vi.fn(), offline: vi.fn() } }))
vi.mock('../constants', () => ({ PORT: 29999, FRONTEND_RETRY_DELAY: 1 }))
vi.mock('../store', () => {
  const anyModel = new Proxy({}, { get: () => new Proxy({}, { get: () => vi.fn() }) })
  return { store: { dispatch: anyModel, getState: () => ({}) } }
})

import controller from './Controller'

describe('Controller.emitWithAck', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    controller.setupConnection({ username: 'a@test', authHash: 'hash-a', guid: 'guid-a' })
    socket.connected = true
    emitWithAck.mockReset()
  })

  it("resolves the backend's answer within the timeout", async () => {
    emitWithAck.mockResolvedValue(true)
    expect(await controller.emitWithAck('agent/release', 500)).toBe(true)
    expect(socket.timeout).toHaveBeenCalledWith(500)
    expect(emitWithAck).toHaveBeenCalledWith('agent/release')
  })

  it('resolves nothing when the backend never answers', async () => {
    emitWithAck.mockRejectedValue(new Error('operation has timed out'))
    expect(await controller.emitWithAck('agent/release', 500)).toBeUndefined()
  })

  it('resolves nothing without asking when the socket is down', async () => {
    socket.connected = false
    expect(await controller.emitWithAck('agent/release', 500)).toBeUndefined()
    expect(emitWithAck).not.toHaveBeenCalled()
  })
})
