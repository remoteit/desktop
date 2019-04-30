export const ENVIRONMENT = process.env.NODE_ENV || 'development'

export const LATEST_CONNECTD_RELEASE =
  process.env.LATEST_CONNECTD_RELEASE || 'v4.5'

// Port for the Socket.io websocket server
export const PORT = process.env.PORT || 29999

// Google Analytics usage tracking
export const GOOGLE_ANALYTICS_CODE =
  process.env.GOOGLE_ANALYTICS_CODE || 'UA-76016818-10'

// Airbrake error reporting
export const AIRBRAKE_PROJECT_ID = process.env.AIRBRAKE_PROJECT_ID
  ? Number(process.env.AIRBRAKE_PROJECT_ID)
  : 223457
export const AIRBRAKE_PROJECT_KEY =
  process.env.AIRBRAKE_PROJECT_KEY || 'e1376551dbe5b1326f98edd78b6247ba'

export const PEER_PORT_RANGE = [33000, 42999]
export const LOCAL_PROXY_PORT_RANGE = [43000, 52999]
