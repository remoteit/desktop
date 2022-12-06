import cli from './cliInterface'
import rimraf from 'rimraf'
import strings from './cliStrings'
import Command from './Command'
import EventBus from './EventBus'
import environment from './environment'
import preferences from './preferences'
import ConnectionPool from './ConnectionPool'
import semverCompare from 'semver/functions/compare'
import Binary, { binaries, cliBinary } from './Binary'
import { existsSync, lstatSync } from 'fs'
import Logger from './Logger'

export class BinaryInstaller {
  ready = false
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
    } else if (!this.ready) {
      this.ready = true
    }

    EventBus.emit(Binary.EVENTS.installed, this.cliBinary.toJSON())
  }

  async shouldInstall() {
    let binariesOutdated = !(await this.cliBinary.isCurrent())
    const agentStopped = !(await cli.agentRunning())
    const agentMismatched = (await cli.agentVersion()) !== this.cliBinary.version
    const cliUpdated = await this.cliUpdated()
    Logger.info('SHOULD INSTALL?', { binariesOutdated, serviceStopped: agentStopped, agentMismatched, cliUpdated })
    return binariesOutdated || agentStopped || agentMismatched || cliUpdated
  }

  async install() {
    if (this.inProgress) return Logger.warn('INSTALL IN PROGRESS', { error: 'Can not install while in progress' })
    Logger.info('START INSTALLATION')
    this.inProgress = true

    await this.installBinaries().catch(error => EventBus.emit(Binary.EVENTS.error, error))

    EventBus.emit(Binary.EVENTS.installed, this.cliBinary.toJSON())
    EventBus.emit(ConnectionPool.EVENTS.clearErrors)
    this.updateVersions()

    this.inProgress = false
    this.ready = true
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

      commands.push(`${this.envVar()} "${this.cliBinary.path}" ${strings.serviceInstall()}`)
      commands.push(`"${this.cliBinary.path}" ${strings.defaults()}`) // @FIXME this should go before the service install if possible and the restart removed!
      commands.push(`${this.envVar()} "${this.cliBinary.path}" ${strings.serviceRestart()}`)

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

  async restart() {
    const commands = new Command({ onError: e => EventBus.emit(Binary.EVENTS.error, e.toString()), admin: true })
    commands.push(`${this.envVar()} "${this.cliBinary.path}" ${strings.serviceRestart()}`)

    this.inProgress = true
    await commands.exec()
    this.inProgress = false
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

  envVar(): string {
    if (!preferences.get().switchApi) return ''

    const remoteAPI = preferences.get().apiURL
    const graphqlURL = preferences.get().apiGraphqlURL

    let envVar = ''

    if (remoteAPI) envVar += `ENVAR_REMOTEIT_API_URL=${remoteAPI} `
    if (graphqlURL) envVar += `ENVAR_REMOTEIT_API_GRAPHQL_URL=${graphqlURL} `

    return envVar
  }

  async cliUpdated() {
    const previousVersion = preferences.get().cliVersion
    const thisVersion = this.cliBinary.version
    let updated = true

    try {
      updated = semverCompare(previousVersion, thisVersion) < 0
    } catch (error) {
      Logger.warn('CLI VERSION COMPARE FAILED', { error, previousVersion, thisVersion })
    }

    if (environment.isWindows && updated) {
      // Windows has an installer script to update so doesn't need this check
      this.updateVersions()
      return false
    }

    if (updated) Logger.info('CLI UPDATE DETECTED', { previousVersion, thisVersion })
    else Logger.info('CLI NOT UPDATED', { previousVersion, thisVersion })

    return updated
  }

  async updateVersions() {
    const cliVersion = await cli.version()
    Logger.info('CLI VERSION UPDATE', { cliVersion })
    preferences.update({ version: environment.version, cliVersion })
  }
}

export default new BinaryInstaller(binaries, cliBinary)
