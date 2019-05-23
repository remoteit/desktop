import fs from 'fs'
import path from 'path'
import os from 'os'

export const fileName = 'connections.json'

export const directory = path.join(os.homedir(), '.remoteit')

export const location = path.join(directory, fileName)

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
export function read(): Connection[] | undefined {
  if (!exists()) return

  const content = fs.readFileSync(location)
  if (!content || !content.toString()) return

  try {
    const json = JSON.parse(content.toString())
    if (!json) return

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
export function write(content: Connection[] = []): Connection[] {
  fs.mkdirSync(directory, { recursive: true })
  fs.writeFileSync(location, JSON.stringify(content, null, 2))
  return content
}

/**
 * Adds a new connection to the list of connections.
 * Creates the connections file if missing and does not
 * create duplicate connections.
 */
export function addConnection(conn: Connection): Connection[] | undefined {
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
