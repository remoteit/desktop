import { Server } from './server'
import debug from 'debug'
import path from 'path'
import { app, Menu, Tray, BrowserWindow } from 'electron'

const d = debug('desktop:application')

class Application {
  private mainWindow: BrowserWindow | null = null
  private tray: Tray | null = null

  constructor() {
    new Server()
    app.on('ready', this.handleAppStartup)
    app.on('window-all-closed', this.handleAllWindowsClosed)
    app.on('activate', this.reopenMainWindow)
  }

  /**
   * Create the main application window that contains the UI
   * for the desktop app.
   */
  public showMainWindow = () => {
    // Don't create multiple instances of the main window
    if (this.mainWindow) return

    d('Showing main window')
    this.mainWindow = new BrowserWindow({ width: 1000, height: 800 })

    this.mainWindow.loadFile(path.join(__dirname, 'index.html'))

    // if (process.env.NODE_ENV === 'development')
    // mainWindow.webContents.openDevTools()

    this.mainWindow.on('closed', () => {
      d('Main window closed')
      this.mainWindow = null
    })
  }

  public showTrayIcon = () => {
    d('Showing tray icon')

    // TODO: Handle OSX dark/light modes
    const iconPath = path.join(__dirname, 'images', 'r3.png')
    d('Tray icon path:', iconPath)

    this.tray = new Tray(iconPath)
    this.tray.on('click', this.handleTrayClick)
    // this.setContextMenu()
  }

  public showDockIcon = () => {
    d('Showing dock icon')
    app.dock.show()
  }

  public hideDockIcon = () => {
    d('Hiding dock icon')
    app.dock.hide()
  }

  private focusMainWindow = () => {
    if (this.mainWindow) this.mainWindow.focus()
  }

  // private setContextMenu = () => {
  //   const contextMenu = Menu.buildFromTemplate([
  //     { label: 'Logs', type: 'radio' },
  //     { label: 'Quit remote.it Desktop', role: 'quit' },
  //   ])

  //   // Call this again for Linux because we modified the context menu
  //   if (this.tray) this.tray.setContextMenu(contextMenu)
  // }

  private handleTrayClick = () => {
    this.showMainWindow()
    this.focusMainWindow()
  }

  /**
   * Handle the application startup. This is the main entrypoint
   * event.
   */
  private handleAppStartup = () => {
    d('Application starting up!')
    // this.showMainWindow()
    this.showTrayIcon()
    d('Desktop application ready!')
  }

  /**
   * Quit the application when the last window was closed,
   * except for OSX where that is not the OS's standard behavior.
   */
  private handleAllWindowsClosed = () => {
    d('All windows closed')
    if (process.platform !== 'darwin') app.quit()
  }

  /**
   * Re-open the main window if clicking on the application icon
   * in case the user closed the window and wants to re-open it.
   */
  private reopenMainWindow = () => {
    d('Reopening main window')
    if (this.mainWindow === null) this.showMainWindow()
  }
}

export default Application
