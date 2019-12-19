import { application } from '.'
import { hostName } from './helpers/nameHelper'
import { IP_PRIVATE } from './constants'
import LAN from './LAN'
import electron from 'electron'
import Environment from './Environment'
import ElectronApp from './ElectronApp'
import ConnectionPool from './ConnectionPool'
import EventBus from './EventBus'
import user from './User'
import path from 'path'

const iconConnected = path.join(__dirname, 'images', 'iconConnectedTemplate.png')
const iconOnline = path.join(__dirname, 'images', 'iconOnlineTemplate.png')

export default class TrayMenu {
  private tray: any
  private connections: any[]
  private privateIP: ipAddress

  constructor(tray: electron.Tray) {
    this.tray = tray
    this.connections = []
    this.privateIP = IP_PRIVATE

    if (Environment.isWindows) {
      this.tray.on('click', () => {
        this.tray.popUpContextMenu()
      })
    }

    EventBus.on(user.EVENTS.signedIn, this.updateConnectionMenu)
    EventBus.on(user.EVENTS.signedOut, this.updateConnectionMenu)
    EventBus.on(ConnectionPool.EVENTS.updated, this.updateConnectionMenu)
    EventBus.on(LAN.EVENTS.privateIP, privateIP => (this.privateIP = privateIP))
  }

  private render = () => {
    const menuItems = user.signedIn ? this.remoteitMenu() : this.signInMenu()
    const contextMenu = electron.Menu.buildFromTemplate(menuItems)
    this.tray.setContextMenu(contextMenu)
  }

  private updateConnectionMenu = (pool: IConnection[]) => {
    this.connections = pool.reduce((result: any[], connection) => {
      if (connection.startTime && connection.owner === user.username) {
        const location = hostName(connection, this.privateIP)
        result.push({
          label: connection.name,
          icon: connection.active ? iconConnected : iconOnline,
          submenu: [
            !connection.active
              ? { label: 'Connect', click: () => this.connect(connection) }
              : { label: 'Disconnect', click: () => this.disconnect(connection) },
            { type: 'separator' },
            { label: location, enabled: false },
            { label: 'Copy to clipboard', click: () => this.copy(location) },
            { label: 'Launch', click: () => this.launch(location) },
          ],
        })
      }
      return result
    }, [])
    this.render()
  }

  private remoteitMenu() {
    return [
      {
        label: 'Open remote.it...',
        type: 'normal',
        click: this.handleOpen,
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
      {
        label: 'Quit',
        type: 'normal',
        click: electron.app.quit,
      },
    ]
  }

  private handleOpen = (menuItem: any, browserWindow: any, event: any) =>
    EventBus.emit(
      ElectronApp.EVENTS.open,
      // Open dev tools when command+option clicked
      process.defaultApp && event.metaKey
    )

  private connect(connection: IConnection) {
    application.pool.start(connection)
  }

  private disconnect(connection: IConnection) {
    application.pool.stop(connection)
  }

  private copy(location: string) {
    electron.clipboard.writeText(location)
  }

  private launch(location: string) {
    electron.shell.openExternal(`http://${location}`)
  }
}
