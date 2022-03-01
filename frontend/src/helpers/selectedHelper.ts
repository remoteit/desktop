import { getAllDevices } from '../models/accounts'
import { ApplicationState } from '../store'

export function eachDevice(state: ApplicationState, selected: string[], callback: (device: IDevice) => void) {
  getAllDevices(state).forEach(device => {
    if (selected.includes(device.id)) callback(device)
  })
}