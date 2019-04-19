import { latestVersion } from './release'
import { version } from './binary'

/**
 * Determine if the current version of connectd is current
 * or not. If it is, return `true` otherwise, return `false`.
 */
export async function needsUpdate() {
  const latest = await latestVersion()
  const current = version()
  // TODO: Should we throw or something instead?
  if (!current || !latest) return true
  return latest > current
}
