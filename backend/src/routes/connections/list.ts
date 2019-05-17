import debug from 'debug'
import * as Pool from '../../connectd/pool'

const d = debug('r3:desktop:backend:routes:connections:list')

export function list() {
  return async (callback: (connections: ConnectdProcess[]) => void) => {
    d('Return list of connected services:', Pool.pool.length)
    callback(Pool.pool)
  }
}
