import { createSelector } from 'reselect'
import { ApplicationState } from '../store'
import { getActiveAccountId } from './accounts'

const getDefaultSelected = (state: ApplicationState) => state.ui.defaultSelection

export const selectDefaultSelected = createSelector(
  [getActiveAccountId, getDefaultSelected],
  (activeAccountId, defaultSelected) => defaultSelected[activeAccountId] || {}
)
