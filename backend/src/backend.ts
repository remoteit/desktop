import electron from 'electron'
import debug from 'debug'
import path from 'path'
import url from 'url'
import logger from './utils/logger'
import { server } from './server'
import { installConnectdIfMissing } from './connectd/install'
import * as track from './utils/analytics'
import ConnectionPool from './connectd/ConnectionPool'
import * as Platform from './services/Platform'
import './utils/errorReporting'

const d = debug('r3:backend:backend')

d('Starting up Electron application!')
track.event('app', 'startup', 'remote.it Desktop application has started')
logger.info('Desktop starting up!')
logger.info('Platform info', Platform)

const app = electron.app
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window and try objects, if you don't, they window will
// be removed automatically when the JavaScript object is garbage collected.
export let mainWindow: electron.BrowserWindow
export let systemTray: electron.Tray

let quitSelected = false

app.on('ready', handleAppReady)
app.on('activate', handleActivate)
app.on('before-quit', () => (quitSelected = true))

app.dock.hide()
startSocketIOServer()

/**
 * Start the Socket.io server that the frontend React application
 * listens to.
 */
async function startSocketIOServer() {
  logger.info('Starting WebSocket server')
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

  ConnectionPool.loadFromSavedConnectionsFile()
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

function handleActivate() {
  logger.info('Window activated')
  mainWindow.show()
}

function createMainWindow() {
  if (mainWindow) return

  logger.info('Creating main window')
  d('Showing main window')
  mainWindow = new BrowserWindow({
    width: 700,
    height: 600,
    minWidth: 400,
    minHeight: 300,
    icon: path.join(__dirname, 'images/icon-64x64.png'),
    frame: false,
    titleBarStyle: 'hiddenInset',
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

  mainWindow.on('close', e => {
    if (!quitSelected) {
      e.preventDefault()
      mainWindow.hide()
    }
  })
}

function createTrayIcon() {
  logger.info('Create tray icon')

  const iconPath = path.join(__dirname, 'images', 'iconTemplate.png')
  systemTray = new electron.Tray(iconPath)

  systemTray.on('click', () => {
    logger.info('Clicked tray icon')
    mainWindow.show()
    mainWindow.focus()
  })
}

process.on('uncaughtException', function(err) {
  logger.error('Caught exception: ' + err)
})
