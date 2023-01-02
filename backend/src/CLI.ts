import { CLI_REACHABLE_ERROR_CODE } from './sharedCopy/constants'
import { cliBinary } from './Binary'
import { toUnicode } from 'punycode'
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
  configVersion?: number
  user?: UserCredentials
  admin?: UserCredentials
  device: CLIDeviceProps
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
  onCommand?: (command: string) => void
  onError?: (error: Error) => void
}

type IConnectionStatus = {
  id: string
  isEnabled?: boolean
  state?: number
  /* 0 - offline
	   1 - starting
	   2 - ready
	   3 - connecting
	   4 - connected
	   5 - disconnecting
	   6 - disconnected
	   7 - stopping  */
  isP2P?: boolean
  error?: ISimpleError
  isReachable: boolean
  sessionID?: string
  createdAt: string
  startedAt?: string
  stoppedAt?: string
  serviceType?: number
  addressPort?: number
  addressHost?: string
  restrict?: ipAddress
  timeout?: number
  checkpointCanBindToPortLocally?: boolean
  checkpointConnectdCanAuth?: boolean
  checkpointConnectdCanConnectToChatServers?: boolean
  checkpointConnectdCanPortBind?: boolean
  checkpointConnectdCanStart?: boolean
  checkpointConnectdTunnelCreated?: boolean
  checkpointHostnameCanFetch?: boolean
  checkpointHostnameCanResolve?: boolean
  checkpointProxyCanCreate?: boolean
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
    configVersion: undefined,
    user: undefined,
    admin: undefined,
    device: undefined,
    connectionDefaults: {},
    errorCodes: [],
  }

  configFile: JSONFile<ConfigFile>

  EVENTS = {
    error: 'cli/error',
    command: 'cli/command',
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
    this.readSettings()
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
    this.readSettings()
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
    const device = config.device || {}
    this.data.device = {
      ...device,
      hostname: device.hostname || '',
    }
  }

  readSettings() {
    const config = this.readFile()
    d('READ overrides', config.overrides)
    environment.overrides = config?.overrides || {}

    this.data.connectionDefaults = config.connectionDefaults
    this.data.configVersion = config.version
  }

  private readFile() {
    return this.configFile.read() || {}
  }

  async readConnections() {
    const connections = await this.connectionStatus()
    return connections.map(c => {
      let error: ISimpleError | undefined

      if (c.isReachable === false) {
        error = {
          message: 'Remote.It connected, but there is no service running on the remote machine.',
          code: CLI_REACHABLE_ERROR_CODE,
        }
      } else if (c.isReachable === true) {
        if (error && error?.code === CLI_REACHABLE_ERROR_CODE) error = { code: 0, message: '' }
      }

      if (c.error?.message) {
        error = { message: c.error.message, code: c.error.code }
      }

      d('CONNECTION STATE', c.id, c.state)
      // if (c.id === '80:00:00:00:01:26:69:30') Logger.info('CONNECTION STATUS', c)

      let result: IConnection = {
        id: c.id,
        host: toUnicode(c.addressHost || ''),
        enabled: !!c.isEnabled,
        starting: c.state === 1, //      starting
        connecting: c.state === 3, //    connecting
        connected: c.state === 4, //     connected
        disconnecting: c.state === 5, // disconnecting
        stopping: c.state === 7, //      stopping
        typeID: c.serviceType,
        isP2P: c.isP2P,
        reachable: c.isReachable,
        restriction: c.restrict,
        timeout: c.timeout,
        checkpoint: {
          canBindToPortLocally: !!c.checkpointCanBindToPortLocally,
          connectdCanAuth: !!c.checkpointConnectdCanAuth,
          connectdCanConnectToChatServers: !!c.checkpointConnectdCanConnectToChatServers,
          connectdCanPortBind: !!c.checkpointConnectdCanPortBind,
          connectdCanStart: !!c.checkpointConnectdCanStart,
          connectdTunnelCreated: !!c.checkpointConnectdTunnelCreated,
          hostnameCanFetch: !!c.checkpointHostnameCanFetch,
          hostnameCanResolve: !!c.checkpointHostnameCanResolve,
          proxyCanCreate: !!c.checkpointProxyCanCreate,
        },
        default: false,
      }

      // keep old sessionID for analytics
      if (c.sessionID) result.sessionId = c.sessionID.toLowerCase()
      if (c.addressPort && c.addressPort > 0) result.port = c.addressPort
      if (c.createdAt) result.createdTime = Date.parse(c.createdAt)
      if (c.startedAt) result.startTime = Date.parse(c.startedAt)
      if (c.stoppedAt) result.endTime = Date.parse(c.stoppedAt)
      if (error) result.error = error

      return result
    })
  }

  async connectionStatus() {
    const data = await this.exec({
      cmds: [strings.status()],
      checkAuthHash: true,
      skipSignInCheck: true,
      quiet: true,
    })
    return (data?.connections || []) as IConnectionStatus[]
  }

  async register(code: string) {
    await this.exec({ cmds: [strings.register(code)], checkAuthHash: true })
    this.read()
  }

  async unregister() {
    if (!this.data.device?.uid) return
    await this.exec({ cmds: [strings.unregister()], checkAuthHash: true })
    this.read()
  }

  async forceUnregister() {
    // @TODO when cli supports force reset will implement
    // await this.exec({ cmds: [strings.unregister()], admin: true })
  }

  async addConnection(c: IConnection, onError: (error: Error) => void, onCommand: (command: string) => void) {
    d('ADD CONNECTION', strings.connect(c))
    await this.exec({ cmds: [strings.connect(c)], checkAuthHash: true, onError, onCommand })
  }

  async removeConnection(c: IConnection, onError: (error: Error) => void, onCommand: (command: string) => void) {
    d('REMOVE CONNECTION', strings.remove(c))
    await this.exec({ cmds: [strings.remove(c)], checkAuthHash: true, onError, onCommand })
  }

  async stopConnection(c: IConnection, onError: (error: Error) => void, onCommand: (command: string) => void) {
    d('STOP CONNECTION', strings.stop(c))
    await this.exec({ cmds: [strings.stop(c)], checkAuthHash: true, onError, onCommand })
  }

  async setConnection(c: IConnection, onError: (error: Error) => void, onCommand: (command: string) => void) {
    d('SET CONNECTION', strings.setConnect(c))
    await this.exec({ cmds: [strings.setConnect(c)], checkAuthHash: true, onError, onCommand })
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

  async agentRunning() {
    const data = await this.exec({ cmds: [strings.agentStatus()], skipSignInCheck: true, force: true })
    return data?.running
  }

  async version() {
    const result = await this.exec({ cmds: [strings.version()], skipSignInCheck: true, quiet: true, force: true })
    return result?.version
  }

  async agentVersion() {
    const result = await this.exec({ cmds: [strings.agentVersion()], skipSignInCheck: true, quiet: true, force: true })
    return result?.version
  }

  async exec({
    cmds,
    checkAuthHash = false,
    skipSignInCheck = false,
    admin = false,
    quiet = false,
    force,
    onCommand,
    onError,
  }: IExec) {
    if (!force && (binaryInstaller.inProgress || !binaryInstaller.ready)) {
      Logger.info('EXEC EXITED -> CLI NOT READY', {
        inProgress: binaryInstaller.inProgress,
        ready: binaryInstaller.ready,
      })
      return ''
    }
    if (!skipSignInCheck && !binaryInstaller.uninstallInitiated) await this.checkSignIn()
    if (checkAuthHash && !user.signedIn) {
      Logger.info('EXEC EXITED -> USER NOT SIGNED IN')
      return ''
    }

    let commands = new Command({ admin, quiet })
    cmds.forEach(cmd => commands.push(`"${cliBinary.path}" ${cmd}`))

    if (!quiet) {
      commands.onError = (e: Error) => {
        if (typeof onError === 'function') onError(e)
        // @TODO detect signing or service not started error and don't display,
        // just run check and sign in commands.
        EventBus.emit(this.EVENTS.error, e.toString())
        binaryInstaller.check()
      }
    }

    const result = await commands.exec()

    if (typeof onCommand === 'function') onCommand(commands.toSafeString())

    if (result) {
      try {
        const parsed = typeof result === 'string' ? JSON.parse(result) : result
        if (parsed.code === 0) parsed.message && Logger.info('CLI EXEC MESSAGE', parsed.message)
        else throw new Error(parsed)
        return parsed.data
      } catch (error) {
        if (error instanceof Error) {
          Logger.error('CLI PARSE ERROR', { result, errorMessage: error.message.toString() })
        }
      }
    }
  }
}
