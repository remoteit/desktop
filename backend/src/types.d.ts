import { ChildProcess } from 'child_process'
import { IService } from 'remote.it'

declare global {
  export type ConfigFile = {
    device?: IDevice | undefined
    services?: ITarget[]
    auth?: UserCredentials | undefined
  } & { [key: string]: any }
}
