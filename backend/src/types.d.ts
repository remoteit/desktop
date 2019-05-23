import { ChildProcess } from 'child_process'
import { IService } from 'remote.it'
import httpProxy from 'http-proxy'

declare global {
  export interface Connection {
    deviceID: string
    serviceID: string
    serviceName: string
    type: string
    port: number
    pid?: number
  }

  export interface ConnectdProcess extends ChildProcess, Connection {}

  export interface User {
    authHash: string
    username: string
    language?: string // 'en' | 'jp'
  }
}

declare module 'remote.it' {
  export interface IService {
    // The port in which the service is connected to
    port?: number
  }
}
