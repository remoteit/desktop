import fs from 'fs'
import path from 'path'
import os from 'os'

export const fileName = 'user.json'

export const directory = path.join(os.homedir(), '.remoteit')

export const location = path.join(directory, fileName)

/**
 * Checks to see if the user credentials file exists on the
 * file system.
 */
export function exists() {
  return fs.existsSync(location)
}

/**
 * Read the connections file and return it or
 * undefined if it is missing or invalid.
 */
export function read(): User | undefined {
  if (!exists()) return

  const content = fs.readFileSync(location)
  if (!content || !content.toString()) return

  try {
    const json = JSON.parse(content.toString())
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
export function isValid() {
  return Boolean(read())
}

/**
 * Remove the user credentials file from the user's system.
 */
export function remove() {
  if (!exists()) return
  fs.unlinkSync(location)
}

/**
 * Create a new user credentials file with an optional set
 * of initial user credentials.
 */
export function write(content: User): User {
  fs.mkdirSync(directory, { recursive: true })
  fs.writeFileSync(location, JSON.stringify(content, null, 2))
  return content
}
