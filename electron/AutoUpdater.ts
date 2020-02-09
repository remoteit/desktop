import { autoUpdater } from 'electron-updater'
import electron from 'electron'
import EventBus from './EventBus'
import Logger from './Logger'

export default class AppUpdater {
  static EVENTS = {
    downloaded: 'update/downloaded',
    available: 'update/available',
  }

  constructor() {
    autoUpdater.logger = Logger

    this.check()

    autoUpdater.on('update-available', info => {
      Logger.info('Update available', { info })
      EventBus.emit(AppUpdater.EVENTS.available, info.version)
    })

    autoUpdater.on('update-downloaded', info => {
      EventBus.emit(AppUpdater.EVENTS.downloaded, info.version)
    })

    autoUpdater.on('error', error => {
      Logger.error('AUTO UPDATE ERROR', { error })
    })
  }

  check() {
    try {
      autoUpdater.checkForUpdatesAndNotify()
    } catch (error) {
      Logger.warn('AUTO UPDATE ERROR', { error })
    }
  }

  static restart() {
    autoUpdater.quitAndInstall()
    electron.app.quit()
  }
}
