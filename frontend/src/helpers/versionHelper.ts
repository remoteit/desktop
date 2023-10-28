import json from '../../package.json'
import browser from '../services/Browser'

export const version = json.version

export function fullVersion() {
  let platform = browser.isPortal ? 'Portal' : 'Desktop'
  if (browser.isRemote) platform = 'Remote'
  const dev = browser.environment() === 'development' ? 'Development' : ''
  return `${platform} Version ${json.version} ${dev}`
}
