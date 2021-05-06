import cli from './cliInterface'
import rimraf from 'rimraf'
import strings from './cliStrings'
import EventBus from './EventBus'
import environment from './environment'
import preferences from './preferences'
import ConnectionPool from './ConnectionPool'
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
    let binariesOutdated = !(await this.cliBinary.isCurrent())
    const serviceStopped = !(await cli.agentRunning())
    const cliChanged = this.cliVersionChanged()
    Logger.info('SHOULD INSTALL?', { binariesOutdated, serviceStopped, cliChanged })
    return binariesOutdated || serviceStopped || cliChanged
  }

  async install() {
    if (this.inProgress) return Logger.warn('INSTALL IN PROGRESS', { error: 'Can not install while in progress' })
    Logger.info('START INSTALLATION')
    this.inProgress = true

    await this.installBinaries().catch(error => EventBus.emit(Binary.EVENTS.error, error))

    this.updateVersions()
    EventBus.emit(Binary.EVENTS.installed, this.cliBinary.toJSON())
    EventBus.emit(ConnectionPool.EVENTS.clearErrors)
    this.inProgress = false
  }

  async changeURLRequest(remoteAPI?: string, graphqlURL?: string): Promise<void> {
    let envVar = ''

    if (remoteAPI) envVar += `ENVAR_REMOTEIT_API_URL=${remoteAPI} `
    if (graphqlURL) envVar += `ENVAR_REMOTEIT_API_GRAPHQL_URL=${graphqlURL} `

    return new Promise(async (resolve, reject) => {
      const commands = new Command({ onError: reject, admin: true })
      commands.push(`"${this.cliBinary.path}" ${strings.serviceStop()}`)
      commands.push(`${graphqlURL} ${this.cliBinary.path}" ${strings.serviceStart()}`)
      await commands.exec()
      resolve()
    })
  }

  async installBinaries(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this.migrateBinaries()
      const commands = new Command({ onError: reject, admin: true })

      this.pushUninstallCommands(commands)

      if (!(environment.isWindows || environment.isHeadless)) {
        this.binaries.map(binary => {
          if (existsSync(environment.symlinkPath)) commands.push(`ln -sf "${binary.path}" "${binary.symlink}"`)
        })
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
    if (!(environment.isWindows || environment.isHeadless)) {
      this.binaries.map(binary => {
        if (existsSync(binary.symlink)) {
          if (lstatSync(binary.symlink).isSymbolicLink()) {
            commands.push(`unlink "${binary.symlink}"`)
          } else {
            commands.push(`rm -f "${binary.symlink}"`)
          }
        }
      })
    }
  }

  cliVersionChanged() {
    const previousVersion = preferences.get().cliVersion
    const thisVersion = this.cliBinary.version
    let changed = true

    try {
      changed = semverCompare(previousVersion, thisVersion) < 0
    } catch (error) {
      Logger.warn('CLI VERSION COMPARE FAILED', { error, previousVersion, thisVersion })
    }

    if (environment.isWindows && changed) {
      // Windows has an installer script to update so doesn't need this check
      this.updateVersions()
      return false
    }

    if (changed) Logger.info('CLI UPDATE DETECTED', { previousVersion, thisVersion })
    else Logger.info('CLI NOT UPDATED', { previousVersion, thisVersion })

    return changed
  }

  updateVersions() {
    preferences.update({ version: environment.version, cliVersion: this.cliBinary.installedVersion })
  }
}

export default new BinaryInstaller(binaries, cliBinary)
