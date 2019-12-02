import Environment from './Environment'
import RemoteitInstaller from './RemoteitInstaller'
import JSONFile from './JSONFile'
import defaults from './helpers/defaults'
import Logger from './Logger'
import debug from 'debug'
import path from 'path'
import User from './User'
import EventBus from './EventBus'
import { promisify } from 'util'
import { exec, execFile } from 'child_process'
import { removeDeviceName } from './helpers/nameHelper'

const execPromise = promisify(exec)
const d = debug('r3:backend:CLI')

export default class CLI {
  data: { user?: UserCredentials; device: IDevice; targets: ITarget[] } = {
    user: undefined,
    device: defaults,
    targets: [defaults],
  }

  file: JSONFile<ConfigFile>
  credentials: UserCredentials | undefined

  constructor(user?: UserCredentials) {
    Logger.info('CONFIG FILE', { path: path.join(Environment.remoteitDirectory, 'config.json') })
    this.file = new JSONFile<ConfigFile>(path.join(Environment.remoteitDirectory, 'config.json'))
    this.credentials = user
    EventBus.on(User.EVENTS.signedIn, (user: UserCredentials) => {
      this.credentials = user
      this.signIn(user)
    })
    EventBus.on(User.EVENTS.signedOut, () => this.signOut())
    this.read()
  }

  read() {
    this.readUser()
    this.readDevice()
    this.readTargets()
  }

  readUser() {
    const config = this.readFile()
    d('READ USER', config.auth)
    this.data.user = config.auth
  }

  readDevice() {
    const config = this.readFile()
    d('READ DEVICE', config.device)
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
    d('READ TARGETS', targets)
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
    await this.exec(['add', `"${t.name}"`, t.port, '--type', t.type, '--hostname', t.hostname || '127.0.0.1'])
  }

  async removeTarget(t: ITarget) {
    await this.exec(['remove', t.uid])
  }

  async register(device: IDevice) {
    await this.exec(['setup', `"${device.name}"`])
  }

  async delete(d: IDevice) {
    await this.exec(['teardown', '--yes'])
  }

  async install() {
    await this.exec(['tools', 'install'])
  }

  async signIn(user?: UserCredentials) {
    if (!user || !user.username || !user.authHash) return
    await this.exec(['signin', user.username, '-a', user.authHash], true)
  }

  async signOut() {
    await this.exec(['signout'])
  }

  async scan(ipMask: string) {
    const result = await this.exec(['scan', '-j', '-m', ipMask])
    return JSON.parse(result)
  }

  async checkSignIn() {
    this.readUser()
    d('Check sign in', this.data.user)
    if (this.signedOut) await this.signIn(this.credentials)
  }

  async exec(commands: any[], signIn?: boolean) {
    if (!signIn) await this.checkSignIn()

    const command = commands.join(' ')

    d('EXEC', `${RemoteitInstaller.binaryPath} ${command}`)
    Logger.info('EXEC', { exec: `${RemoteitInstaller.binaryPath} ${command}` })

    const { stdout, stderr } = await execPromise(`${RemoteitInstaller.binaryPath} ${command}`)

    if (stderr) {
      d(`EXEC *** ERROR *** ${command}: `, stderr.toString())
      Logger.warn(`EXEC *** ERROR *** ${command}: `, { stderr: stderr.toString() })
      return stderr.toString()
    }

    d(`EXEC SUCCESS ${command}: `, stdout.toString())
    Logger.warn(`EXEC SUCCESS ${command}: `, { stdout: stdout.toString() })
    return stdout.toString()
  }

  get signedOut() {
    const { user } = this.data
    return !user || !user.username || !user.authHash
  }
}

//   execPlatform(
//     path: string,
//     commands: string[],
//     callback: (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => void
//   ) {
//     return Environment.isWindows ? exec(path + ' ' + commands.join(' '), callback) : execFile(path, commands, callback)
//   }
