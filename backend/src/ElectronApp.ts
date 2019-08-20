import debug from 'debug'
import electron from 'electron'
import Environment from './Environment'
import EventBus from './EventBus'
import Logger from './Logger'
import path from 'path'
import url from 'url'

const d = debug('r3:backend:ElectronApp')

export default class ElectronApp {
  private window?: electron.BrowserWindow
  private tray?: electron.Tray
  private app: electron.App
  private quitSelected: boolean

  static EVENTS = {
    ready: 'app/ready',
    openOnLogin: 'app/open-on-login',
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
    if (this.app.dock) this.app.dock.hide()

    EventBus.on(ElectronApp.EVENTS.openOnLogin, (open: boolean) =>
      this.handleOpenAtLogin(open)
    )
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
    this.showWindow()
  }

  private handleOpenAtLogin = (open: boolean) => {
    d('Handling open at login:', open)
    this.app.setLoginItemSettings({
      openAtLogin: open,
    })
  }

  private createMainWindow = () => {
    d('Create main window')
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

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    this.window.on('blur', () => this.window && this.window.hide())

    this.window.on('close', e => {
      d('Window closed')
      if (!this.quitSelected) {
        e.preventDefault()
        if (this.window) this.window.hide()
      }
    })

    this.window.once('ready-to-show', () => this.showWindow())
  }

  private createTrayIcon() {
    d('Create tray icon')
    Logger.info('Create tray icon')

    let iconFile = 'iconTemplate.png'
    if (Environment.isWindows) {
      iconFile = electron.systemPreferences.isInvertedColorScheme()
        ? 'icontraywhite.ico'
        : 'icontrayblack.ico'
    }
    const iconPath = path.join(__dirname, 'images', iconFile)
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

  private showWindow() {
    d('Showing window')
    if (this.window && this.tray) {
      const position = this.getWindowPosition()
      if (!position) return
      this.window.setPosition(position.x, position.y, false)
      this.window.show()
      this.window.focus()
    }
  }

  private getWindowPosition() {
    if (!this.window || !this.tray) return

    const padding = 12
    const window = this.window.getBounds()
    const tray = this.tray.getBounds()
    const display = electron.screen.getDisplayMatching(tray).bounds

    let position = {
      x: Math.round(tray.x + tray.width / 2 - window.width / 2),
      y: Math.round(tray.y - window.height),
    }

    if (Environment.isMac) {
      position.y = Math.round(tray.y + tray.height)
    }

    // out of bounds check
    const windowRightEdge = position.x + window.width
    const displayRightEdge = display.x + display.width - padding
    const overlap = displayRightEdge - windowRightEdge
    if (overlap < 0) position.x += overlap

    return position
  }
}
