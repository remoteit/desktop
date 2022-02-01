import environment from './environment'
import Logger from './Logger'
import EventBus from './EventBus'
import Axios from 'axios'
import { preferences } from '.'
import semverCompare from 'semver/functions/compare'
import { LATEST } from './constants'

export class HeadlessUpdater {
  static checkUpdate() {
    throw new Error('Method not implemented.')
  }
  static EVENTS = {
    downloaded: 'update/downloaded',
  }

  check = async () => {
    if (!environment.isHeadless) return
    try {
      const response = await Axios.get(LATEST)
      Logger.info('LATEST HEADLESS VERSION IS', { version: response.data.tag_name })
      const latest = response.data.tag_name
      let desktopVersion = preferences.get().version
      let current = desktopVersion && semverCompare(desktopVersion, latest) >= 0
      if (!current) {
        Logger.warn('THERE IS A NEW HEADLESS VERSION AVAILABLE', { latest })
        EventBus.emit(HeadlessUpdater.EVENTS.downloaded, latest.substring(1))
      }

      return true
    } catch (error) {
      Logger.warn('UPDATE HEADLESS FAILURE', { error })
      return false
    }
  }
}

export default new HeadlessUpdater()
