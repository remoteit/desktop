import { removeDeviceName, safeFilename } from './sharedCopy/nameHelper'
import { DEFAULT_TARGET } from './sharedCopy/constants'
import remoteitInstaller from './remoteitInstaller'
import environment from './environment'
import JSONFile from './JSONFile'
import EventBus from './EventBus'
import Command from './Command'
import Logger from './Logger'
import debug from 'debug'
import path from 'path'
import user, { User } from './User'

const d = debug('r3:backend:CLI')

type IData = {
  user?: UserCredentials
  admin?: UserCredentials
  device: ITargetDevice
  targets: ITarget[]
  connections: IConnection[]
}

export default class CLI {
  data: IData = {
    user: undefined,
    admin: undefined,
    device: DEFAULT_TARGET,
    targets: [DEFAULT_TARGET],
    connections: [],
  }

  userConfigFile: JSONFile<ConfigFile>
  adminConfigFile: JSONFile<ConfigFile>

  EVENTS = {
    error: 'cli/error',
  }

  // @TODO determine if we still will need to keep track of the non admin user
  //       Might need it when cli manages initiator connections

  constructor() {
    // const filename = `${safeFilename(user.username)}-config.json`
    const filename = 'config.json'
    this.userConfigFile = new JSONFile<ConfigFile>(path.join(environment.userPath, filename))
    this.adminConfigFile = new JSONFile<ConfigFile>(path.join(environment.adminPath, filename))
    Logger.info('USER FILE', { path: this.userConfigFile.location })
    Logger.info('ADMIN FILE', { path: this.adminConfigFile.location })
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
    this.readConnections()
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
    const device = config.device || DEFAULT_TARGET
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

  readConnections() {
    const config = this.readFile(true)
    const connections = config.connections || []
    this.data.connections = connections.map((c: any) => ({
      id: c.uid,
      name: c.name,
      port: c.port,
      host: c.hostname,
      createdTime: c.createdtimestamp,
      startTime: c.startedTimestamp || (!c.disabled && Date.now()),
      restriction: c.restrict,
      autoStart: c.retry,
      failover: c.failover,
      active: !c.disabled,
      // owner:
      // online:
      // deviceID:
      // typeID:
      // endTime:
      // connecting:
    }))
    Logger.info('CLI CONNECTIONS', { connections: this.data.connections })
  }

  private readFile(admin?: boolean) {
    return (admin ? this.adminConfigFile.read() : this.userConfigFile.read()) || {}
  }

  async addTarget(t: ITarget) {
    await this.exec({ cmds: [this.addCommand(t)], admin: true, checkSignIn: true })
    this.readTargets()
  }

  async removeTarget(t: ITarget) {
    await this.exec({ cmds: [`remove --id ${t.uid}`], admin: true, checkSignIn: true })
    this.readTargets()
  }

  async register(device: ITargetDevice) {
    await this.exec({ cmds: [this.setupCommand(device)], admin: true, checkSignIn: true })
    this.read()
  }

  async registerAll(registration: IRegistration) {
    let cmds = [this.setupCommand(registration.device)]
    registration.targets.forEach((t: ITarget) => {
      cmds.push(this.addCommand(t))
    })
    await this.exec({ cmds, admin: true, checkSignIn: true })
    this.read()
  }

  signinCommand() {
    return `-j signin --user ${user.username} --authhash ${user.authHash}`
  }

  setupCommand(device: ITargetDevice) {
    return `-j --manufacture-id ${environment.manufacturerDetails.product.appCode} setup --name "${device.name}"`
  }

  addCommand(t: ITarget) {
    return `-j --manufacture-id ${environment.manufacturerDetails.product.appCode} add --name "${t.name}" --port ${
      t.port
    } --type ${t.type} --hostname ${t.hostname || '127.0.0.1'}`
  }

  async addConnection(c: IConnection) {
    // --failover ${c.failover}
    await this.exec({
      cmds: [
        `-j connection add --id ${c.id} --name "${c.name}" --port ${c.port} --hostname ${c.host} --restrict ${c.restriction} --retry ${c.autoStart} --authhash ${user.authHash}`,
      ],
      admin: true,
      checkSignIn: true,
    })
  }

  async removeConnection(c: IConnection) {
    await this.exec({ cmds: [`-j connection remove --id ${c.id}`], admin: true, checkSignIn: true })
  }

  async delete() {
    if (!this.data.device.uid) return
    await this.exec({ cmds: ['-j teardown --yes'], admin: true, checkSignIn: true })
    this.read()
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
    await this.exec({ cmds: [this.signinCommand()], admin, checkSignIn: false })
    this.read()
  }

  async signOut(admin?: boolean) {
    if (!this.isSignedOut(admin)) await this.exec({ cmds: ['-j signout'], checkSignIn: false, admin })
    this.read()
  }

  async scan(ipMask?: string) {
    const result = await this.exec({ cmds: ipMask ? [`-j scan -m ${ipMask}`] : ['-j scan'] })
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
    let config = admin ? ` --config "${this.adminConfigFile.location}"` : ''

    if (checkSignIn && this.isSignedOut(admin)) {
      readUser = true
      cmds.unshift(this.signinCommand())
    }

    cmds.forEach(cmd => commands.push(`"${remoteitInstaller.binaryPath()}" ${cmd}${config}`))
    if (!quiet) commands.onError = (e: Error) => EventBus.emit(this.EVENTS.error, e.toString())

    result = await commands.exec()
    if (readUser) this.readUser(admin)

    return result
  }

  isSignedOut(admin?: boolean) {
    this.readUser(admin)
    return admin ? !this.data.admin || !this.data.admin.username : !this.data.user || !this.data.user.username
  }
}
