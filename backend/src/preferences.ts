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
    if (!this.file.exists) this.file.write(this.defaults)
    this.set(this.file.read() || {})
    Logger.info('PREFERENCES', { preferences: this.data })
  }

  get defaults(): IPreferences {
    return {
      autoUpdate: environment.isMac || environment.isWindows,
      openAtLogin: true,
    }
  }

  set = (preferences: IPreferences) => {
    this.file.write(preferences)
    this.data = preferences
    Logger.info('SET PREFERENCES', { preferences })
    EventBus.emit(this.EVENTS.update, this.data)
  }
}

export default new Preferences()
