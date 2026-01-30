import electron, { Menu, dialog } from 'electron'
import path from 'path'
import AutoUpdater from './AutoUpdater'
import TrayMenu from './TrayMenu'
import {
  EVENTS,
  PROTOCOL,
  brand,
  environment,
  preferences,
  EventBus,
  Logger,
} from './backend'

const URL_REGEX = new RegExp('^https?://')
const IP_PRIVATE = '127.0.0.1'

export default class ElectronApp {
  public app: electron.App
  public tray?: electron.Tray
  private window?: electron.BrowserWindow
  private autoUpdater: AutoUpdater
  private quitSelected: boolean
  private isMaximized: boolean
  private deepLinkUrl?: string
  private authCallback?: boolean
  private errorShown: boolean
  private protocol: string
  private bluetoothCallback?: (deviceId: string) => void

  constructor() {
    this.app = electron.app
    this.quitSelected = false
    this.errorShown = false
    this.isMaximized = false
    this.autoUpdater = new AutoUpdater()
    this.protocol = PROTOCOL.substring(0, PROTOCOL.length - 3)

    if (!this.app.requestSingleInstanceLock()) {
      Logger.warn('ANOTHER APP INSTANCE IS RUNNING. EXITING.')
      this.quitSelected = true
      this.app.quit()
    }

    Logger.info('ELECTRON STARTING UP', { version: electron.app.getVersion() })

    if (preferences.get().disableDeepLinks) {
      this.app.removeAsDefaultProtocolClient(this.protocol)
      Logger.info('REMOVED AS DEFAULT PROTOCOL HANDLER', { protocol: this.protocol })
    } else {
      this.app.setAsDefaultProtocolClient(this.protocol)
      Logger.info('SET AS DEFAULT PROTOCOL HANDLER', { protocol: this.protocol })
    }

    Logger.info('BRAND', { brand })

    // Windows event
    this.app.on('ready', this.handleAppReady)
    this.app.on('activate', this.handleActivate)
    this.app.on('before-quit', this.handleBeforeQuit)
    this.app.on('second-instance', this.handleSecondInstance)
    this.app.on('open-url', this.handleOpenUrl)

    EventBus.on(EVENTS.install, this.handleInstallUpdate)
    EventBus.on(EVENTS.preferences, this.handleOpenAtLogin)
    EventBus.on(EVENTS.filePrompt, this.handleFilePrompt)
    EventBus.on(EVENTS.navigate, this.handleNavigate)
    EventBus.on(EVENTS.maximize, this.handleMaximize)
    EventBus.on(EVENTS.cancelBluetooth, this.handleCancelBluetooth)
    EventBus.on(EVENTS.open, this.openWindow)
  }

  get url() {
    if (!this.window) return
    return this.window.webContents.getURL()
  }

  quitDuplicateInstance = () => {
    if (!this.quitSelected && !this.errorShown) {
      this.errorShown = true
      dialog.showErrorBox(
        `${brand.appName} Failed to Start`,
        `The app could not start because another instance is already running. Please close any other ${brand.appName} processes, or restart your computer.`
      )
    }

    Logger.warn('ANOTHER APP INSTANCE IS RUNNING. EXITING.')
    this.app.quit()
  }

  /**
   * This method will be called when Electron has finished
   * initialization and is ready to create browser windows.
   * Some APIs can only be used after this event occurs.
   */
  private handleAppReady = () => {
    this.setDeepLink(process.argv.pop())
    this.createSystemTray()
    this.createMainWindow()
    this.handleOpenAtLogin(preferences.get() || {})
    this.openWindow()
    EventBus.emit(EVENTS.ready, this.tray)
  }

  private handleBeforeQuit = () => {
    Logger.info('QUITTING APP')
    this.quitSelected = true
    this.saveWindowState()
  }

  private handleSecondInstance = (_: electron.Event, argv: string[]) => {
    // Windows deep link support
    Logger.info('SECOND INSTANCE ARGS', { argv })
    this.setDeepLink(argv.pop())
    this.openWindow()
  }

  private handleInstallUpdate = () => {
    this.handleBeforeQuit()
    this.autoUpdater.install()
  }

  private handleOpenUrl = (event: electron.Event, url: string) => {
    // Mac deep link support
    Logger.info('OPEN URL', { url })
    event.preventDefault()
    this.setDeepLink(url)
    this.openWindow()
  }

