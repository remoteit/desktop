import { execFileSync } from 'child_process'
import { existsSync } from 'fs'
import { targetPath } from './host'

/**
 * Whether or not the connectd binary exists on this system.
 */
export function exists() {
  return existsSync(targetPath())
}

/**
 * Returns the version number of connectd, if it is installed
 * on this system, otherwise it returns null.
 */
export function version() {
  // Don't go further if we can't find connectd on the system.
  if (!exists()) return null

  try {
    execFileSync(targetPath())
  } catch (error) {
    const out = error.stdout
    if (!out) return null

    const lines = out.toString().split('\n')
    for (const line of lines) {
      if (line.includes('Version')) {
        const matches = /Version ([\d\.]*)/.exec(line)
        if (matches && matches.length && matches[1]) {
          return matches[1]
        }
      }
    }
  }

  return null
}
