import { app, BrowserWindow } from 'electron'
import path from 'path'
import isDev from 'electron-is-dev'

let mainWindow: BrowserWindow | null

// require('electron-reload')(__dirname)
require('electron-reload')(__dirname, {
  // electron: require('electron-prebuilt')
  electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
})

function createWindow() {
  mainWindow = new BrowserWindow({ width: 900, height: 680 })
  mainWindow.loadURL(
    isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../render-process/build/index.html')}`
  )
  mainWindow.on('closed', () => (mainWindow = null))
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
