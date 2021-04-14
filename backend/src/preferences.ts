import EventBus from './EventBus'
import Logger from './Logger'
import JSONFile from './JSONFile'
import environment from './environment'
import path from 'path'

export class Preferences {
  data: IPreferences = {
    version: 'unknown',
    cliVersion: 'unknown',
    autoUpdate: false,
    openAtLogin: true,
    remoteUIOverride: false,
    disableLocalNetwork: false,
    showNotifications: true,
    allowPrerelease: false,
    useCertificate: true,
    switchApi: false,
    testUI: false,
  }

  private file: JSONFile<IPreferences>

  EVENTS = { update: 'preferences' }

  constructor() {
    this.file = new JSONFile<IPreferences>(path.join(environment.userPath, 'preferences.json'))
    this.set({ ...this.defaults, ...this.file.read() })
  }

  get defaults(): IPreferences {
    return {
      ...this.data,
      version: environment.version,
      autoUpdate: environment.isMac || environment.isWindows,
    }
  }

  get(): IPreferences {
    return this.data
  }

  update(pref: { [key: string]: any }) {
    this.set({ ...this.data, ...pref })
  }

  set = (preferences: IPreferences) => {
    this.file.write(preferences)
    this.data = preferences
    Logger.info('SET PREFERENCES', { preferences })
    EventBus.emit(this.EVENTS.update, this.data)
  }
}

export default new Preferences()
