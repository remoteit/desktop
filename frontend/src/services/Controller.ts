import io from 'socket.io-client'
import { store } from '../store'
import { PORT, FRONTEND_RETRY_DELAY } from '../shared/constants'
import { EventEmitter } from 'events'
import analyticsHelper from '../helpers/analyticsHelper'

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
  const { binaries, auth, backend, logs, ui } = store.dispatch

  return {
    connect: () => {
      controller.auth()
      ui.set({ connected: true })
      backend.set({ error: false })
    },

    unauthorized: (error: Error) => auth.backendSignInError(error.message),

    'server/authenticated': () => auth.authenticated(),

    disconnect: () => {
      ui.set({ connected: false })
    },

    connect_error: () => {
      backend.set({ error: true })
    },

    pool: (result: IConnection[]) => {
      console.log('socket pool', result)
      backend.set({ connections: result })
    },

    connection: (result: IConnection) => {
      console.log('socket connection', result)
      backend.setConnection(result)
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

    oob: (oob: IOob) => {
      backend.set({ lan: oob })
      analyticsHelper.setOobAvailable(oob.oobAvailable)
      analyticsHelper.setOobActive(oob.oobActive)
    },

    interfaces: (result: IInterface[]) => {
      console.log('socket interfaces', result)
      if (result) backend.set({ interfaces: result })
    },

    freePort: (result: number) => backend.set({ freePort: result }),

    dataReady: (result: boolean) => backend.set({ dataReady: result }),

    environment: (result: ILookup<any>) => {
      backend.set({ environment: result })
      analyticsHelper.setOS(result.os)
      analyticsHelper.setOsVersion(result.osVersion)
      analyticsHelper.setArch(result.arch)
      analyticsHelper.setManufacturerDetails(result.manufacturerDetails)
    },

    preferences: (result: IPreferences) => backend.set({ preferences: result }),

    // User
    'signed-out': () => auth.signedOut(),

    // AutoUpdate
    'update/downloaded': version => backend.set({ update: version }),

    // AutoUpdate
    'cli/error': error => {
      backend.set({ globalError: '' }) // So we re-trigger a new error if one exists
      backend.set({ globalError: error })
      ui.reset()
    },

    // Connections
    'service/connected': (msg: ConnectionMessage) => {
      logs.add({ id: msg.connection.id, log: msg.raw })
      backend.setConnection(msg.connection)
      analyticsHelper.trackConnect('connectionSucceeded', msg.connection)
    },
    'service/disconnected': (msg: ConnectionMessage) => {
      logs.add({ id: msg.connection.id, log: msg.raw })
      backend.setConnection(msg.connection)
    },
    'service/forgotten': (id: string) => console.log(id),
    'service/error': (msg: ConnectionErrorMessage) => {
      logs.add({ id: msg.connection.id, log: `\nCONNECTION ERROR\n${msg.message}\n` })
      backend.setConnection(msg.connection)
      analyticsHelper.trackConnect('connectionFailed', msg.connection, msg)
    },

    'binary/install/error': (error: string) => binaries.installError(error),
    'binary/install/progress': (progress: number) => console.log('binary/install/progress', progress),
    'binary/installed': (info: InstallationInfo) => binaries.installed(info),
    'binary/not-installed': (binary: string) => binaries.notInstalled(binary),

    'service/putty/required': (result: IPuttyValidation) => {
      console.log({ result })
      ui.set({
        requireInstallPutty: result.install,
        loading: result.loading,
        pathPutty: result.pathPutty,
      })
    },
  } as EventHandlers
}

const controller = new Controller()
export default controller
export const emit = controller.emit
