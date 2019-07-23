import fs from 'fs'
import Logger from './Logger'
import path from 'path'

export default class JSONFile<T> {
  public location: string

  constructor(location: string) {
    this.location = location
  }

  /**
   * Checks to see if the connections file exists on the
   * file system.
   */
  get exists() {
    return fs.existsSync(this.location)
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
  write = (content: T) => {
    Logger.info('Writing file', { location: this.location, content })

    // Make sure containing folder exists.
    fs.mkdirSync(path.parse(this.location).dir, { recursive: true })

    // Write the contents as a indented/formatted JSON value.
    fs.writeFileSync(this.location, JSON.stringify(content, null, 2))
  }
}
