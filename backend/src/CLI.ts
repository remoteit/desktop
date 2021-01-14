import { DEFAULT_TARGET } from './sharedCopy/constants'
import { cliBinary } from './Binary'
import binaryInstaller from './binaryInstaller'
import environment from './environment'
import strings from './cliStrings'
import JSONFile from './JSONFile'
import EventBus from './EventBus'
import Command from './Command'
import Logger from './Logger'
import debug from 'debug'
import path from 'path'
import user from './User'
import { REACHABLE_ERROR_CODE } from './constants'

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
  skipSignInCheck?: boolean
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
  reachable: boolean
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
    }
  }

  readTargets() {
    const config = this.readFile()
    const targets = config.services || []
    d('READ TARGETS', targets)
    this.data.targets = targets.map(service => ({
      ...service,
      hostname: service.hostname || '',
    }))
  }

  async readConnections() {
    const config = this.readFile()
    const connections = config.connections || []
    this.data.connections = connections.map((c: any) => ({
      id: c.uid,
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
        c.isP2P = status.state === 'connected' ? status.isP2P : undefined
        c.reachable = status.reachable

        if (status.reachable === false) {
          c.error = { message: "This connection didn't detect a running service", code: REACHABLE_ERROR_CODE }
        } else if (status.reachable === true) {
          if (c.error && c.error.code === REACHABLE_ERROR_CODE) c.error = { code: 0, message: '' }
        }

        if (status.error?.message) {
          c.error = { message: status.error.message, code: status.error.code }
        }

        d('UPDATE STATUS', { c, status: status.state })
      }
      return c
    })
  }

  async agentRunning() {
    const result = await this.exec({
      cmds: [strings.agentStatus()],
      checkAuthHash: true,
      skipSignInCheck: true,
      quiet: true,
    })
    let running = false,
      data: { status: 0 | 1 }
    try {
      if (result) {
        data = JSON.parse(result)
        running = data.status === 0
      }
    } catch (error) {
      Logger.warn('CLI AGENT STATUS PARSE ERROR', { result, errorMessage: error.message })
    }
    Logger.info('CLI AGENT STATUS', { running })
    return running
  }

  async status() {
    const result = await this.exec({
      cmds: [strings.status()],
      checkAuthHash: true,
      skipSignInCheck: true,
      quiet: true,
    })
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

  async setDevice(d: ITargetDevice) {
    await this.exec({ cmds: [strings.setDevice(d)], checkAuthHash: true })
    this.readDevice()
  }

  async setTarget(d: ITarget) {
    await this.exec({ cmds: [strings.setTarget(d)], checkAuthHash: true })
    this.readTargets()
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

  async restore(deviceId: string) {
    await this.exec({ cmds: [strings.restore(deviceId)], admin: true })
    await this.read()
  }

  async reset() {
    await this.exec({ cmds: [strings.reset()], checkAuthHash: true })
  }

  async serviceUninstall() {
    await this.exec({ cmds: [strings.serviceUninstall()], admin: true })
  }

  async signIn() {
    await this.exec({ cmds: [strings.signIn()], checkAuthHash: true, skipSignInCheck: true })
    this.read()
  }

  async signOut() {
    if (!this.isSignedOut()) await this.exec({ cmds: [strings.signOut()], skipSignInCheck: true, checkAuthHash: true })
    this.read()
  }

  async scan(ipMask?: string) {
    const result = await this.exec({ cmds: [strings.scan(ipMask)], skipSignInCheck: true })
    return JSON.parse(result)
  }

  async version() {
    const result = await this.exec({ cmds: [strings.version()], skipSignInCheck: true, quiet: true })
    return result.toString().trim()
  }

  async exec({ cmds, checkAuthHash = false, skipSignInCheck = false, admin = false, quiet = false, onError }: IExec) {
    if (!skipSignInCheck && !binaryInstaller.uninstallInitiated) await this.checkSignIn()
    if (checkAuthHash && !user.signedIn) return ''

    let commands = new Command({ admin, quiet })
    cmds.forEach(cmd => commands.push(`"${cliBinary.path}" ${cmd}`))

    if (!quiet)
      commands.onError = (e: Error) => {
        if (typeof onError === 'function') onError(e)
        // @TODO detect signing or service not started error and don't display,
        // just run check and sign in commands.
        EventBus.emit(this.EVENTS.error, e.toString())
        binaryInstaller.check()
      }

    return await commands.exec()
  }
}
