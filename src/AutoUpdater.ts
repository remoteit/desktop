import electron from 'electron'
import { EventBus, Logger, EVENTS, environment, preferences } from 'remoteit-headless'
import { autoUpdater } from 'electron-updater'

const AUTO_UPDATE_CHECK_INTERVAL = 43200000 // one half day

export default class AppUpdater {
  nextCheck: number = 0

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
      if ((environment.isMac || environment.isWindows) && this.nextCheck < Date.now() && preferences.data.autoUpdate) {
        autoUpdater.checkForUpdatesAndNotify()
        this.nextCheck = Date.now() + AUTO_UPDATE_CHECK_INTERVAL
      }
    } catch (error) {
      Logger.warn('AUTO UPDATE ERROR', { error })
    }
  }

  async restart() {
    autoUpdater.quitAndInstall()
    electron.app.quit()
  }
}
