import { ChildProcess } from 'child_process'
import { IService } from 'remote.it'
import httpProxy from 'http-proxy'

declare global {
  interface UserCredentials {
    username: string
    authHash: string
  }
}
