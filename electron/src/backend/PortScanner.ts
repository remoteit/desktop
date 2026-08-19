import net from 'net'
import Logger from './Logger'
import isPortReachable from 'is-port-reachable'

export interface ServerError extends Error {
  code?: string
}

export interface PortCheck {
  free: boolean
  code?: string
}

// Codes that mean "this port is taken" - every other listen error means the
// host itself can't be bound, so scanning the rest of the range is pointless.
const PORT_IN_USE_CODES = ['EADDRINUSE', 'EACCES']

export default class PortScanner {
  static EVENTS = {
    freePort: 'freePort',
    reachablePort: 'reachablePort',
  }

  public static async findFreePortInRange(
    start: number,
    end: number,
    reservedPorts: number[] = []
  ): Promise<number | undefined> {
    if (start > end) end = start + 1

    for (let port = start; port < end; port++) {
      if (reservedPorts.includes(port)) continue
      const result = await this.checkPort(port)
      if (result.free) return port
      if (!PORT_IN_USE_CODES.includes(result.code || '')) return
    }
  }

  // @TODO check https://www.npmjs.com/package/is-port-reachable when loading device page.
  public static async isPortFree(port: number, host?: string): Promise<boolean> {
    const result = await this.checkPort(port, host)
    return result.free
  }

  public static async checkPort(port: number, host: string = 'localhost'): Promise<PortCheck> {
    return new Promise(function (resolve) {
      const server = net.createServer()

      // Any listen error means the port is unusable, so always settle the promise here.
      // EADDRNOTAVAIL and ENOTFOUND show up when the host doesn't resolve to a local
      // address, and leaving those pending stalls every caller of findFreePortInRange.
      server.once('error', (err: ServerError) => {
        if (!PORT_IN_USE_CODES.includes(err.code || ''))
          Logger.warn('PORT CHECK FAILED', { port, host, code: err.code, error: err.message })
        resolve({ free: false, code: err.code })
      })

      // Listen for connection and resolve "free" if no errors
      server.once('listening', () => {
        server.once('close', () => resolve({ free: true }))
        server.close()
      })

      server.listen(port, host)
    })
  }

  public static async isPortReachable(port: number, host?: string) {
    let isReachable = false
    try {
      isReachable = await isPortReachable(port, { host })
      // Logger.info('VALID PORT', { isReachable, port, host })
    } catch (error) {
      isReachable = false
      // Logger.warn('NOT VALID PORT', { error, port, host })
    }
    return isReachable
  }
}
