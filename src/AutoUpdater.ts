import electron from 'electron'
import { cli } from 'remoteit-headless'
import { EventBus, Logger, EVENTS } from 'remoteit-headless'
import { autoUpdater } from 'electron-updater'

export default class AppUpdater {
  constructor() {
    autoUpdater.logger = Logger

    autoUpdater.on('update-available', info => {
      Logger.info('Update available', { info })
      EventBus.emit(EVENTS.available, info.version)
    })

    autoUpdater.on('update-downloaded', info => {
      EventBus.emit(EVENTS.downloaded, info.version)
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

  async restart() {
    autoUpdater.quitAndInstall()
    electron.app.quit()
  }
}