  private handleNavigate = (action: 'BACK' | 'FORWARD' | 'STATUS' | 'CLEAR') => {
    if (!this.window) return
    const { navigationHistory } = this.window.webContents

    switch (action) {
      case 'BACK':
        navigationHistory.goBack()
        break
      case 'FORWARD':
        navigationHistory.goForward()
        break
      case 'CLEAR':
        navigationHistory.clear()
        break
    }
    
    const canNavigate = {
      canGoBack: navigationHistory.canGoBack(),
      canGoForward: navigationHistory.canGoForward(),
    }

    EventBus.emit(EVENTS.canNavigate, canNavigate)
  }

  private handleMaximize = () => {
    if (this.isMaximized) {
      this.window?.unmaximize()
      this.isMaximized = false
    } else {
      this.window?.maximize()
      this.isMaximized = true
    }
  }

  private handleFilePrompt = async (type: 'app' | string) => {
    if (!this.window) return

    const result = await dialog.showOpenDialog(this.window, {
      title: 'Find application',
      message: 'Select the application location',
      buttonLabel: 'Select',
    })

    let filePath = result?.filePaths[0]
    if (type === 'app' && environment.isMac) filePath = path.basename(filePath, '.app')

    EventBus.emit(EVENTS.filePath, filePath)
    Logger.info('FILE PROMPT RESULT', { result, filePath })
  }

  private handleActivate = () => {
    this.openWindow()
  }

  private handleOpenAtLogin = (preferences: IPreferences) => {
    const { openAtLogin } = this.app.getLoginItemSettings()
    if (preferences.openAtLogin !== openAtLogin) {
      Logger.info('SET OPEN AT LOGIN', { openAtLogin: preferences.openAtLogin })
      this.app.setLoginItemSettings({ openAtLogin: preferences.openAtLogin })
    }
  }

  private setDeepLink(url?: string) {
    if (!url) return
    const scheme = this.protocol + '://'

    if (url.includes(scheme)) {
      this.deepLinkUrl = url.substring(scheme.length)
      Logger.info('SET DEEP LINK', { url: this.deepLinkUrl })
    }

    if (url.includes('authCallback')) {
      this.authCallback = true
      Logger.info('SET AUTH CALLBACK')
    }

    const match = URL_REGEX.exec(url)
    if (match) {
      Logger.info('OPEN EXTERNAL LINK', { url, match })
      electron.shell.openExternal(url.substring(match.index))
    }
  }

