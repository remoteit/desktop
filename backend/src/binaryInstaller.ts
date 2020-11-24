import cli from './cliInterface'
import rimraf from 'rimraf'
import strings from './cliStrings'
import EventBus from './EventBus'
import environment from './environment'
import preferences from './preferences'
import semverCompare from 'semver/functions/compare'
import { existsSync, lstatSync } from 'fs'
import Command from './Command'
import Binary, { binaries, cliBinary } from './Binary'
import Logger from './Logger'

export class BinaryInstaller {
  inProgress = false
  uninstallInitiated = false
  binaries: Binary[]
  cliBinary: Binary

  constructor(binaries: Binary[], cliBinary: Binary) {
    this.binaries = binaries
    this.cliBinary = cliBinary
  }

  async check() {
    if (this.inProgress) return

    const shouldInstall = await this.shouldInstall()

    if (shouldInstall) {
      if (environment.isElevated) return await this.install()
      return EventBus.emit(Binary.EVENTS.notInstalled, this.cliBinary.name)
    }
    EventBus.emit(Binary.EVENTS.installed, this.cliBinary.toJSON())
  }

  async shouldInstall() {
    const binariesOutdated = !(await this.cliBinary.isCurrent())
    const serviceStopped = !(await cli.agentRunning())
    const desktopOutdated = !this.isDesktopCurrent()
    Logger.info('SHOULD INSTALL?', { binariesOutdated, serviceStopped, desktopOutdated })
    return binariesOutdated || serviceStopped || desktopOutdated
  }

  async install() {
    if (this.inProgress) return Logger.warn('INSTALL IN PROGRESS', { error: 'Can not install while in progress' })
    Logger.info('START INSTALLATION')
    this.inProgress = true

    await this.installBinaries().catch(error => EventBus.emit(Binary.EVENTS.error, error))

    preferences.update({ version: environment.version })
    this.binaries.map(binary => binary.isCli && EventBus.emit(Binary.EVENTS.installed, binary.toJSON()))
    this.inProgress = false
  }

  async installBinaries() {
    return new Promise(async (resolve, reject) => {
      await this.migrateBinaries()
      const commands = new Command({ onError: reject, admin: true })

      this.pushUninstallCommands(commands)

      if (!environment.isWindows && !environment.isHeadless) {
        this.binaries.map(binary => commands.push(`ln -sf ${binary.path} ${environment.symlinkPath}`))
      }

      commands.push(`"${this.cliBinary.path}" ${strings.serviceInstall()}`)

      await commands.exec()
      resolve()
    })
  }

  async migrateBinaries() {
    const commands = new Command({ admin: true })
    let files = environment.deprecatedBinaries
    let toDelete: string[] = []

    files.forEach(file => {
      // Too small to be the desktop app -> must be cli
      if (existsSync(file) && lstatSync(file).size < 30000000) {
        Logger.info('MIGRATING DEPRECATED BINARY', { file })
        commands.push(`"${file}" ${strings.serviceUninstall()}`)
        commands.push(`"${file}" ${strings.toolsUninstall()}`)
        toDelete.push(file)
      } else {
        Logger.info('DEPRECATED BINARY DOES NOT EXIST', { file })
      }
    })

    await commands.exec()

    toDelete.forEach(file => {
      try {
        Logger.info('REMOVING FILE', { file })
        rimraf.sync(file, { disableGlob: true })
      } catch (e) {
        Logger.warn('FILE REMOVAL FAILED', { file })
      }
    })
  }

  async uninstall() {
    if (this.inProgress) return Logger.warn('UNINSTALL IN PROGRESS', { error: 'Can not uninstall while in progress' })
    Logger.info('START UNINSTALL')
    this.inProgress = true
    const commands = new Command({ admin: true })
    this.pushUninstallCommands(commands)
    await commands.exec()
    this.inProgress = false
  }

  async pushUninstallCommands(commands: Command) {
    commands.push(`"${this.cliBinary.path}" ${strings.serviceUninstall()}`)
    if (!environment.isWindows && !environment.isHeadless) {
      this.binaries.map(binary => commands.push(`rm -f ${binary.symlink}`))
    }
  }

  isDesktopCurrent() {
    let desktopVersion = preferences.get().version
    let current = desktopVersion && semverCompare(desktopVersion, environment.version) >= 0

    if (current) {
      Logger.info('DESKTOP CURRENT', { desktopVersion })
    } else {
      Logger.info('DESKTOP UPDATE DETECTED', { oldVersion: desktopVersion, thisVersion: environment.version })
    }

    return current
  }
}

export default new BinaryInstaller(binaries, cliBinary)
