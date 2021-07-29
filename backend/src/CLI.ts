import { REACHABLE_ERROR_CODE } from './constants'
import { DEFAULT_TARGET } from './sharedCopy/constants'
import { cliBinary } from './Binary'
import binaryInstaller from './binaryInstaller'
import environment from './environment'
import preferences from './preferences'
import JSONFile from './JSONFile'
import EventBus from './EventBus'
import strings from './cliStrings'
import Command from './Command'
import Logger from './Logger'
import debug from 'debug'
import path from 'path'
import user from './User'

const d = debug('cli')

type IData = {
  user?: UserCredentials
  admin?: UserCredentials
  device: ITargetDevice
  targets: ITarget[]
  connections: IConnection[]
  connectionDefaults: IConnectionDefaults
  errorCodes: number[]
}

type IExec = {
  cmds: string[]
  checkAuthHash?: boolean
  skipSignInCheck?: boolean
  admin?: boolean
  quiet?: boolean
  force?: boolean
  onError?: ErrorCallback
}

type IConnectionStatus = {
  id: string
  isDisabled?: boolean
  state?: 'offline' | 'connecting' | 'connected' | 'disconnecting'
  isP2P?: boolean
  error?: ISimpleError
  reachable: boolean
  sessionID?: string
  createdAt: string
  startedAt?: string
  stoppedAt?: string
  address?: string
  namedPort?: number
  namedHost?: string
  restrict?: ipAddress
  timeout?: number
}

type IConnectionDefaults = {
  enableCertificate?: boolean
  enableOneHTTPSListener?: boolean
  enableOneHTTPListener?: boolean
  oneHTTPSListenerPort?: number
  oneHTTPListenerPort?: number
}

