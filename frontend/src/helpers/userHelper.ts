import { REGEX_EMAIL_SAFE, REGEX_DOMAIN_SAFE } from '../constants'

export function getAccess(device?: IDevice, email?: string) {
  if (!device) return { services: [], scripting: false }

  let services = device.services.filter(s => s.access?.find(ac => ac.email === email)) || []
  const scripting = device.access?.find(ac => ac.email === email)?.scripting || false

  return { services, scripting }
}

export function sanitizeEmail(input: string): string {
  const index = input.lastIndexOf('@')

  if (index === -1) {
    return input.replace(REGEX_EMAIL_SAFE, '')
  } else {
    const localPart = input.substring(0, index)
    const domainPart = input.substring(index + 1)

    return localPart.replace(REGEX_EMAIL_SAFE, '') + '@' + domainPart.replace(REGEX_DOMAIN_SAFE, '')
  }
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
