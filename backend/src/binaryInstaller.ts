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

    const current = (await this.isCurrent(log)) && (await cli.agentRunning())

    if (current) {
      return EventBus.emit(Binary.EVENTS.installed, this.cliBinary.toJSON())
    } else if (environment.isElevated) {
      return await this.install()
    }
    EventBus.emit(Binary.EVENTS.notInstalled, this.cliBinary.name)
  }

  async install(force?: boolean) {
    if (this.inProgress) return Logger.info('INSTALL IN PROGRESS', { error: 'Can not install while in progress' })
    this.inProgress = true

    const binariesOutdated = !(await this.isCurrent(false))
    const serviceStopped = !(await cli.agentRunning())
    const desktopOutdated = !this.isDesktopCurrent(true)

    Logger.info('INSTALL?', { binariesOutdated, desktopOutdated, serviceStopped })

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

      if (environment.isWindows) {
        commands.push(`setx /M PATH "%PATH%;${environment.binPath}"`)
      } else {
        this.binaries.map(binary => commands.push(`ln -sf ${binary.path} ${environment.symlinkPath}`))
      }

      commands.push(`${this.cliBinary.path} ${strings.serviceUninstall()}`)
      commands.push(`${this.cliBinary.path} ${strings.serviceInstall()}`)

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

      if (this.cliBinary.isInstalled() && !skipCommands)
        commands.push(`${this.cliBinary.path} ${strings.serviceUninstall()}`)

      try {
        if (environment.isWindows) {
          const path = await this.getWindowsPathClean()
          Logger.info('REMOVE FROM PATH', { binPath: environment.binPath })
          if (path.length < 1024) commands.push(`setx /M PATH "${path}"`) // setx path limited to 1024 characters
          await commands.exec()
        } else if (environment.isMac) {
          await commands.exec()
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

  async getWindowsPathClean() {
    const path = await new Command({ command: 'echo %PATH%' }).exec()
    Logger.info('PATH TO REMOVE', { remove: environment.binPath })
    const parts = path.split(';')
    const keep = parts.filter(p => p && p.trim() !== environment.binPath)
    const newPath = keep.join(';')
    if (keep.length < parts.length) Logger.info('PATH REMOVED')
    return newPath
  }

  async isCurrent(log?: boolean) {
    let current = true
    for (const binary of this.binaries) {
      current = current && (await binary.isCurrent(log))
    }
    return current
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
