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

  async check(log?: boolean) {
    if (this.inProgress) return

    const install = (await this.cliBinary.isCurrent(log)) && (await cli.agentRunning())

    if (install) {
      return EventBus.emit(Binary.EVENTS.installed, this.cliBinary.toJSON())
    } else if (environment.isElevated) {
      return await this.install(true)
    }
    EventBus.emit(Binary.EVENTS.notInstalled, this.cliBinary.name)
  }

  async install(force?: boolean) {
    let binariesOutdated, serviceStopped, desktopOutdated

    if (this.inProgress) return Logger.info('INSTALL IN PROGRESS', { error: 'Can not install while in progress' })
    this.inProgress = true

    if (!force) {
      binariesOutdated = !(await this.cliBinary.isCurrent(false))
      serviceStopped = !(await cli.agentRunning())
      desktopOutdated = !this.isDesktopCurrent(true)
    }

    Logger.info('INSTALL?', { force, binariesOutdated, desktopOutdated, serviceStopped })

    if (binariesOutdated || serviceStopped || force) {
      Logger.info('UPDATING BINARIES')
      await this.installBinaries().catch(error => EventBus.emit(Binary.EVENTS.error, error))
    } else if (desktopOutdated) {
      Logger.info('RESTARTING CLI SYSTEM SERVICES')
      await this.restartService()
    }

    preferences.update({ version: environment.version })
    this.binaries.map(binary => binary.isCli && EventBus.emit(Binary.EVENTS.installed, binary.toJSON()))
    this.inProgress = false
  }

  async installBinaries() {
    return new Promise(async (resolve, reject) => {
      await this.migrateBinaries()
      await this.uninstallBinaries().catch() //fixme - just get commands to execute

      const commands = new Command({ onError: reject, admin: true })

      if (!environment.isWindows) {
        this.binaries.map(binary => commands.push(`ln -sf ${binary.path} ${environment.symlinkPath}`))
      }

      commands.push(`${this.cliBinary.path} ${strings.serviceUninstall()}`)
      commands.push(`${this.cliBinary.path} ${strings.serviceInstall()}`)
      commands.push(`${this.cliBinary.path} ${strings.signIn()}`)

      await commands.exec()
      resolve()
    })
  }

  async restartService() {
    await cli.restartService()
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

  async uninstall(skipCommands?: boolean) {
    if (this.inProgress) return Logger.info('UNINSTALL IN PROGRESS', { error: 'Can not uninstall while in progress' })
    this.uninstallInitiated = true
    this.inProgress = true
    await this.uninstallBinaries(skipCommands).catch(error => EventBus.emit(Binary.EVENTS.error, error))
    this.inProgress = false
  }

  async uninstallBinaries(skipCommands?: boolean) {
    return new Promise(async (resolve, reject) => {
      const commands = new Command({ onError: reject, admin: true })
      const options = { disableGlob: true }

      try {
        if (this.cliBinary.isInstalled() && !skipCommands) {
          commands.push(`${this.cliBinary.path} ${strings.serviceUninstall()}`)
          await commands.exec()
        }

        if (!environment.isWindows) {
          this.binaries.map(binary => {
            Logger.info('REMOVE SYMLINK', { name: binary.symlink })
            rimraf.sync(binary.symlink, options)
          })
        }
      } catch (e) {
        reject(e)
      }

      resolve()
    })
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
}

export default new BinaryInstaller(binaries, cliBinary)
