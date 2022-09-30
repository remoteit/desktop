import { isPortal } from './Browser'
import { GOOGLE_TAG_MANAGER_DESKTOP_KEY, GOOGLE_TAG_MANAGER_PORTAL_KEY } from '../shared/constants'
import TagManager from 'react-gtm-module'

const analytics = {
  initialize() {
    const gtmId = isPortal() ? GOOGLE_TAG_MANAGER_PORTAL_KEY : GOOGLE_TAG_MANAGER_DESKTOP_KEY
    TagManager.initialize({ gtmId })
  },
}

export default analytics
