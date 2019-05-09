const ELECTRON = 'electron'
const BROWSER = 'browser'

export function environment() {
  if (isElectron()) return ELECTRON
  return BROWSER
}

export function isElectron() {
  const userAgent = navigator.userAgent.toLowerCase()
  return userAgent.includes(' electron/')
}
