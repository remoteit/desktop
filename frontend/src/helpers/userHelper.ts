export function getAccess(device: IDevice, email?: string, selectAllToNewUser?: boolean) {
  let services = device.services.filter(s => s.access?.find(ac => ac.email === email)) || []
  const scripting = device.access?.find(ac => ac.email === email)?.scripting || false

  if (selectAllToNewUser && !services.length && !scripting) services = device.services
  return { services, scripting }
}

class RememberMe {
  key: string = 'rememberMe'
  username: string = ''

  constructor() {
    this.username = window.localStorage.getItem(this.key) || ''
  }

  get checked() {
    return !!this.username
  }

  set(username: string) {
    window.localStorage.setItem(this.key, username)
    this.username = username
  }
}

export const rememberMe = new RememberMe()
