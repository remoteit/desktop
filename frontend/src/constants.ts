export const API_KEY = process.env.REACT_APP_API_KEY
export const API_URL = process.env.REACT_APP_API_URL || 'https://api.remot3.it/apv/v27'
export const PORT = process.env.REACT_APP_PORT || 29999
export const DEVELOPER_KEY = process.env.REACT_APP_DEVELOPER_KEY || 'Mjc5REIzQUQtMTQyRC00NTcxLTlGRDktMTVGNzVGNDYxQkE3'
export const IP_OPEN: ipAddress = '0.0.0.0'
export const IP_LATCH: ipAddress = '255.255.255.255'
export const IP_CLASS_A: ipAddress = '192.0.0.0'
export const IP_CLASS_B: ipAddress = '192.168.0.0'
export const IP_CLASS_C: ipAddress = '192.168.2.0'
export const IP_PRIVATE: ipAddress = '127.0.0.1'
export const REGEX_LAST_PATH = /\/[^/]+$/g
export const REGEX_FIRST_PATH = /^\/(\w+)/g
export const REGEX_NAME_SAFE = /[^a-zA-Z0-9 ]/g
export const REGEX_IP_SAFE = /[^0-9\.]+/g
export const DEFAULT_TARGET: ITarget | IDevice = {
  hardwareID: '',
  hostname: '',
  name: '',
  port: 0,
  secret: '',
  type: 1,
  uid: '',
}
