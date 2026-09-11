import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import axios from 'axios'
import { EventBus, Logger, EVENTS, preferences, environment, brand } from './backend'
import { detectNativeWindowsArch, resolveNativeArchSteering, WindowsArch } from './backend/updateChannel'

const AUTO_UPDATE_CHECK_INTERVAL = 43200000 // one half day
const PRE_RELEASE_CHECK_INTERVAL = 900000 // fifteen minutes
const DEFAULT_GITHUB_OWNER = 'remoteit'
const DEFAULT_GITHUB_REPO = 'desktop'

interface GitHubFeedConfig {
  owner: string
  repo: string
}

interface GitHubReleaseAsset {
  name: string
}

interface GitHubRelease {
  tag_name: string
  draft: boolean
  prerelease: boolean
  assets: GitHubReleaseAsset[]
}

// Same pattern as scripts/release-repo.js, which resolves the repository for CI.
const resolveGitHubFeedFromBrand = (): GitHubFeedConfig => {
  const repositoryUrl = brand?.package?.repository?.url || ''
  const match = repositoryUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i)

  return {
    owner: match?.[1] || DEFAULT_GITHUB_OWNER,
    repo: match?.[2] || DEFAULT_GITHUB_REPO,
  }
}

export default class AppUpdater {
  nextCheck: number = 0
  checking: boolean = false
  available: boolean = false
  downloaded: boolean = false
  downloading: boolean = false
  version?: string
  error: boolean = false
  private steering: WindowsArch | null = null
  private readonly defaultGithubFeed: GitHubFeedConfig = resolveGitHubFeedFromBrand()

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

  private get updateManifestFile() {
    if (process.platform === 'darwin') return 'latest-mac.yml'
    return this.steering ? `latest-${this.steering}.yml` : 'latest.yml'
  }

  check = async (force?: boolean) => {
    if ((!environment.isWindows && !environment.isMac) || !preferences.get().autoUpdate) return

    try {
      if (force || this.nextCheck < Date.now()) {
        this.nextCheck =
          Date.now() + (autoUpdater.allowPrerelease ? PRE_RELEASE_CHECK_INTERVAL : AUTO_UPDATE_CHECK_INTERVAL)
        this.applyFeed(this.nativeArchSteering())
        Logger.info('CHECK FOR UPDATE', { feed: this.defaultGithubFeed, manifest: this.updateManifestFile })
        Logger.info('Checking for update')
        await autoUpdater.checkForUpdatesAndNotify()
        this.emitStatus()
      }
    } catch (error) {
      if (this.isMissingChannelFileError(error)) {
        if (await this.checkWithFallbackRelease()) return
        if (await this.checkWithoutSteering()) return
      }
      Logger.warn('AUTO UPDATE ERROR', { error })
    }
  }

  install = () => {
    Logger.info('QUIT AND INSTALL UPDATE')
    autoUpdater.quitAndInstall()
  }

  private nativeArchSteering(): WindowsArch | null {
    if (!environment.isWindows) return null
    const nativeArch = detectNativeWindowsArch(process.arch, app.runningUnderARM64Translation, process.env)
    return resolveNativeArchSteering(process.arch, nativeArch)
  }

  // The feed's own `channel` only renames the manifest GitHubProvider reads from the release it
  // picks; autoUpdater.channel would also change which tags it picks. See RELEASE.md.
  private applyFeed(steering: WindowsArch | null) {
    const { owner, repo } = this.defaultGithubFeed
    this.steering = steering
    autoUpdater.setFeedURL(
      steering
        ? { provider: 'github', owner, repo, channel: `latest-${steering}` }
        : { provider: 'github', owner, repo }
    )
    if (steering) Logger.info('AUTO UPDATE NATIVE ARCH', { processArch: process.arch, nativeArch: steering })
  }

  // No release carries this build's per-arch manifest yet; latest.yml still updates it on its
  // current arch.
  private async checkWithoutSteering(): Promise<boolean> {
    if (!this.steering) return false
    Logger.warn('AUTO UPDATE NATIVE ARCH MANIFEST MISSING', { manifest: this.updateManifestFile })
    this.applyFeed(null)
    try {
      await autoUpdater.checkForUpdatesAndNotify()
      this.emitStatus()
      return true
    } catch (error) {
      if (this.isMissingChannelFileError(error)) return this.checkWithFallbackRelease()
      Logger.warn('AUTO UPDATE ERROR', { error })
      return true
    }
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

      const url = `https://github.com/${this.defaultGithubFeed.owner}/${this.defaultGithubFeed.repo}/releases/download/${tag}`
      autoUpdater.setFeedURL(
        this.steering ? { provider: 'generic', url, channel: `latest-${this.steering}` } : { provider: 'generic', url }
      )
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
    const { data } = await axios.get<GitHubRelease[]>(
      `https://api.github.com/repos/${this.defaultGithubFeed.owner}/${this.defaultGithubFeed.repo}/releases?per_page=30`,
      { headers: { Accept: 'application/vnd.github+json' }, timeout: 10000 }
    )

    const release = data.find(item => {
      if (item.draft) return false
      if (!autoUpdater.allowPrerelease && item.prerelease) return false
      return item.assets?.some(asset => asset.name === this.updateManifestFile)
    })

    return release?.tag_name
  }
}
