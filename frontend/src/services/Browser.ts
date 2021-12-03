import { IP_PRIVATE, PORTAL } from '../shared/constants'
import { ApplicationState, store } from '../store'

const ELECTRON = 'electron'
const BROWSER = 'browser'
const DEVELOPMENT = 'development'

export function environment() {
  if (window.location.origin === 'http://localhost:3000') return DEVELOPMENT
  if (isElectron()) return ELECTRON
  return BROWSER
}

export function os() {
  if (isMac()) return 'mac'
  if (isWindows()) return 'windows'
  return 'linux'
}

export function agent() {
  const result = navigator.userAgent.match(/\(.*?\)/)
  return result?.length ? result[0] : ''
}

export function isPortal() {
  const { port } = window.location
  return PORTAL || (!isElectron() && port === '3000')
}

// limited remote management interface
export function isRemote() {
  const { port, hostname } = window.location
  return !(isElectron() || ((port === '29999' || port === '29998') && hostname === IP_PRIVATE) || isPortal())
}

export function isElectron() {
  const userAgent = navigator.userAgent.toLowerCase()
  return userAgent.includes('electron')
}

export function isMac() {
  const platform = navigator.platform.toLowerCase()
  return platform.includes('mac')
}

export function isWindows() {
  const platform = navigator.platform.toLowerCase()
  return platform.includes('win')
}

export function isHeadless() {
  return !isElectron()
}

export function isDev() {
  return environment() === DEVELOPMENT
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
