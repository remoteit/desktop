import BackendAdaptor from '../services/BackendAdapter'
import { store } from '../store'
import { findService } from '../models/devices'

export function setConnection(serviceID: string, data: Object = {}) {
  const { all } = store.getState().devices
  const [service, device] = findService(all, serviceID)
  if (device && service) {
    BackendAdaptor.emit('connection', {
      ...data,
      id: service.id,
      name: service.name,
      deviceID: device.id,
    })
  }
}
