import { application } from './backend'
import { IUser } from 'remote.it'
import electron from 'electron'
import Environment from './Environment'
import ElectronApp from './ElectronApp'
import ConnectionPool from './ConnectionPool'
import User from './User'
import EventBus from './EventBus'
import path from 'path'

const iconConnected = path.join(__dirname, 'images', 'iconConnectedTemplate.png')
const iconOnline = path.join(__dirname, 'images', 'iconOnlineTemplate.png')

export default class TrayMenu {
  private tray: any
  private connections: any[]
  private user: any

  constructor(tray: electron.Tray) {
    this.tray = tray
    this.user = {}
    this.connections = []

    if (Environment.isWindows) {
      this.tray.on('click', () => {
        this.tray.popUpContextMenu()
      })
    }

    EventBus.on(User.EVENTS.signedIn, this.updateUser)
    EventBus.on(User.EVENTS.signedOut, this.updateUser)
    EventBus.on(ConnectionPool.EVENTS.updated, this.updateConnectionMenu)
  }

  private updateUser = (user: IUser) => {
    this.user = user
    this.render()
  }

  private updateConnectionMenu = (pool: ConnectionData[]) => {
    this.connections = pool.map(connection => ({
      label: connection.name,
      icon: connection.pid ? iconConnected : iconOnline,
      submenu: [
        !connection.pid
          ? { label: 'Connect', click: () => this.connect(connection.id) }
          : { label: 'Disconnect', click: () => this.disconnect(connection.id) },
        { type: 'separator' },
        { label: 'localhost:' + connection.port, enabled: false },
        { label: 'Copy to clipboard', click: () => this.copy(connection.port) },
        { label: 'Launch', click: () => this.launch(connection.port) },
      ],
    }))
    this.render()
  }

  private render() {
    const menuItems = this.user ? this.remoteitMenu() : this.signInMenu()
    const contextMenu = electron.Menu.buildFromTemplate(menuItems)
    this.tray.setContextMenu(contextMenu)
  }

  private remoteitMenu() {
    return [
      { label: 'remote.it', enabled: false },
      {
        label: 'Open...',
        type: 'normal',
        click: this.handleOpen,
      },
      { type: 'separator' },
      ...this.connectionsMenu(),
    ]
  }

  private connectionsMenu() {
    return this.connections.length
      ? [{ label: 'Connections', enabled: false }, ...this.connections]
      : [{ label: 'No recent connections', enabled: false }]
  }

  private signInMenu() {
    return [
      { label: 'remote.it', enabled: false },
      {
        label: 'Sign in...',
        type: 'normal',
        click: this.handleOpen,
      },
    ]
  }

  private handleOpen = (menuItem: any, browserWindow: any, event: any) =>
    EventBus.emit(
      ElectronApp.EVENTS.open,
      // Open dev tools when command+option clicked
      process.defaultApp && event.metaKey
    )

  private connect(id: string) {
    application.pool.restart(id)
  }

  private disconnect(id: string) {
    application.pool.stop(id)
  }

  private copy(port: number) {
    electron.clipboard.writeText(`localhost:${port}`)
  }

  private launch(port: number) {
    electron.shell.openExternal(`http://localhost:${port}`)
  }
}
