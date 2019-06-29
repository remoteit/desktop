import fs from 'fs'
import path from 'path'
import logger from '../utils/logger'
import { REMOTEIT_ROOT_DIR } from '../constants'

export default class UserCredentialsFile {
  public static get directory() {
    return REMOTEIT_ROOT_DIR
  }

  public static get location() {
    return path.join(this.directory, 'user.json')
  }

  /**
   * Read the connections file and return it or
   * undefined if it is missing or invalid.
   */
  public static read(): User | undefined {
    if (!this.exists()) return

    const content = fs.readFileSync(this.location)

    if (!content || !content.toString()) return

    logger.info('User file contents', { content: content.toString() })

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
   * Remove the user credentials file from the user's system.
   */
  public static remove() {
    logger.info('Removing user file')
    if (!this.exists()) return
    fs.unlinkSync(this.location)
  }

  /**
   * Create a new user credentials file with an optional set
   * of initial user credentials.
   */
  public static write(content: User): User {
    logger.info('Writing user file contents', { content })
    fs.mkdirSync(this.directory, { recursive: true })
    fs.writeFileSync(this.location, JSON.stringify(content, null, 2))
    return content
  }

  /**
   * Returns whether the user credentials file is valid or not.
   * This includes a check to see if it exists and has
   * valid JSON contents.
   */
  public static isValid(): boolean {
    const valid = Boolean(this.read())
    logger.info(`User file ${valid ? 'is' : 'is not'} valie`)
    return valid
  }

  /**
   * Checks to see if the user credentials file exists on the
   * file system.
   */
  public static exists(): boolean {
    const fileExists = fs.existsSync(this.location)
    logger.info(`User file ${fileExists ? 'exists' : 'does not exist'}`)
    return fileExists
  }
}
