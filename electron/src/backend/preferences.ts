import environment from './environment'
import JSONFile from './JSONFile'
import EventBus from './EventBus'
import Logger from './Logger'
import path from 'path'

export class Preferences {
  windowDefaultState: IPreferences['windowState'] = { width: 1280, height: 800 }
  data: IPreferences = {
    version: '',
    cliVersion: '',
    cliConfigVersion: undefined,
    autoUpdate: false,
    openAtLogin: !environment.isDev,
    remoteUIOverride: false,
    disableLocalNetwork: !environment.isHeadless,
    disableDeepLinks: false,
    allowPrerelease: false,
    useCertificate: true,
    switchApi: false,
    apiURL: '',
    apiGraphqlURL: '',
    windowState: structuredClone(this.windowDefaultState),
    sshConfig: false,
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
      autoUpdate: environment.isMac || environment.isWindows,
    }
  }

  get(): IPreferences {
    return this.data || this.file.read()
  }

  // Merge, never replace: a renderer emit that raced the backend's state once wiped every
  // other key and switched auto-update off.
  set = (preferences: Partial<IPreferences>) => {
    Logger.info('SET PREFERENCES', { preferences })
    const data = { ...this.data, ...preferences }
    // @ts-ignore - remove circular reference
    delete data.preferences
    this.file.write(data)
    this.data = data
    EventBus.emit(this.EVENTS.update, data)
  }
}

export default new Preferences()
