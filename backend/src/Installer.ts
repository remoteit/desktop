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
  resources: { name: string; version: string; url: string }[]
  dependencies: string[]
}

export default class Installer {
  repoName: string
  resources: { name: string; version: string; url: string }[]
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
    this.resources = args.resources
    this.dependencies = args.dependencies
  }

  async check(log?: boolean) {
    if (binaryInstaller.inProgress) return

    d('CHECK INSTALLATION', { name: this.resources[0].name, version: this.resources[0].version })
    const cliCurrent = await this.isCliCurrent(log)

    if (cliCurrent) {
      return EventBus.emit(Installer.EVENTS.installed, this.toJSON())
    } else {
      if (environment.isElevated) await binaryInstaller.install()
      else EventBus.emit(Installer.EVENTS.notInstalled, this.resources[0].name)
    }
  }

  toJSON() {
    return {
      path: this.binaryPathCLI(),
      version: this.resources[0].version,
      name: this.resources[0].name,
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
    let cliVersion = 'Not Installed'
    let current = false

    cliVersion = await cli.version()
    this.installedVersion = cliVersion
    try {
      current = semverCompare(cliVersion, this.resources[0].version) >= 0
    } catch (error) {
      Logger.warn('BAD CLI VERSION', { error })
    }

    return current
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
    return environment.isWindows ? this.resources[0].name + '.exe' : this.resources[0].name
  }

  get dependencyNames() {
    return this.dependencies.map(d => (environment.isWindows ? d + '.exe' : d))
  }
}
