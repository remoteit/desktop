import electron from 'electron'
import debug from 'debug'
import path from 'path'
import url from 'url'
import { server } from './server'
import { installConnectdIfMissing } from './connectd/install'
import * as track from './utils/analytics'
import './utils/errorReporting'
import * as pool from './connectd/pool'

const d = debug('r3:backend:backend')

d('Starting up Electron application!')

track.event('app', 'startup', 'remote.it Desktop application has started')

const app = electron.app
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: electron.BrowserWindow | null

startSocketIOServer()

app.on('ready', handleAppReady)
app.on('window-all-closed', handleWindowsClosed)
app.on('activate', handleActivate)

/**
 * Start the Socket.io server that the frontend React application
 * listens to.
 */
async function startSocketIOServer() {
  const io = await server()

  // Try and install connectd if it doesn't exist on the current system.
  // If it fails, let the user know by reporting an erro
  // via Socket.io
  try {
    await installConnectdIfMissing()
  } catch (error) {
    io.emit('connectd/install/error', {
      error: { ...error, message: error.message },
    })
  }

  pool.loadFromSavedConnectionsFile()
}

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
function handleAppReady() {
  createMainWindow()
  createTrayIcon()
}

/**
 * Quit when all windows are closed.
 */
function handleWindowsClosed() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
}

function handleActivate() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createMainWindow()
}

function createMainWindow() {
  d('Showing main window')
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    minWidth: 400,
    minHeight: 300,
    icon: path.join(__dirname, 'images/icon-64x64.png'),
  })

  const startUrl =
    process.env.ELECTRON_START_URL ||
    url.format({
      pathname: path.join(__dirname, '/../build/index.html'),
      protocol: 'file:',
      slashes: true,
    })
  mainWindow.loadURL(startUrl)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

function focusMainWindow() {
  if (mainWindow) mainWindow.focus()
}

function createTrayIcon() {
  // TODO: Handle OSX dark/light modes
  const iconPath = path.join(__dirname, 'images', 'r3.png')
  d('Tray icon path:', iconPath)
  const tray = new electron.Tray(iconPath)
  tray.on('click', () => {
    createMainWindow()
    focusMainWindow()
  })
}

// export {}
