import { ChildProcess } from 'child_process'
import { IService } from 'remote.it'
import httpProxy from 'http-proxy'

declare global {
  export interface ConnectdProcess extends ChildProcess {
    service: IService
    port: number
  }
}
