import debug from 'debug'
import portfinder from 'portfinder'

const d = debug('desktop:utils:free-port')

export default async (start: number, end: number) => {
  d('Checking port range:', { start, end })
  const port = await portfinder.getPortPromise({
    port: start,
    stopPort: end,
  })
  d('Found available port:', port)
  return port
}
