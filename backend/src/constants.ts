export const ENVIRONMENT = process.env.NODE_ENV || 'development'

// Port for the Socket.io websocket server
export const PORT = process.env.PORT || 29999

// Google Analytics usage tracking
export const GOOGLE_ANALYTICS_CODE = 'UA-76016818-10'

// Airbrake error reporting
export const AIRBRAKE_PROJECT_ID = 223457
export const AIRBRAKE_PROJECT_KEY = process.env.AIRBRAKE_PROJECT_KEY || 'e1376551dbe5b1326f98edd78b6247ba'

// Remote.it API URL
export const API_URL = process.env.API_URL || 'https://api.remot3.it/apv/v27'
export const DEVELOPER_KEY = process.env.DEVELOPER_KEY || 'Mjc5REIzQUQtMTQyRC00NTcxLTlGRDktMTVGNzVGNDYxQkE3'

export const IP_OPEN: ipAddress = '0.0.0.0'
export const IP_LATCH: ipAddress = '255.255.255.255'
export const IP_CLASS_A: ipAddress = '192.0.0.0'
export const IP_CLASS_B: ipAddress = '192.168.0.0'
export const IP_CLASS_C: ipAddress = '192.168.2.0'
export const IP_PRIVATE: ipAddress = '127.0.0.1'
