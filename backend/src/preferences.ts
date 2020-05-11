import EventBus from './EventBus'
import Logger from './Logger'
import JSONFile from './JSONFile'
import environment from './environment'
import path from 'path'

export class Preferences {
  data?: IPreferences
  private file: JSONFile<IPreferences>

  EVENTS = { update: 'preferences' }

  constructor() {
    this.file = new JSONFile<IPreferences>(path.join(environment.userPath, 'preferences.json'))
    this.set({ ...this.defaults, ...this.file.read() })
    Logger.info('PREFERENCES', { preferences: this.data })
  }

  get defaults(): IPreferences {
    return {
      version: environment.version,
      autoUpdate: environment.isMac || environment.isWindows,
      openAtLogin: true,
    }
  }

  get(): IPreferences {
    return this.data || {}
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
