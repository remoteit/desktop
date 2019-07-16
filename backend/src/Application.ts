import debug from 'debug'
import electron from 'electron'
import express from 'express'
import fs from 'fs'
import http from 'http'
import https from 'https'
import logger from './utils/logger'
import os from 'os'
import path from 'path'
import PortScanner from './utils/PortScanner'
import SocketIO from 'socket.io'
import url from 'url'
import { existsSync } from 'fs'
import { execFile, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { PORT } from './constants'
import { r3 } from './services/remote.it'
import { IUser } from 'remote.it'
import * as sudo from 'sudo-prompt'
import Tracker from './utils/analytics'

const d = debug('r3:backend:Application')

const PEER_PORT_RANGE = [33000, 42999]
//  const LOCAL_PROXY_PORT_RANGE = [43000, 52999]

const EVENTS: { [name: string]: SocketEvent } = {
  // user/auth
  userSignedOut: 'user/signed-out',
  userSignInError: 'user/sign-in/error',
  userSignedIn: 'user/signed-in',

  // connections
  poolUpdated: 'pool/updated',
  connectionStarted: 'service/connect/started',
  connectionConnected: 'service/connected',
  connectionDisconnected: 'service/disconnected',
  connectionForgotten: 'service/forgotten',
  connectionError: 'service/error',
  connectionStatus: 'service/status',
  connectionUptime: 'service/uptime',
  connectionRequest: 'service/request',
  connectionTunnelOpened: 'service/tunnel/opened',
  connectionTunnelClosed: 'service/tunnel/closed',
  connectionThroughput: 'service/throughput',
  connectionVersion: 'service/version',
  connectionUnknown: 'service/unknown-event',

  installError: 'install/error',

  // connectd
  connectdInstallStart: 'connectd/install/start',
  connectdInstallProgress: 'connectd/install/progress',
  connectdInstallError: 'connectd/install/error',
  connectdInstalled: 'connectd/installed',
  connectdNotInstalled: 'connectd/not-installed',

  // muxer
  muxerInstallStart: 'muxer/install/start',
  muxerInstallProgress: 'muxer/install/progress',
  muxerInstallError: 'muxer/install/error',
  muxerInstalled: 'muxer/installed',
  muxerNotInstalled: 'muxer/not-installed',

  // demuxer
  demuxerInstallStart: 'demuxer/install/start',
  demuxerInstallProgress: 'demuxer/install/progress',
  demuxerInstallError: 'demuxer/install/error',
  demuxerInstalled: 'demuxer/installed',
  demuxerNotInstalled: 'demuxer/not-installed',
}

interface UserCredentials {
  username: string
  authHash: string
}

interface ConnectionData {
  id: string
  port: number
  name?: string
  pid?: number
}

interface ConnectionArgs {
  authHash: string
  host?: string
  id: string
  name?: string
  port?: number
  username: string
}

interface SavedConnection {
  id: string
  port: number
  name?: string
}

class ElectronApp extends EventEmitter {
  private window?: electron.BrowserWindow
  private tray?: electron.Tray
  private app: electron.App
  private quitSelected: boolean

  constructor() {
    super()

    this.app = electron.app
    // const BrowserWindow = electron.BrowserWindow
    // Keep a global reference of the window and try objects, if you don't, they window will
    // be removed automatically when the JavaScript object is garbage collected.

    this.quitSelected = false

    this.app.on('ready', this.handleAppReady)
    this.app.on('activate', this.handleActivate)
    this.app.on('before-quit', () => (this.quitSelected = true))

    // Make sure to never show the doc icon
    // TODO: Have this configurable via a setting!
    // this.app.dock.hide()
  }

  get url() {
    if (!this.window) return
    return this.window.webContents.getURL()
  }

  /**
   * This method will be called when Electron has finished
   * initialization and is ready to create browser windows.
   * Some APIs can only be used after this event occurs.
   */
  handleAppReady = () => {
    this.createMainWindow()
    this.createTrayIcon()
    this.emit('ready')
  }

  handleActivate = () => {
    // logger.info('Window activated')
    if (this.window) this.window.show()
  }

  createMainWindow = () => {
    if (this.window) return

    // logger.info('Creating main window')
    // d('Showing main window')
    this.window = new electron.BrowserWindow({
      width: 700,
      height: 600,
      minWidth: 400,
      minHeight: 300,
      icon: path.join(__dirname, 'images/icon-64x64.png'),
      fullscreen: false,
      fullscreenable: false,
      frame: false,
      titleBarStyle: 'hiddenInset',
    })

    const startUrl =
      process.env.ELECTRON_START_URL ||
      url.format({
        pathname: path.join(__dirname, '../build/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    this.window.loadURL(startUrl)

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    this.window.on('close', e => {
      if (!this.quitSelected) {
        e.preventDefault()
        if (this.window) this.window.hide()
      }
    })
  }

  createTrayIcon() {
    logger.info('Create tray icon')

    const iconPath = path.join(__dirname, 'images', 'iconTemplate.png')
    this.tray = new electron.Tray(iconPath)

    this.tray.on('click', event => {
      // logger.info('Clicked tray icon')
      if (this.window) {
        if (this.window.isVisible() && this.window.isFocused()) {
          this.window.hide()
        } else {
          this.window.show()
          this.window.focus()
        }

        // Show devtools when command+option clicked
        if (process.defaultApp && event.metaKey) {
          this.window.webContents.openDevTools({ mode: 'detach' })
        }
      }
    })
  }
}

export class Environment {
  static get isWindows() {
    return os.platform() === 'win32'
  }

  static get isMac() {
    return os.platform() === 'darwin'
  }

  static get remoteitDirectory() {
    return this.isWindows ? '/remoteit' : path.join(os.homedir(), '.remoteit')
  }

  static toJSON() {
    return {
      isWindows: this.isWindows,
      isMac: this.isMac,
      remoteitDirectory: this.remoteitDirectory,
    }
  }
}

type ProgressCallback = (percent: number) => void

interface InstallerArgs {
  name: string
  repoName: string
  version: string
}

class Installer {
  name: string
  repoName: string
  version: string

  constructor(args: InstallerArgs) {
    this.name = args.name
    this.repoName = args.repoName
    this.version = args.version
  }

  /**
   * Download the binary, move it to the PATH on the user's
   * system and then make it writable.
   */
  install(cb?: ProgressCallback) {
    const permission = 0o755

    d('Attempting to install binary: %O', {
      name: this.name,
      permission,
      path: this.binaryPath,
      version: this.version,
      repoName: this.repoName,
    })

    try {
      d('Creating binary path: ', this.targetDirectory)
      fs.mkdirSync(this.targetDirectory, { recursive: true })
    } catch (error) {
      d('Error creating binary path:', error)
    }

    // Download the binary from Github
    return this.download(this.version, cb)
  }

  get targetDirectory() {
    const { dir } = path.parse(this.binaryPath)
    return dir
  }

  /**
   * Install connectd if it is missing from the host system.
   */
  async installIfMissing(cb?: ProgressCallback) {
    if (this.isInstalled) return
    d('connectd is not installed, attempting to install now')
    return this.install(cb)
  }

  get binaryPath() {
    return path.join(this.binaryDirectory, this.binaryName)
  }

  get binaryName() {
    return Environment.isWindows ? this.name + '.exe' : this.name
  }

  get binaryDirectory() {
    return Environment.isWindows ? '/remoteit/bin/' : '/usr/local/bin/'
  }

  /**
   * Return whether or not connectd exists where we expect it. Used
   * to decide if we install connectd or not on startup.
   */
  get isInstalled() {
    // TODO: we should probably make sure the output of the binary is what
    // we expect it to be and it is the right version
    return existsSync(this.binaryPath)
  }

  private download(tag: string, progress: ProgressCallback = () => {}) {
    return new Promise((resolve, reject) => {
      const url = `https://github.com/${this.repoName}/releases/download/${
        this.version
      }/${this.downloadFileName}`

      d(`Downloading ${this.name}:`, url)

      progress(0)

      https
        .get(url, res1 => {
          if (!res1 || !res1.headers || !res1.headers.location)
            return reject(new Error('No response from download URL!'))
          https
            .get(res1.headers.location, res2 => {
              if (!res2 || !res2.headers || !res2.headers['content-length'])
                return reject(new Error('No response from location URL!'))
              const total = parseInt(res2.headers['content-length'], 10)
              let completed = 0
              const w = fs.createWriteStream(this.downloadPath)
              res2.pipe(w)
              res2.on('data', data => {
                completed += data.length
                progress(completed / total)
              })
              res2.on('progress', progress)
              res2.on('error', reject)
              res2.on('end', resolve)
            })
            .on('error', reject)
        })
        .on('error', reject)
    })
  }

  get downloadPath() {
    return path.join(this.downloadDirectory, this.binaryName)
  }

  private get downloadFileName() {
    return Environment.isWindows
      ? `${this.name}.exe`
      : os.arch() === 'x64'
      ? `${this.name}.x86_64-osx`
      : `${this.name}.x86-osx`
  }

  private get downloadDirectory() {
    return Environment.isWindows ? '/remoteit/tmp/' : '/tmp/'
  }
}

const connectdInstaller = new Installer({
  name: 'connectd',
  repoName: 'remoteit/connectd',
  version: 'v4.6',
})

const muxerInstaller = new Installer({
  name: 'muxer',
  repoName: 'remoteit/multiport',
  version: 'v0.3-alpha',
})

const demuxerInstaller = new Installer({
  name: 'demuxer',
  repoName: 'remoteit/multiport',
  version: 'v0.3-alpha',
})

class BinaryInstaller extends EventEmitter {
  installers: Installer[]

  constructor(installers: Installer[]) {
    super()

    this.installers = installers
  }

  async install() {
    return new Promise(async (resolve, reject) => {
      // if (
      //   connectdInstaller.isInstalled &&
      //   muxerInstaller.isInstalled &&
      //   demuxerInstaller.isInstalled
      // )
      //   return

      // Download and install binaries
      await Promise.all(
        this.installers.map(installer =>
          installer
            .install((progress: number) =>
              this.emit('progress', { progress, installer })
            )
            .then(() => {
              // For Windows, we don't need admin permissions:
              if (Environment.isWindows) {
                this.emit('installed', installer)
              }
            })
            .catch(error =>
              this.emit('error', { error: error.message, installer })
            )
        )
      )

      // TODO: only require this on inital install
      if (!Environment.isWindows) {
        const options = { name: 'remoteit' }
        const cmds = this.installers.map(
          installer =>
            `mv ${installer.downloadPath} ${
              installer.binaryPath
            } && chmod 755 ${installer.binaryPath}`
        )
        const cmd = cmds.join(' && ')
        d('Running command:', cmd)
        sudo.exec(cmd, options, (error: Error, stdout: any, stderr: any) => {
          d('Command error:', error)
          d('Command stderr:', stderr)
          d('Command stdout:', stdout)

          if (error) return reject(error.message)
          if (stderr) return reject(stderr)
          resolve(stdout)
          this.installers.map(installer => this.emit('installed', installer))

          // if (error) return failure(error)
          // if (stderr) return failure(stderr)
          // success(stdout)
        })
      }
    })
  }
}

class JSONFile<T> {
  public location: string

  constructor(location: string) {
    this.location = location
  }

  /**
   * Checks to see if the connections file exists on the
   * file system.
   */
  get exists() {
    return fs.existsSync(this.location)
  }

  /**
   * Read the connections file and return it or
   * undefined if it is missing or invalid.
   */
  read(): T | undefined {
    if (!this.exists) return

    // logger.info('Loading saved connections file:', { location: this.location })

    const content = fs.readFileSync(this.location)
    if (!content || !content.toString()) return

    try {
      const json = JSON.parse(content.toString())
      if (!json) return

      // logger.info('Read saved connections file:', json)

      return json
    } catch (error) {
      return
    }
  }

  /**
   * Returns whether the file is valid or not.
   * This includes a check to see if it exists and has
   * valid JSON contents.
   */
  isValid = () => Boolean(this.read())

  /**
   * Remove the file from the filesystem.
   */
  remove = () => this.exists && fs.unlinkSync(this.location)

  /**
   * Create a new file.
   */
  write = (content: T) => {
    logger.info('Writing file', { location: this.location, content })

    // Make sure containing folder exists.
    fs.mkdirSync(path.parse(this.location).dir, { recursive: true })

    // Write the contents as a indented/formatted JSON value.
    fs.writeFileSync(this.location, JSON.stringify(content, null, 2))
  }
}

/**
 * Forward a set of events from one EventEmitter to another.
 */
class EventRelay {
  constructor(events: string[], from: EventEmitter, to: EventEmitter) {
    events.map(event =>
      from.on(event, (...args: any[]) => to.emit(event, ...args))
    )
  }
}

class Connection extends EventEmitter {
  private authHash: string
  public id: string
  public host?: string
  public name?: string
  public pid?: number
  public port: number
  private username: string
  // private password?: string
  private process?: ChildProcess

  constructor(args: {
    id: string
    port: number
    username: string
    authHash: string
    host?: string
    name?: string
  }) {
    super()
    this.authHash = args.authHash
    this.id = args.id
    this.host = args.host || 'localhost'
    this.port = args.port
    this.name = args.name || `${this.host}:${this.port}`
    this.username = args.username
  }

  async start() {
    this.emit(EVENTS.connectionStarted, this.toJSON())
    Tracker.pageView(`/connections/${this.id}/start`)
    Tracker.event('connection', 'start', `connecting to service: ${this.id}`)
    logger.info('Starting connection:', this.toJSON())
    const usernameBase64 = Buffer.from(this.username).toString('base64')
    this.process = execFile(
      connectdInstaller.binaryPath,
      [
        // TODO: Support password login too?
        '-s',
        '-p',
        usernameBase64,
        this.authHash,
        this.id, // Service ID
        `T${this.port}`, // Bind port
        '1', // Encryption
        '127.0.0.1', // Bind address
        '0.0.0.0', // Restricted connection IP
        '12', // Max out
        '0', // Lifetime
        '0', // Grace period
      ],
      {
        maxBuffer: Infinity,
      },
      (
        error: Error | null,
        stdout: string | Buffer,
        stderr: string | Buffer
      ) => {
        let message = 'Unknown error'
        if (error) message = error.message
        if (stderr) message = stderr.toString()
        logger.error(message)
        // this.emit(EVENTS.connectionError, {
        //   error: message,
        //   connection: this.toJSON(),
        // })
      }
    )

    if (!this.process || !this.process.stdout || !this.process.stderr)
      throw new Error('Could not start connectd process!')

    this.process.stdout.on('data', this.handleStdOut)
    this.process.stderr.on('data', this.handleStdErr)
    this.process.on('error', this.handleError)
    this.process.on('close', this.handleClose)
  }

  async kill() {
    logger.info('Killing connection:', this.toJSON())
    Tracker.pageView(`/connections/${this.id}/kill`)
    Tracker.event('connection', 'kill', 'kill service')
    if (this.process) this.process.kill()
    this.process = undefined
  }

  async stop() {
    logger.info('Stopping connection:', this.toJSON())
    Tracker.pageView(`/connections/${this.id}/stop`)
    Tracker.event('connection', 'stop', 'stopping service')
    await this.kill()
    this.emit(EVENTS.connectionDisconnected, {
      connection: this.toJSON(),
    } as ConnectdMessage)
  }

  async restart() {
    logger.info('Restarting connection:', this.toJSON())
    Tracker.pageView(`/connections/${this.id}/restart`)
    Tracker.event('connection', 'restart', `restarting service: ${this.id}`)
    if (this.process && this.process.pid) await this.stop()
    await this.start()
  }

  toJSON = (): ConnectionData => {
    return {
      id: this.id,
      pid: this.process ? this.process.pid : undefined,
      port: this.port,
      name: this.name,
    }
  }

  private handleError = (error: Error) => {
    logger.error('connectd error: ' + error.message)
    Tracker.event('connection', 'error', `connection error: ${this.id}`)
    this.emit('error', { error: error.message })
  }

  private handleClose = async (code: number) => {
    logger.error(`Connection closed with code: ${code}`)
    Tracker.event('connection', 'connection-closed', `connection closed`, code)

    // If terminated by signal code is received, do nothing.
    if (code === 3) return

    // Make sure kill the process.
    await this.kill()

    this.emit(EVENTS.connectionDisconnected, {
      connection: this.toJSON(),
      raw: `Connection closed`,
    } as ConnectdMessage)

    if (code && code !== 0) {
      const messages: { [code: string]: string } = {
        1: 'process lifetime expired',
        2: 'shutdown packet received',
        3: 'termination from signal',
        4: 'Disabled By User Configuration',
        10: 'bad user specified  (probably not possible at this time)',
        11: 'authentication error (may be multiple because of retry)',
        12: 'auto connect failed (Initiator p2p connect failed)',
        13: 'Initiate session create failed (initiator p2p connect failed !autoconnect)',
        14: 'Connection To remot3.it Service has Timed Out',
        15: 'cannot get UID from service (not a initiator side error)',
        16: 'Cannot Bind UDP Port (UDP P2P port)',
        17: 'Cannot Bind Proxy Port (initiator port)',
        20: 'connection to peer closed or timed out',
        21: 'connection to peer failed (failed p2p connect)',
        25: 'unknown reason (this should not happen)',
        30: 'user console exit',
      }
      const message = messages[String(code)]

      console.error('⚠️  Closing with error code:', code, message)

      if (code === 3) return

      this.emit(EVENTS.connectionError, {
        code,
        connection: this.toJSON(),
        error: message,
      } as ConnectionErrorMessage)
    }
  }

  private handleStdOut = (buff: Buffer) => {
    // Split incoming lines from stdout so we can parse them
    // individually.
    const lines = buff
      .toString()
      .trim()
      .split(/\r?\n/)

    // Parse incoming messages and format messages for
    // emitting.
    for (const line of lines) {
      let name
      let extra: any
      if (line.includes('seconds since startup')) {
        name = EVENTS.connectionUptime
      } else if (line.startsWith('!!status')) {
        name = EVENTS.connectionStatus
      } else if (line.startsWith('!!throughput')) {
        name = EVENTS.connectionThroughput
      } else if (line.startsWith('!!request')) {
        name = EVENTS.connectionRequest
      } else if (line.startsWith('!!connected')) {
        this.emit(EVENTS.connectionConnected, this.toJSON())
        return
      } else if (line.includes('exit - process closed')) {
        name = EVENTS.connectionDisconnected
      } else if (line.includes('connecttunnel')) {
        name = EVENTS.connectionTunnelOpened
      } else if (line.includes('closetunnel')) {
        name = EVENTS.connectionTunnelClosed
      } else if (line.includes('Version')) {
        name = EVENTS.connectionVersion
        const match = line.match(/Version ([\d\.]*)/)
        if (match && match.length > 1) extra = { version: match[1] }
        // TODO: return local IP
        // } else if (line.includes('primary local ip')) {
        //   localIP = localIP
        //   connectd.emit(EVENTS.updated, {}) //this.toJSON())
      } else {
        name = EVENTS.connectionUnknown
      }

      this.emit(name, {
        connection: this.toJSON(),
        extra,
        raw: line,
      } as ConnectdMessage)
    }
  }

  private handleStdErr = (buff: Buffer) => {
    const error = buff.toString()
    this.emit(EVENTS.connectionError, {
      connection: this.toJSON(),
      error,
    } as ConnectionErrorMessage)
    console.error('⚠️  CONNECTD ERROR:', error)
  }
}

class ConnectionPool extends EventEmitter {
  public user?: UserCredentials
  private pool: { [id: string]: Connection } = {}

  initialize = async (
    connections?: ConnectionData[],
    user?: UserCredentials
  ) => {
    logger.info('Initializing connections pool', { connections })

    if (!connections || !connections.length || !user) return
    this.user = user

    connections.map(conn => this.connect(conn))
  }

  connect = async (args: { id: string; port?: number; name?: string }) => {
    if (!this.user) throw new Error('No user to authenticate connection!')

    const port = args.port || (await this.freePort())

    if (!port) throw new Error('No port could be assigned to connection!')

    logger.info('Connecting to service', args)

    // TODO: De-dupe connections!

    const connection = new Connection({
      port,
      username: this.user.username,
      authHash: this.user.authHash,
      ...args,
    })
    this.pool[args.id] = connection
    await this.start(args.id)

    // Trigger a save of the connections file
    this.updated()

    // Emit all events comming from the Connection to the
    // ConnectionPool so they can be listened to
    const events = Object.values(EVENTS)
    new EventRelay(events, connection, this)

    return connection
  }

  find = (id: string) => {
    const conn = this.pool[id]
    if (!conn) throw new Error(`Connection with ID ${id} could not be found!`)
    return conn
  }

  start = async (id: string) => {
    return this.find(id).start()
  }

  stop = async (id: string) => {
    return this.find(id).stop()
  }

  stopAll = async () => {
    return Object.keys(this.pool).map(id => this.stop(id))
  }

  forget = async (id: string) => {
    await this.stop(id)
    delete this.pool[id]
    this.updated()
    await this.emit(EVENTS.connectionForgotten, id)
  }

  reset = async () => {
    await this.stopAll()
    this.pool = {}
  }

  restart = async (id: string) => {
    return this.find(id).restart()
  }

  updated = async () => {
    this.emit(EVENTS.poolUpdated, this.toJSON())
  }

  toJSON = (): ConnectionData[] => {
    const ids = Object.keys(this.pool)
    return ids.map(id => this.pool[id].toJSON())
  }

  private freePort = async () => {
    return await PortScanner.findFreePortInRange(
      PEER_PORT_RANGE[0],
      PEER_PORT_RANGE[1],
      this.usedPorts
    )
  }

  private get usedPorts() {
    return Object.keys(this.pool).map(id => this.pool[id].port)
  }
}

class Server extends EventEmitter {
  private pool: ConnectionPool
  private io: SocketIO.Server
  private user?: UserCredentials

  constructor(pool: ConnectionPool, user?: UserCredentials) {
    super()

    logger.info('Setting user:', { user })

    this.pool = pool
    this.user = user

    logger.info('Starting up server!')

    const app = express()
    const server = new http.Server(app)
    this.io = SocketIO(server)

    this.io.on('connection', socket => {
      logger.info('New connection')

      this.emit('connection')

      socket.on('user/check-sign-in' as SocketAction, this.checkSignIn)
      socket.on('user/sign-in' as SocketAction, this.signIn)
      socket.on('user/sign-out' as SocketAction, this.signOut)
      socket.on('user/quit' as SocketAction, electron.app.quit)
      socket.on('connections/list' as SocketAction, this.list)
      socket.on('service/connect' as SocketAction, this.connect)
      socket.on('service/disconnect' as SocketAction, this.disconnect)
      socket.on('service/forget' as SocketAction, this.forget)
      socket.on('service/restart' as SocketAction, this.restart)
      socket.on('binaries/install' as SocketAction, this.installBinaries)
    })

    // Forward all connection pool events to the server SocketIO process.
    const events = Object.values(EVENTS)
    new EventRelay(events, this.pool, this.io.sockets)

    server.listen(PORT, () => {
      d(`Listening on port ${PORT}`)
      logger.info(`Listening on port ${PORT}`)
      this.emit('ready')
    })
  }

  send = (event: string, ...args: any[]) => {
    this.emit(event, ...args)
    this.io.sockets.emit(event, ...args)
    return true
  }

  checkSignIn = async () => {
    logger.info('Check sign in:', { user: this.user })
    Tracker.event('auth', 'check-sign-in', 'check user sign in')

    if (!this.user) {
      logger.warn('No user, signing out...')
      this.send(EVENTS.userSignedOut)
      return
    }

    logger.info('Attempting auth hash login')

    const user = await r3.user.authHashLogin(
      this.user.username,
      this.user.authHash
    )

    d('User signed in: %O', user)

    // Set the user on the pool so we can
    // authenticate requests.
    this.pool.user = user
    this.user = user

    logger.info('User', { user })
    if (user) this.send(EVENTS.userSignedIn, user)
  }

  signIn = async ({
    username,
    password,
  }: {
    username: string
    password: string
  }) => {
    logger.info('Loggin in user', { username })
    Tracker.pageView('/sign-in')
    Tracker.event('auth', 'sign-in', 'user signed in')

    d('Updated access key')

    let user
    try {
      user = await r3.user.login(username, password)
    } catch (error) {
      this.send(EVENTS.userSignInError, error.message)
      return
    }

    d('Got user:', user)

    if (!user) {
      d('Could not login user: %O', { username, password })
      logger.error('Could not log in user:', { username })
      return
    }

    // Store accesskey in remote.it.js
    // TODO: make this into a helper of some kind
    r3.authHash = user.authHash
    r3.token = user.token

    this.user = { username: user.username, authHash: user.authHash }

    this.send(EVENTS.userSignedIn, user)
  }

  signOut = () => {
    Tracker.event('auth', 'sign-out', 'user signed out')
    Tracker.pageView('/sign-out')
    logger.info('Sign out user')
    this.user = undefined
    this.send(EVENTS.userSignedOut)
  }

  list = (cb: (pool: ConnectionData[]) => void) => {
    cb(this.pool.toJSON())
  }

  connect = async (args: ConnectionArgs) => {
    logger.info('Connect to service:', args)
    return this.pool.connect(args)
  }

  disconnect = async (id: string) => {
    await this.pool.stop(id)
  }

  forget = async (id: string) => {
    await this.pool.forget(id)
  }

  restart = async (id: string) => {
    await this.pool.restart(id)
  }

  installBinaries = async () => {
    const installer = new BinaryInstaller([
      connectdInstaller,
      muxerInstaller,
      demuxerInstaller,
    ])
    installer.on(
      'progress',
      ({ progress, installer }: { progress: number; installer: Installer }) =>
        this.send(EVENTS[installer.name + 'Progress'], progress)
    )
    installer.on(
      'error',
      ({ error, installer }: { error: string; installer: Installer }) =>
        this.send(EVENTS[installer.name + 'Error'], error)
    )
    installer.on('installed', (installer: Installer) =>
      this.send(EVENTS[installer.name + 'Installed'], installer)
    )
    return installer
      .install()
      .catch(error => this.send(EVENTS.installError, error))
  }

  // install = () => {}
}

export default class Application {
  private server: Server
  private pool: ConnectionPool
  private connectionsFile: JSONFile<SavedConnection[]>
  private userFile: JSONFile<UserCredentials>
  private window: ElectronApp

  constructor() {
    logger.info('Application starting up!')

    this.handleExit()

    this.window = new ElectronApp()

    this.connectionsFile = new JSONFile<SavedConnection[]>(
      path.join(Environment.remoteitDirectory, 'connections.json')
    )
    this.userFile = new JSONFile<UserCredentials>(
      path.join(Environment.remoteitDirectory, 'user.json')
    )

    const userCredentials = this.userFile.read()

    logger.info('Reading user credentials:', { user: userCredentials })

    // Start pool and load connections from filestystem
    this.pool = new ConnectionPool()
    this.pool.initialize(this.connectionsFile.read(), userCredentials)
    this.pool.on(EVENTS.poolUpdated, this.handlePoolUpdated)

    // win.on('ready', async () => {})

    // Start server and listen to events.
    this.server = new Server(this.pool, userCredentials)
    this.server.on('ready', this.handleServerReady)
    this.server.on('connection', this.handleConnection)
    this.server.on(EVENTS.userSignedIn, this.handleSignedIn)
    this.server.on(EVENTS.userSignedOut, this.handleSignedOut)
  }

  get url() {
    return this.window.url
  }

  private handleConnection = () => {
    logger.info('Checking install status:', {
      connectdInstalled: connectdInstaller.isInstalled,
      muxerInstalled: muxerInstaller.isInstalled,
      demuxerInstalled: demuxerInstaller.isInstalled,
    })

    connectdInstaller.isInstalled
      ? this.server.send(EVENTS.connectdInstalled, {
          path: connectdInstaller.binaryPath,
          version: connectdInstaller.version,
        } as InstallationInfo)
      : this.server.send(EVENTS.connectdNotInstalled)
    muxerInstaller.isInstalled
      ? this.server.send(EVENTS.muxerInstalled, {
          path: muxerInstaller.binaryPath,
          version: muxerInstaller.version,
        } as InstallationInfo)
      : this.server.send(EVENTS.muxerNotInstalled)
    demuxerInstaller.isInstalled
      ? this.server.send(EVENTS.demuxerInstalled, {
          path: demuxerInstaller.binaryPath,
          version: demuxerInstaller.version,
        } as InstallationInfo)
      : this.server.send(EVENTS.demuxerNotInstalled)
  }

  private handleExit = () => {
    Tracker.event('app', 'close', 'closing application')
    // Do something when app is closing
    process.on('exit', this.handleException)

    // Catches ctrl+c event
    process.on('SIGINT', this.handleException)

    // Catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', this.handleException)
    process.on('SIGUSR2', this.handleException)

    // Catches uncaught exceptions
    process.on('uncaughtException', this.handleException)
  }

  private handleException = async () => {
    await this.pool.stopAll()
    process.exit()
  }

  /**
   * When the pool is updated, persist it to the saved connections
   * file on disk.
   */
  private handlePoolUpdated = (pool: ConnectionData[]) => {
    logger.info('Pool updated', { pool })
    this.connectionsFile.write(pool)
  }

  /**
   *  Make sure connectd is installed on startup of server
   */
  private handleServerReady = async () => {
    logger.info('Server is ready')
  }

  /**
   * When a user is signed in, persist them to the user credentials
   * file on disk.
   */

  private handleSignedIn = (user: IUser) => {
    logger.info('User signed in', { username: user.username })

    // Set the user on the pool so we can
    // authenticate requests.
    this.pool.user = user

    // Save the user to the user JSON file.
    this.userFile.write({
      username: user.username,
      authHash: user.authHash,
    })
  }

  /**
   * When a user logs out, remove their credentials from the
   * saved connections file.
   */

  private handleSignedOut = async () => {
    logger.info('Signing out user')

    // Stop all connections cleanly
    await this.pool.reset()

    // Clear out the authenticatd user in the connection
    // pool so future connections don't start.
    this.pool.user = undefined

    // Remove files from system.
    this.userFile.remove()
    this.connectionsFile.remove()
  }
}
