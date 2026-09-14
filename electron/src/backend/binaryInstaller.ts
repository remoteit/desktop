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

// Refusals the running agent will give again: unsupported platform, a service definition that
// predates staging, a signature it will not accept, and a daemon too old to know the command.
const PERMANENT_REFUSAL_CODES = ['409', '410', '411']

function permanentRefusal(error?: Error) {
  if (!error) return false
  return PERMANENT_REFUSAL_CODES.includes(error.name) || error.message.toLowerCase().includes('unknown-message')
}

export class BinaryInstaller {
  ready = false
  inProgress = false
  uninstallInitiated = false
  reloadRefusedBy?: string
  binaries: Binary[]
  cliBinary: Binary

  constructor(binaries: Binary[], cliBinary: Binary) {
    this.binaries = binaries
    this.cliBinary = cliBinary
  }

  async init() {
    // Windows and headless have their own update mechanisms
    if (environment.isWindows || environment.isHeadless) await this.updateVersions()
  }

  async check() {
    if (this.inProgress) return

    const status = await this.status()
    const shouldInstall = (Object.keys(status) as (keyof BinaryReason)[]).some(key => status[key])

    if (shouldInstall) {
      if (environment.isElevated) return await this.install()
      if (this.canReload(status) && (await this.reload())) return
      return EventBus.emit(Binary.EVENTS.notInstalled, status)
    } else if (!this.ready) {
      Logger.info('INSTALLER DONE')
      this.ready = true
    }

    EventBus.emit(Binary.EVENTS.installed, this.cliBinary.toJSON())
  }

  async status(): Promise<BinaryReason> {
    const binariesOutdated = !(await this.cliBinary.isCurrent())
    const agentStopped = !(await cli.agentRunning())
    const agentMismatched = this.cliBinary.agentVersion !== this.cliBinary.version
    const cliUpdated = await this.cliUpdated()
    const desktopUpdated = await this.desktopUpdated()

    const status = { binariesOutdated, agentStopped, agentMismatched, cliUpdated, desktopUpdated }
    Logger.info('SHOULD INSTALL?', status)

    return status
  }

  // The running agent decides whether it can adopt the installed binaries itself.
  canReload(status: BinaryReason) {
    return !status.binariesOutdated && !status.agentStopped && this.reloadRefusedBy !== this.cliBinary.agentVersion
  }

  async reload(): Promise<boolean> {
    if (this.inProgress) {
      Logger.info('AGENT RELOAD ALREADY IN PROGRESS')
      return true
    }
    Logger.info('START AGENT RELOAD')
    this.inProgress = true

    const { version, error } = await cli.agentReload()
    const reloaded = !!version && version === this.cliBinary.version
    if (reloaded) {
      await this.completeInstall()
    } else {
      // A daemon that answered, or refused for a reason it will repeat, is worth latching. An
      // unreachable agent or a failed spawn is not, or the unprivileged retry never happens again.
      if (!!version || permanentRefusal(error)) this.reloadRefusedBy = this.cliBinary.agentVersion
      Logger.warn('AGENT RELOAD REFUSED', {
        version,
        code: error?.name,
        error: error?.message,
        latched: this.reloadRefusedBy,
        agentVersion: this.cliBinary.agentVersion,
      })
    }

    this.inProgress = false
    return reloaded
  }

  async install() {
    if (this.inProgress) return Logger.warn('INSTALL IN PROGRESS', { error: 'Can not install while in progress' })
    Logger.info('START INSTALLATION')
    this.inProgress = true

    await this.installBinaries().catch(error => EventBus.emit(Binary.EVENTS.error, error))
    await this.completeInstall()

    this.inProgress = false
  }

  private async completeInstall() {
    this.reloadRefusedBy = undefined
    EventBus.emit(Binary.EVENTS.installed, this.cliBinary.toJSON())
    EventBus.emit(ConnectionPool.EVENTS.clearErrors)
    await this.updateVersions()
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
        rimraf.sync(file)
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

  envVar(): string {
    if (!preferences.get().switchApi) return ''

    const remoteAPI = preferences.get().apiURL
    const graphqlURL = preferences.get().apiGraphqlURL

    let envVar = ''

    if (remoteAPI) envVar += `ENVAR_REMOTEIT_API_URL=${remoteAPI} `
    if (graphqlURL) envVar += `ENVAR_REMOTEIT_API_GRAPHQL_URL=${graphqlURL} `

    return envVar
  }

  async cliUpdated(): Promise<boolean> {
    const previousVersion = preferences.get().cliVersion
    const thisVersion = this.cliBinary.version
    let updated: boolean = true

    try {
      updated = !!previousVersion && semverCompare(previousVersion, thisVersion) < 0
      if (!previousVersion) await this.updateVersions()
    } catch (error) {
      Logger.warn('CLI VERSION COMPARE FAILED', { error, previousVersion, thisVersion })
    }

    if (updated) Logger.info('CLI UPDATE DETECTED', { previousVersion, thisVersion })

    return updated
  }

  desktopUpdated(): boolean {
    const previousVersion = preferences.get().version
    const thisVersion = environment.version
    const updated = !previousVersion || semverCompare(previousVersion, thisVersion) !== 0
    if (updated)
      Logger.info('DESKTOP UPDATED', {
        updated,
        previousVersion,
        thisVersion,
        compare: semverCompare(previousVersion, thisVersion),
      })
    return updated
  }

  async updateVersions() {
    const cliVersion = this.cliBinary.installedVersion || (await cli.version())
    Logger.info('CLI VERSION UPDATE', { cliVersion })
    preferences.update({ version: environment.version, cliVersion })
  }
}

export default new BinaryInstaller(binaries, cliBinary)
