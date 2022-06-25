import json from '../../package.json'
import { environment, isPortal, isRemote } from '../services/Browser'

export const version = json.version

export function fullVersion() {
  let platform = isPortal() ? 'Portal' : 'Desktop'
  if (isRemote()) platform = 'Remote'
  const dev = environment() === 'development' ? 'Development' : ''
  return `${platform} Version ${json.version} ${dev}`
}
