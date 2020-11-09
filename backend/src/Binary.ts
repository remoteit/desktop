import cli from './cliInterface'
import debug from 'debug'
import semverCompare from 'semver/functions/compare'
import commandExists from 'command-exists'
import environment from './environment'
import Logger from './Logger'
import path from 'path'

const d = debug('binary')

export type ProgressCallback = (percent: number) => void

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

  async isCurrent(log?: boolean) {
    let version = 'Not Installed'
    let current = this.isInstalled()

    if (current && this.isCli) {
      try {
        version = await cli.version()
        this.installedVersion = version
        current = semverCompare(version, this.version) >= 0
      } catch (error) {
        Logger.warn('BAD CLI VERSION', { error })
      }
    }

    if (current) {
      log && Logger.info('CHECK CLI VERSION', { current, name: this.name, version, desiredVersion: this.version })
    } else {
      Logger.info('CLI NOT CURRENT', { name: this.name, version, desiredVersion: this.version })
    }

    return current
  }

  isInstalled() {
    let installed = commandExists.sync('remoteit')
    d('BINARY EXISTS', { name: this.fileName, installed })
    return installed
  }

  get path() {
    return path.join(environment.binPath, this.fileName)
  }

  get fileName() {
    return environment.isWindows ? this.name + '.exe' : this.name
  }

  get symlink() {
    return path.join(environment.symlinkPath, this.fileName)
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
