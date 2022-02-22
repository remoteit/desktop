import net from 'net'
import debug from 'debug'
import isPortReachable from 'is-port-reachable'

const d = debug('r3:desktop:PortScanner')

export interface ServerError extends Error {
  code?: string
}

export default class PortScanner {
  public static async findFreePortInRange(
    start: number,
    end: number,
    reservedPorts: number[] = []
  ): Promise<number | undefined> {
    d('Checking port range:', { start, end })

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
      d('IS PORT REACHABLE?', { isReachable })
    } catch (error) {
      d('NOT VALID PORT', { error })
      isReachable = false
    }
    return isReachable
  }
}