  private createMainWindow = () => {
    if (this.window) return
    this.app.setAppUserModelId(brand.name)
    const { windowState } = preferences.get()
    const validatedWindow = this.validateWindowState(windowState)

    this.window = new electron.BrowserWindow({
      ...validatedWindow,
      minWidth: 525,
      minHeight: 325,
      backgroundColor: brand.colors.light.primaryDark,
      icon: path.join(__dirname, 'images/icon-64x64.png'),
      titleBarStyle: environment.isMac ? 'hidden' : 'hiddenInset',
      frame: !environment.isMac,
      autoHideMenuBar: true,
    })

    const startUrl = this.getStartUrl()

    this.window.loadURL(startUrl)

    this.window.on('close', event => {
      this.saveWindowState()
      if (!this.quitSelected && environment.isMac) {
        event.preventDefault()
        this.closeWindow()
      }
    })

    this.window.webContents.on('will-prevent-unload', event => {
      // Don't allow stripe to prevent unload (it tries to stop to confirm changes)
      event.preventDefault()
    })

    this.window.webContents.setWindowOpenHandler(({ url }) => {
      Logger.info('OPEN EXTERNAL URL', { url })
      electron.shell.openExternal(url)
      return { action: 'deny' }
    })

    this.window.webContents.on('will-navigate', (event, url) => {
      if (url.includes('auth.remote.it')) {
        Logger.info('AUTH NAVIGATION DETECTED')
        event.preventDefault()
        electron.shell.openExternal(url)
      }
    })

    this.window.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
      event.preventDefault()
      Logger.info('SCAN BLUETOOTH', { deviceList })
      this.bluetoothCallback = callback

      const result = deviceList.pop()
      if (result) {
        callback(result.deviceId)
      } else {
        // The device wasn't found so we wait until the
        // device is turned on or the user cancels the request
      }
    })

    this.logWebErrors()
  }

  private validateWindowState(state?: IPreferences['windowState']): IPreferences['windowState'] {
    const defaults = preferences.windowDefaultState ?? { width: 1280, height: 800 }

    if (!state || state.x === undefined || state.y === undefined) return { ...defaults }

    const displays = electron.screen.getAllDisplays()
    Logger.info('VALIDATE WINDOW STATE', { displays: displays.map(d => d.workArea), state })

    const inBounds = displays.some(({ workArea }) => {
      const minX = workArea.x
      const minY = workArea.y
      const maxX = workArea.x + workArea.width
      const maxY = workArea.y + workArea.height

      return (
        state.width <= workArea.width &&
        state.height <= workArea.height &&
        state.x! >= minX &&
        state.y! >= minY &&
        state.x! + state.width <= maxX &&
        state.y! + state.height <= maxY
      )
    })

    if (inBounds) return state

    Logger.info('WINDOW STATE OUT OF BOUNDS')
    return { ...defaults }
  }

  private saveWindowState = () => {
    const bounds = this.window?.getBounds()
    preferences.update({ windowState: bounds })
  }

  private logWebErrors = () => {
    if (!this.window) return
    const { webContents } = this.window
    webContents.on('render-process-gone', (event, details) => {
      Logger.error('ELECTRON WEB CONSOLE render-process-gone', { details })
      this.reload()
    })
    webContents.on('unresponsive', () => Logger.warn('ELECTRON WEB CONSOLE unresponsive'))
    webContents.on('responsive', () => Logger.warn('ELECTRON WEB CONSOLE responsive'))
    webContents.on('plugin-crashed', (event, name, version) =>
      Logger.error('ELECTRON WEB CONSOLE plugin-crashed', { name, version })
    )
    webContents.on('preload-error', (event, preloadPath, error) =>
      Logger.error('ELECTRON WEB CONSOLE preload-error', { preloadPath, error })
    )
    webContents.on('console-message', (event, level, error, line, sourceId) => {
      if (level > 2 && !error.includes('unsafe-inline'))
        Logger.error('ELECTRON WEB CONSOLE error', { level, error, line, sourceId })
    })
  }

  private reload() {
    const lastWindow = this.window
    this.window = undefined
    this.createMainWindow()
    lastWindow?.destroy()
  }

  private getStartUrl(): string {
    return process.env.NODE_ENV === 'development' ? `http://${IP_PRIVATE}:3003` : `http://${IP_PRIVATE}:29999`
  }

  private createSystemTray() {
    Logger.info('CREATE SYSTEM TRAY')

    this.tray = new electron.Tray(this.getIconPath())
    new TrayMenu(this.tray)
    const defaultMenu = Menu.getApplicationMenu()
    const items = defaultMenu?.items.filter(item => item.role !== 'help')
    const menu = Menu.buildFromTemplate(items || [])
    Menu.setApplicationMenu(menu)

    if (environment.isWindows) {
      electron.nativeTheme.on('updated', () => this.tray?.setImage(this.getIconPath()))
    }
  }

  private getIconPath() {
    const iconFile = environment.isMac
      ? 'iconTemplate.png'
      : environment.isWindows
      ? 'iconWinColor.ico'
      : environment.isPi
      ? 'iconLinuxColor.png'
      : 'iconLinux.png'
    return path.join(__dirname, 'images', iconFile)
  }

  private handleCancelBluetooth = () => {
    Logger.info('CANCEL BLUETOOTH SCAN')
    if (this.bluetoothCallback) {
      this.bluetoothCallback('')
      this.bluetoothCallback = undefined
    }
  }

  private openWindow = (location?: string, openDevTools?: boolean) => {
    if (!this.window || !this.tray) return

    if (!this.window.isVisible()) {
      if (this.app.dock) this.app.dock.show()
    }

    this.window.show()

    if (this.deepLinkUrl) {
      location = this.deepLinkUrl
      this.deepLinkUrl = undefined
    }

    if (location && this.authCallback) {
      this.authCallback = false
      const index = location.indexOf('?')
      let fullUrl = this.getStartUrl()
      if (index != -1) {
        const parameters = location.substring(index)
        fullUrl = fullUrl + parameters
      }
      Logger.info('OPENING AUTH URL', { url: fullUrl })
      this.window.loadURL(fullUrl)
    } else if (location) {
      Logger.info('OPENING WINDOW LOCATION', { location })
      this.window.webContents.executeJavaScript(`window.location.hash="#/${location}"`)
    }

    if (openDevTools) this.window.webContents.openDevTools({ mode: 'detach' })
  }

  private closeWindow() {
    if (this.window) this.window.hide()
    if (this.app.dock) this.app.dock.hide()
  }
}
