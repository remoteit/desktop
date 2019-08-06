import debug from 'debug'
import Environment from './Environment'
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
    this.name = args.name
    this.repoName = args.repoName
    this.version = args.version
  }

  /**
   * Download the binary, move it to the PATH on the user's
   * system and then make it writable.
   */
  install(cb?: ProgressCallback) {
    const permission = 0o755

    d('Attempting to install binary: %O', {
      name: this.name,
      permission,
      path: this.binaryPath,
      version: this.version,
      repoName: this.repoName,
    })

    try {
      d('Creating binary path: ', this.targetDirectory)
      fs.mkdirSync(this.targetDirectory, { recursive: true })
    } catch (error) {
      d('Error creating binary path:', error)
    }

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
    d('connectd is not installed, attempting to install now')
    return this.install(cb)
  }

  get binaryPath() {
    return path.join(this.binaryDirectory, this.binaryName)
  }

  get binaryName() {
    return Environment.isWindows ? this.name + '.exe' : this.name
  }

  get binaryDirectory() {
    return Environment.isWindows ? '/remoteit/bin/' : '/usr/local/bin/'
  }

  /**
   * Return whether or not connectd exists where we expect it. Used
   * to decide if we install connectd or not on startup.
   */
  get isInstalled() {
    // TODO: we should probably make sure the output of the binary is what
    // we expect it to be and it is the right version
    d('Check if is installed', this.binaryPath)
    return existsSync(this.binaryPath)
  }

  private download(tag: string, progress: ProgressCallback = () => {}) {
    return new Promise((resolve, reject) => {
      const url = `https://github.com/${this.repoName}/releases/download/${
        this.version
      }/${this.downloadFileName}`

      d(`Downloading ${this.name}:`, url)

      progress(0)

      https
        .get(url, res1 => {
          if (!res1 || !res1.headers || !res1.headers.location)
            return reject(new Error('No response from download URL!'))
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

  get downloadPath() {
    return path.join(this.downloadDirectory, this.binaryName)
  }

  private get downloadFileName() {
    return Environment.isWindows
      ? `${this.name}.x86_64-64.exe`
      : os.arch() === 'x64'
      ? `${this.name}.x86_64-osx`
      : `${this.name}.x86-osx`
  }

  private get downloadDirectory() {
    return Environment.isWindows ? '/remoteit/bin/' : '/tmp/'
  }
}
