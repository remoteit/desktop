import Logger from './Logger'
import debug from 'debug'
import fs from 'fs'
import path from 'path'

const d = debug('r3:backend:JSONFile')

export default class JSONFile<T> {
  public location: string

  constructor(location: string) {
    this.location = location
    Logger.info('FILE ATTACHED', { location })
  }

  /**
   * Checks to see if the connections file exists on the
   * file system.
   */
  get exists() {
    const exists = fs.existsSync(this.location)
    if (!exists) Logger.info('FILE DOES NOT EXIST', { location: this.location })
    return exists
  }

  /**
   * Read the connections file and return it or
   * undefined if it is missing or invalid.
   */
  read(): T | undefined {
    if (!this.exists) return

    // Logger.info('Loading saved connections file:', { location: this.location })

    const content = fs.readFileSync(this.location)
    if (!content || !content.toString()) return

    try {
      const json = JSON.parse(content.toString())
      if (!json) return

      // Logger.info('Read saved connections file:', json)

      return json
    } catch (error) {
      Logger.error('FILE READ ERROR', error)
      return
    }
  }

  /**
   * Returns whether the file is valid or not.
   * This includes a check to see if it exists and has
   * valid JSON contents.
   */
  isValid = () => Boolean(this.read())

  /**
   * Remove the file from the filesystem.
   */
  remove = () => this.exists && fs.unlinkSync(this.location)

  /**
   * Create a new file.
   */
  write = (content?: T) => {
    d('Writing file', { location: this.location, content })
    try {
      // Make sure containing folder exists.
      fs.mkdirSync(path.parse(this.location).dir, { recursive: true })

      // Write the contents as a indented/formatted JSON value.
      fs.writeFileSync(this.location, JSON.stringify(content || {}, null, 2))
    } catch (error) {
      Logger.error('FILE WRITE ERROR', error)
      return
    }
  }
}
