import cli from './cliInterface'
import rimraf from 'rimraf'
import strings from './cliStrings'
import version from './cli-version.json'
import EventBus from './EventBus'
import environment from './environment'
import preferences from './preferences'
import semverCompare from 'semver/functions/compare'
import Command from './Command'
import Binary from './Binary'
import Logger from './Logger'
import { existsSync, lstatSync } from 'fs'

export const cliBinary = new Binary({ name: 'remoteit', version: version.cli, isCli: true })

export const binaries = [
  cliBinary,
  new Binary({ name: 'muxer', version: version.muxer }),
  new Binary({ name: 'demuxer', version: version.demuxer }),
  new Binary({ name: 'connectd', version: version.connectd }),
]

class BinaryInstaller {
  inProgress = false

  async check(log?: boolean) {
    if (this.inProgress) return

    const current = await this.isCurrent(log)

    if (current) {
      return EventBus.emit(Binary.EVENTS.installed, cliBinary.toJSON())
    } else if (environment.isElevated) {
      EventBus.emit(Binary.EVENTS.install)
    }
    EventBus.emit(Binary.EVENTS.notInstalled, cliBinary.name)
  }

  async install(force?: boolean) {
    if (this.inProgress) return Logger.info('INSTALL IN PROGRESS', { error: 'Can not install while in progress' })
    this.inProgress = true

    const binariesOutdated = !(await this.isCurrent(false)) || force
    const desktopOutdated = !this.isDesktopCurrent(true)

    Logger.info('INSTALL?', { binariesOutdated, updateDesktop: desktopOutdated })

    if (binariesOutdated) {
      Logger.info('UPDATING BINARIES')
      await this.installBinaries().catch(error => EventBus.emit(Binary.EVENTS.error, error))
    } else if (desktopOutdated) {
      Logger.info('RESTARTING CLI SYSTEM SERVICES')
      await this.restartService()
    }

    preferences.update({ version: environment.version })
    binaries.map(binary => binary.isCli && EventBus.emit(Binary.EVENTS.installed, binary.toJSON()))
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
        binaries.map(binary => commands.push(`ln -sf ${binary.path} ${environment.symlinkPath}`))
      }

      commands.push(`remoteit ${strings.serviceUninstall()}`)
      commands.push(`remoteit ${strings.serviceInstall()}`)

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
    this.inProgress = true
    await this.uninstallBinaries(skipCommands).catch(error => EventBus.emit(Binary.EVENTS.error, error))
    this.inProgress = false
  }

  async uninstallBinaries(skipCommands?: boolean) {
    return new Promise(async (resolve, reject) => {
      const commands = new Command({ onError: reject, admin: true })
      const options = { disableGlob: true }

      if (cliBinary.isInstalled() && !skipCommands) commands.push(`remoteit ${strings.serviceUninstall()}`)

      try {
        if (environment.isWindows && cliBinary.isInstalled()) {
          Logger.info('REMOVE FROM PATH', { binPath: environment.binPath })
          commands.push(`setx /M PATH "${this.getWindowsPathUninstalled()}"`)
          await commands.exec()
        } else if (environment.isMac) {
          await commands.exec()
          binaries.map(binary => {
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

  async getWindowsPathUninstalled() {
    const path = await new Command({ command: 'echo %PATH%' }).exec()
    Logger.info('WINDOWS PATH', { path })
    const parts = path.split(';')
    const keep = parts.filter(p => p && p !== environment.binPath)
    const newPath = keep.join(';')
    Logger.info('WINDOWS NEW PATH', { newPath })
    return newPath
  }

  isInstalled() {
    return binaries.every(binary => binary.isInstalled())
  }

  async isCurrent(log?: boolean) {
    let current = true
    for (const binary of binaries) {
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

export default new BinaryInstaller()
