import debug from 'debug'
import cli from './cliInterface'
import binaryInstaller from './binaryInstaller'
import semverCompare from 'semver-compare'
import environment from './environment'
import EventBus from './EventBus'
import Logger from './Logger'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { existsSync } from 'fs'

const d = debug('r3:backend:Installer')

export type ProgressCallback = (percent: number) => void

interface InstallerArgs {
  name: string
  repoName: string
  version: string
  dependencies: string[]
}

export default class Installer {
  name: string
  repoName: string
  version: string
  dependencies: string[]
  tempFile?: string

  static EVENTS = {
    progress: 'binary/install/progress',
    error: 'binary/install/error',
    installed: 'binary/installed',
    notInstalled: 'binary/not-installed',
    afterInstall: 'binary/after-install',
    // uninstalled: 'binary/uninstalled',
  }

  constructor(args: InstallerArgs) {
    this.name = args.name
    this.repoName = args.repoName
    this.version = args.version
    this.dependencies = args.dependencies
  }

  async check(log?: boolean) {
    d('CHECK INSTALLATION', { name: this.name, version: this.version })
    if (await this.isCurrent(log)) return EventBus.emit(Installer.EVENTS.installed, this.toJSON())
    if (environment.isElevated) return await binaryInstaller.install()
    EventBus.emit(Installer.EVENTS.notInstalled, this.name)
  }

  /**
   * Return whether or not connectd exists where we expect it. Used
   * to decide if we install connectd or not on startup.
   */
  isInstalled() {
    const check = this.dependencyNames.concat(this.binaryName)
    const missing = check.find(fileName => !this.fileExists(fileName))
    d('IS INSTALLED?', { installed: !missing })
    return !missing
  }

  toJSON() {
    return {
      path: this.binaryPath(),
      version: this.version,
      name: this.name,
    } as InstallationInfo
  }

  async isCurrent(log?: boolean) {
    let current = false
    let cliVersion = 'Installing'

    if (this.isInstalled()) {
      cliVersion = await cli.version()
      current = semverCompare(cliVersion, this.version) <= 0
    }

    if (current) {
      log && Logger.info('CHECK VERSION', { current, name: this.name, cliVersion, desiredVersion: this.version })
    } else {
      Logger.info('NOT CURRENT', { name: this.name, cliVersion, desiredVersion: this.version })
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
  install(tempDir: string, cb?: ProgressCallback) {
    Logger.info('INSTALLING BINARY', {
      name: this.name,
      repoName: this.repoName,
      version: this.version,
    })

    this.tempFile = path.join(tempDir, this.binaryName)

    // Download the binary from Github
    return this.download(cb)
  }

  get downloadFileName() {
    const name = `${this.name}_`
    let platform = 'linux_arm64'
    if (environment.isWindows) platform = 'windows_x86_64.exe'
    else if (environment.isMac) platform = 'mac-osx_x86_64'
    else if (environment.isPiZero) platform = 'linux_armv6'
    else if (environment.isPi) platform = 'linux_armv7'
    else if (environment.isArmLinux) platform = 'linux_arm64'
    else if (environment.isLinux) platform = 'linux_x86_64'
    return name + platform
  }

  binaryPath(admin?: boolean) {
    return path.join(environment.binPath, this.binaryName)
  }

  get binaryName() {
    return environment.isWindows ? this.name + '.exe' : this.name
  }

  get dependencyNames() {
    return this.dependencies.map(d => (environment.isWindows ? d + '.exe' : d))
  }

  private download(progress: ProgressCallback = () => {}) {
    return new Promise((resolve, reject) => {
      const url = `https://github.com/${this.repoName}/releases/download/v${this.version}/${this.downloadFileName}`

      Logger.info('DOWNLOADING', { url })
      d(`Downloading ${this.name}:`, url)

      progress(0)

      https
        .get(url, res1 => {
          if (!res1 || !res1.headers || !res1.headers.location) {
            d('No response from download URL', res1, this)
            return reject(new Error('No response from download URL!'))
          }
          https
            .get(res1.headers.location, res2 => {
              if (!res2 || !res2.headers || !res2.headers['content-length'])
                return reject(new Error('No response from location URL!'))
              const total = parseInt(res2.headers['content-length'], 10)
              let completed = 0
              if (!this.tempFile) return reject(new Error('No temp file path set'))
              const w = fs.createWriteStream(this.tempFile)
              res2.pipe(w)
              res2.on('data', data => {
                completed += data.length
                progress(completed / total)
              })
              res2.on('progress', progress)
              res2.on('error', reject)
              res2.on('end', resolve)
            })
            .on('error', reject)
        })
        .on('error', reject)
    })
  }
}
