import debug from 'debug'
import Environment from './Environment'
import Logger from './Logger'
import EventBus from './EventBus'
import fs from 'fs'
import https from 'https'
import os from 'os'
import path from 'path'
import { existsSync } from 'fs'

const d = debug('r3:backend:Installer')

export type ProgressCallback = (percent: number) => void

interface InstallerArgs {
  name: string
  repoName: string
  version: string
}

export default class Installer {
  name: string
  repoName: string
  version: string

  static EVENTS = {
    progress: 'binary/install/progress',
    error: 'binary/install/error',
    installed: 'binary/installed',
    notInstalled: 'binary/not-installed',
  }

  constructor(args: InstallerArgs) {
    d('Creating installer:', args)
    this.name = args.name
    this.repoName = args.repoName
    this.version = args.version
  }

  check(version?: string) {
    this.isInstalled(version)
      ? EventBus.emit(Installer.EVENTS.installed, {
          path: this.binaryPath,
          version: this.version,
          name: this.name,
        } as InstallationInfo)
      : EventBus.emit(Installer.EVENTS.notInstalled, this.name)
  }

  /**
   * Download the binary, move it to the PATH on the user's
   * system and then make it writable.
   */
  install(cb?: ProgressCallback) {
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

    // Download the binary from Github
    return this.download(cb)
  }

  isCurrent(version?: string) {
    // stub to be overridden in child class
    return true
  }

  get targetDirectory() {
    const { dir } = path.parse(this.binaryPath)
    return dir
  }

  /**
   * Return whether or not connectd exists where we expect it. Used
   * to decide if we install connectd or not on startup.
   */
  isInstalled(version?: string) {
    const exists = existsSync(this.binaryPath)
    const current = this.isCurrent(version)
    Logger.info('IS INSTALLED?', { path: this.binaryPath, exists, current })
    return exists && current
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
              const w = fs.createWriteStream(this.downloadPath)
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

  get binaryPath() {
    return path.join(Environment.binPath, this.binaryName)
  }

  get binaryName() {
    return Environment.isWindows ? this.name + '.exe' : this.name
  }

  get downloadPath() {
    return path.join(os.tmpdir(), this.binaryName)
  }

  // @TODO support for installing all platforms:
  // https://github.com/remoteit/installer/blob/master/scripts/auto-install.sh
  get downloadFileName() {
    let extension = ''

    if (Environment.isWindows) {
      extension = os.arch() === 'x64' ? '.x86_64-64.exe' : '.exe'
    } else if (Environment.isMac) {
      extension = os.arch() === 'x64' ? '.x86_64-osx' : '.x86-osx'
    } else if (Environment.isPi) {
      extension = '.arm-linaro-pi'
    } else if (Environment.isLinux) {
      extension = os.arch() === 'x64' ? '.x86_64-ubuntu16.04' : '.x86-ubuntu16.04'
    }

    return this.name + extension
  }
}
