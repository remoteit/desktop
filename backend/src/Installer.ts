import { application } from '.'
import debug from 'debug'
import semverCompare from 'semver-compare'
import Environment from './Environment'
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
    d('Creating installer:', args)
    this.name = args.name
    this.repoName = args.repoName
    this.version = args.version
    this.dependencies = args.dependencies
  }

  async check() {
    d('CHECK INSTALLATION', { name: this.name, version: this.version })
    const current = await this.isCurrent()
    current
      ? EventBus.emit(Installer.EVENTS.installed, {
          path: this.binaryPath,
          version: this.version,
          name: this.name,
        } as InstallationInfo)
      : EventBus.emit(Installer.EVENTS.notInstalled, this.name)
    return current
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

  async isCurrent() {
    let current = false
    if (this.isInstalled()) {
      const version = await application.cli.version()
      current = semverCompare(version || '0', this.version) === 0
      d('CURRENT', { name: this.name, checkVersion: version, version: this.version })
    }
    return current
  }

  fileExists(name: string) {
    const filePath = path.join(Environment.binPath, name)
    const exists = existsSync(filePath)
    d('BINARY EXISTS', { name, exists, filePath })
    return exists
  }

  /**
   * Download the binary, move it to the PATH on the user's
   * system and then make it writable.
   */
  install(tempDir: string, cb?: ProgressCallback) {
    Logger.info('Installing Binary', {
      name: this.name,
      repoName: this.repoName,
      version: this.version,
    })
    d('Attempting to install binary: %O', {
      name: this.name,
      path: this.binaryPath,
      version: this.version,
      repoName: this.repoName,
    })

    this.tempFile = path.join(tempDir, this.binaryName)

    // Download the binary from Github
    return this.download(cb)
  }

  get downloadFileName() {
    const version = this.version
    const name = `${this.name}_${version}_`
    if (Environment.isWindows) return `${name}windows_x86_64.exe`
    else if (Environment.isMac) return `${name}mac-osx_x86_64`
    else if (Environment.isPi) return `${name}linux_armv7`
    else if (Environment.isLinux) return `${name}linux_x86_64`
    else return `${name}linux_arm64`
  }

  get binaryPath() {
    return path.join(Environment.binPath, this.binaryName)
  }

  get binaryName() {
    return Environment.isWindows ? this.name + '.exe' : this.name
  }

  get dependencyNames() {
    return this.dependencies.map(d => (Environment.isWindows ? d + '.exe' : d))
  }

  private download(progress: ProgressCallback = () => {}) {
    return new Promise((resolve, reject) => {
      const url = `https://github.com/${this.repoName}/releases/download/v${this.version}/${this.downloadFileName}`

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
