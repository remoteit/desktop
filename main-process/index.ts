import { app, BrowserWindow } from 'electron'
// @ts-ignore
// import path from 'path'
import isDev from 'electron-is-dev'
// import HostsFile from './hosts-file'
// import Listener from './listener'
import Server from './server'
import { DEV_SERVER_URL, RENDER_INDEX_FILE_LOCATION } from '../shared/constants'

let mainWindow: BrowserWindow | null

// require('electron-reload')(__dirname, {
//   electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
//   // electron: require('electron-prebuilt'),
//   // electron: require('electron'),
// })

function createWindow() {
  makeSingleInstance()
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    // webPreferences: { nodeIntegration: false },
  })
  mainWindow.loadURL(
    isDev ? DEV_SERVER_URL : `file://${RENDER_INDEX_FILE_LOCATION}`
  )
  mainWindow.on('closed', () => (mainWindow = null))

  // Star the local server!
  new Server()

  app.setAsDefaultProtocolClient('remoteit')
  // request => console.log('RECEIVED DEEP LINK:', request.url),
  // error => console.error('DEEP LINK FAILED', error)

  // Register message listeners
  // Listener.register('hosts-file/raw', HostsFile.raw)
  // Listener.register('hosts-file/entries', HostsFile.entries)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

function makeSingleInstance() {
  if (process.mas) return

  app.requestSingleInstanceLock()

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
