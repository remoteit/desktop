import { removeDeviceName } from './sharedCopy/nameHelper'
import { DEFAULT_TARGET } from './sharedCopy/constants'
import remoteitInstaller from './remoteitInstaller'
import environment from './environment'
import strings from './cliStrings'
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

type IExec = {
  cmds: string[]
  checkSignIn?: boolean
  admin?: boolean
  quiet?: boolean
  onError?: ErrorCallback
}

export default class CLI {
  data: IData = {
    user: undefined,
    admin: undefined,
    device: DEFAULT_TARGET,
    targets: [DEFAULT_TARGET],
    connections: [],
  }

  configFile: JSONFile<ConfigFile>

  EVENTS = {
    error: 'cli/error',
  }

  constructor() {
    this.configFile = new JSONFile<ConfigFile>(path.join(environment.adminPath, 'config.json'))
    Logger.info('ADMIN FILE', { path: this.configFile.location })
    this.read()
  }

  check = () => {
    this.read()
    if (this.isSignedOut() && (this.data.device.uid || this.data.connections.length)) {
      this.signIn()
    }
  }

  isSignedOut() {
    this.readUser()
    return !this.data.admin || !this.data.admin.username
  }

  read() {
    this.readUser()
    this.readDevice()
    this.readTargets()
    this.readConnections()
  }

  readUser() {
    const config = this.readFile()
    d('READ USER', config.auth)
    this.data.admin = config.auth
    environment.adminUsername = config.auth?.username || ''
  }

  readDevice() {
    const config = this.readFile()
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
    const config = this.readFile()
    const targets = config.services || []
    d('READ TARGETS', targets)
    this.data.targets = targets.map(service => ({
      ...service,
      hostname: service.hostname || '',
      name: removeDeviceName(deviceName, service.name) || '',
    }))
  }

  readConnections() {
    const config = this.readFile()
    const connections = config.connections || []
    this.data.connections = connections.map((c: any) => ({
      id: c.uid,
      name: c.name,
      port: c.port,
      host: c.hostname,
      createdTime: Math.round(c.createdtimestamp / 1000000),
      startTime: Math.round((c.startedtimestamp || c.createdtimestamp) / 1000000),
      endTime: Math.round(c.stoppedtimestamp / 1000000),
      connecting: false,
      restriction: c.restrict,
      autoStart: c.retry,
      failover: c.failover,
      active: !c.disabled,
    }))
  }

  private readFile() {
    return this.configFile.read() || {}
  }

  async addTarget(t: ITarget) {
    await this.exec({ cmds: [strings.add(t)], checkSignIn: true })
    this.readTargets()
  }

  async removeTarget(t: ITarget) {
    await this.exec({ cmds: [strings.remove(t)], checkSignIn: true })
    this.readTargets()
  }

  async register(device: ITargetDevice) {
    await this.exec({ cmds: [strings.setup(device)], checkSignIn: true })
    this.read()
  }

  async registerAll(registration: IRegistration) {
    let cmds = [strings.setup(registration.device)]
    registration.targets.forEach((t: ITarget) => {
      cmds.push(strings.add(t))
    })
    await this.exec({ cmds, checkSignIn: true })
    this.read()
  }

  async unregister() {
    if (!this.data.device.uid) return
    await this.exec({ cmds: [strings.unregister()], checkSignIn: true })
    this.read()
  }

  async addConnection(c: IConnection, onError: ErrorCallback) {
    await this.exec({ cmds: [strings.connect(c)], checkSignIn: true, onError })
    this.readConnections()
  }

  async removeConnection(c: IConnection, onError: ErrorCallback) {
    await this.exec({ cmds: [strings.disconnect(c)], checkSignIn: true, onError })
    this.readConnections()
  }

  async setConnection(c: IConnection, onError: ErrorCallback) {
    await this.exec({ cmds: [strings.setConnect(c)], checkSignIn: true, onError })
    this.readConnections()
  }

  async restartService() {
    await this.exec({ cmds: [strings.serviceUninstall(), strings.serviceInstall()], admin: true })
  }

  async toolsInstall() {
    await this.exec({ cmds: [strings.toolsInstall()], admin: true })
  }

  async unInstall() {
    await this.exec({ cmds: [strings.uninstall()], admin: true })
    this.read()
  }

  async signIn() {
    await this.exec({ cmds: [strings.signIn()], admin: true })
    this.read()
  }

  async signOut() {
    if (!this.isSignedOut()) await this.exec({ cmds: [strings.signOut()], admin: true })
    this.read()
  }

  async scan(ipMask?: string) {
    const result = await this.exec({ cmds: [strings.scan(ipMask)] })
    return JSON.parse(result)
  }

  async version() {
    const result = await this.exec({ cmds: [strings.version()], quiet: true })
    return result.toString().trim()
  }

  async isNotInstalled() {
    const installed = remoteitInstaller.fileExists(remoteitInstaller.binaryName)
    return !installed
  }

  async exec({ cmds, checkSignIn = false, admin = false, quiet = false, onError }: IExec) {
    if (await this.isNotInstalled()) {
      remoteitInstaller.check()
      return ''
    }

    let result
    let readUser = false
    let commands = new Command({ admin, quiet })

    if (checkSignIn && this.isSignedOut()) {
      readUser = true
      commands.admin = true
      cmds.unshift(strings.signIn())
    }

    cmds.forEach(cmd => commands.push(`"${remoteitInstaller.binaryPath()}" ${cmd}`))
    if (!quiet)
      commands.onError = (e: Error) => {
        if (typeof onError === 'function') onError(e)
        EventBus.emit(this.EVENTS.error, e.toString())
      }

    result = await commands.exec()
    if (readUser) this.readUser()

    return result
  }
}
