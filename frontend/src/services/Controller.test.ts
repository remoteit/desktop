import { describe, it, expect, vi, afterEach } from 'vitest'

const { socket } = vi.hoisted(() => {
  const socket = {
    connected: true,
    handlers: {} as Record<string, (...args: any[]) => void>,
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      socket.handlers[event] = handler
      return socket
    }),
    emit: vi.fn(),
    removeAllListeners: vi.fn(),
    close: vi.fn(() => {
      socket.connected = false
    }),
    // Like socket.io: opening a connected socket does nothing.
    open: vi.fn(() => {
      if (socket.connected) return
      socket.connected = true
      socket.handlers.connect?.()
    }),
  }
  return { socket }
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

const credentials = { username: 'b@test', authHash: 'hash-b', guid: 'guid-b' }

describe('Controller — switching the agent', () => {
  afterEach(() => vi.useRealTimers())

  it('re-authenticates on a fresh connection with consent, and only once', () => {
    vi.useFakeTimers()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    controller.setupConnection(credentials)
    socket.connected = true
    socket.emit.mockClear()

    controller.retryWithAgentSwitch()
    vi.runAllTimers()

    expect(socket.close).toHaveBeenCalled()
    expect(socket.emit).toHaveBeenCalledWith('authentication', { ...credentials, switchAgent: true })

    socket.emit.mockClear()
    controller.auth()
    expect(socket.emit).toHaveBeenCalledWith('authentication', credentials)
  })
})
