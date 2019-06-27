import debug from 'debug'
import { socket } from '../services/backend'
import { IService, IUser } from 'remote.it'

const d = debug('r3:desktop:frontend:services:service')

/**
 * Connect to a service and return what port and process ID
 * it is running at. A separate event for connect
 */
export async function connect(
  service: IService,
  user: IUser
): Promise<ConnectionInfo> {
  return new Promise(success => {
    d('Attempting to connect to service: %O', service)
    socket.emit(
      'service/connect',
      { service, user },
      (resp: ConnectionInfo) => {
        d('Connection response: %O', resp)
        success(resp)
      }
    )
  })
}

export async function getConnections(): Promise<ConnectionInfo[]> {
  return new Promise(success => {
    socket.emit('connection/list', (resp: ConnectionInfo[]) => {
      d('Get connections: %O', resp)
      success(resp)
    })
  })
}

export async function restart(serviceID: string): Promise<ConnectionInfo> {
  return new Promise(success => {
    socket.emit('service/restart', serviceID, (connection: ConnectionInfo) => {
      d('Restart succeeded? %O', connection)
      success(connection)
    })
  })
}

export async function disconnect(serviceID: string): Promise<boolean> {
  return new Promise(success => {
    socket.emit('service/disconnect', serviceID, (succeeded: boolean) => {
      d('Shutdown succeeded? %O', succeeded)
      success(succeeded)
    })
  })
}

export async function forget(serviceID: string) {
  return new Promise(success => {
    socket.emit(
      'service/forget',
      serviceID,
      (connections: ConnectionInfo[]) => {
        d('New connections: %O', connections)
        success(connections)
      }
    )
  })
}
