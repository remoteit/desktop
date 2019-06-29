import fs from 'fs'
import path from 'path'
import logger from '../utils/logger'
import { REMOTEIT_ROOT_DIR } from '../constants'

export default class SavedConnectionsFile {
  public static get fileName() {
    return 'connections.json'
  }

  public static get location() {
    return path.join(REMOTEIT_ROOT_DIR, this.fileName)
  }

  /**
   * Checks to see if the connections file exists on the
   * file system.
   */
  public static exists() {
    return fs.existsSync(this.location)
  }

  /**
   * Read the connections file and return it or
   * undefined if it is missing or invalid.
   */
  public static read(): ConnectionInfo[] | undefined {
    if (!this.exists()) return

    logger.info('Loading saved connections file:', { location: this.location })

    const content = fs.readFileSync(this.location)
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
  public static isValid() {
    return Boolean(this.read())
  }

  /**
   * Remove the connections file from the user's system.
   */
  public static remove() {
    if (!this.exists()) return
    fs.unlinkSync(this.location)
  }

  /**
   * Create a new connections file with an optional set
   * of initial connections.
   */
  public static write(content: ConnectionInfo[] = []): ConnectionInfo[] {
    fs.mkdirSync(REMOTEIT_ROOT_DIR, { recursive: true })
    fs.writeFileSync(this.location, JSON.stringify(content, null, 2))
    return content
  }
}
