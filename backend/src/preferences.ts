import EventBus from './EventBus'
import Logger from './Logger'
import JSONFile from './JSONFile'
import environment from './environment'
import path from 'path'

export class Preferences {
  data: IPreferences = {
    version: '',
    cliVersion: '',
    cliConfigVersion: undefined,
    autoUpdate: false,
    openAtLogin: true,
    remoteUIOverride: false,
    disableLocalNetwork: !environment.isHeadless,
    disableDeepLinks: false,
    allowPrerelease: false,
    useCertificate: true,
    switchApi: false,
    apiURL: '',
    apiGraphqlURL: '',
    windowState: { width: 1280, height: 800 },
  }

  private file: JSONFile<IPreferences>

  EVENTS = { update: 'preferences' }

  constructor() {
    this.file = new JSONFile<IPreferences>(path.join(environment.userPath, 'preferences.json'))
    const fileData = this.file.read()
    if (!fileData) Logger.warn('NO PREFERENCES DATA', { fileData })
    this.set({ ...this.defaults, ...fileData })
  }

  get defaults(): IPreferences {
    return {
      ...this.data,
      version: environment.version,
      autoUpdate: environment.isMac || environment.isWindows,
    }
  }

  get(): IPreferences {
    return this.data || this.file.read()
  }

  update(pref: { [key: string]: any }) {
    Logger.info('UPDATE PREFERENCE', pref)
    const data = this.get()
    this.set({ ...data, ...pref })
  }

  set = (preferences: IPreferences) => {
    Logger.info('SET PREFERENCES', { preferences })
    this.file.write(preferences)
    this.data = preferences
    EventBus.emit(this.EVENTS.update, preferences)
  }
}

export default new Preferences()
