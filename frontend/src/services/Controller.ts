import io from 'socket.io-client'
import { store } from '../store'
import { isPortal } from '../services/Browser'
import { PORT, FRONTEND_RETRY_DELAY } from '../shared/constants'
import { EventEmitter } from 'events'
import network from '../services/Network'
import analyticsHelper from '../helpers/analyticsHelper'

class Controller extends EventEmitter {
  private socket?: SocketIOClient.Socket
  private retrying?: NodeJS.Timeout
  private credentials?: UserCredentials
  private url: string = '/'
  handlers: ILookup<(result: any) => void> = {}

  init() {
    const { protocol, host } = window.location
    const isDev = host === 'localhost:3000'
    this.url = protocol === 'file:' || isDev ? `http://localhost:${PORT}` : '/'
    this.onNetworkConnect()
    network.on('connect', this.onNetworkConnect)
  }

  log(...args) {
    console.log(`%c${args[0]}`, 'color:lime;font-weight:bold', ...args.slice(1))
  }

  onNetworkConnect = () => {
    const state = store.getState()
    const { ui, auth } = store.dispatch

    this.log('ONLINE - CONNECT LOCAL SOCKET')

    if (state.auth.backendAuthenticated) {
      this.open()
      ui.refreshAll()
    } else {
      ui.set({ errorMessage: '' })
      auth.init()
    }
  }

  setupConnection(credentials: UserCredentials) {
    this.credentials = credentials
    this.handlers = getEventHandlers()

    if (!isPortal())
      this.socket = io(this.url, {
        transports: ['websocket'],
        forceNew: true,
        reconnectionDelay: FRONTEND_RETRY_DELAY,
      })

    for (const eventName in this.handlers) {
      if (this.handlers.hasOwnProperty(eventName)) {
        const name = eventName as SocketEvent
        const handler = this.handlers[name]
        this.on(name, handler)
      }
    }
  }

  auth() {
    if (!isPortal()) emit('authentication', this.credentials)
  }

  // Retry open with delay, force skips delay
  open(retry?: boolean, force?: boolean) {
    if (force || (navigator.onLine && !this.socket?.connected && !this.retrying)) {
      this.retrying = setTimeout(
        () => {
          this.log('Retrying local socket.io connection')
          this.retrying = undefined
          this.socket?.open()
        },
        retry ? FRONTEND_RETRY_DELAY : 0
      )
    }
  }

  close() {
    this.log('CLOSE LOCAL SOCKET')
    this.socket?.close()
  }

  on(eventName: SocketEvent, handler: (...args: any[]) => void) {
    this.socket?.on(eventName, handler)
    return this
  }

  off(eventName: SocketEvent) {
    this.socket?.off(eventName)
    return this
  }

  emit = (event: SocketAction, ...args: any[]): boolean => {
    this.log('Controller emit', event, args)
    this.socket?.emit(event, ...args)
    return true
  }
}

type EventHandlers = { [event: string]: (data?: any) => any }

function getEventHandlers() {
  const { connections, binaries, auth, backend, ui } = store.dispatch

  return {
    connect: () => {
      controller.log('CONNECT LOCAL SOCKET')
      controller.auth()
      ui.set({ connected: true })
      backend.set({ error: false })
    },

    unauthorized: (error: Error) => auth.backendSignInError(error.message),

    authenticated: () => auth.backendAuthenticated(),

    disconnect: () => auth.disconnect(),

    dataReady: backend.initialized,

    connect_error: () => {
      backend.set({ error: true })
    },

    pool: (result: IConnection[]) => {
      controller.log('socket pool', result)
      connections.restoreConnections(result)
    },

    connection: (result: IConnection) => {
      controller.log('socket connection', result)
      connections.updateConnection(result)
    },

    targets: (result: ITarget[]) => {
      controller.log('socket targets', result)
      if (result) {
        backend.set({ targets: result })
        backend.targetUpdated(result)
      }
    },

    device: (result: ITargetDevice) => {
      controller.log('socket device', result)
      if (result) backend.targetDeviceUpdated(result)
    },

    scan: (result: IScanData) => {
      controller.log('socket scan', result)
      if (result) backend.set({ scanData: result })
    },

    interfaces: (result: IInterface[]) => {
      controller.log('socket interfaces', result)
      if (result) {
        backend.set({ interfaces: result })
        analyticsHelper.setOobActive(result.length > 1)
      }
    },

    freePort: (result: number) => backend.set({ freePort: result }),

    reachablePort: (result: boolean) => {
      backend.set({ reachablePort: result, loading: false })
    },

    environment: (result: ILookup<any>) => {
      backend.set({ environment: result })
      analyticsHelper.setOS(result.os)
      analyticsHelper.setOsVersion(result.osVersion)
      analyticsHelper.setArch(result.arch)
      analyticsHelper.setManufacturerDetails(result.manufacturerDetails)
      analyticsHelper.setOobAvailable(result.oobAvailable)
    },

    preferences: (result: IPreferences) => backend.set({ preferences: result }),

    filePath: (filePath: string) => backend.set({ filePath }),

    // User
    'signed-out': () => auth.signedOut(),

    // AutoUpdate
    'update/downloaded': (version: string) => {
      backend.set({ updateReady: version })
    },

    // AutoUpdate
    'cli/error': error => {
      ui.set({ errorMessage: '' }) // So we re-trigger a new error if one exists
      ui.set({ errorMessage: error })
      ui.updated()
    },

    // Connections --- TODO validate we need these three channels
    'service/connected': (msg: ConnectionMessage) => {
      connections.updateConnection(msg.connection)
    },
    'service/disconnected': (msg: ConnectionMessage) => {
      connections.updateConnection(msg.connection)
    },
    'service/error': (msg: ConnectionErrorMessage) => {
      connections.updateConnection(msg.connection)
      analyticsHelper.trackConnect('connectionFailed', msg.connection, msg)
    },

    'binary/install/error': (error: string) => binaries.installError(error),
    'binary/install/progress': (progress: number) => controller.log('binary/install/progress', progress),
    'binary/installed': (info: InstallationInfo) => binaries.installed(info),
    'binary/not-installed': (binary: BinaryName) => binaries.notInstalled(binary),
  } as EventHandlers
}

const controller = new Controller()
export default controller
export const emit = controller.emit
