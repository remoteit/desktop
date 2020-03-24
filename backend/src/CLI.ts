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

  static EVENTS = {
    error: 'cli/error',
  }

  // @TODO determine if we still will need to keep track of the non admin user
  //       Might need it when cli manages initiator connections

  constructor() {
    Logger.info('USER FILE', { path: path.join(environment.userPath, 'config.json') })
    Logger.info('ADMIN FILE', { path: path.join(environment.adminPath, 'config.json') })
    this.userConfigFile = new JSONFile<ConfigFile>(path.join(environment.userPath, 'config.json'))
    this.adminConfigFile = new JSONFile<ConfigFile>(path.join(environment.adminPath, 'config.json'))
    EventBus.on(user.EVENTS.signedOut, () => this.signOut())
    EventBus.on(user.EVENTS.signedIn, () => this.read())
    this.read()
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
      checkSignIn: true,
    })
    this.readTargets()
  }

  async removeTarget(t: ITarget) {
    await this.exec({ params: ['remove', t.uid], admin: true, checkSignIn: true })
    this.readTargets()
  }

  async stopService() {
    if (this.isSignedOut(true)) return
    await this.exec({ params: ['service', 'stop'], admin: true, checkSignIn: true })
  }

  async startService() {
    if (this.isSignedOut(true)) return
    await this.exec({ params: ['service', 'start'], admin: true, checkSignIn: true })
  }

  async register(device: IDevice) {
    await this.exec({ params: ['setup', `"${device.name}"`, '-j'], admin: true, checkSignIn: true })
    this.read()
  }

  async delete() {
    if (!this.data.device.uid) return
    await this.exec({ params: ['teardown', '--yes', '-j'], admin: true, checkSignIn: true })
    this.read()
  }

  async install() {
    await this.exec({ params: ['tools', 'install', '--update', '-j'], admin: true })
  }

  async unInstall() {
    await this.exec({ params: ['uninstall', '--yes', '-j'], admin: true })
  }

  async signIn(admin?: boolean) {
    // if (!user.signedIn) return // can't sign in to cli if the user hasn't signed in yet - can remove because not trying to sudo install cli
    await this.exec({ params: ['signin', user.username, '-a', user.authHash, '-j'], admin, checkSignIn: false })
    this.read()
  }

  async signOut() {
    // *This will not sign out the admin user
    if (!this.isSignedOut()) await this.exec({ params: ['signout'], checkSignIn: false })
    this.read()
  }

  async scan(ipMask: string) {
    const result = await this.exec({ params: ['scan', '-j', '-m', ipMask] })
    return JSON.parse(result)
  }

  async version() {
    const result = await this.exec({ params: ['version'], quiet: true })
    return result.toString().trim()
  }

  async isNotInstalled() {
    const installed = remoteitInstaller.fileExists(remoteitInstaller.binaryName)
    d('CLI INSTALLED?', { installed, name: remoteitInstaller.binaryName })
    return !installed
  }

  async exec({
    params,
    checkSignIn = false,
    admin = false,
    quiet = false,
  }: {
    params: any[]
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
      commands.push(`"${remoteitInstaller.binaryPath()}" signin ${user.username} -a ${user.authHash} -j`)
    }
    commands.push(`"${remoteitInstaller.binaryPath()}" ${params.join(' ')}`)
    commands.onError = (e: Error) => EventBus.emit(CLI.EVENTS.error, e.toString())

    result = await commands.exec()
    if (readUser) this.readUser(admin)

    return result
  }

  isSignedOut(admin?: boolean) {
    this.readUser(admin)
    return admin ? !this.data.admin || !this.data.admin.username : !this.data.user || !this.data.user.username
  }
}