export default class CLI {
  data: IData = {
    user: undefined,
    admin: undefined,
    device: DEFAULT_TARGET,
    targets: [DEFAULT_TARGET],
    connections: [],
    connectionDefaults: {},
    errorCodes: [],
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

  async checkDefaults() {
    if (!this.areDefaultsSet()) await this.setDefaults()
  }

  isSignedOut() {
    this.readUser()
    return !this.data.admin || !this.data.admin.username
  }

  areDefaultsSet() {
    this.readConnectionDefaults()
    const defaults = this.data.connectionDefaults
    if (defaults?.enableOneHTTPSListener || defaults?.enableOneHTTPListener) return false
    const useCert: boolean = !!defaults?.enableCertificate
    const result = !!preferences.get().useCertificate === useCert
    d('ARE CLI DEFAULTS SET?', { result, defaults })
    return result
  }

  read() {
    this.readUser()
    this.readDevice()
    this.readTargets()
    this.readConnections()
    this.readConnectionDefaults()
    this.readOverrides()
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

  private readFile() {
    return this.configFile.read() || {}
  }

  readOverrides() {
    const config = this.readFile()
    d('READ overrides', config.overrides)
    environment.overrides = config?.overrides || {}
  }

  readConnectionDefaults() {
    const config = this.readFile()
    this.data.connectionDefaults = config.connectionDefaults
  }

  async readConnections() {
    const connections = (await this.connectionStatus()) || []
    this.data.connections = connections.map((c, i) => {
      const connection = this.data.connections[i] || {}
      let error = connection?.error

      if (c.reachable === false) {
        error = {
          message: 'remote.it connected, but there is no service running on the remote machine.',
          code: REACHABLE_ERROR_CODE,
        }
      } else if (c.reachable === true) {
        if (error && error.code === REACHABLE_ERROR_CODE) error = { code: 0, message: '' }
      }

      if (c.error?.message) {
        error = { message: c.error.message, code: c.error.code }
      }

      d('CONNECTION STATE', c.id, c.state)

      return {
        ...connection,
        id: c.id,
        host: c.namedHost,
        port: c.namedPort,
        enabled: !c.isDisabled,
        createdTime: Date.parse(c.createdAt),
        startTime: c.startedAt ? Date.parse(c.startedAt) : undefined,
        endTime: c.stoppedAt ? Date.parse(c.stoppedAt) : undefined,
        connected: c.state === 'connected',
        connecting: c.state === 'connecting',
        disconnecting: c.state === 'disconnecting',
        isP2P: c.isP2P,
        reachable: c.reachable,
        sessionId: c.sessionID?.toLowerCase(),
        restriction: c.restrict,
        timeout: c.timeout,
        error,
      }
    })
  }

  async connectionStatus() {
    const data = await this.exec({
      cmds: [strings.status()],
      checkAuthHash: true,
      skipSignInCheck: true,
      quiet: true,
    })
    return data?.connections as IConnectionStatus[]
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
    d('ADD CONNECTION', strings.connect(c))
    await this.exec({ cmds: [strings.connect(c)], checkAuthHash: true, onError })
    await this.readConnections()
  }

  async removeConnection(c: IConnection, onError: ErrorCallback) {
    d('REMOVE CONNECTION', strings.disconnect(c))
    await this.exec({ cmds: [strings.disconnect(c)], checkAuthHash: true, onError })
    await this.readConnections()
  }

  async stopConnection(c: IConnection, onError: ErrorCallback) {
    d('STOP CONNECTION', strings.stop(c))
    await this.exec({ cmds: [strings.stop(c)], checkAuthHash: true, onError })
    await this.readConnections()
  }

  async setConnection(c: IConnection, onError: ErrorCallback) {
    d('SET CONNECTION', strings.setConnect(c))
    await this.exec({ cmds: [strings.setConnect(c)], checkAuthHash: true, onError })
    await this.readConnections()
  }

  async restore(deviceId: string) {
    await this.exec({ cmds: [strings.restore(deviceId)], admin: true })
    await this.read()
  }

  async reset() {
    await this.exec({ cmds: [strings.reset()], admin: true })
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

  async setDefaults() {
    Logger.info('SET CLI DEFAULTS', strings.defaults())
    await this.exec({ cmds: [strings.defaults()], checkAuthHash: true, skipSignInCheck: true })
    binaryInstaller.restart()
    this.read()
  }

  async scan(ipMask?: string) {
    return await this.exec({ cmds: [strings.scan(ipMask)], skipSignInCheck: true })
  }

  async agentRunning(force?: boolean) {
    let running = false

    const data = await this.exec({
      cmds: [strings.agentStatus()],
      checkAuthHash: true,
      skipSignInCheck: true,
      quiet: true,
      force,
    })

    if (data) running = data.running
    Logger.info('CLI AGENT STATUS', { running })
    return running
  }

  async version(force?: boolean) {
    const result = await this.exec({ cmds: [strings.version()], skipSignInCheck: true, quiet: true, force })
    return result.version
  }

  async exec({
    cmds,
    checkAuthHash = false,
    skipSignInCheck = false,
    admin = false,
    quiet = false,
    force,
    onError,
  }: IExec) {
    if (!force && (binaryInstaller?.inProgress || !binaryInstaller.ready)) return ''
    if (!skipSignInCheck && !binaryInstaller.uninstallInitiated) await this.checkSignIn()
    if (checkAuthHash && !user.signedIn) return ''

    let commands = new Command({ admin, quiet })
    cmds.forEach(cmd => commands.push(`"${cliBinary.path}" ${cmd}`))
    d('COMMAND', commands.toString())

    if (!quiet)
      commands.onError = (e: Error) => {
        if (typeof onError === 'function') onError(e)
        // @TODO detect signing or service not started error and don't display,
        // just run check and sign in commands.
        EventBus.emit(this.EVENTS.error, e.toString())
        binaryInstaller.check()
      }

    const result = await commands.exec()

    if (result) {
      try {
        const parsed = JSON.parse(result)
        if (parsed.code === 0) parsed.message && Logger.info('CLI EXEC MESSAGE', parsed.message)
        else throw new Error(parsed)
        return parsed.data
      } catch (error) {
        Logger.warn('CLI PARSE ERROR', { result, errorMessage: error.message.toString() })
      }
    }
  }
}
