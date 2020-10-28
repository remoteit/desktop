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
import path from 'path'
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
      // Stop and remove old binaries
      // await this.migrateBinaries(installer.binaryPathCLI())

      const commands = new Command({ onError: reject, admin: true })

      if (environment.isWindows) {
        if (!existsSync(environment.binPath)) commands.push(`md "${environment.binPath}"`)
        // commands.push(`icacls "${installer.binaryPathCLI()}" /T /C /Q /grant "*S-1-5-32-545:RX"`) // Grant all group "Users" read and execute permissions
      } else {
        commands.push(`ln -sf ${installer.binaryPathCLI()} /usr/local/bin/`)
        commands.push(`ln -sf ${installer.binaryPathMuxer()} /usr/local/bin/`)
        commands.push(`ln -sf ${installer.binaryPathDemuxer()} /usr/local/bin/`)
        commands.push(`ln -sf ${installer.binaryPathConnectd()} /usr/local/bin/`)
      }

      commands.push(`${installer.binaryName} ${strings.serviceUninstall()}`)
      commands.push(`${installer.binaryName} ${strings.serviceInstall()}`)
      // commands.push(`${installer.binaryName} ${strings.signIn()}`)

      await commands.exec()

      EventBus.emit(Installer.EVENTS.installed, remoteitInstaller.toJSON())
      resolve()
    })
  }

  async restartService() {
    await cli.restartService()
  }

  async migrateBinaries(installerPath?: string) {
    const commands = new Command({ admin: true })
    let files = environment.deprecatedBinaries
    let toDelete: string[] = []

    if (installerPath) files.push(installerPath)

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

  async download(installer: Installer) {
    // return installer
    //   .install((progress: number) => EventBus.emit(Installer.EVENTS.progress, { progress, installer }))
    //   .catch(error => EventBus.emit(Installer.EVENTS.error, error.message))
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
        rimraf.sync(installer.binaryPathCLI(), options)
        rimraf.sync(environment.userPath, options)
      } catch (e) {
        reject(e)
      }

      resolve()
    })
  }
}

export default new BinaryInstaller()
