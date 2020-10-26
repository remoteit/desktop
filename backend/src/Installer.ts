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
  repoName: string
  resources: { name: string, version: string, url:string }[]
  dependencies: string[]
}

export default class Installer {
  repoName: string
  resources: { name: string, version: string, url:string }[]
  installedVersion?: string
  dependencies: string[]
  pathFile?: string

  static EVENTS = {
    progress: 'binary/install/progress',
    error: 'binary/install/error',
    installed: 'binary/installed',
    notInstalled: 'binary/not-installed',
  }

  constructor(args: InstallerArgs) {
    this.repoName = args.repoName
    this.resources = args.resources
    this.dependencies = args.dependencies
  }

  async check(log?: boolean) {
    if (binaryInstaller.inProgress) return

    d('CHECK INSTALLATION', { name: this.resources[0].name, version: this.resources[0].version })
    const cliCurrent = await this.isCliCurrent(log)

    if (cliCurrent) {
      return EventBus.emit(Installer.EVENTS.installed, this.toJSON())
    } else {
      if (environment.isElevated) await binaryInstaller.install()
      else EventBus.emit(Installer.EVENTS.notInstalled, this.resources[0].name)
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
      version: this.resources[0].version,
      name: this.resources[0].name,
      installedVersion: this.installedVersion,
    } as InstallationInfo
  }

  isDesktopCurrent(log?: boolean) {
    let desktopVersion = preferences.get().version
    let current = desktopVersion && semverCompare(desktopVersion, environment.version) >= 0
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
        current = semverCompare(cliVersion, this.resources[0].version) >= 0
      } catch (error) {
        Logger.warn('BAD CLI VERSION', { error })
      }
    }

    if (current) {
      log && Logger.info('CHECK CLI VERSION', { current, name: this.resources[0].name, cliVersion, desiredVersion: this.resources[0].version })
    } else {
      Logger.info('CLI NOT CURRENT', { name: this.resources[0].name, cliVersion, desiredVersion: this.resources[0].version })
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
  install( cb?: ProgressCallback) {
    Logger.info('INSTALLING BINARY', {
      name: this.resources[0].name,
      repoName: this.repoName,
      version: this.resources[0].version,
    })
 

    // Download the binary from Github
    return this.download(cb)
  }
  

  get downloadFileName() {
    const name = `${this.resources[0].name}_`
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

  get extensionName () {
    let platform = ''
    if (environment.isWindows32) platform = '.x86-win.exe'
    else if (environment.isWindows) platform = '.x86_64-64.exe'
    else if (environment.isMac) platform = '.x86_64-osx'
    return  platform
  }

  get downloadFileNameMuxer() {
    return `muxer${this.extensionName}`
  }

  get downloadFileNameDemuxer() {
    return `demuxer${this.extensionName}`
  }

  get downloadFileNameConnectd() {
    return `connectd${this.extensionName}`
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
    return environment.isWindows ? this.resources[0].name + '.exe' : this.resources[0].name
  }

  get muxerName(){
    return environment.isWindows ? this.dependencies[1] + '.exe' : this.dependencies[1]
  }

  get demuxerName(){
    return environment.isWindows ? this.dependencies[2] + '.exe' : this.dependencies[2]
  }

  get connectdName(){
    return environment.isWindows ? this.dependencies[0] + '.exe' : this.dependencies[0]
  }

  get dependencyNames() {
    return this.dependencies.map(d => (environment.isWindows ? d + '.exe' : d))
  }

  private download(progress: ProgressCallback = () => {}) {
    EventBus.emit(Installer.EVENTS.progress, { progress: 0, installer: 'download init' });
    return new Promise((resolve, reject) => {

      const url       = `${this.resources[0].url}${this.resources[0].version}/${this.downloadFileName}`
      const muxer     = `${this.resources[1].url}${this.resources[1].version}/${this.downloadFileNameMuxer}`
      const demuxer   = `${this.resources[2].url}${this.resources[2].version}/${this.downloadFileNameDemuxer}`
      const connectd  = `${this.resources[3].url}${this.resources[3].version}/${this.downloadFileNameConnectd}`
      progress(0)

      Logger.info('DOWNLOADING BINARY', {  url, muxer, demuxer, connectd })

      this.getFileWeb(url, resolve, reject, progress, this.binaryPathCLI())
      this.getFileWeb(muxer, resolve, reject, progress, this.binaryPathMuxer())
      this.getFileWeb(demuxer, resolve, reject, progress, this.binaryPathDemuxer())
      this.getFileWeb(connectd, resolve, reject, progress, this.binaryPathConnectd())

    })
  }

  private getFileWeb(url: string, resolve:any, reject: any, progress: any, pathFile: any ){
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
      if (!pathFile) return reject(new Error('No file path set'))
      const w = fs.createWriteStream(pathFile)
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
