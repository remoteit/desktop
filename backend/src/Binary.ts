import environment from './environment'
import versionJson from './cli-version.json'
import path from 'path'

interface BinaryArgs {
  name: string
  version: string
  isCli?: boolean
}

export default class Binary {
  name: string
  version: string
  agentVersion?: string
  installedVersion?: string
  inProgress?: boolean
  isCli?: boolean

  static EVENTS = {
    error: 'binary/install/error',
    install: 'binaries/install',
    installed: 'binary/installed',
    notInstalled: 'binary/not-installed',
  }

  constructor(args: BinaryArgs) {
    this.name = args.name
    this.version = args.version
    this.isCli = args.isCli
  }

  get path() {
    return environment.isHeadless ? cliBinary.name : path.resolve(environment.binPath, this.fileName)
  }

  get fileName() {
    return environment.isWindows ? this.name + '.exe' : this.name
  }

  get symlink() {
    return path.resolve(environment.symlinkPath, this.fileName)
  }

  toJSON(): InstallationInfo {
    return {
      path: this.path,
      version: this.version,
      name: this.name,
      installedVersion: this.installedVersion,
    }
  }
}

export const cliBinary = new Binary({ name: 'remoteit', version: versionJson.cli, isCli: true })

export const binaries = [
  cliBinary,
  new Binary({ name: 'muxer', version: versionJson.muxer }),
  new Binary({ name: 'demuxer', version: versionJson.demuxer }),
  new Binary({ name: 'connectd', version: versionJson.connectd }),
]
