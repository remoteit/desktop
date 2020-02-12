import { WEB_DIR, environment, EventBus, Logger, user } from 'remoteit-headless'
import electron from 'electron'
import TrayMenu from './TrayMenu'
import AutoUpdater from './AutoUpdater'
import debug from 'debug'
import path from 'path'
import url from 'url'

const d = debug('r3:headless:ElectronApp')

export default class ElectronApp {
  public app: electron.App
  public tray?: electron.Tray
  private window?: electron.BrowserWindow
  private autoUpdater: AutoUpdater
  private quitSelected: boolean

  static EVENTS = {
    ready: 'app/ready',
    open: 'app/open',
    openOnLogin: 'app/open-on-login',
  }

  constructor() {
    this.app = electron.app
    this.quitSelected = false
    this.autoUpdater = new AutoUpdater()

    // Not primary instance of app
    if (!this.app.requestSingleInstanceLock()) this.app.quit()

    this.app.on('ready', this.handleAppReady)
    this.app.on('activate', this.handleActivate)
    this.app.on('before-quit', () => (this.quitSelected = true))
    this.app.on('second-instance', () => this.openWindow())

    EventBus.on(ElectronApp.EVENTS.openOnLogin, this.handleOpenAtLogin)
    EventBus.on(ElectronApp.EVENTS.open, this.openWindow)
  }

  public check = () => {
    this.autoUpdater.check()
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
    EventBus.emit(ElectronApp.EVENTS.ready, this.tray)
  }

  private handleActivate = () => {
    this.openWindow()
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

    this.window = new electron.BrowserWindow({
      width: 800,
      height: 600,
      icon: path.join(__dirname, 'images/icon-64x64.png'),
      titleBarStyle: 'hiddenInset',
      frame: !environment.isMac,
      autoHideMenuBar: true,
    })

    this.window.setVisibleOnAllWorkspaces(true)

    const startUrl =
      process.env.NODE_ENV === 'development'
        ? url.format({
            protocol: 'http',
            hostname: 'localhost',
            port: '3000',
            query: user.credentials,
          })
        : url.format({
            pathname: path.join(WEB_DIR, 'index.html'),
            protocol: 'file',
            slashes: true,
            query: user.credentials,
          })

    Logger.info('LOAD HEADLESS', { startUrl })

    this.window.loadURL(startUrl)

    this.window.on('close', e => {
      d('Window closed')
      if (!this.quitSelected) {
        e.preventDefault()
        this.closeWindow()
      }
    })

    this.window.webContents.on('new-window', (event, url) => {
      event.preventDefault()
      electron.shell.openExternal(url)
    })
  }

  private createTrayIcon() {
    d('Create tray icon')

    const iconFile = environment.isMac
      ? 'iconTemplate.png'
      : environment.isWindows
      ? 'iconwin.ico'
      : environment.isPi
      ? 'iconLinuxColor.png'
      : 'iconLinux.png'
    const iconPath = path.join(__dirname, 'images', iconFile)
    this.tray = new electron.Tray(iconPath)
    new TrayMenu(this.tray)
  }

  private openWindow = (openDevTools?: boolean) => {
    if (!this.window || !this.tray) return
    d('Showing window')

    if (!this.window.isVisible()) {
      this.setWindowPosition()
      if (this.app.dock) this.app.dock.show()
    }

    this.window.show()

    if (openDevTools) this.window.webContents.openDevTools({ mode: 'detach' })
  }

  private closeWindow() {
    if (this.window) this.window.hide()
    if (this.app.dock) this.app.dock.hide()
  }

  private setWindowPosition() {
    if (!this.window || !this.tray) return

    const padding = 12
    const window = this.window.getBounds()
    const tray = this.tray.getBounds()
    const display = electron.screen.getDisplayMatching(tray).bounds

    let position = {
      x: Math.round(display.x + display.width / 2 - window.width / 2),
      y: Math.round(display.y + display.height / 2 - window.height / 2),
    }

    // out of bounds check
    const windowRightEdge = position.x + window.width
    const displayRightEdge = display.x + display.width - padding
    const overlap = displayRightEdge - windowRightEdge
    if (overlap < 0) position.x += overlap

    this.window.setPosition(position.x, position.y)
  }
}
