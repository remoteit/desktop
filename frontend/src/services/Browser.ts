import { REDIRECT_URL } from '../shared/constants'

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

export function getRedirectUrl() {
  let redirectUrl = window.origin
  if (isElectron()) {
    redirectUrl = REDIRECT_URL
  }
  return redirectUrl
}

export function isRemote() {
  const { port } = window.location
  return !(isElectron() || port === '29999' || port === '29998')
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

export function isDev() {
  return environment() === DEVELOPMENT
}

export function launchPutty(typeID?: number) {
  return typeID === 22 && isWindows()
}
