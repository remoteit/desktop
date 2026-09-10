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

  update(pref: { [key: string]: any }) {
    Logger.info('UPDATE PREFERENCE', pref)
    const data = this.get()
    this.set({ ...data, ...pref })
  }

  // Merge, never replace: the renderer can emit its own preferences state before the
  // backend's has reached it (ui.ts resolves the language on startup), which wiped every
  // key but version/cliVersion/language and switched auto-update off.
  set = (preferences: IPreferences) => {
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
