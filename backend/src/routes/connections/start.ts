import socketIO from 'socket.io'
import { freePort } from '../../utils/freePort'
import { EVENTS } from '../../connectd/connection'
import { IService, IUser } from 'remote.it'
import { PEER_PORT_RANGE } from '../../constants'
import { register } from '../../connectd/pool'
import debug from 'debug'

const d = debug('r3:desktop:backend:routes:connections:start')

let initialPort = PEER_PORT_RANGE[0]

export function start(socket: socketIO.Socket) {
  return async (
    { service, user }: { service: IService; user: IUser },
    callback: (connection: ConnectdProcessData) => void
  ) => {
    const port = await freePort([++initialPort, PEER_PORT_RANGE[1]])

    d('Starting connection to service on port: %O', { service, port })

    const connection = await register({ port, service, user })

    const data = { pid: connection.pid, port, service }

    d('Created connection: %O', data)

    // Forward all events to the browser
    // TODO: Turn into helper:
    Object.values(EVENTS).map(event => {
      connection.on(event, (payload: any) => socket.emit(event, payload))
    })

    connection.on(EVENTS.connected, () => callback(data))
  }
}
