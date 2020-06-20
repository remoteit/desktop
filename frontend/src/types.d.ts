import { DeviceState, ServiceState } from 'remote.it'
import { AnalyticsJS } from 'segment-analytics'

declare global {
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

  export type IconType = 'light' | 'regular' | 'solid' | 'brands'

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
    analytics: AnalyticsJS
  }

  export interface IDataDisplay {
    label: string
    value?: any
    help?: string
    format?: 'duration' | 'percent' | 'round' | 'location'
  }
}

declare module 'remote.it' {
  // export interface IService {
  //   connecting?: boolean
  //   port?: number
  // }
}

export {}
