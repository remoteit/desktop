import { ChildProcess } from 'child_process'
import { IService } from 'remote.it'
import httpProxy from 'http-proxy'

declare global {
  interface UserCredentials {
    username: string
    authHash: string
  }

  interface ConnectionData {
    autoStart?: boolean
    id: string
    port: number
    name?: string
    pid?: number
    error?: Error
  }

  interface ConnectionArgs {
    authHash: string
    host?: string
    id: string
    name?: string
    port?: number
    username: string
  }

  interface SavedConnection {
    id: string
    port: number
    name?: string
  }
}
