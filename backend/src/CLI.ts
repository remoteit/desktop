import Environment from './Environment'
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

  constructor(user?: UserCredentials) {
    Logger.info('CONFIG FILE', { path: path.join(Environment.remoteitDirectory, 'config.json') })
    this.file = new JSONFile<ConfigFile>(path.join(Environment.remoteitDirectory, 'config.json'))
    this.read()
    if (!this.data.user) this.signIn(user)
    EventBus.on(User.EVENTS.signedIn, this.signIn)
    EventBus.on(User.EVENTS.signedOut, this.signOut)
  }

  read() {
    this.readUser()
    this.readDevice()
    this.readTargets()
    d('read config', { config: this.data })
  }

  write(key: string, value: any) {
    let config = this.readFile()
    key = key === 'targets' ? 'services' : key
    key = key === 'user' ? 'auth' : key
    config[key] = value
    this.file.write()
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
    await CLI.exec(`add "${t.name}" ${t.port} --type ${t.type} --hostname ${t.hostname || '127.0.0.1'}`)
  }

  async removeTarget(t: ITarget) {
    await CLI.exec(`remove ${t.uid}`)
  }

  async register(device: IDevice) {
    await CLI.exec(`setup "${device.name}"`)
  }

  async delete(d: IDevice) {
    await CLI.exec(`teardown ${d.uid} --yes`)
  }

  async install() {
    await CLI.exec('tools install')
  }

  async signIn(user?: UserCredentials) {
    if (!user) return
    await CLI.exec(`signin ${user.username} -a ${user.authHash}`)
  }

  async signOut() {
    await CLI.exec('signout')
  }

  async scan(ipMask: string) {
    const result = await CLI.exec(`scan -j -m ${ipMask}`)
    return JSON.parse(result)
  }

  static exec(command: string) {
    return new Promise<string>((success, failure) => {
      d('EXEC', `${Environment.execPath} ${command}`)
      Logger.info('EXEC', { exec: `${Environment.execPath} ${command}` })

      if (Environment.isWindows) {
        execFile(Environment.execPath, command.split(' '), (error, stdout) => {
          if (error) {
            Logger.error(`*** ERROR *** EXEC ${command}: `, { error })
            d(`*** ERROR *** EXEC ${command}: `, error)
            failure(error)
          }
          d('EXEC SUCCESS', stdout)
          success(stdout)
        })
      } else {
        exec(`${Environment.execPath} ${command}`, (error, stdout) => {
          if (error) {
            Logger.error(`*** ERROR *** EXEC ${command}: `, { error })
            d(`*** ERROR *** EXEC ${command}: `, error)
            failure(error)
          }
          d('EXEC SUCCESS', stdout)
          success(stdout)
        })
      }
    })
  }
}
