import io from 'socket.io-client'
import { store } from '../store'
import { PORT, FRONTEND_RETRY_DELAY } from '../shared/constants'
import { EventEmitter } from 'events'
import analyticsHelper from '../helpers/analyticsHelper'
import cloudController from './cloudController'

class Controller extends EventEmitter {
  private socket?: SocketIOClient.Socket
  private retrying?: NodeJS.Timeout
  private userName?: string
  private userPassword?: string
  private url: string = '/'

  init() {
    const { protocol, host } = window.location
    const isDev = host === 'localhost:3000'
    this.url = protocol === 'file:' || isDev ? `http://localhost:${PORT}` : '/'
    this.setOffline()
    window.addEventListener('online', this.setOffline)
    window.addEventListener('offline', this.setOffline)
  }

  setOffline = () => {
    const state = store.getState()
    const { ui, auth } = store.dispatch
    const offline = !navigator.onLine
    ui.set({ offline })
    if (!offline) {
      if (state.auth.backendAuthenticated) {
        ui.refreshAll()
      } else {
        ui.set({ errorMessage: '' })
        auth.init()
      }
    }
  }

  setupConnection(username: string, password: string) {
    this.userName = username
    this.userPassword = password
    this.socket = io(this.url, { transports: ['websocket'], forceNew: true })
    const handlers = getEventHandlers()

    for (const eventName in handlers) {
      if (handlers.hasOwnProperty(eventName)) {
        const name = eventName as SocketEvent
        const handler = handlers[name]
        this.on(name, handler)
      }
    }
  }

  auth() {
    emit('authentication', { username: this.userName, authHash: this.userPassword })
  }

  // Retry open with delay, force skips delay
  open(retry?: boolean, force?: boolean) {
    if (force || (!this.socket?.connected && !this.retrying)) {
      this.retrying = setTimeout(
        () => {
          this.retrying = undefined
          this.socket?.open()
        },
        retry ? FRONTEND_RETRY_DELAY : 0
      )
    }
  }

  close() {
    if (this.socket?.connected) {
      this.socket?.close()
    }
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
    console.log('Controller emit', event, args)
    this.socket?.emit(event, ...args)
    return true
  }
}

type EventHandlers = { [event: string]: (data?: any) => any }

function getEventHandlers() {
  const { connections, binaries, auth, backend, ui } = store.dispatch

  return {
    connect: () => {
      controller.auth()
      ui.set({ connected: true })
      backend.set({ error: false })
    },

    unauthorized: (error: Error) => auth.backendSignInError(error.message),

    authenticated: () => auth.authenticated(),

    disconnect: () => auth.disconnect(),

    dataReady: async (result: boolean) => {
      console.log('Data ready')
      backend.set({ dataReady: result })
      await cloudController.init()
      await store.dispatch.licensing.fetch()
      await store.dispatch.accounts.init()
      await store.dispatch.devices.init()
      await store.dispatch.ui.init()
      store.dispatch.applicationTypes.fetch()
      store.dispatch.announcements.fetch()
      await store.dispatch.devices.fetch()
      store.dispatch.sessions.fetch()
    },

    connect_error: () => {
      backend.set({ error: true })
    },

    pool: (result: IConnection[]) => {
      console.log('socket pool', result)
      connections.restoreConnections(result)
    },

    connection: (result: IConnection) => {
      console.log('socket connection', result)
      connections.updateConnection(result)
    },

    targets: (result: ITarget[]) => {
      console.log('socket targets', result)
      if (result) {
        backend.set({ targets: result })
        backend.targetUpdated(result)
      }
    },

    device: (result: ITargetDevice) => {
      console.log('socket device', result)
      if (result) backend.targetDeviceUpdated(result)
    },

    scan: (result: IScanData) => {
      console.log('socket scan', result)
      if (result) backend.set({ scanData: result })
    },

    interfaces: (result: IInterface[]) => {
      console.log('socket interfaces', result)
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

    // User
    'signed-out': () => auth.signedOut(),

    // AutoUpdate
    'update/downloaded': version => {
      backend.set({ update: version })
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
      analyticsHelper.trackConnect('connectionSucceeded', msg.connection)
    },
    'service/disconnected': (msg: ConnectionMessage) => {
      connections.updateConnection(msg.connection)
    },
    'service/error': (msg: ConnectionErrorMessage) => {
      connections.updateConnection(msg.connection)
      analyticsHelper.trackConnect('connectionFailed', msg.connection, msg)
    },

    'binary/install/error': (error: string) => binaries.installError(error),
    'binary/install/progress': (progress: number) => console.log('binary/install/progress', progress),
    'binary/installed': (info: InstallationInfo) => binaries.installed(info),
    'binary/not-installed': (binary: BinaryName) => binaries.notInstalled(binary),
    'required/app': (result: IAppValidation) => {
      ui.set({
        requireInstall: result.install,
        launchLoading: result.loading,
        launchPath: result.path,
      })
    },
  } as EventHandlers
}

const controller = new Controller()
export default controller
export const emit = controller.emit
