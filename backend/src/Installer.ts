import { CLI_DOWNLOAD } from './constants'
import debug from 'debug'
import cli from './cliInterface'
import preferences from './preferences'
import binaryInstaller from './binaryInstaller'
import semverCompare from 'semver/functions/compare'
import environment from './environment'
import EventBus from './EventBus'
import Logger from './Logger'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { existsSync } from 'fs'
import tmp from 'tmp'

tmp.setGracefulCleanup()

const d = debug('installer')

export type ProgressCallback = (percent: number) => void

interface InstallerArgs {
  name: string
  repoName: string
  version: string
  versionMuxer: string
  versionDemuxer: string
  versionConnectd: string
  baseUrl: string
  cliUrl: string
  connectdUrl: string
  dependencies: string[]
}

export default class Installer {
  name: string
  repoName: string
  version: string
  versionMuxer: string
  versionDemuxer: string
  versionConnectd: string
  baseUrl: string
  cliUrl: string
  connectdUrl: string
  installedVersion?: string
  dependencies: string[]
  tempFile?: string
  tempFileMuxer?: string
  tempFileDemuxer?: string
  tempFileConnectd?: string

  static EVENTS = {
    progress: 'binary/install/progress',
    error: 'binary/install/error',
    installed: 'binary/installed',
    notInstalled: 'binary/not-installed',
  }

  constructor(args: InstallerArgs) {
    6
    this.name = args.name
    this.repoName = args.repoName
    this.version = args.version
    this.versionMuxer = args.versionMuxer
    this.versionDemuxer = args.versionDemuxer
    this.versionConnectd = args.versionConnectd
    this.baseUrl = args.baseUrl
    this.cliUrl = args.cliUrl
    this.connectdUrl = args.connectdUrl
    this.dependencies = args.dependencies
  }

  async check(log?: boolean) {
    if (binaryInstaller.inProgress) return

    d('CHECK INSTALLATION', { name: this.name, version: this.version })
    const cliCurrent = await this.isCliCurrent(log)

    if (cliCurrent) {
      return EventBus.emit(Installer.EVENTS.installed, this.toJSON())
    } else {
      if (environment.isElevated) await binaryInstaller.install()
      else EventBus.emit(Installer.EVENTS.notInstalled, this.name)
    }
  }

  /**
   * Return whether or not connectd exists where we expect it. Used
   * to decide if we install connectd or not on startup.
   */
  isInstalled() {
    if (binaryInstaller.inProgress) return false
    const check = this.dependencyNames.concat(this.binaryName)
    const missing = check.find(fileName => !this.fileExists(fileName))
    d('IS INSTALLED?', { installed: !missing })
    return !missing
  }

  toJSON() {
    return {
      path: this.binaryPathCLI(),
      version: this.version,
      name: this.name,
      installedVersion: this.installedVersion,
    } as InstallationInfo
  }

  isDesktopCurrent(log?: boolean) {
    let desktopVersion = preferences.get().version || ''
    let current = semverCompare(desktopVersion, environment.version) >= 0
    if (current) {
      log && Logger.info('DESKTOP CURRENT', { desktopVersion })
    } else {
      Logger.info('DESKTOP UPDATE DETECTED', { oldVersion: desktopVersion, thisVersion: environment.version })
    }

    return current
  }

  async isCliCurrent(log?: boolean) {
    let cliVersion = 'Not Installed'
    let current = false

    if (this.isInstalled()) {
      cliVersion = await cli.version()
      this.installedVersion = cliVersion
      try {
        current = semverCompare(cliVersion, this.version) >= 0
      } catch (error) {
        Logger.warn('BAD CLI VERSION', { error })
      }
    }

    if (current) {
      log && Logger.info('CHECK CLI VERSION', { current, name: this.name, cliVersion, desiredVersion: this.version })
    } else {
      Logger.info('CLI NOT CURRENT', { name: this.name, cliVersion, desiredVersion: this.version })
    }

    return current
  }

  fileExists(name: string) {
    const filePath = path.join(environment.binPath, name)
    const exists = existsSync(filePath)
    d('BINARY EXISTS', { name, exists, filePath })
    return exists
  }

  /**
   * Download the binary, move it to the PATH on the user's
   * system and then make it writable.
   */
  install(cb?: ProgressCallback) {
    Logger.info('INSTALLING BINARY', {
      name: this.name,
      repoName: this.repoName,
      version: this.version,
    })
    let tempDir = tmp.dirSync({ unsafeCleanup: true, keep: true })
    this.tempFile = path.join(tempDir.name, this.binaryName)

    tempDir = tmp.dirSync({ unsafeCleanup: true, keep: true })
    this.tempFileMuxer = path.join(tempDir.name, this.muxerName)

    tempDir = tmp.dirSync({ unsafeCleanup: true, keep: true })
    this.tempFileDemuxer = path.join(tempDir.name, this.demuxerName)

    tempDir = tmp.dirSync({ unsafeCleanup: true, keep: true })
    this.tempFileConnectd = path.join(tempDir.name, this.connectdName)

    // Download the binary from Github
    return this.download(cb)
  }

