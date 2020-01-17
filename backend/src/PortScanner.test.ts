import PortScanner, { ServerError } from './PortScanner'
// import { ConnectionPool } from '../connectd/ConnectionPool'
import net, { Server } from 'net'
import { EventEmitter } from 'events'

// jest.mock('../connectd/ConnectionPool')

describe('backend/utils/PortScanner', () => {
  describe('.findFreePortInRange', () => {
    test('returns the next available port in a range', async () => {
      const expected = 33002
      // Simulate a saved connection existing for port 33000
      // const spy: jest.SpyInstance = jest
      // .spyOn(ConnectionPool.prototype, 'usedPorts')
      // .mockReturnValue([33000])

      // Simulate the first port not being free
      jest.spyOn(PortScanner, 'isPortFree').mockImplementationOnce(() => Promise.resolve(false))

      const port = await PortScanner.findFreePortInRange(33000, 42999, [33000])

      expect(port).toBe(expected)
      // expect(spy).toBeCalled()
    })
  })

  describe('.isPortFree', () => {
    test('returns true if port is free', async () => {
      // Create a mock server to use for net.createServer
      class MockServer extends EventEmitter {
        listen() {
          this.emit('listening')
          this.emit('close')
        }
        close() {}
      }

      jest.spyOn(net, 'createServer').mockReturnValueOnce(new MockServer() as Server)

      expect(await PortScanner.isPortFree(33000)).toBe(true)
    })

    test('returns false if port is not free', async () => {
      // Create a mock server to use for net.createServer
      class MockServer extends EventEmitter {
        listen() {
          const error = new Error('Address in use') as ServerError
          error.code = 'EADDRINUSE'
          this.emit('error', error)
        }
      }

      jest.spyOn(net, 'createServer').mockReturnValueOnce(new MockServer() as Server)

      expect(await PortScanner.isPortFree(33000)).toBe(false)
    })
  })
})
