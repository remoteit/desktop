import headless, {
  IP_PRIVATE,
  EVENTS,
  LAN,
  environment,
  EventBus,
  User,
  user,
  ConnectionPool,
  hostName,
  getApplication,
  Logger,
} from 'remoteit-headless'
import electron from 'electron'
import path from 'path'

const MAX_MENU_SIZE = 10

const iconConnected = path.join(__dirname, 'images', 'iconConnectedTemplate.png')
const iconOffline = path.join(__dirname, 'images', 'iconOfflineTemplate.png')
const iconOnline = path.join(__dirname, 'images', 'iconOnlineTemplate.png')

export default class TrayMenu {
  private tray: any
  private privateIP: ipAddress
  private pool: IConnection[]

  constructor(tray: electron.Tray) {
    this.tray = tray
    this.pool = []
    this.privateIP = IP_PRIVATE

    if (environment.isWindows) {
      this.tray.on('click', () => {
        this.tray.popUpContextMenu()
      })
    }

    EventBus.on(User.EVENTS.signedIn, this.render)
    EventBus.on(User.EVENTS.signedOut, this.render)
    EventBus.on(ConnectionPool.EVENTS.updated, this.updatePool)
    EventBus.on(LAN.EVENTS.privateIP, privateIP => (this.privateIP = privateIP))
  }

  private render = () => {
    const menuItems = user.signedIn ? this.remoteitMenu() : this.signInMenu()
    const contextMenu = electron.Menu.buildFromTemplate(menuItems)
    this.tray.setContextMenu(contextMenu)
  }

  private updatePool = (pool: IConnection[]) => {
    this.pool = pool || []
    this.render()
  }

  private remoteitMenu() {
    return [
      {
        label: 'Open remote.it...',
        type: 'normal',
        click: () => this.handleOpen(),
      },
      {
        label: user.username,
        submenu: [
          {
            label: 'Sign out',
            type: 'normal',
            click: user.signOut,
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
    const active = this.pool.filter(c => c.active)
    const recent = this.pool.filter(c => !c.active)
    if (active.length) menu.push({ label: 'Active connections', enabled: false }, ...this.connectionsList(active))
    if (active.length && recent.length) menu.push({ type: 'separator' })
    if (recent.length)
      menu.push(
        { label: 'Recent connections', enabled: false },
        ...this.connectionsList(recent),
        { type: 'separator' },
        {
          label: 'Clear recent',
          type: 'normal',
          click: () => EventBus.emit(EVENTS.clearRecent),
        }
      )

    return menu.length ? menu : [{ label: 'No recent connections', enabled: false }]
  }

  private connectionsList(list: IConnection[]) {
    let more = 0
    if (list.length > MAX_MENU_SIZE) {
      more = list.length - MAX_MENU_SIZE
      list = list.slice(0, MAX_MENU_SIZE)
    }
    let menu = list.reduce((result: any[], connection) => {
      if (connection.startTime) {
        result.push({
          label: connection.name,
          icon: connection.active ? iconConnected : connection.online ? iconOnline : iconOffline,
          submenu: [
            connection.active
              ? { label: 'Disconnect', click: () => this.disconnect(connection) }
              : connection.online
              ? { label: 'Connect', click: () => this.connect(connection) }
              : { label: 'Offline', enabled: false },
            { type: 'separator' },
            { label: hostName(connection), enabled: false },
            { label: 'Copy to clipboard', click: () => this.copy(connection) },
            connection.online
              ? { label: 'Launch', enabled: connection.active, click: () => this.launch(connection) }
              : { label: 'Remove', click: () => EventBus.emit(EVENTS.forget, connection) },
          ],
        })
      }
      return result
    }, [])
    if (more) menu.push({ label: `and ${more} more...`, click: () => this.handleOpen('connections') })
    Logger.info('TRAY MENU', { menu })
    return menu
  }

  private signInMenu() {
    return [
      { label: 'remote.it', enabled: false },
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
  }

  private disconnect(connection: IConnection) {
    headless.pool.stop(connection)
  }

  private copy(connection: IConnection) {
    const app = getApplication(connection.typeID)
    electron.clipboard.writeText(app.copy(connection))
  }

  private launch(connection: IConnection) {
    const app = getApplication(connection.typeID)
    electron.shell.openExternal(app.launch(connection))
  }
}
