import remoteitInstaller from './remoteitInstaller'
import environment from './environment'
import Installer from './Installer'
import defaults from './helpers/defaults'
import JSONFile from './JSONFile'
import EventBus from './EventBus'
import Command from './Command'
import Logger from './Logger'
import debug from 'debug'
import path from 'path'
import user, { User } from './User'
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

  EVENTS = {
    error: 'cli/error',
  }

  // @TODO determine if we still will need to keep track of the non admin user
  //       Might need it when cli manages initiator connections

  constructor() {
    Logger.info('USER FILE', { path: path.join(environment.userPath, 'config.json') })
    Logger.info('ADMIN FILE', { path: path.join(environment.adminPath, 'config.json') })
    this.userConfigFile = new JSONFile<ConfigFile>(path.join(environment.userPath, 'config.json'))
    this.adminConfigFile = new JSONFile<ConfigFile>(path.join(environment.adminPath, 'config.json'))
    EventBus.on(User.EVENTS.signedOut, () => this.signOut())
    this.read()
  }

  check = () => {
    const admin = true
    this.read()
    if (this.isSignedOut(admin) && this.data.device.uid) {
      this.signIn(admin)
    }
  }

  read() {
    this.readUser()
    this.readUser(true)
    this.readDevice()
    this.readTargets()
  }

  readUser(admin?: boolean) {
    const config = this.readFile(admin)
    d('READ USER', config.auth)
    if (admin) {
      this.data.admin = config.auth
      environment.adminUsername = config.auth?.username || ''
    } else this.data.user = config.auth
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
    await this.exec({ cmds: [this.addString(t)], admin: true, checkSignIn: true })
    this.readTargets()
  }

  async removeTarget(t: ITarget) {
    await this.exec({ cmds: [`remove ${t.uid}`], admin: true, checkSignIn: true })
    this.readTargets()
  }

  async register(device: IDevice) {
    await this.exec({ cmds: [this.setupString(device)], admin: true, checkSignIn: true })
    this.read()
  }

  async registerAll(registration: IRegistration) {
    let cmds = [this.setupString(registration.device)]
    registration.targets.forEach((t: ITarget) => {
      cmds.push(this.addString(t))
    })
    await this.exec({ cmds, admin: true, checkSignIn: true })
    this.read()
  }

  setupString(device: IDevice) {
    return `-j --manufacture-id ${environment.manufacturerDetails.product.appCode} setup "${device.name}"`
  }

  addString(t: ITarget) {
    return `-j --manufacture-id ${environment.manufacturerDetails.product.appCode} add "${t.name}" ${t.port} --type ${
      t.type
    } --hostname ${t.hostname || '127.0.0.1'}`
  }

  async delete() {
    if (!this.data.device.uid) return
    await this.exec({ cmds: ['-j teardown --yes'], admin: true, checkSignIn: true })
    this.read()
  }

  async stopService() {
    if (this.isSignedOut(true)) return
    await this.exec({ cmds: ['service stop'], admin: true, checkSignIn: true })
  }

  async startService() {
    if (this.isSignedOut(true)) return
    await this.exec({ cmds: ['service start'], admin: true, checkSignIn: true })
  }

  async restartService() {
    await this.exec({ cmds: ['-j service uninstall', '-j service install'], admin: true })
  }

  async install() {
    await this.exec({ cmds: ['-j tools install --update'], admin: true })
  }

  async unInstall() {
    await this.exec({ cmds: ['-j uninstall --yes'], admin: true })
  }

  async signIn(admin?: boolean) {
    // if (!user.signedIn) return // can't sign in to cli if the user hasn't signed in yet - can remove because not trying to sudo install cli
    await this.exec({ cmds: [`-j signin ${user.username} -a ${user.authHash}`], admin, checkSignIn: false })
    this.read()
  }

  async signOut(admin?: boolean) {
    if (!this.isSignedOut(admin)) await this.exec({ cmds: ['signout'], checkSignIn: false, admin })
    this.read()
  }

  async scan(ipMask: string) {
    const result = await this.exec({ cmds: [`-j scan -m ${ipMask}`] })
    return JSON.parse(result)
  }

  async version() {
    const result = await this.exec({ cmds: ['version'], quiet: true })
    return result.toString().trim()
  }

  async isNotInstalled() {
    const installed = remoteitInstaller.fileExists(remoteitInstaller.binaryName)
    d('CLI INSTALLED?', { installed, name: remoteitInstaller.binaryName })
    return !installed
  }

  async exec({
    cmds,
    checkSignIn = false,
    admin = false,
    quiet = false,
  }: {
    cmds: string[]
    checkSignIn?: boolean
    admin?: boolean
    quiet?: boolean
  }) {
    if (await this.isNotInstalled()) {
      remoteitInstaller.check()
      return ''
    }

    let result
    let readUser = false
    let commands = new Command({ admin, quiet })

    if (checkSignIn && this.isSignedOut(admin)) {
      readUser = true
      cmds.unshift(`-j signin ${user.username} -a ${user.authHash}`)
    }
    cmds.forEach(cmd => commands.push(`"${remoteitInstaller.binaryPath()}" ${cmd}`))
    commands.onError = (e: Error) => EventBus.emit(this.EVENTS.error, e.toString())

    result = await commands.exec()
    if (readUser) this.readUser(admin)

    return result
  }

  isSignedOut(admin?: boolean) {
    this.readUser(admin)
    return admin ? !this.data.admin || !this.data.admin.username : !this.data.user || !this.data.user.username
  }
}
