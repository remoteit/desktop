import net from 'net'
import PortScanner from './PortScanner'

// 192.0.2.0/24 is TEST-NET-1 (RFC 5737). It is never assigned to a local
// interface, so binding to it fails with EADDRNOTAVAIL instead of EADDRINUSE.
const UNBINDABLE_HOST = '192.0.2.1'

describe('backend/PortScanner', () => {
  describe('isPortFree', () => {
    test('should report an unused port as free', async () => {
      await expect(PortScanner.isPortFree(45301, '127.0.0.1')).resolves.toBe(true)
    })

    test('should report a port already in use as not free', async () => {
      const server = net.createServer()
      await new Promise<void>(resolve => server.listen(45302, '127.0.0.1', resolve))

      await expect(PortScanner.isPortFree(45302, '127.0.0.1')).resolves.toBe(false)

      await new Promise<void>(resolve => server.close(() => resolve()))
    })

    test('should report a port as not free when the address cannot be bound', async () => {
      await expect(PortScanner.isPortFree(45303, UNBINDABLE_HOST)).resolves.toBe(false)
    })
  })

  describe('findFreePortInRange', () => {
    test('should return the first free port in the range', async () => {
      await expect(PortScanner.findFreePortInRange(45304, 45307)).resolves.toBe(45304)
    })

    test('should skip reserved ports', async () => {
      await expect(PortScanner.findFreePortInRange(45304, 45307, [45304, 45305])).resolves.toBe(45306)
    })

    test('should give up rather than wait forever when no port can be bound', async () => {
      const isPortFree = PortScanner.isPortFree
      const spy = jest
        .spyOn(PortScanner, 'isPortFree')
        .mockImplementation((port: number) => isPortFree.call(PortScanner, port, UNBINDABLE_HOST))

      await expect(PortScanner.findFreePortInRange(45308, 45311)).resolves.toBeUndefined()
      expect(spy).toHaveBeenCalledTimes(3)

      spy.mockRestore()
    })
  })
})
