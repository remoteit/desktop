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
import user from './User'

const d = debug('CLI')

type IData = {
  user?: UserCredentials
  admin?: UserCredentials
  device: ITargetDevice
  targets: ITarget[]
  connections: IConnection[]
}

type IExec = {
  cmds: string[]
  checkAuthHash?: boolean
  admin?: boolean
  quiet?: boolean
  onError?: ErrorCallback
}

type IConnectionStatus = {
  id?: string
  state?: 'offline' | 'connecting' | 'connected'
  isFailover?: boolean
  isP2P?: boolean
  error?: ISimpleError
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

  async checkSignIn() {
    if (this.isSignedOut()) await this.signIn()
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

  async readConnections() {
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
      restriction: c.restrict,
      autoStart: c.retry,
      failover: c.failover,
    }))
    await this.updateConnectionStatus()
  }

  private readFile() {
    return this.configFile.read() || {}
  }

  async updateConnectionStatus() {
    if (!this.data.connections.length) return
    const json = await this.status()
    if (!json?.connections?.length) return
    this.data.connections = this.data.connections.map(c => {
      const status = json?.connections?.find(s => s.id === c.id)
      if (status) {
        c.active = status.state === 'connected'
        c.connecting = status.state === 'connecting'
        c.isP2P = status.isP2P
        c.error = status.error // Can add back when CLI is more careful about creating errors
        Logger.info('UPDATE STATUS', { c, status: status.state })
      }
      return c
    })
  }

  async status() {
    const result = await this.exec({ cmds: [strings.status()], checkAuthHash: true, quiet: true })
    let data: { connections?: IConnectionStatus[] } = {}
    try {
      if (result) data = JSON.parse(result)
    } catch (error) {
      Logger.warn('CLI STATUS PARSE ERROR', { result, errorMessage: error.message })
    }
    return data
  }

  async addTarget(t: ITarget) {
    await this.exec({ cmds: [strings.add(t)], checkAuthHash: true })
    this.readTargets()
  }

  async removeTarget(t: ITarget) {
    await this.exec({ cmds: [strings.remove(t)], checkAuthHash: true })
    this.readTargets()
  }

  async register(device: ITargetDevice) {
    await this.exec({ cmds: [strings.setup(device)], checkAuthHash: true })
    this.read()
  }

  async registerAll(registration: IRegistration) {
    let cmds = [strings.setup(registration.device)]
    registration.targets.forEach((t: ITarget) => {
      cmds.push(strings.add(t))
    })
    await this.exec({ cmds, checkAuthHash: true })
    this.read()
  }

  async unregister() {
    if (!this.data.device.uid) return
    await this.exec({ cmds: [strings.unregister()], checkAuthHash: true })
    this.read()
  }

  async addConnection(c: IConnection, onError: ErrorCallback) {
    await this.exec({ cmds: [strings.connect(c)], checkAuthHash: true, onError })
    await this.readConnections()
  }

  async removeConnection(c: IConnection, onError: ErrorCallback) {
    await this.exec({ cmds: [strings.disconnect(c)], checkAuthHash: true, onError })
    await this.readConnections()
  }

  async setConnection(c: IConnection, onError: ErrorCallback) {
    await this.exec({ cmds: [strings.setConnect(c)], checkAuthHash: true, onError })
    await this.readConnections()
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
    if (!this.isSignedOut()) await this.exec({ cmds: [strings.signOut()], checkAuthHash: true })
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

  async exec({ cmds, checkAuthHash = false, admin = false, quiet = false, onError }: IExec) {
    if ((checkAuthHash && !user.signedIn) || !remoteitInstaller.isInstalled()) return ''

    let result
    let commands = new Command({ admin, quiet })

    cmds.forEach(cmd => commands.push(`"${remoteitInstaller.binaryPath()}" ${cmd}`))
    if (!quiet)
      commands.onError = (e: Error) => {
        if (typeof onError === 'function') onError(e)
        EventBus.emit(this.EVENTS.error, e.toString())
      }

    result = await commands.exec()

    return result
  }
}
