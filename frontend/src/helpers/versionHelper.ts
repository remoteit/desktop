import { version } from '../../package.json'
import { environment, isPortal, isRemote } from '../services/Browser'

export const packageVersion = version

export function fullVersion() {
  let platform = isPortal() ? 'Portal' : 'Desktop'
  if (isRemote()) platform = 'Remote'
  const dev = environment() === 'development' ? 'Development' : ''
  return `${platform} Version ${version} ${dev}`
}
