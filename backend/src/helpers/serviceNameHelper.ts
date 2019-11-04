const separator = ' - '

export function removeNameExt(deviceName: string, name: string) {
  const nameExt = new RegExp(`^${deviceName}[\- _]+`, 'gi')
  return name.toString().replace(nameExt, '')
}

export function addNameExt(deviceName: string, ext: string) {
  return deviceName + separator + ext
}
