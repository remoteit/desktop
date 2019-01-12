import fs from 'fs'
import Platform from './platform'

export type HostFileEntry = {
  ip: string
  host: string
}

export default class HostsFile {
  /**
   * The host file lives in a different place on
   * windows machines compared to *NIX machines.
   */
  public static get location() {
    return Platform.isWindows
      ? 'C:/Windows/System32/drivers/etc/hosts'
      : '/etc/hosts'
  }

  /**
   * Returns the raw host file as a string.
   */
  public static get raw(): string {
    // Make sure things still work if not in Electron,
    // just for testing purposes.
    //     if (!Platform.isElectron) {
    //       console.error('You are not running in Electron!')
    //       return `# Fake hosts file. You are NOT running in Electron!
    // 127.0.0.1 localhost`
    //     }

    return fs.readFileSync(this.location).toString()
  }

  /**
   * Return every valid entry from the user's hosts file.
   */
  public static get entries(): HostFileEntry[] {
    return this.raw
      .split('\n')
      .reduce((entries: HostFileEntry[], curr: string) => {
        // Cleanup any whitespace that may mess up further comparisons
        curr = curr.trim()

        // Don't count empty lines and comments.
        if (!curr || curr.startsWith('#') || curr.startsWith(':')) {
          return entries
        }

        let entry = curr
          .trim()
          .replace('\t', ' ')
          .split(' ')
        entries.push({ ip: entry[0], host: entry[1] })
        return entries
      }, [])
  }
}
