import { ChildProcess } from 'child_process'
import { IService } from 'remote.it'
import httpProxy from 'http-proxy'

declare global {
  export interface User {
    authHash: string
    username: string
    language?: string // 'en' | 'jp'
  }
}