  get downloadFileName() {
    const name = `${this.name}_`
    let platform = 'linux_arm64'
    if (environment.isWindows32) platform = 'windows_x86.exe'
    else if (environment.isWindows) platform = 'windows_x86_64.exe'
    else if (environment.isMac) platform = 'mac-osx_x86_64'
    else if (environment.isPiZero) platform = 'linux_armv6'
    else if (environment.isPi) platform = 'linux_armv7'
    else if (environment.isArmLinux) platform = 'linux_arm64'
    else if (environment.isLinux) platform = 'linux_x86_64'
    return name + platform
  }

  get downloadFileNameMuxer() {
    let platform = ''
    if (environment.isWindows32) platform = 'muxer.x86-win.exe'
    else if (environment.isWindows) platform = 'muxer.x86_64-64.exe'
    else if (environment.isMac) platform = 'muxer.x86_64-osx'
    return platform
  }

  get downloadFileNameDemuxer() {
    let platform = ''
    if (environment.isWindows32) platform = 'demuxer.x86-win.exe'
    else if (environment.isWindows) platform = 'demuxer.x86_64-64.exe'
    else if (environment.isMac) platform = 'demuxer.x86_64-osx'
    return platform
  }

  get downloadFileNameConnectd() {
    let platform = ''
    if (environment.isWindows32) platform = 'connectd.x86-win.exe'
    else if (environment.isWindows) platform = 'connectd.x86_64-64.exe'
    else if (environment.isMac) platform = 'connectd.x86_64-osx'
    return platform
  }

  binaryPathCLI(admin?: boolean) {
    return path.join(environment.binPath, this.binaryName)
  }

  binaryPathMuxer(admin?: boolean) {
    return path.join(environment.binPath, this.muxerName)
  }

  binaryPathDemuxer(admin?: boolean) {
    return path.join(environment.binPath, this.demuxerName)
  }

  binaryPathConnectd(admin?: boolean) {
    return path.join(environment.binPath, this.connectdName)
  }

  get binaryName() {
    return environment.isWindows ? this.name + '.exe' : this.name
  }

  get muxerName() {
    return environment.isWindows ? this.dependencies[1] + '.exe' : this.dependencies[1]
  }

  get demuxerName() {
    return environment.isWindows ? this.dependencies[2] + '.exe' : this.dependencies[2]
  }

  get connectdName() {
    return environment.isWindows ? this.dependencies[0] + '.exe' : this.dependencies[0]
  }

  get dependencyNames() {
    return this.dependencies.map(d => (environment.isWindows ? d + '.exe' : d))
  }

  private download(progress: ProgressCallback = () => {}) {
    return new Promise((resolve, reject) => {
      const url_cli =
        CLI_DOWNLOAD === 'DEV' ? 'https://dev-cli.s3-us-west-2.amazonaws.com/v' : 'https://downloads.remote.it/cli/v'

      const baseURL = 'https://downloads.remote.it/multiport/v'

      const url = `${url_cli}${this.version}/${this.downloadFileName}`
      const muxer = `${baseURL}${this.versionMuxer}/${this.downloadFileNameMuxer}`
      const demuxer = `${baseURL}${this.versionDemuxer}/${this.downloadFileNameDemuxer}`
      const connectd = `https://github.com/remoteit/connectd/releases/download/v${this.versionConnectd}/${this.downloadFileNameConnectd}`

      progress(0)

      Logger.info('DOWNLOADING CLI', { url })
      this.getFileWeb(url, resolve, reject, progress, this.tempFile)
      Logger.info('DOWNLOADING MUXER', { muxer })
      this.getFileWeb(muxer, resolve, reject, progress, this.tempFileMuxer)
      Logger.info('DOWNLOADING DEMUXER', { demuxer })
      this.getFileWeb(demuxer, resolve, reject, progress, this.tempFileDemuxer)
      Logger.info('DOWNLOADING CONNECTD', { connectd })
      this.getFileWeb(connectd, resolve, reject, progress, this.tempFileConnectd)
    })
  }

  private getFileWeb(url: string, resolve: any, reject: any, progress: any, temp: any) {
    https
      .get(url, res1 => {
        if (!res1 || !res1.headers) {
          Logger.warn('No response from download URL', { headers: res1.headers })
          return reject(new Error('No response from download URL!'))
        }
        if (res1.headers.location) {
          d('LOCATION FOUND', { location: res1.headers.location })
          try {
            https
              .get(res1.headers.location, res2 => {
                if (!res2 || !res2.headers || !res2.headers['content-length'])
                  return reject(new Error('No response from location URL!'))
                stream(res2)
              })
              .on('error', reject)
          } catch (e) {
            Logger.warn('Download file not found', { headers: res1.headers })
            return reject(new Error('Download file not found'))
          }
        } else if (res1.headers['content-length']) {
          stream(res1)
        } else {
          Logger.warn('No download header in download URL', { headers: res1.headers })
          return reject(new Error('No download header in download URL!'))
        }
      })
      .on('error', reject)

    const stream = (res: any) => {
      const total = parseInt(res.headers['content-length'], 10)
      let completed = 0
      if (!temp) return reject(new Error('No temp file path set'))
      const w = fs.createWriteStream(temp)
      res.pipe(w)
      res.on('data', (data: any) => {
        completed += data.length
        progress(completed / total)
      })
      res.on('progress', progress)
      res.on('error', reject)
      res.on('end', resolve)
    }
  }
}
