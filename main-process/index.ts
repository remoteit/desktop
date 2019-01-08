import { app, BrowserWindow, Event } from 'electron'
import path from 'path'
import isDev from 'electron-is-dev'
import HostsFile from './hosts-file'
import Listener from './listener'
import { DEV_SERVER_URL, RENDER_INDEX_FILE_LOCATION } from '../shared/constants'
import { HOSTS_FILE_RAW } from '../shared/messages'

let mainWindow: BrowserWindow | null

require('electron-reload')(__dirname, {
  electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
  // electron: require('electron-prebuilt'),
  // electron: require('electron'),
})

function createWindow() {
  console.log('CREATED WINDOW')
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

  mainWindow.webContents.send(HOSTS_FILE_RAW)
  Listener.register(HOSTS_FILE_RAW, HostsFile.raw)
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
