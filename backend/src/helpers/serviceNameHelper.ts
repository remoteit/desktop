const separator = ' - '

export function removeNameExt(deviceName: string, name: string) {
  return name.toString().replace(deviceName + separator, '')
}

export function addNameExt(deviceName: string, ext: string) {
  return deviceName + separator + ext
}
