import path from 'path'

export const DEV_SERVER_PORT = process.env.DEV_SERVER_PORT || 3333
export const DEV_SERVER_URL =
  process.env.DEV_SERVER_URL || `http://localhost:${DEV_SERVER_PORT}`
export const RENDER_INDEX_FILE_LOCATION = path.join(
  'render-process',
  'www',
  'index.html'
)
