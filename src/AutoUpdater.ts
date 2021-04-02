import electron from 'electron'
import { EventBus, Logger, EVENTS, preferences, environment } from 'remoteit-headless'
import { autoUpdater } from 'electron-updater'
import axios from 'axios'
import { ENVIRONMENT, LATEST } from 'remoteit-headless/build/constants'
import semverCompare from 'semver/functions/compare'

const AUTO_UPDATE_CHECK_INTERVAL = 43200000 // one half day

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
      autoUpdater.allowPrerelease = preferences.get().allowPrerelease || false
      if (autoUpdate !== this.autoUpdate) this.check(true)
      this.autoUpdate = !!autoUpdate
    })

    this.autoUpdate = !!preferences.get().autoUpdate
  }

  async check(force?: boolean) {
    try {
      if (ENVIRONMENT !== 'development') {
        if (environment.isLinux) {
          try {
            const response = await axios.get(LATEST)
            Logger.info('LATEST VERSION FOUND', { version: response.data.tag_name })
            const latest = response.data.tag_name
            let desktopVersion = preferences.get().version
            let current = desktopVersion && semverCompare(desktopVersion, latest) >= 0
            if (!current) {
              EventBus.emit(EVENTS.downloaded, latest.substring(1))
            }
          } catch (error) {
            Logger.error('LATEST VERSION ERROR', { error })
          }
        } else if (environment.isWindows || environment.isMac) {
          Logger.info('CHECK FOR UPDATE')
          if (force || (this.nextCheck < Date.now() && preferences.get().autoUpdate)) {
            autoUpdater.checkForUpdatesAndNotify()
            this.nextCheck = Date.now() + AUTO_UPDATE_CHECK_INTERVAL
          }
        }
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
