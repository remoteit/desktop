import headless, {
  EVENTS,
  environment,
  EventBus,
  User,
  user,
  ConnectionPool,
  hostName,
  getApplication,
  Logger,
  brand,
} from 'remoteit-headless'
import electron from 'electron'
import path from 'path'

const MAX_MENU_SIZE = 10
const MAX_UPDATE_CHECKS = 16
const CHECK_INTERVAL = 800

const iconConnected = path.join(__dirname, 'images', 'iconConnectedTemplate.png')
const iconOffline = path.join(__dirname, 'images', 'iconOfflineTemplate.png')
const iconOnline = path.join(__dirname, 'images', 'iconOnlineTemplate.png')

export default class TrayMenu {
  private tray: electron.Tray
  private menu?: electron.Menu
  private pool: IConnection[]
  private checks: number = 0

  constructor(tray: electron.Tray) {
    this.tray = tray
    this.pool = []

    if (environment.isWindows) {
      this.tray.on('click', () => {
        this.tray.popUpContextMenu()
      })
    }

    this.render()

    EventBus.on(User.EVENTS.signedIn, this.render)
    EventBus.on(User.EVENTS.signedOut, this.render)
    EventBus.on(ConnectionPool.EVENTS.pool, this.updatePool)
  }

  private render = () => {
    const menuItems = user.signedIn ? this.remoteitMenu() : this.signInMenu()
    this.menu = electron.Menu.buildFromTemplate(menuItems)
    this.menu.on('menu-will-show', headless.pool.check)
    this.tray.setContextMenu(this.menu)
  }

  private updatePool = (pool: IConnection[]) => {
    this.pool = pool || []
    this.render()
  }

  private remoteitMenu() {
    return [
      {
        label: `Open ${brand.appName}...`,
        type: 'normal',
        click: () => this.handleOpen(),
      },
      {
        label: user.username,
        submenu: [
          {
            label: 'Sign out',
            type: 'normal',
            click: () => EventBus.emit(EVENTS.signOut),
          },
          {
            label: 'Quit',
            type: 'normal',
            click: electron.app.quit,
          },
        ],
      },
      { type: 'separator' },
      ...this.connectionsMenu(),
    ]
  }

  private connectionsMenu() {
    let menu = []
    const enabled = this.pool.filter(c => c.enabled)
    if (enabled.length) menu.push({ label: 'Connections', enabled: false }, ...this.connectionsList(enabled))
    return menu.length ? menu : [{ label: 'No connections', enabled: false }]
  }

  private connectionsList(list: IConnection[]) {
    let more = 0
    if (list.length > MAX_MENU_SIZE) {
      more = list.length - MAX_MENU_SIZE
      list = list.slice(0, MAX_MENU_SIZE)
    }
    let menu = list.reduce((result: any[], connection) => {
      if (connection.createdTime || connection.enabled) {
        result.push({
          label: connection.name,
          icon: connection.connected ? iconConnected : connection.online ? iconOnline : iconOffline,
          submenu: [
            connection.enabled
              ? connection.connected
                ? { label: 'Stop connection', click: () => this.disconnect(connection) }
                : { label: 'Remove from network', click: () => this.remove(connection) }
              : connection.online
              ? { label: 'Add to network', click: () => this.connect(connection) }
              : { label: 'Offline', enabled: false },
            { type: 'separator' },
            { label: hostName(connection), enabled: false },
            { label: 'Copy to clipboard', click: () => this.copy(connection) },
            connection.online
              ? { label: 'Launch', enabled: connection.enabled, click: () => this.launch(connection) }
              : { label: 'Remove', click: () => EventBus.emit(EVENTS.clear, connection) },
          ],
        })
      }
      return result
    }, [])
    if (more) menu.push({ label: `and ${more} more...`, click: () => this.handleOpen('connections') })
    return menu
  }

  private signInMenu() {
    return [
      { label: brand.appName, enabled: false },
      {
        label: 'Sign in...',
        type: 'normal',
        click: () => this.handleOpen(),
      },
      {
        label: 'Quit',
        type: 'normal',
        click: electron.app.quit,
      },
    ]
  }

  private handleOpen(url?: string) {
    EventBus.emit(EVENTS.open, url)
  }

  private connect(connection: IConnection) {
    headless.pool.start(connection)
    this.checks = 0
    this.updateCheck()
  }

  private disconnect(connection: IConnection) {
    headless.pool.disconnect(connection)
  }

  private remove(connection: IConnection) {
    headless.pool.stop(connection)
  }

  private copy(connection: IConnection) {
    const app = getApplication(undefined, connection)
    Logger.info('COPY', { command: app.string, connection })
    if (app.prompt) {
      this.handleOpen(`copy/${connection.id}`)
    } else {
      electron.clipboard.writeText(app.string)
    }
  }

  private launch(connection: IConnection) {
    const app = getApplication(undefined, connection)
    Logger.info('LAUNCH', { command: app.string, connection })
    if (app.prompt) {
      this.handleOpen(`launch/${connection.id}`)
    } else {
      electron.shell.openExternal(app.string)
    }
  }

  private updateCheck() {
    if (this.checks < MAX_UPDATE_CHECKS) {
      setTimeout(() => {
        this.checks++
        headless.pool.check()
        this.updateCheck()
      }, CHECK_INTERVAL)
    }
  }
}
