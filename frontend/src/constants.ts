const env = import.meta.env
export const MODE = env.MODE || 'development'
export const CLIENT_ID = env.VITE_CLIENT_ID
export const MOBILE_CLIENT_ID = env.VITE_MOBILE_CLIENT_ID
export const COGNITO_USER_POOL_ID = env.VITE_COGNITO_USER_POOL_ID || 'us-west-2_6nKjyW7yg'
export const COGNITO_AUTH_DOMAIN = env.VITE_COGNITO_AUTH_DOMAIN || 'auth.remote.it'
export const API_URL = env.VITE_API_URL || 'https://api.remote.it/apv/v27'
export const AUTH_API_URL = env.VITE_AUTH_API_URL || env.AUTH_API_URL || 'https://auth.api.remote.it/v1'
export const GRAPHQL_API = env.VITE_GRAPHQL_API || 'https://api.remote.it/graphql/v1'
export const GRAPHQL_BETA_API = env.VITE_GRAPHQL_BETA_API || 'https://api.remote.it/graphql/beta'
export const PORTAL = (env.VITE_PORTAL || env.PORTAL) === 'true' ? true : false
export const DEVELOPER_KEY = env.VITE_DEVELOPER_KEY || 'Mjc5REIzQUQtMTQyRC00NTcxLTlGRDktMTVGNzVGNDYxQkE3'

export const PROTOCOL = env.PROTOCOL || 'remoteit://'
export const REDIRECT_URL = env.VITE_REDIRECT_URL || PROTOCOL + 'authCallback'
export const SIGNOUT_REDIRECT_URL = PROTOCOL + 'signoutCallback'
export const CALLBACK_URL =
  env.VITE_CALLBACK_URL || env.MODE === 'development'
    ? env.VITE_DEV_CALLBACK_URL || 'https://dev-auth.internal.remote.it/v1/callback/'
    : env.VITE_PROD_CALLBACK_URL || 'https://auth.api.remote.it/v1/callback/'

export const WEBSOCKET_URL = env.VITE_WEBSOCKET_URL
export const WEBSOCKET_BETA_URL = env.VITE_WEBSOCKET_BETA_URL
export const PORT = env.VITE_PORT || 29999
export const PASSWORD_MIN_LENGTH = env.PASSWORD_MIN_LENGTH ? Number(env.PASSWORD_MIN_LENGTH) : 7
export const PASSWORD_MAX_LENGTH = env.PASSWORD_MAX_LENGTH ? Number(env.PASSWORD_MAX_LENGTH) : 64
export const RECAPTCHA_SITE_KEY = String(env.RECAPTCHA_SITE_KEY || '6Ldt3W4UAAAAAFtJAA4erruG9zT9TCOulJHO4L5e')

const BT_BASE_UUID = '-6802-4573-858e-5587180c32ea'
export const BT_UUIDS = {
  SERVICE: `0000a000${BT_BASE_UUID}`,
  WIFI_LIST: `0000a004${BT_BASE_UUID}`,
  WIFI_STATUS: `0000a001${BT_BASE_UUID}`,
  REGISTRATION_STATUS: `0000a011${BT_BASE_UUID}`,
  COMMAND: `0000a020${BT_BASE_UUID}`,
}

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

export const CERTIFICATE_DOMAIN = 'at.remote.it'
export const ANONYMOUS_MANUFACTURER_CODE = 34560
export const SCREEN_VIEW_APP_LINK = 'https://play.google.com/store/apps/details?id=it.remote.screenview'
export const DEMO_SCRIPT_URL =
  'https://raw.githubusercontent.com/remoteit/code_samples/refs/heads/main/scripts/linux/script_demo.sh'

export const REGEX_LAST_PATH = /\/[^/]+$/g
export const REGEX_FIRST_PATH = /^\/([^\/]+)/g
export const REGEX_IP_SAFE = /[^0-9.]+/g
export const REGEX_PORT_SAFE = /[^0-9]+/g
export const REGEX_DOMAIN_SAFE = /[^a-zA-Z0-9-.]+/g
export const REGEX_EMAIL_SAFE = /[^a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+/g
export const REGEX_NUMERIC_VALUE = /=(\d+)/
export const REGEX_CHARACTERS = /^([^0-9]*)$/
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
export const REGEX_SCHEME = /^(.*?):\/\//

export const DESKTOP_EPOCH = new Date('2020-01-01T00:00:00')
export const MOBILE_LAUNCH_DATE = new Date('2023-12-20')
export const FRONTEND_RETRY_DELAY = 20000
export const MAX_CONNECTION_NAME_LENGTH = 62
export const MAX_DESCRIPTION_LENGTH = 1024
export const SIDEBAR_WIDTH = 250
export const ORGANIZATION_BAR_WIDTH = 70
export const HIDE_SIDEBAR_WIDTH = 1150
export const HIDE_TWO_PANEL_WIDTH = 750
export const APP_MAX_WIDTH = 1800
export const MOBILE_WIDTH = 500
export const BINARY_DATA_TOKEN = '!BINARY-DATA'
export const VALID_JOB_ID_LENGTH = 36


export const LANGUAGES: ILookup<string> = {
  en: 'English',
  ja: 'Japanese',
}
