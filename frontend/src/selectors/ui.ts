import { createSelector } from 'reselect'
import { getDefaultSelected, getThemeMode } from './state'
import { getActiveAccountId } from './accounts'
import { getTheme } from '../styling/theme'

export const selectDefaultSelected = createSelector(
  [getActiveAccountId, getDefaultSelected],
  (activeAccountId, defaultSelected) => defaultSelected[activeAccountId] || {}
)

export const selectTheme = createSelector([getThemeMode], theme => getTheme(theme))
