import { createSelector } from 'reselect'
import { ApplicationState } from '../store'
import { getActiveAccountId } from './accounts'

const getTags = (state: ApplicationState) => state.tags.all

export const selectTags = createSelector(
  [getTags, getActiveAccountId],
  (tags, activeAccountId) => tags[activeAccountId] || []
)
