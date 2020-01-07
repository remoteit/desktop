import RemoteitInstaller from './RemoteitInstaller'
import Environment from './Environment'
import Installer from './Installer'
import defaults from './helpers/defaults'
import JSONFile from './JSONFile'
import EventBus from './EventBus'
import Command from './Command'
import Logger from './Logger'
import debug from 'debug'
import path from 'path'
import user from './User'
import { removeDeviceName } from './helpers/nameHelper'

const d = debug('r3:backend:CLI')

type IData = { user?: UserCredentials; admin?: UserCredentials; device: IDevice; targets: ITarget[] }

export default class CLI {
  data: IData = {
    user: undefined,
    admin: undefined,
    device: defaults,
    targets: [defaults],
  }

  userConfigFile: JSONFile<ConfigFile>
  adminConfigFile: JSONFile<ConfigFile>

  // @TODO determine if we still will need to keep track of the non admin user
  //       Might need it when cli manages initiator connections

  constructor() {
    Logger.info('USER FILE', { path: path.join(Environment.userPath, 'config.json') })
    Logger.info('ADMIN FILE', { path: path.join(Environment.adminPath, 'config.json') })
    this.userConfigFile = new JSONFile<ConfigFile>(path.join(Environment.userPath, 'config.json'))
    this.adminConfigFile = new JSONFile<ConfigFile>(path.join(Environment.adminPath, 'config.json'))
    EventBus.on(user.EVENTS.signedOut, () => this.signOut())
    EventBus.on(user.EVENTS.signedIn, () => this.read())
    EventBus.on(Installer.EVENTS.afterInstall, binary => binary.name === 'remoteit' && this.install())
    this.read()
    this.readUser(true)
  }

  read() {
    this.readUser()
    this.readDevice()
    this.readTargets()
  }

  readUser(admin?: boolean) {
    const config = this.readFile(admin)
    d('READ USER', config.auth)
    if (admin) this.data.admin = config.auth
    else this.data.user = config.auth
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
      params: ['add', `"${t.name}"`, t.port, '--type', t.type, '--hostname', t.hostname || '127.0.0.1'],
      admin: true,
    })
  }

  async removeTarget(t: ITarget) {
    await this.exec({ params: ['remove', t.uid], admin: true })
  }

  async register(device: IDevice) {
    await this.exec({ params: ['setup', `"${device.name}"`], admin: true })
  }

  async delete(d: IDevice) {
    await this.exec({ params: ['teardown', '--yes'], admin: true })
  }

  async install() {
    await this.exec({ params: ['tools', 'install'], admin: true, checkSignIn: false })
  }

  async unInstall() {
    await this.exec({ params: ['uninstall'], admin: true, checkSignIn: false })
  }

  async signIn(admin?: boolean) {
    if (!user.signedIn) return
    await this.exec({ params: ['signin', user.username, '-a', user.authHash], admin, checkSignIn: false })
  }

  async signOut() {
    await this.exec({ params: ['signout'], checkSignIn: false })
  }

  async scan(ipMask: string) {
    const result = await this.exec({ params: ['scan', '-j', '-m', ipMask] })
    return JSON.parse(result)
  }

  async version() {
    const result = await this.exec({ params: ['version', '-j'] })
    return result.toString().trim()
  }

  async checkSignIn(admin?: boolean) {
    this.readUser(admin)
    d('Check sign in', this.data.user)
    Logger.info('CHECK SIGN IN', { username: this.data.user && this.data.user.username, admin })
    if (this.isSignedOut(admin)) await this.signIn(admin)
  }

  async exec({ params, admin, checkSignIn = true }: { params: any[]; admin?: boolean; checkSignIn?: boolean }) {
    if (checkSignIn) await this.checkSignIn(admin)
    return await new Command({ command: `${RemoteitInstaller.binaryPath} ${params.join(' ')}`, admin }).exec()
  }

  isSignedOut(admin?: boolean) {
    return admin ? !this.data.admin || !this.data.admin.username : !this.data.user || !this.data.user.username
  }
}
