import { r3 } from '../services/remote.it'

export class Device {
  static async all() {
    // TODO: Handle errors!
    return await r3.devices.all()
  }
}
