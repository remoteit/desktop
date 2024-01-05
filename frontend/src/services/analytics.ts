import browser from './Browser'
import {
  GOOGLE_TAG_MANAGER_DESKTOP_KEY,
  GOOGLE_TAG_MANAGER_PORTAL_KEY,
  GOOGLE_TAG_MANAGER_ANDROID_KEY,
  GOOGLE_TAG_MANAGER_IOS_KEY,
} from '../constants'
import TagManager from 'react-gtm-module'

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
    // analytics.initializeClarity()
  },

  // initializeClarity() {
  //   const user = store.getState().user
  //   if (window.clarity) window.clarity('set', 'user', user.email)
  // },
}

export default analytics
