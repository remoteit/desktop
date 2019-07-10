export const ENVIRONMENT = process.env.NODE_ENV || 'development'

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

// Remote.it API URL
export const API_URL = process.env.API_URL || 'https://api.remot3.it/apv/v27'

export const USERNAME_COOKIE = 'remoteit.username'
export const AUTH_HASH_COOKIE = 'remoteit.authhash'
