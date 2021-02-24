import electron from 'electron'
import { EventBus, Logger, EVENTS, preferences, environment } from 'remoteit-headless'
import { autoUpdater } from 'electron-updater'
import axios from 'axios'
import { ENVIRONMENT } from 'remoteit-headless/build/constants'

const AUTO_UPDATE_CHECK_INTERVAL = 43200000 // one half day
export const RELEASES = `https://api.github.com/repos/remoteit/desktop/releases/latest`

export default class AppUpdater {
  nextCheck: number = 0
  autoUpdate: boolean

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

    EventBus.on(EVENTS.preferences, ({ autoUpdate }: IPreferences) => {
      if (autoUpdate !== this.autoUpdate) this.check(true)
      this.autoUpdate = !!autoUpdate
    })

    this.autoUpdate = !!preferences.get().autoUpdate
  }

  async check(force?: boolean) {
    try {
      if (process.platform !== 'win32' && process.platform !== 'darwin' && ENVIRONMENT !== 'development') {
        Logger.info('ENVIRONMENT', { ENVIRONMENT })
        try {
          const response = await axios.get(RELEASES)
          Logger.info('LATEST VERSION FOUND', { version: response.data.tag_name })
          const latest = response.data.tag_name
          if (preferences.get().version !== latest) {
            EventBus.emit(EVENTS.downloaded, latest.substring(1))
          }
        } catch (error) {
          Logger.error('LATEST VERSION ERROR', { error })
        }
      }
      if (force || (this.nextCheck < Date.now() && preferences.get().autoUpdate)) {
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
