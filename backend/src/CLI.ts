import Environment from './Environment'
import RemoteitInstaller from './RemoteitInstaller'
import JSONFile from './JSONFile'
import defaults from './helpers/defaults'
import Logger from './Logger'
import debug from 'debug'
import path from 'path'
import user from './User'
import EventBus from './EventBus'
import * as sudo from 'sudo-prompt'
import { promisify } from 'util'
import { exec, execFile } from 'child_process'
import { removeDeviceName } from './helpers/nameHelper'

const adminPromise = promisify(sudo.exec)
const execPromise = promisify(exec)
const d = debug('r3:backend:CLI')

export default class CLI {
  data: { user?: UserCredentials; device: IDevice; targets: ITarget[] } = {
    user: undefined,
    device: defaults,
    targets: [defaults],
  }

  userConfigFile: JSONFile<ConfigFile>
  adminConfigFile: JSONFile<ConfigFile>

  constructor() {
    Logger.info('USER FILE', { path: path.join(Environment.userPath, 'config.json') })
    Logger.info('ADMIN FILE', { path: path.join(Environment.adminPath, 'config.json') })
    this.userConfigFile = new JSONFile<ConfigFile>(path.join(Environment.userPath, 'config.json'))
    this.adminConfigFile = new JSONFile<ConfigFile>(path.join(Environment.adminPath, 'config.json'))
    EventBus.on(user.EVENTS.signedOut, () => this.signOut())
    this.read()
  }

  read() {
    this.readUser()
    this.readDevice()
    this.readTargets()
  }

  readUser(admin?: boolean) {
    const config = this.readFile(admin)
    d('READ USER', config.auth)
    this.data.user = config.auth
  }

  readDevice() {
    const config = this.readFile(true)
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
    const config = this.readFile(true)
    const targets = config.services || []
    d('READ TARGETS', targets)
    this.data.targets = targets.map(service => ({
      ...service,
      hostname: service.hostname || '',
      name: removeDeviceName(deviceName, service.name) || '',
    }))
  }

  private readFile(admin?: boolean) {
    return (admin ? this.adminConfigFile.read() : this.userConfigFile.read()) || {}
  }

  async addTarget(t: ITarget) {
    await this.exec({
      commands: ['add', `"${t.name}"`, t.port, '--type', t.type, '--hostname', t.hostname || '127.0.0.1'],
      admin: true,
    })
  }

  async removeTarget(t: ITarget) {
    await this.exec({ commands: ['remove', t.uid], admin: true })
  }

  async register(device: IDevice) {
    await this.exec({ commands: ['setup', `"${device.name}"`], admin: true })
  }

  async delete(d: IDevice) {
    await this.exec({ commands: ['teardown', '--yes'], admin: true })
  }

  async install() {
    await this.exec({ commands: ['tools', 'install'], admin: true })
  }

  async signIn(admin?: boolean) {
    if (!user.signedIn) return
    await this.exec({ commands: ['signin', user.username, '-a', user.authHash], admin, checkSignIn: false })
  }

  async signOut() {
    await this.exec({ commands: ['signout'], checkSignIn: false })
  }

  async scan(ipMask: string) {
    const result = await this.exec({ commands: ['scan', '-j', '-m', ipMask] })
    return JSON.parse(result)
  }

  async checkSignIn(admin?: boolean) {
    this.readUser(admin)
    d('Check sign in', this.data.user)
    Logger.info('CHECK SIGN IN', { user: this.data.user, admin })
    if (this.signedOut) await this.signIn(admin)
  }

  async exec({ commands, admin, checkSignIn = true }: { commands: any[]; admin?: boolean; checkSignIn?: boolean }) {
    if (checkSignIn) await this.checkSignIn(admin)

    const command = commands.join(' ')
    let result = ''

    d('EXEC', `${RemoteitInstaller.binaryPath} ${command}`)
    Logger.info('EXEC', { exec: `${RemoteitInstaller.binaryPath} ${command}`, admin, checkSignIn })

    try {
      const { stdout, stderr } = admin
        ? await adminPromise(`"${RemoteitInstaller.binaryPath}" ${command}`, { name: 'remoteit' })
        : await execPromise(`"${RemoteitInstaller.binaryPath}" ${command}`)

      if (stderr) {
        d(`EXEC *** ERROR *** ${command}: `, stderr.toString())
        Logger.warn(`EXEC *** ERROR *** ${command}: `, { stderr: stderr.toString() })
        result = stderr.toString()
      }

      if (stdout) {
        d(`EXEC SUCCESS ${command}: `, stdout.toString())
        Logger.info(`EXEC SUCCESS ${command}: `, { stdout: stdout.toString() })
        result = stdout.toString()
      }
    } catch (error) {
      Logger.warn(`EXEC ERROR CAUGHT ${command}: `, { error, errorMessage: error.message })
    }

    Logger.info(`EXEC COMPLETE ${command}: `, { result })
    return result
  }

  get signedOut() {
    return !this.data.user || !this.data.user.username || !this.data.user.authHash
  }
}
