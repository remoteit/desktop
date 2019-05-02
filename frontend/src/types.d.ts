import { DeviceState, ServiceState } from 'remote.it'

declare global {
  export type ConnectionState = DeviceState | ServiceState | 'connecting'
  // | 'active'
  // | 'inactive'
  // | 'connecting'
  // | 'connected'
  // | 'restricted'
  export interface ConnectdMessage {
    type: string
    raw: string
    serviceID: string
    port: number
  }

  export type FontSizes = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl'

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
