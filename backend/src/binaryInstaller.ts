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
const child_process = require('child_process')

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
      const commands = new Command({ onError: reject, admin: true })

      if (environment.isWindows) {
        if (!existsSync(environment.binPath)) commands.push(`md "${environment.binPath}"`)
        commands.push(`icacls remoteit /T /C /Q /grant "*S-1-5-32-545:RX"`)

        if (existsSync(`"${environment.mklinkPath}/${installer.binaryName}"`))
          commands.push(`del "${environment.mklinkPath}/${installer.binaryName}" `)
        commands.push(`mklink /H "${environment.mklinkPath}/${installer.binaryName}" "${installer.binaryPathCLI()}"`)

        installer.dependencyNames.map((name, index) => {
          if (existsSync(`"${environment.mklinkPath}/${name}"`))
            commands.push(`del "${environment.mklinkPath}/${name}" `)
          commands.push(`mklink /H "${environment.mklinkPath}/${name}" "${installer.dependenciesPath()[index]}"`)
        })

        commands.push(`remoteit ${strings.serviceUninstall()}`)
        commands.push(`remoteit ${strings.serviceInstall()}`)
      } else {
        commands.push(`ln -sf ${installer.binaryPathCLI()} /usr/local/bin/`)
        installer.dependenciesPath().map(path => {
          commands.push(`ln -sf ${path} /usr/local/bin/`)
        })
        commands.push(`${installer.binaryName} ${strings.serviceUninstall()}`)
        commands.push(`${installer.binaryName} ${strings.serviceInstall()}`)
      }

      await commands.exec()

      EventBus.emit(Installer.EVENTS.installed, remoteitInstaller.toJSON())
      resolve()
    })
  }

  execCommand(command: string, shell: string) {
    child_process.exec(command, { shell }, (error: any, stdout: any, stderr: any) => {
      if (error) {
        Logger.error(`EXEC ERROR: ${error}`)
        return
      }
      if (stderr) {
        Logger.error(`STDERR : ${stderr}`)
        return
      }
      Logger.info(`EXEC SUCCESS: ${stdout}`)
    })
  }

  async restartService() {
    await cli.restartService()
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
