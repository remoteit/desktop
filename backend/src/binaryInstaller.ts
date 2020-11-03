import tmp from 'tmp'
import cli from './cliInterface'
import rimraf from 'rimraf'
import strings from './cliStrings'
import EventBus from './EventBus'
import environment from './environment'
import preferences from './preferences'
import remoteitInstaller from './remoteitInstaller'
import Installer from './Installer'
import Command from './Command'
import Logger from './Logger'
import { existsSync, lstatSync } from 'fs'

tmp.setGracefulCleanup()

class BinaryInstaller {
  options = { name: 'remoteit' }
  inProgress = false

  async install(force?: boolean) {
    if (this.inProgress) return Logger.info('INSTALL IN PROGRESS', { error: 'Can not install while in progress' })
    this.inProgress = true
    const updateCli = !(await remoteitInstaller.isCliCurrent(true)) || force
    const updateDesktop = !remoteitInstaller.isDesktopCurrent(true)

    Logger.info('INSTALLING BINARIES', { updateCli, updateDesktop })

    if (updateCli) {
      Logger.info('UPDATING CLI')
      await this.installBinary(remoteitInstaller).catch(error => EventBus.emit(Installer.EVENTS.error, error))
    } else if (updateDesktop) {
      Logger.info('RESTARTING CLI SYSTEM SERVICES')
      await this.restartService()
    }

    preferences.update({ version: environment.version })
    EventBus.emit(Installer.EVENTS.installed, remoteitInstaller.toJSON())
    this.inProgress = false
  }

  async installBinary(installer: Installer) {
    return new Promise(async (resolve, reject) => {
      await this.migrateBinaries(installer.binaryPathCLI())
      const commands = new Command({ onError: reject, admin: true })

      if (environment.isWindows) {
        if (!existsSync(environment.binPath)) commands.push(`md "${environment.binPath}"`)
        commands.push(`setx remoteit "${installer.binaryPathCLI()}"`)
        installer.dependencies.map(name => {
          commands.push(`setx  ${name} "${environment.binPath}\\${name}.exe"`)
        })
        commands.push(`"${process.env.remoteit}" ${strings.serviceUninstall()}`)
        commands.push(`"${process.env.remoteit}" ${strings.serviceInstall()}`)
      } else {
        commands.push(`ln -sf ${installer.binaryPathCLI()} /usr/local/bin/`)
        installer.dependenciesPath().map(path => {
          commands.push(`ln -sf ${path} /usr/local/bin/`)
        })
        commands.push(`remoteit ${strings.serviceUninstall()}`)
        commands.push(`remoteit ${strings.serviceInstall()}`)
      }

      await commands.exec()

      EventBus.emit(Installer.EVENTS.installed, remoteitInstaller.toJSON())
      resolve()
    })
  }

  async restartService() {
    await cli.restartService()
  }

  async migrateBinaries(installerPath: string) {
    const commands = new Command({ admin: true })
    let paths = environment.isWindows
      ? [process.env.remoteit, process.env.muxer, process.env.demuxer, process.env.connectd]
      : [installerPath]
    let toDelete: string[] = []

    paths.forEach(path => {
      if (path) {
        Logger.info('UNINSTALL BINARY', { path })
        toDelete.push(path || '')
      } else {
        Logger.info('ENVIRONMENT PATH DOES NOT EXIST', { path })
      }
    })

    commands.push(`remoteit ${strings.serviceUninstall()}`)
    commands.push(`remoteit ${strings.toolsUninstall()}`)

    await commands.exec()

    toDelete.forEach(path => {
      try {
        Logger.info('REMOVING PATH', { path })
        rimraf.sync(path, { disableGlob: true })
      } catch (e) {
        Logger.warn('PATH REMOVAL FAILED', { path })
      }
    })
  }

  async uninstall() {
    if (this.inProgress) return Logger.info('UNINSTALL IN PROGRESS', { error: 'Can not uninstall while in progress' })
    this.inProgress = true
    await this.uninstallBinary(remoteitInstaller).catch(error => EventBus.emit(Installer.EVENTS.error, error))
    this.inProgress = false
  }

  async uninstallBinary(installer: Installer) {
    return new Promise(async (resolve, reject) => {
      const options = { disableGlob: true }
      try {
        let paths = environment.isWindows
          ? [process.env.remoteit, process.env.muxer, process.env.demuxer, process.env.connectd]
          : [installer.binaryPathCLI()]
        paths.forEach(path => {
          if (path) {
            Logger.info('REMOVE ENVIRONMENT PATH', { path })
            rimraf.sync(path, options)
          } else {
            Logger.info('ENVIRONMENT PATH DOES NOT EXIST', { path })
          }
        })
        rimraf.sync(environment.userPath, options)
      } catch (e) {
        reject(e)
      }

      resolve()
    })
  }
}

export default new BinaryInstaller()
