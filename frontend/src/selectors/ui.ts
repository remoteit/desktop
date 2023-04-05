import { createSelector } from 'reselect'
import { getDefaultSelected, getThemeDark, getUpdateStatus, getNotifiedVersion, getPreferences } from './state'
import { getActiveAccountId } from './accounts'
import { getTheme } from '../styling/theme'
import { version } from '../helpers/versionHelper'

export const selectDefaultSelected = createSelector(
  [getActiveAccountId, getDefaultSelected],
  (activeAccountId, defaultSelected) => defaultSelected[activeAccountId] || {}
)

export const selectTheme = createSelector([getThemeDark], darkTheme => getTheme(darkTheme))

export const selectUpdateNotice = createSelector(
  [getUpdateStatus, getPreferences, getNotifiedVersion],
  (updateStatus, preferences, notifiedVersion) => {
    if (preferences.autoUpdate && updateStatus.downloaded && updateStatus.version !== version) {
      if (!notifiedVersion || notifiedVersion !== updateStatus.version) return updateStatus.version
    }
  }
)
