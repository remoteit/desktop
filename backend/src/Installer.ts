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

  check() {
    this.isInstalled
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
    return this.download(this.version, cb)
  }

  get targetDirectory() {
    const { dir } = path.parse(this.binaryPath)
    return dir
  }

  /**
   * Install connectd if it is missing from the host system.
   */
  async installIfMissing(cb?: ProgressCallback) {
    if (this.isInstalled) return
    d(this.name + ' is not installed, attempting to install now')
    return this.install(cb)
  }

  /**
   * Return whether or not connectd exists where we expect it. Used
   * to decide if we install connectd or not on startup.
   */
  get isInstalled() {
    // TODO: we should probably make sure the output of the binary is what
    // we expect it to be and it is the right version
    Logger.info('IS INSTALLED?', { path: this.binaryPath, installed: existsSync(this.binaryPath) })
    return existsSync(this.binaryPath)
  }

  private download(tag: string, progress: ProgressCallback = () => {}) {
    return new Promise((resolve, reject) => {
      const url = `https://github.com/${this.repoName}/releases/download/${this.version}/${this.downloadFileName}`

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

  get downloadFileName() {
    let extension = ''

    if (Environment.isWindows) {
      extension = os.arch() === 'x64' ? '.x86_64-64.exe' : '.exe'
    }
    if (Environment.isMac) {
      extension = os.arch() === 'x64' ? '.x86_64-osx' : '.x86-osx'
    }
    if (Environment.isLinux) {
      extension = os.arch() === 'x64' ? '.x86_64-ubuntu16.04' : 'x86-ubuntu16.04'
    }

    return this.name + extension
  }
}
