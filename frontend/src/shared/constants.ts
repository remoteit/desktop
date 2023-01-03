/* 
  This is a shared file between backend and frontend
  It will be copied from the frontend to the backend on build
  
  ONLY EDIT THE SOURCE FILE IN frontend
*/
const env = process.env
export const CLIENT_ID = env.REACT_APP_CLIENT_ID
export const COGNITO_USER_POOL_ID = env.REACT_APP_COGNITO_USER_POOL_ID || 'us-west-2_6nKjyW7yg'
export const COGNITO_AUTH_DOMAIN = env.REACT_APP_COGNITO_AUTH_DOMAIN || 'auth.remote.it'
export const API_URL = env.REACT_APP_API_URL || env.API_URL || 'https://api.remote.it/apv/v27'
export const AUTH_API_URL = env.REACT_APP_AUTH_API_URL || env.AUTH_API_URL || 'https://auth.api.remote.it/v1'
export const GRAPHQL_API = env.REACT_APP_GRAPHQL_API
export const GRAPHQL_BETA_API = env.REACT_APP_GRAPHQL_BETA_API
export const DEVELOPER_KEY =
  env.REACT_APP_DEVELOPER_KEY || env.DEVELOPER_KEY || 'Mjc5REIzQUQtMTQyRC00NTcxLTlGRDktMTVGNzVGNDYxQkE3'
export const PROTOCOL = env.PROTOCOL || env.NODE_ENV === 'development' ? 'remoteitdev://' : 'remoteit://'
export const PORTAL = (env.REACT_APP_PORTAL || env.PORTAL) === 'true' ? true : false
export const REDIRECT_URL = env.REACT_APP_REDIRECT_URL || env.REDIRECT_URL || PROTOCOL + 'authCallback'
export const CALLBACK_URL =
  env.REACT_APP_CALLBACK_URL || env.CALLBACK_URL || env.NODE_ENV === 'development'
    ? env.REACT_APP_DEV_CALLBACK_URL
    : env.REACT_APP_PROD_CALLBACK_URL
export const WEBSOCKET_URL = env.REACT_APP_WEBSOCKET_URL
export const WEBSOCKET_BETA_URL = env.REACT_APP_WEBSOCKET_BETA_URL
export const PORT = env.REACT_APP_PORT || 29999
export const DEMO_DEVICE_CLAIM_CODE = 'GUESTVPC'
export const DEMO_DEVICE_ID = '80:00:01:7F:7E:00:48:1B'
export const TEST_HEADER = 'test-header'

//API Zendesk
export const ZENDESK_URL = env.ZENDESK_URL || env.REACT_APP_ZENDESK_URL
export const ZENDESK_KEY = env.ZENDESK_KEY || env.REACT_APP_ZENDESK_KEY
//Analytics
export const GOOGLE_TAG_MANAGER_PORTAL_KEY = env.REACT_APP_GOOGLE_TAG_MANAGER_PORTAL_KEY
export const GOOGLE_TAG_MANAGER_DESKTOP_KEY = env.REACT_APP_GOOGLE_TAG_MANAGER_DESKTOP_KEY

export const IP_OPEN: ipAddress = '0.0.0.0'
export const IP_LATCH: ipAddress = '255.255.255.255'
export const IP_PRIVATE: ipAddress = '127.0.0.1'

export const REGEX_LAST_PATH = /\/[^/]+$/g
export const REGEX_FIRST_PATH = /^\/(\w+)/g
export const REGEX_NAME_SAFE = /[^a-zA-Z0-9_ -]/g
export const REGEX_NOT_FILE_SAFE = /[\W]/g
export const REGEX_IP_SAFE = /[^0-9.]+/g
export const REGEX_PORT_SAFE = /[^0-9]+/g
export const REGEX_DOMAIN_SAFE = /[^a-zA-Z0-9-.]+/g
export const REGEX_NUMERIC_VALUE = /=(\d+)/
export const REGEX_CHARACTERS = /^([^0-9]*)$/
export const REGEX_LAST_NUMBER = /-*\d*$/
export const REGEX_VALID_IP =
  /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/
export const REGEX_VALID_HOSTNAME =
  /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/
export const REGEX_TAG_SAFE = /[\s]/g
export const REGEX_CONNECTION_NAME = /[^a-zA-Z0-9-]+/g
export const REGEX_CONNECTION_TRIM = /^-|-$/

export const FRONTEND_RETRY_DELAY = 20000
export const MAX_NAME_LENGTH = 100
export const MAX_CONNECTION_NAME_LENGTH = 62
export const MAX_DESCRIPTION_LENGTH = 1024
export const SIDEBAR_WIDTH = 250
export const ORGANIZATION_BAR_WIDTH = 70
export const ADD_EVENTS_ACTIONS = ['add', 'update']
export const DESKTOP_EPOCH = new Date('2020-01-01T00:00:00')
export const HIDE_SIDEBAR_WIDTH = 1150
export const HIDE_TWO_PANEL_WIDTH = 750
export const CLI_REACHABLE_ERROR_CODE = 523

export const DEFAULT_CONNECTION: IConnection = {
  id: '',
  name: '',
  owner: { id: '', email: '' },
  deviceID: '',
  online: true,
  timeout: 15,
  enabled: false,
  ip: IP_PRIVATE,
  targetHost: '',
  autoLaunch: false,
  restriction: IP_OPEN,
  publicRestriction: IP_LATCH,
  default: true,
}

export const DEFAULT_SERVICE: IService = {
  id: '',
  contactedAt: new Date(),
  createdAt: new Date(),
  name: '',
  subdomain: '',
  lastReported: new Date(),
  state: 'inactive',
  type: '',
  typeID: 1,
  deviceID: '',
  access: [],
  license: 'UNKNOWN',
  attributes: {},
}

export const LANGUAGES: ILookup<string> = {
  en: 'English',
  ja: 'Japanese',
}
