import electron from 'electron'
import { EventBus, Logger, EVENTS, preferences, environment } from 'remoteit-headless'
import { autoUpdater } from 'electron-updater'

const AUTO_UPDATE_CHECK_INTERVAL = 43200000 // one half day
const PRE_RELEASE_CHECK_INTERVAL = 900000 // fifteen minutes

export default class AppUpdater {
  nextCheck: number = 0
  checking: boolean = true
  available: boolean = false
  downloaded: boolean = false
  version?: string
  error: boolean = false

  constructor() {
    if (environment.isHeadless) return

    autoUpdater.logger = Logger
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.disableWebInstaller = true
    autoUpdater.autoDownload = true
    autoUpdater.allowPrerelease = !!preferences.get().allowPrerelease
    autoUpdater.forceDevUpdateConfig = environment.isDev

    autoUpdater.on('update-downloaded', info => {
      Logger.info('AUTO UPDATER update-downloaded', info)
      this.downloaded = true
      this.checking = false
      this.version = info.version
      this.emitStatus()
    })
    autoUpdater.on('checking-for-update', () => {
      Logger.info('AUTO UPDATER checking-for-update')
      this.checking = true
      this.emitStatus()
    })
    autoUpdater.on('update-available', info => {
      Logger.info('AUTO UPDATER update-available', info)
      this.available = true
      this.checking = false
      this.version = info.version
      this.emitStatus()
    })
    autoUpdater.on('update-not-available', info => {
      Logger.info('AUTO UPDATER update-not-available', info)
      this.available = false
      this.checking = false
      this.version = undefined
      this.emitStatus()
    })
    autoUpdater.on('error', error => {
      Logger.info('AUTO UPDATER error', error)
      this.available = false
      this.checking = false
      this.version = undefined
      this.downloaded = false
      this.error = true
      this.emitStatus()
    })

    EventBus.on(EVENTS.check, this.check)
    EventBus.on(EVENTS.install, this.install)
    EventBus.on(
      EVENTS.preferences,
      ({ allowPrerelease }: IPreferences) => (autoUpdater.allowPrerelease = !!allowPrerelease)
    )
  }

  emitStatus() {
    Logger.info('AUTO UPDATE STATUS', { status: this.status })
    EventBus.emit(EVENTS.status, this.status)
  }

  get status() {
    return {
      version: this.version,
      nextCheck: this.nextCheck,
      checking: this.checking,
      available: this.available,
      downloaded: this.downloaded,
    }
  }

  check = async (force?: boolean) => {
    if ((!environment.isWindows && !environment.isMac) || !preferences.get().autoUpdate) return

    try {
      if (force || this.nextCheck < Date.now()) {
        Logger.info('CHECK FOR UPDATE')
        this.nextCheck =
          Date.now() + (autoUpdater.allowPrerelease ? PRE_RELEASE_CHECK_INTERVAL : AUTO_UPDATE_CHECK_INTERVAL)
        await autoUpdater.checkForUpdatesAndNotify()
        this.emitStatus()
      }
    } catch (error) {
      Logger.warn('AUTO UPDATE ERROR', { error })
    }
  }

  install = async () => {
    Logger.info('QUIT AND INSTALL UPDATE')
    await autoUpdater.quitAndInstall()
    electron.app.quit()
  }
}
