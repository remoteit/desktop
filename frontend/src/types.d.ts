import { DeviceState, ServiceState } from 'remote.it'

declare global {
  export interface Connection {
    deviceID: string
    serviceID: string
    serviceName: string
    type: string
    port: number
  }

  export type ConnectionState = DeviceState | ServiceState | 'connecting'
  // | 'active'
  // | 'inactive'
  // | 'connecting'
  // | 'connected'
  // | 'restricted'

  export type Tab = 'connections' | 'devices'

  export type Page = 'devices' | 'debug' | 'settings'

  export type Route = { [key in Page]: React.ReactNode }

  export type ServerMessageType =
    | 'service/error'
    | 'service/status'
    | 'service/updated'
    | 'service/request'
    | 'service/connecting'
    | 'service/connected'
    | 'service/tunnel/opened'
    | 'service/tunnel/closed'
    | 'service/disconnected'
    | 'service/unknown-event'
    | 'service/throughput'
    | 'service/uptime'
    | 'connectd/install/error'

  export interface ConnectLogMessage {
    type: string
    raw: string
    serviceID: string
    port: number
    error?: Error
  }

  export type LogType = 'general' | 'connectd' | 'alert'

  export interface Log {
    type: LogType
    message: string
    data?: any
    createdAt?: Date
  }

  export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl'

  export type IconWeight = 'light' | 'regular' | 'solid'

  export type BrandColors =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'white'
    | 'gray'
    | 'gray-light'
    | 'gray-lighter'
    | 'gray-lightest'
    | 'gray-dark'
    | 'gray-darker'
    | 'gray-darkest'

  /**
   * Action which are called by components that are wrapped
   * by the context API store.
   */
  export interface Action {
    type: string
    [key: string]: any
  }

  interface Window {
    process?: {
      type?: string
    }
  }
}

declare module 'remote.it' {
  export interface IService {
    // The port in which the service is connected to
    connecting?: boolean
    port?: number
    pid?: number
  }
}

export {}
