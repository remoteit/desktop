/* 
This is a shared file between backend and frontend
It will be copied from the frontend to the backend on build

ONLY EDIT THE SOURCE FILE IN frontend
*/
import { env } from '../env'
export const NODE_ENV = env.NODE_ENV || 'development'
export const CLIENT_ID = env.VITE_CLIENT_ID
export const MOBILE_CLIENT_ID = env.VITE_MOBILE_CLIENT_ID
export const COGNITO_USER_POOL_ID = env.VITE_COGNITO_USER_POOL_ID || 'us-west-2_6nKjyW7yg'
export const COGNITO_AUTH_DOMAIN = env.VITE_COGNITO_AUTH_DOMAIN || 'auth.remote.it'
export const API_URL = env.VITE_API_URL || env.API_URL || 'https://api.remote.it/apv/v27'
export const AUTH_API_URL = env.VITE_AUTH_API_URL || env.AUTH_API_URL || 'https://auth.api.remote.it/v1'
export const GRAPHQL_API = env.VITE_GRAPHQL_API
export const GRAPHQL_BETA_API = env.VITE_GRAPHQL_BETA_API
export const DEVELOPER_KEY =
  env.VITE_DEVELOPER_KEY || env.DEVELOPER_KEY || 'Mjc5REIzQUQtMTQyRC00NTcxLTlGRDktMTVGNzVGNDYxQkE3'
export const PROTOCOL = env.PROTOCOL || 'remoteit://'
// export const PROTOCOL = env.PROTOCOL || env.NODE_ENV === 'development' ? 'remoteitdev://' : 'remoteit://'
export const PORTAL = (env.VITE_PORTAL || env.PORTAL) === 'true' ? true : false
export const REDIRECT_URL = env.VITE_REDIRECT_URL || env.REDIRECT_URL || PROTOCOL + 'authCallback'
export const SIGNOUT_REDIRECT_URL = PROTOCOL + 'signoutCallback'
export const CALLBACK_URL =
  env.VITE_CALLBACK_URL || env.CALLBACK_URL || env.NODE_ENV === 'development'
    ? env.VITE_DEV_CALLBACK_URL
    : env.VITE_PROD_CALLBACK_URL
export const WEBSOCKET_URL = env.VITE_WEBSOCKET_URL
export const WEBSOCKET_BETA_URL = env.VITE_WEBSOCKET_BETA_URL
export const PORT = env.VITE_PORT || 29999
export const PASSWORD_MIN_LENGTH = env.PASSWORD_MIN_LENGTH ? Number(env.PASSWORD_MIN_LENGTH) : 7
export const PASSWORD_MAX_LENGTH = env.PASSWORD_MAX_LENGTH ? Number(env.PASSWORD_MAX_LENGTH) : 64
export const RECAPTCHA_SITE_KEY = String(env.RECAPTCHA_SITE_KEY || '6Ldt3W4UAAAAAFtJAA4erruG9zT9TCOulJHO4L5e')

export const DEMO_DEVICE_CLAIM_CODE = 'GUESTVPC'
export const DEMO_DEVICE_ID = '80:00:01:7F:7E:00:48:1B'
export const TEST_HEADER = 'test-header'

//Airbrake
export const AIRBRAKE_ID = parseInt(env.VITE_AIRBRAKE_ID || '', 10)
export const AIRBRAKE_KEY = String(env.VITE_AIRBRAKE_KEY)

//API Zendesk
export const ZENDESK_URL = env.ZENDESK_URL || env.VITE_ZENDESK_URL
export const ZENDESK_KEY = env.ZENDESK_KEY || env.VITE_ZENDESK_KEY
//Analytics
export const GOOGLE_TAG_MANAGER_PORTAL_KEY = env.VITE_GOOGLE_TAG_MANAGER_PORTAL_KEY
export const GOOGLE_TAG_MANAGER_DESKTOP_KEY = env.VITE_GOOGLE_TAG_MANAGER_DESKTOP_KEY
export const GOOGLE_TAG_MANAGER_ANDROID_KEY = env.VITE_GOOGLE_TAG_MANAGER_ANDROID_KEY
export const GOOGLE_TAG_MANAGER_IOS_KEY = env.VITE_GOOGLE_TAG_MANAGER_IOS_KEY

export const IP_OPEN: ipAddress = '0.0.0.0'
export const IP_LATCH: ipAddress = '255.255.255.255'
export const IP_PRIVATE: ipAddress = '127.0.0.1'
export const CERTIFICATE_DOMAIN = 'at.remote.it'
export const ANONYMOUS_MANUFACTURER_CODE = 34560

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
export const REGEX_HIDDEN_PASSWORD = /^\*+$/
export const REGEX_URL_PATHNAME = /(\w*:\/\/)([^/]+\/)(.*)/
// export const REGEX_URL_PATHNAME = /\w*:\/\/[^/]*/
export const REGEX_VALID_IP =
  /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/
export const REGEX_VALID_HOSTNAME =
  /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/
export const REGEX_TAG_SAFE = /[\s]/g
export const REGEX_CONNECTION_NAME = /[^a-zA-Z0-9-]+/g
export const REGEX_CONNECTION_TRIM = /^-|-$/
export const REGEX_SERVICE_ID = /^..(:..){7}$/

export const DESKTOP_EPOCH = new Date('2020-01-01T00:00:00')
export const FRONTEND_RETRY_DELAY = 20000
export const MAX_NAME_LENGTH = 100
export const MAX_CONNECTION_NAME_LENGTH = 62
export const MAX_DESCRIPTION_LENGTH = 1024
export const SIDEBAR_WIDTH = 250
export const ORGANIZATION_BAR_WIDTH = 70
export const HIDE_SIDEBAR_WIDTH = 1150
export const HIDE_TWO_PANEL_WIDTH = 750
export const MOBILE_WIDTH = 500

export const CLI_REACHABLE_ERROR_CODE = 523
export const CLI_CERT_FAILURE_ERROR_CODE = 496

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
