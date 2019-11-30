import Environment from './Environment'
import RemoteitInstaller from './RemoteitInstaller'
import JSONFile from './JSONFile'
import defaults from './helpers/defaults'
import Logger from './Logger'
import debug from 'debug'
import path from 'path'
import User from './User'
import EventBus from './EventBus'
import { exec, execFile } from 'child_process'
import { removeDeviceName } from './helpers/nameHelper'

const d = debug('r3:backend:CLI')

export default class CLI {
  data: { user?: UserCredentials; device: IDevice; targets: ITarget[] } = {
    user: undefined,
    device: defaults,
    targets: [defaults],
  }

  file: JSONFile<ConfigFile>
  credentials: UserCredentials

  constructor(user: UserCredentials) {
    Logger.info('CONFIG FILE', { path: path.join(Environment.remoteitDirectory, 'config.json') })
    this.file = new JSONFile<ConfigFile>(path.join(Environment.remoteitDirectory, 'config.json'))
    this.credentials = user
    this.read()
    EventBus.on(User.EVENTS.signedIn, (user: UserCredentials) => {
      this.credentials = user
      this.signIn(user)
    })
    EventBus.on(User.EVENTS.signedOut, () => this.signOut())
  }

  read() {
    this.readUser()
    this.readDevice()
    this.readTargets()
    d('read config', { config: this.data })
  }

  readUser() {
    const config = this.readFile()
    if (config.username && config.authHash) this.data.user = config.auth
  }

  readDevice() {
    const config = this.readFile()
    const device = config.device || defaults
    this.data.device = {
      ...device,
      hostname: device.hostname || '',
      name: device.name || '',
    }
  }

  readTargets() {
    const deviceName = this.data.device && this.data.device.name
    const config = this.readFile()
    const targets = config.services || []
    this.data.targets = targets.map(service => ({
      ...service,
      hostname: service.hostname || '',
      name: removeDeviceName(deviceName, service.name) || '',
    }))
  }

  private readFile() {
    return this.file.read() || {}
  }

  async addTarget(t: ITarget) {
    await this.exec(`add "${t.name}" ${t.port} --type ${t.type} --hostname ${t.hostname || '127.0.0.1'}`)
  }

  async removeTarget(t: ITarget) {
    await this.exec(`remove ${t.uid}`)
  }

  async register(device: IDevice) {
    await this.exec(`setup "${device.name}"`)
  }

  async delete(d: IDevice) {
    await this.exec(`teardown ${d.uid} --yes`)
  }

  async install() {
    await this.exec('tools install')
  }

  async signIn(user?: UserCredentials) {
    if (!user || !user.username || !user.authHash) return
    await this.exec(`signin ${user.username} -a ${user.authHash}`, true)
  }

  async signOut() {
    await this.exec('signout')
  }

  async scan(ipMask: string) {
    const result = await this.exec(`scan -j -m ${ipMask}`)
    return JSON.parse(result)
  }

  async checkSignIn() {
    if (!this.data.user) await this.signIn(this.credentials)
  }

  async exec(command: string, signIn?: boolean) {
    if (!signIn) await this.checkSignIn()
    return new Promise<string>((success, failure) => {
      d('EXEC', `${RemoteitInstaller.binaryPath} ${command}`)
      Logger.info('EXEC', { exec: `${RemoteitInstaller.binaryPath} ${command}` })

      execFile(RemoteitInstaller.binaryPath, command.split(' '), (error, stdout) => {
        if (error) {
          Logger.error(`*** ERROR *** EXEC ${command}: `, { error })
          d(`*** ERROR *** EXEC ${command}: `, error)
          failure(error)
        }
        d('EXEC SUCCESS', stdout)
        success(stdout)
      })
    })
  }
}
