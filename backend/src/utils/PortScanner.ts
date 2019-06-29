import net from 'net'
import debug from 'debug'
// import portfinder from 'portfinder'
import logger from './logger'
import ConnectionPool from '../connectd/ConnectionPool'

const d = debug('r3:desktop:utils:free-port')

export interface ServerError extends Error {
  code?: string
}

export default class PortScanner {
  static async findFreePortInRange(
    start: number,
    end: number
  ): Promise<number | undefined> {
    d('Checking port range:', { start, end })
    const reservedPorts = ConnectionPool.usedPorts()

    // Create a range between start and end port numbers
    const range = [...Array(end - start).keys()]
      // Increment the ports from  the starting port number
      .map(x => x + start)
      // Remove any reserved ports from our pool of ports
      .filter(x => !reservedPorts.includes(x))

    // Check if port is free, and if so, return it.
    for (const port of range) {
      const free = await this.isPortFree(port)
      if (free) {
        logger.info('Found free port:', { free })
        return port
      }
    }
  }

  static async isPortFree(port: number): Promise<boolean> {
    return new Promise(function(resolve) {
      const server = net.createServer()

      // Check if binding to port causes an exception
      server.once('error', (err: ServerError) => {
        if (err.code && (err.code === 'EADDRINUSE' || err.code === 'EACCES')) {
          resolve(false)
        }
      })

      // Listen for connection and resolve "true" if no errors
      server.once('listening', () => {
        server.once('close', () => resolve(true))
        server.close()
      })

      server.listen(port)
    })
  }
}
