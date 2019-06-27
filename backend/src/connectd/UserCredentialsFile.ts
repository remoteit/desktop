import fs from 'fs'
import path from 'path'
import { homeDir, remoteitDir } from '../services/Platform'
import logger from '../utils/logger'

export const directory = remoteitDir
export const location = path.join(directory, 'user.json')

/**
 * Checks to see if the user credentials file exists on the
 * file system.
 */
export function exists(): boolean {
  const fileExists = fs.existsSync(location)
  logger.info(`User file ${fileExists ? 'exists' : 'does not exist'}`)
  return fileExists
}

/**
 * Read the connections file and return it or
 * undefined if it is missing or invalid.
 */
export function read(): User | undefined {
  if (!exists()) return

  const content = fs.readFileSync(location)
  logger.info('User file contents', { content })

  if (!content || !content.toString()) return

  try {
    const json = JSON.parse(content.toString())
    logger.info('User file JSON', { json })

    if (!json || !json.username || !json.authHash) return

    return json
  } catch (error) {
    return
  }
}

/**
 * Returns whether the user credentials file is valid or not.
 * This includes a check to see if it exists and has
 * valid JSON contents.
 */
export function isValid(): boolean {
  const valid = Boolean(read())
  logger.info(`User file ${valid ? 'is' : 'is not'} valie`)
  return valid
}

/**
 * Remove the user credentials file from the user's system.
 */
export function remove() {
  logger.info('Removing user file')
  if (!exists()) return
  fs.unlinkSync(location)
}

/**
 * Create a new user credentials file with an optional set
 * of initial user credentials.
 */
export function write(content: User): User {
  logger.info('Writing user file contents', { content })
  fs.mkdirSync(directory, { recursive: true })
  fs.writeFileSync(location, JSON.stringify(content, null, 2))
  return content
}
