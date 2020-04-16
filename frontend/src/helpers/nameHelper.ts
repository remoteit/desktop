import { REGEX_LAST_NUMBER, REGEX_NAME_SAFE } from '../constants'
import { IDevice } from 'remote.it'
import { store } from '../store'

const separator = ' - '

export function replaceHost(url: string) {
  return url.replace('127.0.0.1', 'localhost')
}

export function hostName(connection: IConnection) {
  const { host = '', port } = connection
  if (!port) return null

  switch (host) {
    case '127.0.0.1':
      return `localhost:${port}`
    case '0.0.0.0':
      const { privateIP } = store.getState().backend
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

export function safeHostname(name: string, blacklist: string[]) {
  let index = 1
  name = name.replace('.local', '')
  while (blacklist.includes(name.toLowerCase().trim())) {
    name = name.replace(REGEX_LAST_NUMBER, `-${index}`)
    index++
  }
  return name.replace(REGEX_NAME_SAFE, '-')
}

export function osName(os?: Ios) {
  const name = {
    mac: 'Mac',
    windows: 'Windows PC',
    linux: 'Linux system',
    rpi: 'Raspberry Pi',
  }
  return os ? name[os] : 'system'
}
