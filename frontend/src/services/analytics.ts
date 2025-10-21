import browser, { getOs, getApp } from './browser'
import {
  GOOGLE_TAG_MANAGER_DESKTOP_KEY,
  GOOGLE_TAG_MANAGER_PORTAL_KEY,
  GOOGLE_TAG_MANAGER_ANDROID_KEY,
  GOOGLE_TAG_MANAGER_IOS_KEY,
} from '../constants'
import TagManager from 'react-gtm-module'
import { version } from '../helpers/versionHelper'

const analytics = {
  initialize() {
    const gtmId = browser.isPortal
      ? GOOGLE_TAG_MANAGER_PORTAL_KEY
      : browser.isAndroid
      ? GOOGLE_TAG_MANAGER_ANDROID_KEY
      : browser.isIOS
      ? GOOGLE_TAG_MANAGER_IOS_KEY
      : GOOGLE_TAG_MANAGER_DESKTOP_KEY
    console.log('ANALYTICS INITIALIZE')
    TagManager.initialize({ gtmId: gtmId?.trim() })
    TagManager.dataLayer({
      dataLayer: {
        app_version: version,
        platform: getOs(),
        app_name: getApp(),
      },
    })
  },

  signedIn(user?: IUser) {
    if (user) {
      TagManager.dataLayer({ dataLayer: { user_id: user.id } })
      if (window.clarity) window.clarity('identify', user.id)
    }
  },
}

export default analytics
