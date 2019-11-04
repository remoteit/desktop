import { IDevice } from 'remote.it'
const separator = ' - '

export function removeNameExt(deviceName: string, name: string) {
  const nameExt = new RegExp(`^${deviceName}[\- _]+`, 'gi')
  return name.toString().replace(nameExt, '')
}

export function addNameExt(deviceName: string, ext: string) {
  return deviceName + separator + ext
}

export function renameServices(devices: IDevice[]) {
  devices.forEach(d => {
    d.services = d.services.map(s => {
      s.name = removeNameExt(d.name, s.name)
      return s
    })
  })
  return devices
}
