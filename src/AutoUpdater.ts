import electron from 'electron'
import { EventBus, Logger, EVENTS, preferences, environment } from 'remoteit-headless'
import { autoUpdater } from 'electron-updater'

const AUTO_UPDATE_CHECK_INTERVAL = 43200000 // one half day
const PRE_RELEASE_CHECK_INTERVAL = 900000 // fifteen minutes

export default class AppUpdater {
  nextCheck: number = 0

  constructor() {
    autoUpdater.logger = Logger
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('update-downloaded', info => {
      EventBus.emit(EVENTS.downloaded, info.version)
    })

    autoUpdater.on('error', error => {
      Logger.error('AUTO UPDATE ERROR', { error })
    })

    EventBus.on(EVENTS.preferences, ({ autoUpdate }: IPreferences) => {
      autoUpdater.allowPrerelease = preferences.get().allowPrerelease || false
      if (autoUpdate) this.check(true)
    })
  }

  async check(force?: boolean) {
    try {
      if (force || (this.nextCheck < Date.now() && preferences.get().autoUpdate)) {
        this.nextCheck =
          Date.now() + (autoUpdater.allowPrerelease ? PRE_RELEASE_CHECK_INTERVAL : AUTO_UPDATE_CHECK_INTERVAL)
        if (environment.isWindows || environment.isMac) {
          Logger.info('CHECK FOR UPDATE')
          autoUpdater.checkForUpdatesAndNotify()
          // TEST UPDATE NOTICE: EventBus.emit(EVENTS.downloaded, '9.9.9')
        }
      }
    } catch (error) {
      Logger.warn('AUTO UPDATE ERROR', { error })
    }
  }

  async update() {
    Logger.info('QUIT AND INSTALL UPDATE')
    await autoUpdater.quitAndInstall()
    electron.app.quit()
  }
}
