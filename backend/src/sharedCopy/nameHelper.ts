/* 
  This is a shared file between backend and frontend
  It will be copied from the frontend to the backend on build
  
  ONLY EDIT THE SOURCE FILE IN frontend
*/

import { REGEX_LAST_NUMBER, REGEX_NAME_SAFE, REGEX_NOT_FILE_SAFE, IP_PRIVATE, IP_OPEN } from './constants'
import { getEnvironment } from '../sharedAdaptor'

const separator = ' - '

export function replaceHost(url: string) {
  if (url.includes(IP_PRIVATE)) {
    return url.replace(IP_PRIVATE, 'localhost')
  }
  if (url.includes(IP_OPEN)) {
    const { privateIP } = getEnvironment()
    return url.replace(IP_OPEN, privateIP)
  }
  return url
}

export function hostName(connection: IConnection) {
  const { host = '', port } = connection
  if (!port) return ''
  return `${replaceHost(host)}:${port}`
}

export function removeDeviceName(deviceName: string, name: string) {
  const nameExt = new RegExp(`^${deviceName}[- _]+`, 'gi')
  return name.toString().replace(nameExt, '')
}

export function addDeviceName(deviceName: string, name: string) {
  const ext = removeDeviceName(deviceName, name)
  return deviceName + separator + ext
}

export function renameServices(devices: IDevice[] = []) {
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

export function safeFilename(name: string) {
  return name.replace(REGEX_NOT_FILE_SAFE, '-')
}
