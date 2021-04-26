import { AnalyticsJS } from 'segment-analytics'
import { Color } from './styling'

declare global {
  type ConnectionState = IService['state'] | 'connecting' | 'disconnected' | 'unknown'

  type Tab = 'connections' | 'devices'

  type Page = 'connections' | 'devices' | 'setup' | 'settings' | 'network'

  type Route = { [key in Page]: React.ReactNode }

  type ServerMessageType =
    | 'service/error'
    | 'service/status'
    | 'service/updated'
    | 'service/request'
    | 'service/connected'
    | 'reachablePort'
    | 'service/tunnel/opened'
    | 'service/tunnel/closed'
    | 'service/disconnected'
    | 'service/unknown-event'
    | 'service/throughput'
    | 'service/uptime'
    | 'connectd/install/error'

  type ILicenseChip = {
    name: string
    color: string
    colorName: Color
    background?: string
    disabled?: boolean
    show?: boolean
  }

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
    isDisabled: boolean
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
    format?: 'duration' | 'percent' | 'round' | 'location' | 'element' | 'chip'
  }

  interface ILabel {
    color: string
    name: string
    id: number
    hidden?: boolean
  }

  interface ITag {
    id: number
    name: string
    label?: ILabel['id']
    color?: string
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
