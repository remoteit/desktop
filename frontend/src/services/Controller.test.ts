import { describe, it, expect, vi } from 'vitest'

const { socket } = vi.hoisted(() => ({
  socket: {
    connected: true,
    on: vi.fn(),
    removeAllListeners: vi.fn(),
    close: vi.fn(),
    timeout: vi.fn(() => ({ emitWithAck: vi.fn().mockRejectedValue(new Error('operation has timed out')) })),
  },
}))
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
  it('resolves nothing when the backend never answers', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    controller.setupConnection({ username: 'a@test', authHash: 'hash-a', guid: 'guid-a' })
    expect(await controller.emitWithAck('agent/release', 500)).toBeUndefined()
    expect(socket.timeout).toHaveBeenCalledWith(500)
  })
})
