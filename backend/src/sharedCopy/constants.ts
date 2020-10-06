/* 
  This is a shared file between backend and frontend
  It will be copied from the frontend to the backend on build
  
  ONLY EDIT THE SOURCE FILE IN frontend
*/
export const CLIENT_ID = process.env.REACT_APP_CLIENT_ID || '26g0ltne0gr8lk1vs51mihrmig'
export const API_URL = process.env.REACT_APP_API_URL || process.env.API_URL || 'https://api.remot3.it/apv/v27'
export const GRAPHQL_API = process.env.REACT_APP_GRAPHQL_API || 'https://api.remote.it/v1/graphql'
export const GRAPHQL_BETA_API = process.env.REACT_APP_GRAPHQL_BETA_API || 'https://api.remote.it/beta/graphql'
export const DEVELOPER_KEY =
  process.env.REACT_APP_DEVELOPER_KEY || process.env.DEVELOPER_KEY || 'Mjc5REIzQUQtMTQyRC00NTcxLTlGRDktMTVGNzVGNDYxQkE3'
export const REDIRECT_URL =
  process.env.REACT_APP_REDIRECT_URL || process.env.REDIRECT_URL || process.env.NODE_ENV === 'development' ? 'remoteitdev://authCallback' : 'remoteit://authCallback'
export const CALLBACK_URL =
  process.env.REACT_APP_CALLBACK_URL || process.env.CALLBACK_URL || process.env.NODE_ENV === 'development' ? 'https://dev-auth.internal.remote.it/v1/callback' : 'https://auth.api.remote.it/v1/callback'

export const PORT = process.env.REACT_APP_PORT || 29999
export const HEARTBEAT_INTERVAL = 1000 * 15

export const IP_OPEN: ipAddress = '0.0.0.0'
export const IP_LATCH: ipAddress = '255.255.255.255'
export const IP_PRIVATE: ipAddress = '127.0.0.1'

export const REGEX_LAST_PATH = /\/[^/]+$/g
export const REGEX_FIRST_PATH = /^\/(\w+)/g
export const REGEX_NAME_SAFE = /[^a-zA-Z0-9_ -]/g
export const REGEX_NOT_FILE_SAFE = /[\W]/g
export const REGEX_IP_SAFE = /[^0-9.]+/g
export const REGEX_PORT_SAFE = /[^0-9]+/g
export const REGEX_NUMERIC_VALUE = /=(\d+)/
export const REGEX_LAST_NUMBER = /-*\d*$/

export const FRONTEND_RETRY_DELAY = 20000
export const TARGET_SERVICES_LIMIT = 10
export const MAX_NAME_LENGTH = 100

export const LEGACY_ATTRIBUTES = [
  'categoryA',
  'categoryB',
  'categoryC',
  'categoryD',
  'categoryE',
  'statusA',
  'statusB',
  'statusC',
  'statusD',
  'statusE',
]

export const DEFAULT_TARGET: ITarget | ITargetDevice = {
  hardwareID: '',
  hostname: IP_PRIVATE,
  disabled: false,
  name: '',
  port: 0,
  secret: '',
  type: 1,
  uid: '',
}

export const ROUTES: IRoute[] = [
  {
    key: 'failover',
    icon: 'cloud',
    name: 'Peer to peer with proxy failover',
    description:
      'Default is to prioritize peer to peer connections over proxy connections, but use proxy if peer to peer fails. Also allows overriding at time of connection.',
  },
  {
    key: 'p2p',
    icon: 'arrows-h',
    name: 'Peer to peer only',
    description: 'Only connect using peer to peer. Does not allow overriding.',
  },
  {
    key: 'proxy',
    icon: 'cloud',
    name: 'Proxy only',
    description: 'Only allow proxy connections. Does not allow overriding.',
  },
]
