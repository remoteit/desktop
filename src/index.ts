import { Server } from './server'
import debug from 'debug'
import path from 'path'
import { app, BrowserWindow } from 'electron'

const d = debug('desktop')

let mainWindow: BrowserWindow | null

new Server()

app.on('ready', () => {
  createWindow()
  d('Desktop application ready!')
})

app.on('window-all-closed', () => {
  d('All windows closed')
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function() {
  if (mainWindow === null) {
    createWindow()
  }
})

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1000, height: 800 })

  mainWindow.loadFile(path.join(__dirname, 'index.html'))

  // if (process.env.NODE_ENV === 'development')
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}
