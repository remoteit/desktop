export const CLI_AGENT_ERROR_CODE = 101
export const CLI_REACHABLE_ERROR_CODE = 523
export const CLI_CERT_FAILURE_ERROR_CODE = 496

export const REGEX_LAST_NUMBER = /-*\d*$/
export const REGEX_NAME_SAFE = /[^a-zA-Z0-9_ -]/g
export const REGEX_NOT_FILE_SAFE = /[\W]/g
export const MAX_NAME_LENGTH = 100

export const IP_OPEN: ipAddress = '0.0.0.0'
export const IP_LATCH: ipAddress = '255.255.255.255'
export const IP_PRIVATE: ipAddress = '127.0.0.1'

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
