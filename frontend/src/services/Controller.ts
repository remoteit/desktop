import io from 'socket.io-client'
import { store } from '../store'
import { PORT, FRONTEND_RETRY_DELAY } from '../shared/constants'
import { EventEmitter } from 'events'
import analytics, { CONNECTION_TYPE_FAILOVER } from '../helpers/Analytics'

class Controller extends EventEmitter {
  private socket: SocketIOClient.Socket
  private retrying?: NodeJS.Timeout

  constructor() {
    super()
    const { protocol, host } = window.location
    const isDev = host === 'localhost:3000'
    const url = protocol === 'file:' || isDev ? `http://localhost:${PORT}` : '/'
    this.socket = io(url)
  }

  init() {
    const handlers = getEventHandlers()

    for (const eventName in handlers) {
      if (handlers.hasOwnProperty(eventName)) {
        const name = eventName as SocketEvent
        const handler = handlers[name]
        this.on(name, handler)
      }
    }
  }

  // Retry open with delay, force skips delay
  open(retry?: boolean, force?: boolean) {
    if (force || (!this.socket.connected && !this.retrying)) {
      this.retrying = setTimeout(
        () => {
          this.retrying = undefined
          this.socket.open()
        },
        retry ? FRONTEND_RETRY_DELAY : 0
      )
    }
  }

  close() {
    if (this.socket.connected) {
      this.socket.close()
    }
  }

  on(eventName: SocketEvent, handler: (...args: any[]) => void) {
    this.socket.on(eventName, handler)
    return this
  }

  off(eventName: SocketEvent) {
    this.socket.off(eventName)
    return this
  }

  emit = (event: SocketAction, ...args: any[]): boolean => {
    console.log('Controller emit', event, args)
    this.socket.emit(event, ...args)
    return true
  }
}

type EventHandlers = { [event: string]: (data?: any) => any }

function getEventHandlers() {
  const { binaries, auth, backend, logs, ui } = store.dispatch

  return {
    connect: () => {
      ui.set({ connected: true })
      backend.set({ error: false })
      auth.init()
    },

    unauthorized: (error: Error) => auth.signInError(error.message),

    'server/authenticated': () => auth.authenticated(),

    disconnect: () => {
      ui.set({ connected: false })
      auth.handleDisconnect()
    },

    connect_error: () => {
      backend.set({ error: true })
      auth.handleDisconnect()
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
        ui.setupUpdated(result.length)
      }
    },

    device: (result: ITargetDevice) => {
      console.log('socket device', result)
      if (result) backend.set({ device: result })
    },

    scan: (result: IScanData) => {
      console.log('socket scan', result)
      if (result) backend.set({ scanData: result })
    },

    oob: (oob: IOob) => {
      console.log('oob', oob)
      backend.set({ lan: oob })
      analytics.setOobAvailable(oob.oobAvailable)
      analytics.setOobActive(oob.oobActive)
    },

    interfaces: (result: IInterface[]) => {
      console.log('socket interfaces', result)
      if (result) backend.set({ interfaces: result })
    },

    freePort: (result: number) => backend.set({ freePort: result }),

    dataReady: (result: boolean) => backend.set({ dataReady: result }),

    environment: (result: ILookup) => {
      backend.set({ environment: result })
      analytics.setOS(result.os)
      analytics.setOsVersion(result.osVersion)
      analytics.setArch(result.arch)
      analytics.setManufacturerDetails(result.manufacturerDetails)
    },

    preferences: (result: IPreferences) => backend.set({ preferences: result }),

    //Analytics
    setOSInfo: (osInfo: IosInfo) => {
      analytics.setOS(osInfo.os)
      analytics.setOsVersion(osInfo.version)
      analytics.setArch(osInfo.arch)
    },

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
    'service/started': (msg: ConnectionMessage) => {
      logs.add({ id: msg.connection.id, log: msg.raw })
      backend.setConnection(msg.connection)
    },
    'service/connected': (msg: ConnectionMessage) => {
      logs.add({ id: msg.connection.id, log: msg.raw })
      backend.setConnection(msg.connection)
      analytics.track('connectionSucceeded', {
        connectionType: CONNECTION_TYPE_FAILOVER,
        serviceId: msg.connection?.id,
        serviceName: msg.connection?.name,
        serviceType: msg.connection?.typeID,
      })
    },
    'service/disconnected': (msg: ConnectionMessage) => {
      logs.add({ id: msg.connection.id, log: msg.raw })
      backend.setConnection(msg.connection)
    },
    'service/forgotten': (id: string) => console.log(id),
    'service/error': (msg: ConnectionErrorMessage) => {
      logs.add({ id: msg.connection.id, log: `\nCONNECTION ERROR\n${msg.error}\n` })
      backend.setConnection(msg.connection)
      analytics.track('connectionFailed', {
        connectionType: CONNECTION_TYPE_FAILOVER,
        serviceId: msg.connection?.id,
        serviceName: msg.connection?.name,
        serviceType: msg.connection?.typeID,
        errorCode: msg.code,
        errorMessage: msg.error,
      })
    },
    'service/status': (msg: ConnectionMessage) => logs.add({ id: msg.connection.id, log: msg.raw }),
    'service/uptime': (msg: ConnectionMessage) => console.log('service/uptime', msg),
    'service/request': (msg: ConnectionMessage) => logs.add({ id: msg.connection.id, log: msg.raw }),
    'service/tunnel/opened': (msg: ConnectionMessage) => logs.add({ id: msg.connection.id, log: msg.raw }),
    'service/tunnel/closed': (msg: ConnectionMessage) => logs.add({ id: msg.connection.id, log: msg.raw }),
    'service/version': (msg: ConnectionMessage) => logs.add({ id: msg.connection.id, log: msg.raw }),
    'service/unknown-event': (msg: ConnectionMessage) => logs.add({ id: msg.connection.id, log: msg.raw }),
    // 'service/throughput': (msg: ConnectionMessage) => console.log('service/throughput', msg),

    // muxer binary
    'binary/install/error': (error: string) => binaries.installError(error),
    'binary/install/progress': (progress: number) => console.log('binary/install/progress', progress),
    'binary/installed': (info: InstallationInfo) => binaries.installed(info),
    'binary/not-installed': (binary: string) => binaries.notInstalled(binary),
  } as EventHandlers
}

const controller = new Controller()
export default controller
export const emit = controller.emit
