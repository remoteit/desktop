import { autoUpdater } from 'electron-updater'
import EventBus from './EventBus'
import Logger from './Logger'

export default class AppUpdater {
  static EVENTS = {
    downloaded: 'update/downloaded',
    available: 'update/available',
  }

  constructor() {
    autoUpdater.logger = Logger
    autoUpdater.checkForUpdatesAndNotify()

    autoUpdater.on('update-available', info => {
      Logger.info('Update available', info)
      EventBus.emit(AppUpdater.EVENTS.available, info.version)
    })

    autoUpdater.on('update-downloaded', info => {
      EventBus.emit(AppUpdater.EVENTS.downloaded, info.version)
    })

    autoUpdater.on('error', error => {})
  }

  static restart() {
    autoUpdater.quitAndInstall()
  }
}
