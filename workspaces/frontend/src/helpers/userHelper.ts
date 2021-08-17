export function getPermissions(device: IDevice, email?: string) {
  const services = device.services.filter(s => s.access.find(ac => ac.email === email)) || []
  const scripting = device.access.find(ac => ac.email === email)?.scripting || false
  return { services, scripting }
}
