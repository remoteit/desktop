import { DeviceState, ServiceState } from 'remote.it'
import { AnalyticsJS } from 'segment-analytics'

declare global {
  // @FIXME this should only be connection state info, not overloading device / service state
  type ConnectionState = DeviceState | ServiceState | 'connecting' | 'disconnected' | 'unknown'
  // | 'active''
  // | 'inactive
  // | 'connecting'
  // | 'connected'
  // | 'restricted'

  type Tab = 'connections' | 'devices'

  type Page = 'connections' | 'devices' | 'setup' | 'settings' | 'network'

  type Route = { [key in Page]: React.ReactNode }

  type ServerMessageType =
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

  type LogType = 'general' | 'connectd' | 'alert'

  interface Log {
    type: LogType
    message: string
    data?: any
    createdAt?: Date
  }

  interface ContactFields {
    accountCreated?: boolean
    companyName?: string
    createdAt?: Date
    email: string
    firstName?: string
    id?: string
    inviteSent?: boolean
    lastName?: string
    language?: AvailableLanguage | string
    updatedAt?: Date
  }

  interface IReactSelectOption {
    value: string
    label: string
  }

  interface ShareInfo {
    created: string
    email: string
    scripting: boolean
    services: string[]
    uid: string
    updated: string
    userid: string
  }

  interface SimplifiedService {
    id: string
    name: string
  }

  type IconType = 'light' | 'regular' | 'solid' | 'brands'

  /**
   * Action which are called by components that are wrapped
   * by the context API store.
   */
  interface Action {
    type: string
    [key: string]: any
  }

  interface Window {
    process?: {
      type?: string
    }
    analytics: AnalyticsJS
  }

  interface IDataDisplay {
    label: string
    value?: any
    help?: string
    format?: 'duration' | 'percent' | 'round' | 'location'
  }

  interface ILabel {
    color: string
    name: string
    id: number
  }

  type IContextMenu = { el?: HTMLElement; serviceID?: string }
}

declare module 'remote.it' {
  // export interface IService {
  //   connecting?: boolean
  //   port?: number
  // }
}

export {}
