import { IP_PRIVATE, PORTAL } from '../shared/constants'
import { ApplicationState, store } from '../store'
import { fullVersion } from '../helpers/versionHelper'
import { Capacitor } from '@capacitor/core'

function startLog() {
  console.log(
    `%c

         s t a r t i n g
      ______ _____ ________ _______ ________ _____    __ _______ 
    /  ____/  ___/        /   _   /__   ___/  ___/  /  /__   __/ 
   /  /   /  ___/  /  /  /  /_/  /  /  /  /  ___/__/  /  /  /    
  /__/   /_____/__/__/__/_______/  /__/  /_____/__/__/  /__/     

  ${fullVersion()}
  Set window.stateLogging = true to enable redux state logging

  `,
    'font-family:monospace'
  )
}

class Environment {
  isElectron: boolean = false
  isMobile: boolean = false
  isPortal: boolean = false
  isRemote: boolean = false
  isMac: boolean = false
  isWindows: boolean = false
  hasBackend: boolean = false

  constructor() {
    this.isElectron = isElectron()
    this.isMobile = isMobile()
    this.isPortal = isPortal()
    this.isRemote = isRemote()

    this.isMac = isMac()
    this.isWindows = isWindows()

    this.hasBackend = !this.isPortal && !this.isMobile
    console.log('Environment', this)
  }

  platform() {
    if (this.isElectron) return 'electron'
    if (this.isMobile) return 'mobile'
    if (this.isPortal) return 'portal'
    if (this.isRemote) return 'remote'
    return 'unknown'
  }

  environment() {
    return process.env.NODE_ENV || 'unknown'
  }
}

export default new Environment()

startLog()

function isPortal() {
  return PORTAL || (!isElectron() && !isMobile() && window.location.port === '3000')
}

function isMobile() {
  return Capacitor.isNativePlatform()
}

// limited remote management interface
function isRemote() {
  const { port, hostname } = window.location
  return !(
    isElectron() ||
    isPortal() ||
    isMobile() ||
    ((port === '29999' || port === '29998') && hostname === IP_PRIVATE)
  )
}

function isElectron() {
  return navigator.userAgent.toLowerCase().includes('electron')
}

function isMac() {
  return navigator.userAgent.toLowerCase().includes('mac')
}

function isWindows() {
  return navigator.userAgent.toLowerCase().includes('win')
}

export function getOs(): Ios {
  if (isMac()) return 'mac'
  if (isWindows()) return 'windows'
  return 'linux'
}

export function agent() {
  const result = navigator.userAgent.match(/\(.*?\)/)
  return result?.length ? result[0] : ''
}

// this is a function to save information per user session in local storage
export function getLocalStorage(state: ApplicationState, key: string) {
  const currentSession = state.auth.user?.id
  const value = currentSession ? window.localStorage.getItem(currentSession + ':' + key) : null
  try {
    return value && JSON.parse(value)
  } catch (e) {
    return value
  }
}

export async function setLocalStorage(state: ApplicationState, key: string, value: any) {
  const currentSession = await state.auth.user?.id
  currentSession && window.localStorage.setItem(currentSession + ':' + key, JSON.stringify(value))
}

export async function removeLocalStorage(state: ApplicationState, key: string) {
  const currentSession = await state.auth.user?.id
  currentSession && window.localStorage.removeItem(currentSession + ':' + key)
}

export function windowOpen(url?: string, target?: string) {
  const { ui } = store.dispatch
  try {
    window.open(url, target)
  } catch {
    ui.set({ errorMessage: `Could not launch, URL not valid: ${url}` })
  }
}

export function insertScript(name: string, id: string) {
  return new Promise<any>((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = name
    script.id = id
    document.head.appendChild(script)
    script.onload = resolve
    script.onerror = reject
  })
}
