import { ChildProcess } from 'child_process'

declare global {
  type ConfigFile = {
    device?: ITargetDevice | undefined
    services?: ITarget[]
    auth?: UserCredentials | undefined
  } & { [key: string]: any }

  type ManufacturerFile = {
    manufacturer: IManufacturer
  }

  type CliStderr = {
    code: number
    message: string
  }
}

declare module 'is-port-reachable'
