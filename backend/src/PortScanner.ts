import net from 'net'
import Logger from './Logger'
import isPortReachable from 'is-port-reachable'

export interface ServerError extends Error {
  code?: string
}

export default class PortScanner {
  public static async findFreePortInRange(
    start: number,
    end: number,
    reservedPorts: number[] = []
  ): Promise<number | undefined> {
    if (start > end) end = start + 1

    for (let port = start; port < end; port++) {
      if (reservedPorts.includes(port)) continue
      if (await this.isPortFree(port)) return port
    }
  }

  // @TODO check https://www.npmjs.com/package/is-port-reachable when loading device page.
  public static async isPortFree(port: number, host: string = 'localhost'): Promise<boolean> {
    return new Promise(function (resolve) {
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

      server.listen(port, host)
    })
  }

  public static async isPortReachable(port: number, host?: string) {
    let isReachable = false
    try {
      isReachable = await isPortReachable(port, { host })
      Logger.warn('VALID PORT', { isReachable, port, host })
    } catch (error) {
      isReachable = false
      Logger.warn('NOT VALID PORT', { error, port, host })
    }
    return isReachable
  }
}
