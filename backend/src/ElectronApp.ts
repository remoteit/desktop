import electron from 'electron'
import EventBus from './EventBus'
import Logger from './Logger'
import path from 'path'
import url from 'url'

export default class ElectronApp {
  private window?: electron.BrowserWindow
  private tray?: electron.Tray
  private app: electron.App
  private quitSelected: boolean

  static EVENTS = {
    ready: 'app/ready',
  }

  constructor() {
    this.app = electron.app
    // const BrowserWindow = electron.BrowserWindow
    // Keep a global reference of the window and try objects, if you don't, they window will
    // be removed automatically when the JavaScript object is garbage collected.

    this.quitSelected = false

    this.app.on('ready', this.handleAppReady)
    this.app.on('activate', this.handleActivate)
    this.app.on('before-quit', () => (this.quitSelected = true))
    // this.on('open-at-login', this.handleOpenAtLogin)

    // Make sure to never show the doc icon
    // TODO: Have this configurable via a setting!
    this.app.dock.hide()

    this.handleOpenAtLogin(true)
  }

  get url() {
    if (!this.window) return
    return this.window.webContents.getURL()
  }

  /**
   * This method will be called when Electron has finished
   * initialization and is ready to create browser windows.
   * Some APIs can only be used after this event occurs.
   */
  private handleAppReady = () => {
    this.createTrayIcon()
    this.createMainWindow()
    EventBus.emit(ElectronApp.EVENTS.ready)
  }

  private handleActivate = () => {
    // Logger.info('Window activated')
    if (this.window) this.showWindow()
  }

  private handleOpenAtLogin = (open: boolean) => {
    this.app.setLoginItemSettings({
      openAtLogin: open,
    })
  }

  createMainWindow = () => {
    if (this.window) return

    // Logger.info('Creating main window')
    // d('Showing main window')
    this.window = new electron.BrowserWindow({
      width: 500,
      height: 600,
      icon: path.join(__dirname, 'images/icon-64x64.png'),
      frame: false,
      resizable: false,
      transparent: true,
      titleBarStyle: 'customButtonsOnHover',
    })
    this.window.setVisibleOnAllWorkspaces(true)

    const startUrl =
      process.env.ELECTRON_START_URL ||
      url.format({
        pathname: path.join(__dirname, '../build/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    this.window.loadURL(startUrl)

    this.showWindow()

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    this.window.on('blur', () => this.window && this.window.hide())

    this.window.on('close', e => {
      if (!this.quitSelected) {
        e.preventDefault()
        if (this.window) this.window.hide()
      }
    })
  }

  createTrayIcon() {
    Logger.info('Create tray icon')

    const iconPath = path.join(__dirname, 'images', 'iconTemplate.png')
    this.tray = new electron.Tray(iconPath)

    this.tray.on('click', event => {
      // Logger.info('Clicked tray icon')
      if (this.window) {
        if (this.window.isVisible() && this.window.isFocused()) {
          this.window.hide()
        } else {
          this.showWindow()
        }

        // Show devtools when command+option clicked
        if (process.defaultApp && event.metaKey) {
          this.window.webContents.openDevTools({ mode: 'detach' })
        }
      }
    })
  }

  showWindow() {
    if (this.window && this.tray) {
      const position = this.getWindowPosition()
      if (!position) return
      this.window.setPosition(position.x, position.y, false)
      this.window.show()
      this.window.focus()
    }
  }

  getWindowPosition() {
    if (!this.window || !this.tray) return

    const windowBounds = this.window.getBounds()
    const trayBounds = this.tray.getBounds()
    // const displayBounds = electron.screen.getDisplayMatching(windowBounds).workArea

    return {
      x: Math.round(
        trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
      ),
      y: Math.round(trayBounds.y + trayBounds.height),
    }
  }
}
