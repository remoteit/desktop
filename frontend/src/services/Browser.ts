import { IP_PRIVATE, PORTAL } from '../shared/constants'
import { store } from '../store'

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

export function launchPutty(typeID?: number) {
  return typeID && [22, 28].includes(typeID) && isWindows()
}

export function launchVNC(typeID?: number) {
  return typeID === 4 && isWindows()
}

export function launchRemoteDesktop(typeID?: number) {
  return typeID === 5 && isWindows()
}

export function getApplicationObj(typeID?: number, username?: string) {
  if (launchPutty(typeID)) {
    return {
      application: 'putty',
    }
  }

  if (launchVNC(typeID)) {
    return {
      username,
      application: 'vncviewer',
    }
  }

  if (launchRemoteDesktop(typeID)) {
    return {
      username,
      path: 'desktop',
      application: 'remoteDesktop',
    }
  }

  return { application: '' }
}

// this is a function to save information per user session in local storage
export function getLocalStorageByUser(key: string) {
  try {
    const currentSession = store.getState().auth.user?.email
    return currentSession ? window.localStorage.getItem(currentSession + ':' + key) : null
  } catch (error) {
    console.error({ messageError: `Error: ${error}` })
  }
  return null
}

export async function setLocalStorageByUser(key: string, value: string) {
  try {
    const currentSession = await store.getState().auth.user?.email
    currentSession && window.localStorage.setItem(currentSession + ':' + key, value)
  } catch (error) {
    console.error({ messageError: `Error: ${error}` })
  }
}

export async function removeLocalStorageByUser(key: string) {
  try {
    const currentSession = await store.getState().auth.user?.email
    currentSession && window.localStorage.removeItem(currentSession + ':' + key)
  } catch (error) {
    console.error({ messageError: `Error: ${error}` })
  }
}
