import { ChildProcess } from 'child_process'
import { IService } from 'remote.it'
import httpProxy from 'http-proxy'

declare global {
  interface UserCredentials {
    username: string
    authHash: string
  }

  interface ConnectionArgs {
    authHash: string
    host?: string
    id: string
    name: string
    port?: number
    lanShare?: ipAddress
    username: string
  }

  interface SavedConnection {
    id: string
    port?: number
    name: string
    lanShare?: ipAddress
    autoStart?: boolean
  }
}
