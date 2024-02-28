import json from '../../package.json'
import browser from '../services/Browser'

export const version = json.version

export function fullVersion() {
  let platform = 'Portal'
  if (browser.isElectron) platform = 'Desktop'
  if (browser.isRemote) platform = 'Remote'
  if (browser.isIOS) platform = 'IOS'
  if (browser.isAndroid) platform = 'Android'
  const dev = browser.environment() === 'development' ? 'Development' : ''
  return `${platform} Version ${json.version} ${dev}`
}

export function numericVersion() {
  return parseInt(version.replace(/\D/g, ''), 10)
}