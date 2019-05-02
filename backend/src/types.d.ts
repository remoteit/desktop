import { ChildProcess } from 'child_process'
import { IService } from 'remote.it'
import httpProxy from 'http-proxy'

declare global {
  export interface ConnectdProcessData {
    pid?: number
    port: number
    service: IService
  }
  export interface ConnectdProcess extends ChildProcess, ConnectdProcessData {}
}

declare module 'remote.it' {
  export interface IService {
    // The port in which the service is connected to
    port?: number
  }
}
