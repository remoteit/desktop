import debug from 'debug'
import { socket } from '../services/backend'
import { IService, IUser } from 'remote.it'

const d = debug('r3:desktop:frontend:services:service')

export interface ConnectResponse {
  port: number
  pid: number
  service: IService
}

/**
 * Connect to a service and return what port and process ID
 * it is running at. A separate event for connect
 */
export async function connect(
  service: IService,
  user: IUser
): Promise<ConnectResponse> {
  return new Promise(success => {
    d('Attempting to connect to service: %O', service)
    socket.emit(
      'service/connect',
      { service, user },
      (resp: ConnectResponse) => {
        d('Connection response: %O', resp)
        success(resp)
      }
    )
  })
}

export async function getConnections(): Promise<ConnectResponse[]> {
  return new Promise(success => {
    socket.emit('connection/list', (resp: ConnectResponse[]) => {
      d('Get connections: %O', resp)
      success(resp)
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
