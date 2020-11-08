import cli from './cliInterface'
import debug from 'debug'
import semverCompare from 'semver/functions/compare'
import environment from './environment'
import EventBus from './EventBus'
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

  async check(log?: boolean) {
    if (this.inProgress) return

    const current = await this.isCurrent(log)

    if (current) {
      return EventBus.emit(Binary.EVENTS.installed, this.toJSON())
    } else if (environment.isElevated) {
      EventBus.emit(Binary.EVENTS.install)
    }
    EventBus.emit(Binary.EVENTS.notInstalled, this.name)
  }

  async isCurrent(log?: boolean) {
    let version = 'Not Installed'
    let current = false

    if (!this.isCli) return true

    // if (this.isInstalled()) {
    try {
      version = await cli.version()
      this.installedVersion = version
      current = semverCompare(version, this.version) >= 0
    } catch (error) {
      Logger.warn('BAD CLI VERSION', { error })
    }
    // }

    if (current) {
      log && Logger.info('CHECK CLI VERSION', { current, name: this.name, version, desiredVersion: this.version })
    } else {
      Logger.info('CLI NOT CURRENT', { name: this.name, version, desiredVersion: this.version })
    }

    return current
  }

  // isInstalled() {
  //   if (binaryInstaller.inProgress) return false
  //   const filePath = path.join(environment.binPath, this.fileName)
  //   const installed = existsSync(filePath)
  //   d('BINARY EXISTS', { name: this.fileName, installed, filePath })
  //   return installed
  // }

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
