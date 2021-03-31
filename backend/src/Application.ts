import Controller from './Controller'
import electronInterface from './electronInterface'
import ConnectionPool from './ConnectionPool'
import environment from './environment'
import server from './server'
import EventBus from './EventBus'
import { Logger } from '.'
import { exec } from 'child_process'
import { GITHUB_RELEASES } from './constants'

export default class Application {
  public electron?: any
  public pool: ConnectionPool

  constructor() {
    this.pool = new ConnectionPool()
    this.constructorSync()
  }

  async constructorSync() {
    await environment.setElevatedState()
    server.start()
    if (server.io) new Controller(server.io, this.pool)
  }

  check() {
    this.electron && this.electron.check()
  }

  quit() {
    if (this.electron) this.electron.app.quit()
  }

  async restart(update?: string) {
    if (this.electron && (environment.isMac || environment.isWindows)) {
      this.electron.autoUpdater.restart()
    } else {
      try {
        const kill = ` pkill remoteit`
        const remove = ` apt-get --purge remove remoteit -y`
        const temp = ` TEMP_DEB="$(mktemp)" `
        const wget = ` wget -O "$TEMP_DEB" '${GITHUB_RELEASES}/download/v${update}/remoteit-amd64-installer.deb' `
        const dpkg = ` sudo dpkg -i "$TEMP_DEB" `
        const start = ` setsid remoteit & sleep 1 `

        exec(
          ` gnome-terminal -- /bin/sh -c '
          ${kill};
          ${remove};
          ${temp};
          ${wget}; 
          ${dpkg};
          ${start}'
          `,
          (err: any, stdout: any, stderr: any) => {
            if (err) {
              //some err occurred
              Logger.error(`UPDATE LINUX COMAND ERROR `, { err })
            } else {
              // the *entire* stdout and stderr (buffered)
              Logger.info(`UPDATE LINUX OUT ERROR: ${stderr}`)
            }
          }
        )
      } catch (error) {
        Logger.error(`UPDATE LINUX CATCH ERROR `, { error })
      }
    }
  }
  recapitate(head: any) {
    this.electron = head
    environment.recapitate()
    EventBus.emit(electronInterface.EVENTS.recapitate)
  }
}
