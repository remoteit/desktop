/* 
  This is a shared file between backend and frontend
  It will be copied from the frontend to the backend on build
  
  ONLY EDIT THE SOURCE FILE IN frontend
*/
export const CLIENT_ID = process.env.REACT_APP_CLIENT_ID || '26g0ltne0gr8lk1vs51mihrmig'
export const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-west-2_6nKjyW7yg'
export const COGNITO_AUTH_DOMAIN = process.env.COGNITO_AUTH_DOMAIN || 'auth.remote.it'
export const API_URL = process.env.REACT_APP_API_URL || process.env.API_URL || 'https://api.remote.it/apv/v27'
export const AUTH_API_URL =
  process.env.REACT_AUTH_API_URL || process.env.AUTH_API_URL || 'https://auth.api.remote.it/v1'
export const GRAPHQL_API = process.env.REACT_APP_GRAPHQL_API || 'https://api.remote.it/graphql/beta'
export const GRAPHQL_BETA_API = process.env.REACT_APP_GRAPHQL_BETA_API || 'https://api.remote.it/graphql/beta'
export const DEVELOPER_KEY =
  process.env.REACT_APP_DEVELOPER_KEY || process.env.DEVELOPER_KEY || 'Mjc5REIzQUQtMTQyRC00NTcxLTlGRDktMTVGNzVGNDYxQkE3'
export const PROTOCOL =
  process.env.PROTOCOL || process.env.NODE_ENV === 'development' ? 'remoteitdev://' : 'remoteit://'
export const PORTAL = (process.env.REACT_APP_PORTAL || process.env.PORTAL) === 'true' ? true : false
export const REDIRECT_URL = process.env.REACT_APP_REDIRECT_URL || process.env.REDIRECT_URL || PROTOCOL + 'authCallback'
export const CALLBACK_URL =
  process.env.REACT_APP_CALLBACK_URL || process.env.CALLBACK_URL || process.env.NODE_ENV === 'development'
    ? 'https://dev-auth.internal.remote.it/v1/callback/'
    : 'https://auth.api.remote.it/v1/callback/'
export const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'wss://ws.remote.it/v1'
export const WEBSOCKET_BETA_URL = process.env.REACT_APP_WEBSOCKET_BETA_URL || 'wss://ws.remote.it/beta'
export const PORT = process.env.REACT_APP_PORT || 29999
export const DEMO_DEVICE_CLAIM_CODE = 'GUESTVPC'
export const DEMO_DEVICE_ID = '80:00:01:7F:7E:00:48:1B'

//API Zendesk
export const ZENDESK_URL = process.env.ZENDESK_URL || 'https://remot3it.zendesk.com/api/v2/'

//segment-analytics
export const SEGMENT_PROJECT_PORTAL_KEY = 'kYemtqKHE7qM7prQ1JWTP1ThMUYZBmym'
export const SEGMENT_PROJECT_KEY = 'tMedSrVUwDIeRs6kndztUPgjPiVlDmAe'

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
export const REGEX_CHARACTERS = /^([^0-9]*)$/
export const REGEX_LAST_NUMBER = /-*\d*$/
export const REGEX_VALID_IP =
  /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/
export const REGEX_VALID_HOSTNAME =
  /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/
export const REGEX_TAG_SAFE = /[^a-zA-Z0-9-]/g
export const REGEX_VALID_URL = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/
export const REGEX_CONNECTION_NAME = /[^a-zA-Z0-9-]+/g
export const REGEX_CONNECTION_TRIM = /^-|-$/
export const FRONTEND_RETRY_DELAY = 20000
export const MAX_NAME_LENGTH = 100
export const MAX_CONNECTION_NAME_LENGTH = 62
export const SIDEBAR_WIDTH = 250
export const ADD_EVENTS_ACTIONS = ['add', 'update']
export const DESKTOP_EPOCH = new Date('2020-01-01T00:00:00')

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

export const DEFAULT_CONNECTION: IConnection = {
  id: '',
  name: '',
  owner: { id: '', email: '' },
  deviceID: '',
  online: false,
  timeout: 15,
  enabled: false,
  ip: IP_PRIVATE,
  targetHost: '',
  autoLaunch: false,
  restriction: IP_OPEN,
  publicRestriction: IP_LATCH,
  default: true,
}

export const PUBLIC_CONNECTION = {
  autoLaunch: true,
  port: undefined,
  public: true,
  timeout: 15,
  isP2P: false,
  failover: false,
  proxyOnly: true,
  log: false,
}

export const ROUTES: IRoute[] = [
  {
    key: 'failover',
    icon: 'code-branch',
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
