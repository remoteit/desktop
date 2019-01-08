import { ipcMain, Event } from 'electron'

export default class Listener {
  static register(message: any, payload: any) {
    ipcMain.on(message, (event: Event) => event.sender.send(message, payload))
  }
}
