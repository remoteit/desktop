import { DeviceState, ServiceState } from 'remote.it'

declare global {
  /**
   * Device sort options. Defaults to 'alpha'
   */
  export type SortType = 'alpha' | 'state'

  // @FIXME this should only be connection state info, not overloading device / service state
  export type ConnectionState = DeviceState | ServiceState | 'connecting' | 'disconnected' | 'unknown'
  // | 'active''
  // | 'inactive
  // | 'connecting'
  // | 'connected'
  // | 'restricted'

  export type Tab = 'connections' | 'devices'

  export type Page = 'connections' | 'devices' | 'setup' | 'settings' | 'network'

  export type Route = { [key in Page]: React.ReactNode }

  export type ServerMessageType =
    | 'service/error'
    | 'service/status'
    | 'service/updated'
    | 'service/request'
    | 'service/connected'
    | 'service/tunnel/opened'
    | 'service/tunnel/closed'
    | 'service/disconnected'
    | 'service/unknown-event'
    | 'service/throughput'
    | 'service/uptime'
    | 'connectd/install/error'

  export type LogType = 'general' | 'connectd' | 'alert'

  export interface Log {
    type: LogType
    message: string
    data?: any
    createdAt?: Date
  }

  export type IconWeight = 'light' | 'regular' | 'solid'

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

  export interface IDataDisplay {
    label: string
    value?: any
  }
}

declare module 'remote.it' {
  export interface IService {
    connecting?: boolean
    port?: number
    pid?: number
  }
}

export {}
