import { ipcMain, Event } from 'electron'

export default class Listener {
  /**
   * Register a listener for the render process which asynchronously
   * replies back with a response with the same message name.
   */
  static register(message: any, payload: any) {
    ipcMain.on(message, (event: Event) => event.sender.send(message, payload))
  }
}
