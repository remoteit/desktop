import * as Pool from '../../connectd/pool'
import { IService } from 'remote.it'

export function disconnect() {
  return async (service: IService, callback: (success: boolean) => void) => {
    const success = Pool.disconnect(service.id)
    callback(success)
  }
}
