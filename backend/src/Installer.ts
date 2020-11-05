import debug from 'debug'
import cli from './cliInterface'
import preferences from './preferences'
import semverCompare from 'semver/functions/compare'
import environment from './environment'
import Logger from './Logger'
import path from 'path'
import { existsSync } from 'fs'
import binaryInstaller from './binaryInstaller'
import EventBus from './EventBus'

const d = debug('installer')

export type ProgressCallback = (percent: number) => void

interface InstallerArgs {
  repoName: string
  name: string
  version: string
  dependencies: string[]
}

export default class Installer {
  repoName: string
  name: string
  version: string
  installedVersion?: string
  dependencies: string[]
  pathFile?: string

  static EVENTS = {
    progress: 'binary/install/progress',
    error: 'binary/install/error',
    installed: 'binary/installed',
    notInstalled: 'binary/not-installed',
  }

  constructor(args: InstallerArgs) {
    this.repoName = args.repoName
    this.name = args.name
    this.version = args.version
    this.dependencies = args.dependencies
  }

  async check(log?: boolean) {
    if (binaryInstaller.inProgress) return

    return EventBus.emit(Installer.EVENTS.installed, this.toJSON())
  }

  toJSON() {
    return {
      path: this.binaryPathCLI(),
      version: this.version,
      name: this.name,
      installedVersion: this.installedVersion,
    } as InstallationInfo
  }

  isDesktopCurrent(log?: boolean) {
    let desktopVersion = preferences.get().version
    let current = desktopVersion && semverCompare(desktopVersion, environment.version) >= 0
    if (current) {
      log && Logger.info('DESKTOP CURRENT', { desktopVersion })
    } else {
      Logger.info('DESKTOP UPDATE DETECTED', { oldVersion: desktopVersion, thisVersion: environment.version })
    }

    return current
  }

  async isCliCurrent(log?: boolean) {
    this.installedVersion = this.version
    if (
      (environment.isWindows && !process.env.path?.includes(environment.binPath)) ||
      !existsSync(`/usr/local/bin/${this.name}`)
    ) {
      return false
    }

    return true
  }

  fileExists(name: string) {
    const filePath = path.join(environment.binPath, name)
    const exists = existsSync(filePath)
    d('BINARY EXISTS', { name, exists, filePath })
    return exists
  }

  binaryPathCLI(admin?: boolean) {
    return path.join(environment.binPath, this.binaryName)
  }

  dependenciesPath(admin?: boolean) {
    return this.dependencies.map(d => path.join(environment.binPath, environment.isWindows ? d + '.exe' : d))
  }

  get binaryName() {
    return environment.isWindows ? this.name + '.exe' : this.name
  }

  get dependencyNames() {
    return this.dependencies.map(d => (environment.isWindows ? d + '.exe' : d))
  }
}
