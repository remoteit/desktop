import environment from './environment'
import Logger from './Logger'
import EventBus from './EventBus'
import Axios from 'axios'
import { preferences } from '.'
import semverCompare from 'semver/functions/compare'

const LATEST = `https://api.github.com/repos/remoteit/desktop/releases/latest`

export class CheckUpdateHeadless {
  static EVENTS = {
    downloaded: 'update/downloaded',
  }

  checkUpdate = async () => {
    try {
      if (environment.isHeadless) {
        const response = await Axios.get(LATEST)
        Logger.info('LATEST VERSION FOUND', { version: response.data.tag_name })
        const latest = response.data.tag_name
        let desktopVersion = preferences.get().version
        let current = desktopVersion && semverCompare(desktopVersion, latest) >= 0
        Logger.info('IS CURRENT?', { current })
        if (!current) {
          EventBus.emit(CheckUpdateHeadless.EVENTS.downloaded, latest.substring(1))
        }
      }
      return true
    } catch (error) {
      Logger.warn('UPDATE HEADLESS FAILURE', { error })
      return false
    }
  }
}

export default new CheckUpdateHeadless()
