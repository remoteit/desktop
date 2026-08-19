import net from 'net'
import { EventEmitter } from 'events'
import Logger from './Logger'
import PortScanner, { ServerError } from './PortScanner'

// Ports are simulated - nothing here opens a socket, so the suite can't collide
// with whatever is listening on the machine or CI container running it.
type Outcome = 'free' | string | undefined // 'free', or the listen error code to emit (undefined for none)

let outcomes: { [port: number]: Outcome }
let defaultOutcome: Outcome
let attempts: { port: number; host: string }[]

const fakeServer = () => {
  const server: any = new EventEmitter()

  server.listen = (port: number, host: string) => {
    attempts.push({ port, host })
    const outcome = port in outcomes ? outcomes[port] : defaultOutcome
    setImmediate(() => {
      if (outcome === 'free') return server.emit('listening')
      const error: ServerError = Object.assign(new Error(`listen ${outcome} ${host}:${port}`), { code: outcome })
      server.emit('error', error)
    })
  }

  server.close = () => setImmediate(() => server.emit('close'))

  return server as net.Server
}

describe('backend/PortScanner', () => {
  let warn: jest.SpyInstance

  beforeEach(() => {
    outcomes = {}
    defaultOutcome = 'free'
    attempts = []
    jest.spyOn(net, 'createServer').mockImplementation(fakeServer)
    warn = jest.spyOn(Logger, 'warn').mockImplementation(() => Logger)
  })

  afterEach(() => jest.restoreAllMocks())

  describe('isPortFree', () => {
    test('should report an unused port as free', async () => {
      await expect(PortScanner.isPortFree(33000)).resolves.toBe(true)
      expect(attempts).toEqual([{ port: 33000, host: 'localhost' }])
    })

    test('should report a port already in use as not free', async () => {
      outcomes = { 33000: 'EADDRINUSE' }
      await expect(PortScanner.isPortFree(33000)).resolves.toBe(false)
      expect(warn).not.toHaveBeenCalled()
    })

    test('should report a port as not free when the address cannot be bound', async () => {
      outcomes = { 33000: 'EADDRNOTAVAIL' }
      await expect(PortScanner.isPortFree(33000, '192.0.2.1')).resolves.toBe(false)
      expect(warn).toHaveBeenCalledWith('PORT CHECK FAILED', expect.objectContaining({ code: 'EADDRNOTAVAIL' }))
    })

    test('should not hang when listen fails without an error code', async () => {
      outcomes = { 33000: undefined }
      await expect(PortScanner.isPortFree(33000)).resolves.toBe(false)
    })
  })

  describe('findFreePortInRange', () => {
    test('should return the first free port in the range', async () => {
      await expect(PortScanner.findFreePortInRange(33000, 33003)).resolves.toBe(33000)
    })

    test('should skip reserved ports', async () => {
      await expect(PortScanner.findFreePortInRange(33000, 33003, [33000, 33001])).resolves.toBe(33002)
      expect(attempts.map(a => a.port)).toEqual([33002])
    })

    test('should return the next port when earlier ports are in use', async () => {
      outcomes = { 33000: 'EADDRINUSE', 33001: 'EACCES' }
      await expect(PortScanner.findFreePortInRange(33000, 33003)).resolves.toBe(33002)
    })

    test('should return undefined when every port in the range is in use', async () => {
      defaultOutcome = 'EADDRINUSE'
      await expect(PortScanner.findFreePortInRange(33000, 33003)).resolves.toBeUndefined()
      expect(attempts).toHaveLength(3)
    })

    test('should give up on the first error that means the host cannot be bound', async () => {
      defaultOutcome = 'EADDRNOTAVAIL'
      await expect(PortScanner.findFreePortInRange(33000, 42999)).resolves.toBeUndefined()
      expect(attempts).toHaveLength(1)
      expect(warn).toHaveBeenCalledTimes(1)
    })
  })
})
