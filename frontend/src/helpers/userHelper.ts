export function getAccess(device: IDevice, email?: string, selectAllToNewUser?: boolean) {
  let services = device.services.filter(s => s.access?.find(ac => ac.email === email)) || []
  const scripting = device.access?.find(ac => ac.email === email)?.scripting || false

  if (selectAllToNewUser && !services.length && !scripting) services = device.services
  return { services, scripting }
}

class RememberMe {
  key: string = 'rememberMe'
  username: string = ''
  emailProcessed: boolean = false

  constructor() {
    const storage = window.localStorage.getItem(this.key)
    if (!storage) return
    try {
      const state = JSON.parse(storage)
      this.username = state.username
      this.emailProcessed = state.emailProcessed
    } catch (e) {
      console.error('REMEMBER ME ERROR', e)
    }
  }

  get checked() {
    return !!this.username
  }

  set(settings: { username: string; emailProcessed: boolean }) {
    this.username = settings.username
    this.emailProcessed = settings.emailProcessed
    window.localStorage.setItem(this.key, JSON.stringify(settings))
  }

  toggle(settings: { username: string; emailProcessed: boolean }) {
    if (this.checked) {
      this.username = ''
      this.emailProcessed = false
      window.localStorage.removeItem(this.key)
    } else {
      this.set(settings)
    }
  }
}

export const rememberMe = new RememberMe()
