import electron from 'electron'
import Environment from './Environment'
import ElectronApp from './ElectronApp'
import { IUser } from 'remote.it'
import { application } from './backend'
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

    EventBus.on(ConnectionPool.EVENTS.updated, this.updateConnections)
    EventBus.on(User.EVENTS.signedIn, this.updateUser)
    EventBus.on(User.EVENTS.signedOut, this.updateUser)
  }

  updateConnections = (pool: ConnectionData[]) => {
    this.connections = pool.map(connection => ({
      label: connection.name,
      icon: connection.pid ? iconConnected : iconOnline,
      submenu: [
        { label: !connection.pid ? 'Connect' : 'Disconnect' },
        { type: 'separator' },
        { label: 'localhost:' + connection.port, enabled: false },
        { label: 'Copy', value: 'localhost:' + connection.port },
      ],
    }))
    this.render()
  }

  updateUser = (user: IUser) => {
    this.user = user
    this.render()
  }

  private render() {
    const menuItems = this.user ? this.connectionsMenu() : this.signinMenu()
    const contextMenu = electron.Menu.buildFromTemplate(menuItems)
    this.tray.setContextMenu(contextMenu)
  }

  private connectionsMenu() {
    return [
      { label: 'remote.it', enabled: false },
      {
        label: 'Open settings...',
        type: 'normal',
        click: this.handleOpen,
      },
      { type: 'separator' },
      { label: 'Connections', enabled: false },
      ...this.connections,
    ]
  }

  private signinMenu() {
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
}
