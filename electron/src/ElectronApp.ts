import electron, { Menu, dialog } from 'electron'
import { CHAT_POPOUT_PARAM, CHAT_POPOUT_SIZE } from '@common/constants'
import path from 'path'
import AutoUpdater from './AutoUpdater'
import TrayMenu from './TrayMenu'
import { t, setLanguage } from './i18n'
import { EVENTS, PROTOCOL, START_URL, START_ORIGIN, brand, environment, preferences, EventBus, Logger } from './backend'

const URL_REGEX = new RegExp('^https?://')
// An auth deep link carries the OAuth code and state in its query, so logs keep only the part before it.
const withoutQuery = (url = '') => url.split('?')[0]

export default class ElectronApp {
  public app: electron.App
  public tray?: electron.Tray
  public readonly deepLinks: boolean
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
    setLanguage(preferences.get().language)

    if (!this.app.requestSingleInstanceLock()) {
      Logger.warn('ANOTHER APP INSTANCE IS RUNNING. EXITING.')
      this.quitSelected = true
      this.app.quit()
    }

    Logger.info('ELECTRON STARTING UP', { version: electron.app.getVersion() })

    // The server reports this rather than the live preference: the scheme is only (un)registered here, at launch.
    this.deepLinks = !preferences.get().disableDeepLinks
    if (!this.deepLinks) {
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
        t('dialog.failedToStartTitle', { appName: brand.appName }),
        t('dialog.failedToStartMessage', { appName: brand.appName })
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
    Logger.info('SECOND INSTANCE ARGS', { argv: argv.map(withoutQuery) })
    this.setDeepLink(argv.pop())
    this.openWindow()
  }

  private handleInstallUpdate = () => {
    this.handleBeforeQuit()
    this.autoUpdater.install()
  }

  private handleOpenUrl = (event: electron.Event, url: string) => {
    // Mac deep link support
    Logger.info('OPEN URL', { url: withoutQuery(url) })
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
      title: t('dialog.findApplicationTitle'),
      message: t('dialog.findApplicationMessage'),
      buttonLabel: t('dialog.findApplicationButton'),
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
      Logger.info('SET DEEP LINK', { url: withoutQuery(this.deepLinkUrl) })
    }

    if (url.includes('authCallback')) {
      // The RENDERER owns the exchange (D8): reload the window with the callback query —
      // the app boots with ?code&state exactly like the web return.
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

    this.window.loadURL(START_URL)

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
      // The dev chat panel pops out into its own window (?chatPopout on our
      // own origin); every other window.open goes to the system browser.
      if (this.isAppOrigin(url) && new URL(url).searchParams.has(CHAT_POPOUT_PARAM)) {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: { ...CHAT_POPOUT_SIZE, autoHideMenuBar: true },
        }
      }
      this.openExternal(url)
      return { action: 'deny' }
    })

    // The allowed chat popout is a real child window: give it the same
    // external-URL discipline as the main window, or window.open /
    // target=_blank / link navigation inside it spawns unguarded native
    // windows on remote content instead of the system browser
    this.window.webContents.on('did-create-window', child => {
      child.webContents.setWindowOpenHandler(({ url }) => {
        this.openExternal(url)
        return { action: 'deny' }
      })
      child.webContents.on('will-navigate', (event, url) => {
        if (this.isAppOrigin(url)) return
        event.preventDefault()
        this.openExternal(url)
      })
    })

    this.window.webContents.on('will-navigate', (event, url) => {
      // This window hosts exactly ONE origin: the app's own UI. Any other navigation —
      // the auth journey above all — belongs in the SYSTEM browser, where the user's
      // password manager, passkeys and single sign-on session live. Keyed on origin,
      // not configuration: the packaged main process has no .env, so an issuer-based
      // match fails CLOSED into this window; an origin rule fails open to the browser.
      if (!this.isAppOrigin(url)) {
        Logger.info('EXTERNAL NAVIGATION -> SYSTEM BROWSER', { url })
        event.preventDefault()
        this.openExternal(url)
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

  /* The external-URL discipline: everything leaving the renderer opens in
     the system browser, logged */
  private openExternal(url: string) {
    Logger.info('OPEN EXTERNAL URL', { url })
    electron.shell.openExternal(url)
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
    preferences.set({ windowState: bounds })
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
    webContents.on('preload-error', (event, preloadPath, error) =>
      Logger.error('ELECTRON WEB CONSOLE preload-error', { preloadPath, error })
    )
    webContents.on('console-message', ({ level, message, lineNumber, sourceId }) => {
      if (level === 'error' && !message.includes('unsafe-inline'))
        Logger.error('ELECTRON WEB CONSOLE error', { level, error: message, line: lineNumber, sourceId })
    })
  }

  private reload() {
    const lastWindow = this.window
    this.window = undefined
    this.createMainWindow()
    lastWindow?.destroy()
  }

  private isAppOrigin(url: string): boolean {
    try {
      return new URL(url).origin === START_ORIGIN
    } catch {
      return false
    }
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
      void this.deliverAuthCallback(index != -1 ? location.substring(index) : '')
    } else if (location) {
      Logger.info('OPENING WINDOW LOCATION', { location })
      this.window.webContents.executeJavaScript(`window.location.hash="#/${location}"`)
    }

    if (openDevTools) this.window.webContents.openDevTools({ mode: 'detach' })
  }

  /* A signed-in window completes the callback itself, so it can release the agent before the
     new account signs in; reloading with it is only for a window that isn't signed in. */
  private async deliverAuthCallback(parameters: string) {
    const webContents = this.window?.webContents
    const live = webContents && !webContents.isLoadingMainFrame() && this.isAppOrigin(webContents.getURL())
    const handled =
      live &&
      (await webContents
        .executeJavaScript(`window.authCallback?.(${JSON.stringify(parameters)}) === true`)
        .catch(() => false))
    if (handled) return Logger.info('AUTH CALLBACK HANDLED BY THE OPEN WINDOW')
    const fullUrl = START_URL + parameters
    Logger.info('OPENING AUTH URL', { url: withoutQuery(fullUrl) })
    this.window?.loadURL(fullUrl)
  }

  /* With deep links off, sign-in returns to the app's own server, which also serves the UI to browsers,
     so a callback is this window's only for a flow the window started. Resolves the page for the browser tab. */
  async takeAuthCallback(parameters: string): Promise<string | undefined> {
    const state = new URLSearchParams(parameters).get('state')
    const webContents = this.window?.webContents
    if (!state || !webContents || webContents.isLoadingMainFrame() || !this.isAppOrigin(webContents.getURL())) return
    const owned = await webContents
      .executeJavaScript(`window.authFlowPending?.(${JSON.stringify(state)}) === true`)
      .catch(() => false)
    if (!owned) return
    Logger.info('AUTH CALLBACK ON LOOPBACK')
    this.openWindow()
    this.app.focus({ steal: true })
    void this.deliverAuthCallback(parameters)
    const title = t('authCallback.title', { appName: brand.appName })
    const message = t('authCallback.message', { appName: brand.appName })
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;text-align:center;color:#333;background:#fff}@media (prefers-color-scheme:dark){body{color:#ddd;background:#1e1e1e}}</style></head><body><main><h1>${title}</h1><p>${message}</p></main></body></html>`
  }

  private closeWindow() {
    if (this.window) this.window.hide()
    if (this.app.dock) this.app.dock.hide()
  }
}
