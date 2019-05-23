import socketIO from 'socket.io'
import { freePort } from '../../utils/freePort'
import { EVENTS } from '../../connectd/connection'
import { IService } from 'remote.it'
import { PEER_PORT_RANGE } from '../../constants'
import { register } from '../../connectd/pool'
import debug from 'debug'

const d = debug('r3:desktop:backend:routes:connections:start')

let initialPort = PEER_PORT_RANGE[0]

export function start(socket: socketIO.Socket) {
  return async (
    { service, user }: { service: IService; user: User },
    callback: (connection: Connection) => void
  ) => {
    const port = await freePort([initialPort, PEER_PORT_RANGE[1]])

    d('Starting connection to service on port: %O', { service, port })

    const connection = {
      port,
      serviceID: service.id,
      serviceName: service.name,
      deviceID: service.deviceID,
      type: service.type,
    }
    const connectd = await register({ connection, user })

    if (!connectd) return

    const data = { ...connection, pid: connectd.pid }

    d('Created connection: %O', data)

    // Forward all events to the browser
    // TODO: Turn into helper:
    Object.values(EVENTS).map(event => {
      connectd.on(event, (payload: any) => socket.emit(event, payload))
    })

    connectd.on(EVENTS.connected, () => callback(data))
  }
}
