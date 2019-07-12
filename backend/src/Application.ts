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
import { r3, refreshAccessKey } from './services/remote.it'
import * as sudo from 'sudo-prompt'
import { IUser } from 'remote.it'

const d = debug('r3:backend:Application')

const PEER_PORT_RANGE = [33000, 42999]
//  const LOCAL_PROXY_PORT_RANGE = [43000, 52999]

const EVENTS = {
  user: {
    checkSignIn: 'user/check-sign-in',
    signOut: 'user/sign-out',
    signedOut: 'user/signed-out',
    signIn: 'user/sign-in',
    signInError: 'user/sign-in/error',
    signedIn: 'user/signed-in',
    quit: 'user/quit'
  },
  pool: {
    updated: 'pool/updated',
  },
  connections: {
    // Actions
    connect: 'service/connect',
    disconnect: 'service/disconnect',
    forget: 'service/forget',
    list: 'connections/list',
    restart: 'service/restart',

    // Connection events
    started: 'service/connect/started',
    connected: 'service/connected',
    disconnected: 'service/disconnected',
    forgotten: 'service/forgotten',

    // Process output
    error: 'service/error',
    status: 'service/status',
    uptime: 'service/uptime',
    request: 'service/request',
    tunnelOpened: 'service/tunnel-opened',
    tunnelClosed: 'service/tunnel-closed',
    throughput: 'service/throughput',
    version: 'service/version',
    unknown: 'service/unknown',
  },
  install: {
    done: 'connectd/install/done',
    progress: 'connectd/install/progress',
    error: 'connectd/install/done',
  },
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
    this.app.dock.hide()
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
        } 
        else {
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

  static get connectdBinaryDirectory() {
    return this.isWindows ? '/remoteit/bin/' : '/usr/local/bin/'
  }

  static get connectdBinaryName() {
    return this.isWindows ? 'connectd.exe' : 'connectd'
  }

  static get connectdPath() {
    return path.join(this.connectdBinaryDirectory, this.connectdBinaryName)
  }

  static toJSON() {
    return {
      isWindows: this.isWindows,
      isMac: this.isMac,
      remoteitDirectory: this.remoteitDirectory,
      connectdBinaryDirectory: this.connectdBinaryDirectory,
      connectdBinaryName: this.connectdBinaryName,
      connectdPath: this.connectdPath,
    }
  }
}

type ProgressCallback = (percent: number) => void

class ConnectdInstaller {
  /**
   * Download connectd, move it to the PATH on the user's
   * system and then make it writable.
   */
  static install(cb?: ProgressCallback) {
    const permission = 0o755
    const version = 'v4.6'

    d('Attempting to install connectd: %O', {
      permission,
      path: Environment.connectdPath,
      version,
    })

    try {
      d('Creating binary path: ', Environment.connectdBinaryDirectory)
      fs.mkdirSync(Environment.connectdBinaryDirectory, { recursive: true })
    } catch (error) {
      d('Error creating binary path:', error)
    }

    // Download the connectd binary from Github
    return this.download(version, cb).then(() => {
      if (Environment.isMac) {
        this.moveAndUpdatePermissions()
      }
    })
  }

  /**
   * Install connectd if it is missing from the host system.
   */
  static async installIfMissing(cb?: ProgressCallback) {
    if (this.isConnectdInstalled()) return
    d('connectd is not installed, attempting to install now')
    return this.install(cb)
  }

  /**
   * Return whether or not connectd exists where we expect it. Used
   * to decide if we install connectd or not on startup.
   */
  private static isConnectdInstalled() {
    // TODO: we should probably make sure the output of connectd is what
    // we expect it to be and it is the right version
    return existsSync(Environment.connectdPath)
  }

