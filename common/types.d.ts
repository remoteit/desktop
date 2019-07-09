declare global {
  export interface ConnectionInfo {
    deviceID?: string
    id: string
    name: string
    type: string
    port?: number
    pid?: number
    connecting?: boolean
    error?: {
      code?: number
      message: string
    }
  }

  export interface ConnectdMessage {
    connection: ConnectionInfo
    raw?: string
    extra?: any
  }

  export interface ConnectionErrorMessage {
    code?: number
    error: string
    connection: ConnectionInfo
  }

  export type SocketEmit = (name: string, ...args: any[]) => any

  // export enum ConnectdEvent {
  //   error = 'service/error',
  //   uptime = 'service/uptime',
  //   status = 'service/status',
  //   throughput = 'service/throughput',
  //   updated = 'service/updated',
  //   request = 'service/request',
  //   connecting = 'service/connecting',
  //   connected = 'service/connected',
  //   tunnelOpened = 'service/tunnel/opened',
  //   tunnelClosed = 'service/tunnel/closed',
  //   disconnected = 'service/disconnected',
  //   unknown = 'service/unknown-event',
  // }
}

// declare module 'remote.it' {
//   export interface IService {
//     connecting?: boolean
//     port?: number
//     pid?: number
//   }
// }

export {}
