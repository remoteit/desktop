import cli from './cliInterface'
import semverCompare from 'semver/functions/compare'
import environment from './environment'
import version from './cli-version.json'
import Logger from './Logger'
import path from 'path'

interface BinaryArgs {
  name: string
  version: string
  isCli?: boolean
}

export default class Binary {
  name: string
  version: string
  installedVersion?: string
  inProgress?: boolean
  isCli?: boolean

  static EVENTS = {
    error: 'binary/install/error',
    install: 'binaries/install',
    installed: 'binary/installed',
    notInstalled: 'binary/not-installed',
  }

  constructor(args: BinaryArgs) {
    this.name = args.name
    this.version = args.version
    this.isCli = args.isCli
  }

  async isCurrent() {
    let current = true
    let version = 'Not fetched'

    if (this.isCli) {
      try {
        version = await cli.version()
        this.installedVersion = version
        current = semverCompare(version, this.version) >= 0
      } catch (error) {
        current = false
        Logger.warn('BINARY VERSION ERROR', { name: this.name, error })
      }
    }

    if (current) {
      Logger.info('CHECK BINARY VERSION', { current, name: this.name, version, desiredVersion: this.version })
    } else {
      Logger.info('BINARY NOT CURRENT', { name: this.name, version, desiredVersion: this.version })
    }

    return current
  }

  get path() {
    return environment.isHeadless ? cliBinary.name : path.resolve(environment.binPath, this.fileName)
  }

  get fileName() {
    return environment.isWindows ? this.name + '.exe' : this.name
  }

  get symlink() {
    return path.resolve(environment.symlinkPath, this.fileName)
  }

  toJSON(): InstallationInfo {
    return {
      path: this.path,
      version: this.version,
      name: this.name,
      installedVersion: this.installedVersion,
    }
  }
}

export const cliBinary = new Binary({ name: 'remoteit', version: version.cli, isCli: true })

export const binaries = [
  cliBinary,
  new Binary({ name: 'muxer', version: version.muxer }),
  new Binary({ name: 'demuxer', version: version.demuxer }),
  new Binary({ name: 'connectd', version: version.connectd }),
]
