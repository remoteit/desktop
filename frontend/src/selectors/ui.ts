import { createSelector } from 'reselect'
import { getDefaultSelected } from './state'
import { getActiveAccountId } from './accounts'

export const selectDefaultSelected = createSelector(
  [getActiveAccountId, getDefaultSelected],
  (activeAccountId, defaultSelected) => defaultSelected[activeAccountId] || {}
)