  private static download(tag: string, progress: ProgressCallback = () => {}) {
    return new Promise((resolve, reject) => {
      const url = `https://github.com/remoteit/connectd/releases/download/${tag}/${
        this.downloadFileName
      }`

      d('Downloading connectd', url)

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

  private static moveAndUpdatePermissions() {
    return new Promise((success, failure) => {
      var options = {
        name: 'remoteit',
        // icns: '/Applications/Electron.app/Contents/Resources/Electron.icns', // (optional)
      }
      const cmd = `mv ${this.downloadPath} ${
        Environment.connectdPath
      } && chmod 755 ${Environment.connectdPath}`
      d('Running command:', cmd)
      sudo.exec(cmd, options, (error: Error, stdout: any, stderr: any) => {
        d('Command error:', error)
        d('Command stderr:', stderr)
        d('Command stdout:', stdout)
        if (error) return failure(error)
        if (stderr) return failure(stderr)
        success(stdout)
      })
    })
  }

  private static get downloadFileName() {
    return Environment.isWindows
      ? 'connectd.exe'
      : os.arch() === 'x64'
      ? 'connectd.x86_64-osx'
      : 'connectd.x86-osx'
  }

  private static get downloadDirectory() {
    return Environment.isWindows ? '/remoteit/tmp/' : '/tmp/'
  }

  private static get downloadPath() {
    return path.join(this.downloadDirectory, Environment.connectdBinaryName)
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
    this.emit(EVENTS.connections.started, this.toJSON())
    logger.info('Starting connection:', this.toJSON())
    const usernameBase64 = Buffer.from(this.username).toString('base64')
    this.process = execFile(
      Environment.connectdPath,
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
        // this.emit(EVENTS.connections.error, {
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
    if (this.process) this.process.kill()
    this.process = undefined
  }

  async stop() {
    logger.info('Stopping connection:', this.toJSON())
    await this.kill()
    this.emit(EVENTS.connections.disconnected, {
      connection: this.toJSON(),
    } as ConnectdMessage)
  }

  async restart() {
    logger.info('Restarting connection:', this.toJSON())
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
    this.emit('error', { error: error.message })
  }

  private handleClose = async (code: number) => {
    logger.error(`Connection closed with code: ${code}`)

    // If terminated by signal code is received, do nothing.
    if (code === 3) return

    // Make sure kill the process.
    await this.kill()

    this.emit(EVENTS.connections.disconnected, {
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

      this.emit(EVENTS.connections.error, {
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
        name = EVENTS.connections.uptime
      } else if (line.startsWith('!!status')) {
        name = EVENTS.connections.status
      } else if (line.startsWith('!!throughput')) {
        name = EVENTS.connections.throughput
      } else if (line.startsWith('!!request')) {
        name = EVENTS.connections.request
      } else if (line.startsWith('!!connected')) {
        this.emit(EVENTS.connections.connected, this.toJSON())
        return
      } else if (line.includes('exit - process closed')) {
        name = EVENTS.connections.disconnected
      } else if (line.includes('connecttunnel')) {
        name = EVENTS.connections.tunnelOpened
      } else if (line.includes('closetunnel')) {
        name = EVENTS.connections.tunnelClosed
      } else if (line.includes('Version')) {
        name = EVENTS.connections.version
        const match = line.match(/Version ([\d\.]*)/)
        if (match && match.length > 1) extra = { version: match[1] }
        // TODO: return local IP
        // } else if (line.includes('primary local ip')) {
        //   localIP = localIP
        //   connectd.emit(EVENTS.updated, {}) //this.toJSON())
      } else {
        name = EVENTS.connections.unknown
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
    this.emit(EVENTS.connections.error, {
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
    const events = Object.values(EVENTS.connections)
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
    await this.emit(EVENTS.connections.forgotten, id)
  }

  reset = async () => {
    await this.stopAll()
    this.pool = {}
  }

  restart = async (id: string) => {
    return this.find(id).restart()
  }

  updated = async () => {
    this.emit(EVENTS.pool.updated, this.toJSON())
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
      socket.on(EVENTS.user.checkSignIn, this.checkSignIn)
      socket.on(EVENTS.user.signIn, this.signIn)
      socket.on(EVENTS.user.signOut, this.signOut)
      socket.on(EVENTS.user.quit, electron.app.quit)
      socket.on(EVENTS.connections.list, this.list)
      socket.on(EVENTS.connections.connect, this.connect)
      socket.on(EVENTS.connections.disconnect, this.disconnect)
      socket.on(EVENTS.connections.forget, this.forget)
      socket.on(EVENTS.connections.restart, this.restart)
    })

    // Forward all connection pool events to the server SocketIO process.
    const events = Object.values(EVENTS.connections)
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

    if (!this.user) {
      logger.warn('No user, signing out...')
      this.send(EVENTS.user.signedOut)
      return
    }

    logger.info('Attempting auth hash login')

    await refreshAccessKey()
    const user = await r3.user.authHashLogin(
      this.user.username,
      this.user.authHash
    )

    // Set the user on the pool so we can
    // authenticate requests.
    this.pool.user = user

    logger.info('User', { user })
    if (user) this.send(EVENTS.user.signedIn, user)
  }

  signIn = async ({
    username,
    password,
  }: {
    username: string
    password: string
  }) => {
    logger.info('Loggin in user', { username })

    await refreshAccessKey()

    d('Updated access key')

    let user
    try {
      user = await r3.user.login(username, password)
    } catch (error) {
      this.send(EVENTS.user.signInError, error.message)
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

    this.send(EVENTS.user.signedIn, user)
  }

  signOut = () => {
    logger.info('Sign out user')
    this.user = undefined
    this.send(EVENTS.user.signedOut)
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

  install = () => {}
}

export default class Application {
  private server: Server
  private pool: ConnectionPool
  private connectionsFile: JSONFile<SavedConnection[]>
  private userFile: JSONFile<UserCredentials>
  private window: ElectronApp

  constructor() {
    logger.info('Application starting up!')

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
    this.pool.on(EVENTS.pool.updated, this.handlePoolUpdated)

    // win.on('ready', async () => {})

    // Start server and listen to events.
    this.server = new Server(this.pool, userCredentials)
    this.server.on('ready', this.handleServerReady)
    this.server.on(EVENTS.user.signedIn, this.handleSignedIn)
    this.server.on(EVENTS.user.signedOut, this.handleSignedOut)
  }

  get url() {
    return this.window.url
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
  private handleServerReady = () => {
    logger.info('Server is ready')
    ConnectdInstaller.installIfMissing((progress: number) =>
      this.server.emit(EVENTS.install.progress, progress)
    )
      .then(() => this.server.emit(EVENTS.install.done))
      .catch(error => this.server.emit(EVENTS.install.error, error.message))
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
