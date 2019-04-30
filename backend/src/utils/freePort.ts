import debug from 'debug'
import portfinder from 'portfinder'

const d = debug('r3:desktop:utils:free-port')

export async function freePort(range: number[]) {
  d('Checking port range:', range)
  const port = await portfinder.getPortPromise({
    port: range[0],
    stopPort: range[1],
  })
  d('Found available port:', port)
  return port
}
