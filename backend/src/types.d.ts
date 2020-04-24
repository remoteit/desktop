import { ChildProcess } from 'child_process'
import { IService } from 'remote.it'

declare global {
  type ConfigFile = {
    device?: IDevice | undefined
    services?: ITarget[]
    auth?: UserCredentials | undefined
  } & { [key: string]: any }

  type ManufacturerFile = {
    manufacturer: IManufacturer
  }

  type CliStderr = {
    status: 1 | 0 | -1
    details: string[]
  }
}
