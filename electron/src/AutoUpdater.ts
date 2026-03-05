import { autoUpdater } from 'electron-updater'
import axios from 'axios'
import { EventBus, Logger, EVENTS, preferences, environment } from './backend'

const AUTO_UPDATE_CHECK_INTERVAL = 43200000 // one half day
const PRE_RELEASE_CHECK_INTERVAL = 900000 // fifteen minutes
const GITHUB_OWNER = 'remoteit'
const GITHUB_REPO = 'desktop'
const GITHUB_RELEASES_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases?per_page=30`
const GITHUB_RELEASES_DOWNLOAD_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download`

interface GitHubReleaseAsset {
  name: string
}

interface GitHubRelease {
  tag_name: string
  draft: boolean
  prerelease: boolean
  assets: GitHubReleaseAsset[]
}

export default class AppUpdater {
  nextCheck: number = 0
  checking: boolean = false
  available: boolean = false
  downloaded: boolean = false
  downloading: boolean = false
  version?: string
  error: boolean = false
  private readonly updateManifestFile = process.platform === 'darwin' ? 'latest-mac.yml' : 'latest.yml'

  constructor() {
    if (environment.isHeadless) return

    autoUpdater.logger = Logger
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.disableWebInstaller = true
    autoUpdater.autoDownload = true
    autoUpdater.autoRunAppAfterInstall = true
    autoUpdater.allowPrerelease = !!preferences.get().allowPrerelease
    autoUpdater.forceDevUpdateConfig = environment.isDev

    autoUpdater.on('update-downloaded', info => {
      this.downloaded = true
      this.downloading = false
      this.checking = false
      this.version = info.version
      this.error = false
      this.emitStatus()
    })
    autoUpdater.on('download-progress', info => {
      this.downloading = true
      Logger.info('AUTO UPDATE DOWNLOAD PROGRESS', info)
      this.emitStatus()
    })
    autoUpdater.on('checking-for-update', () => {
      this.checking = true
      this.emitStatus()
    })
    autoUpdater.on('update-available', info => {
      this.available = true
      this.checking = false
      this.error = false
      this.version = info.version
      this.emitStatus()
    })
    autoUpdater.on('update-not-available', () => {
      this.available = false
      this.checking = false
      this.error = false
      this.version = undefined
      this.emitStatus()
    })
    autoUpdater.on('error', error => {
      this.error = true
      this.checking = false
      this.downloading = false
      this.emitStatus()
    })

    EventBus.on(EVENTS.check, this.check)
    EventBus.on(EVENTS.preferences, ({ allowPrerelease }: IPreferences) => {
      if (autoUpdater.allowPrerelease !== !!allowPrerelease) {
        autoUpdater.allowPrerelease = !!allowPrerelease
        Logger.info('AUTO UPDATE ALLOW PRERELEASE', { allowPrerelease })
        this.emitStatus()
      }
    })
  }

  emitStatus() {
    EventBus.emit(EVENTS.status, this.status)
  }

  get status() {
    return {
      version: this.version,
      nextCheck: this.nextCheck,
      checking: this.checking,
      available: this.available,
      downloading: this.downloading,
      downloaded: this.downloaded,
      error: this.error,
    }
  }

  check = async (force?: boolean) => {
    if ((!environment.isWindows && !environment.isMac) || !preferences.get().autoUpdate) return

    try {
      if (force || this.nextCheck < Date.now()) {
        this.setDefaultFeed()
        Logger.info('CHECK FOR UPDATE', { url: autoUpdater.getFeedURL() })
        Logger.info('Checking for update')
        this.nextCheck =
          Date.now() + (autoUpdater.allowPrerelease ? PRE_RELEASE_CHECK_INTERVAL : AUTO_UPDATE_CHECK_INTERVAL)
        await autoUpdater.checkForUpdatesAndNotify()
        this.emitStatus()
      }
    } catch (error) {
      if (this.isMissingChannelFileError(error)) {
        const recovered = await this.checkWithFallbackRelease()
        if (recovered) return
      }
      Logger.warn('AUTO UPDATE ERROR', { error })
    }
  }

  install = () => {
    Logger.info('QUIT AND INSTALL UPDATE')
    autoUpdater.quitAndInstall()
  }

  private setDefaultFeed() {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
    })
  }

  private isMissingChannelFileError(error: any): boolean {
    return (
      error?.code === 'ERR_UPDATER_CHANNEL_FILE_NOT_FOUND' ||
      String(error?.message || '').includes(`Cannot find ${this.updateManifestFile}`)
    )
  }

  private async checkWithFallbackRelease(): Promise<boolean> {
    try {
      const tag = await this.findFallbackReleaseTag()
      if (!tag) return false

      autoUpdater.setFeedURL({
        provider: 'generic',
        url: `${GITHUB_RELEASES_DOWNLOAD_URL}/${tag}`,
      })
      Logger.warn('AUTO UPDATE FALLBACK RELEASE', { tag, manifest: this.updateManifestFile })
      await autoUpdater.checkForUpdatesAndNotify()
      this.emitStatus()
      return true
    } catch (error) {
      Logger.warn('AUTO UPDATE FALLBACK ERROR', { error })
      return false
    }
  }

  private async findFallbackReleaseTag(): Promise<string | undefined> {
    const { data } = await axios.get<GitHubRelease[]>(GITHUB_RELEASES_API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    })

    const release = data.find(item => {
      if (item.draft) return false
      if (!autoUpdater.allowPrerelease && item.prerelease) return false
      return item.assets?.some(asset => asset.name === this.updateManifestFile)
    })

    return release?.tag_name
  }
}
