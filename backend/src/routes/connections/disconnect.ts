import * as Pool from '../../connectd/pool'
import { IService } from 'remote.it'

export function disconnect() {
  return async (service: IService, callback: (success: boolean) => void) => {
    const success = Pool.disconnectByServiceID(service.id)
    callback(success)
  }
}
