import { EventBus, Logger, EVENTS, preferences, environment } from 'remoteit-headless'
import { autoUpdater } from 'electron-updater'

const AUTO_UPDATE_CHECK_INTERVAL = 43200000 // one half day

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
        this.nextCheck = Date.now() + AUTO_UPDATE_CHECK_INTERVAL
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
    autoUpdater.quitAndInstall()
  }
}
