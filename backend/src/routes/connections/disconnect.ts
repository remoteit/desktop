import * as Pool from '../../connectd/pool'
import { IService } from 'remote.it'

export function disconnect() {
  return async (serviceID: string, callback: (success: boolean) => void) => {
    const success = Pool.disconnectByServiceID(serviceID)
    callback(success)
  }
}
