import fs from 'fs'
import path from 'path'
import logger from '../utils/logger'
import { REMOTEIT_ROOT_DIR } from '../constants'

export const fileName = 'connections.json'

export const location = path.join(REMOTEIT_ROOT_DIR, fileName)

/**
 * Checks to see if the connections file exists on the
 * file system.
 */
export function exists() {
  return fs.existsSync(location)
}

/**
 * Read the connections file and return it or
 * undefined if it is missing or invalid.
 */
export function read(): ConnectionInfo[] | undefined {
  if (!exists()) return

  logger.info('Loading saved connections file:', { location })

  const content = fs.readFileSync(location)
  if (!content || !content.toString()) return

  try {
    const json = JSON.parse(content.toString())
    if (!json) return

    logger.info('Read saved connections file:', json)

    return json
  } catch (error) {
    return
  }
}

/**
 * Returns whether the connections file is valid or not.
 * This includes a check to see if it exists and has
 * valid JSON contents.
 */
export function isValid() {
  return Boolean(read())
}

/**
 * Remove the connections file from the user's system.
 */
export function remove() {
  if (!exists()) return
  fs.unlinkSync(location)
}

/**
 * Create a new connections file with an optional set
 * of initial connections.
 */
export function write(content: ConnectionInfo[] = []): ConnectionInfo[] {
  fs.mkdirSync(REMOTEIT_ROOT_DIR, { recursive: true })
  fs.writeFileSync(location, JSON.stringify(content, null, 2))
  return content
}

/**
 * Adds a new connection to the list of connections.
 * Creates the connections file if missing and does not
 * create duplicate connections.
 */
export function addConnection(
  conn: ConnectionInfo
): ConnectionInfo[] | undefined {
  const content = read()
  if (!content) return write([conn])

  // Don't add a new conneciton if the service ID or port match
  // an existing connection.
  const existing = content.find(
    c => c.serviceID === conn.serviceID || c.port === conn.port
  )
  if (existing) return content

  content.push(conn)
  return write(content)
}
