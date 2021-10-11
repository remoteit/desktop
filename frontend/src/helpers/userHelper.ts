export function getPermissions(device: IDevice, email?: string, selectAllToNewUser?: boolean) {
  let services = device.services.filter(s => s.access.find(ac => ac.email === email)) || []
  const scripting = device.access.find(ac => ac.email === email)?.scripting || false

  if (selectAllToNewUser && !services.length && !scripting) services = device.services
  return { services, scripting }
}
