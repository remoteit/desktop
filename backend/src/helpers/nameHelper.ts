import { IDevice } from 'remote.it'

const separator = ' - '

export function hostName(connection: IConnection, privateIP: ipAddress) {
  const { host = '', port } = connection

  switch (host) {
    case '127.0.0.1':
      return `localhost:${port}`
    case '0.0.0.0':
      return `${privateIP}:${port}`
    default:
      return `${host}:${port}`
  }
}

export function removeDeviceName(deviceName: string, name: string) {
  const nameExt = new RegExp(`^${deviceName}[- _]+`, 'gi')
  return name.toString().replace(nameExt, '')
}

export function addDeviceName(deviceName: string, name: string) {
  const ext = removeDeviceName(deviceName, name)
  return deviceName + separator + ext
}

export function renameServices(devices: IDevice[]) {
  devices.forEach(d => {
    d.services = d.services.map(s => {
      s.name = removeDeviceName(d.name, s.name)
      return s
    })
  })
  return devices
}
