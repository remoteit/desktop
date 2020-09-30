export function getPermissions(device: IDevice, email: string) {
  const services = device.services.filter(s => s.access.find(ac => ac.email === email)) || []
  const scripting = device.access.find(ac => ac.email === email)?.scripting || false
  return { services, scripting }
}

export function getConnected(services?: IService[]) {
  const connected: IUser[] = []
  services?.forEach(s => s.sessions.forEach(session => !connected.includes(session) && connected.push(session)))
  return connected
}
