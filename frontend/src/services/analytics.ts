import { store } from '../store'
import { isPortal } from './Browser'
import { GOOGLE_TAG_MANAGER_DESKTOP_KEY, GOOGLE_TAG_MANAGER_PORTAL_KEY } from '../shared/constants'
import TagManager from 'react-gtm-module'

const analytics = {
  initialize() {
    const gtmId = isPortal() ? GOOGLE_TAG_MANAGER_PORTAL_KEY : GOOGLE_TAG_MANAGER_DESKTOP_KEY
    console.log('ANALYTICS INITIALIZE')
    TagManager.initialize({ gtmId: gtmId?.trim() })
    analytics.initializeClarity()
  },

  initializeClarity() {
    // this also happens in the auth model - might be able to remove it here
    const user = store.getState().user
    if (window.clarity) window.clarity('set', 'user', user.email)
  },
}

export default analytics
