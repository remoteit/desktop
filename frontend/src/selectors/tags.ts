import { getTags } from './state'
import { createSelector } from 'reselect'
import { getActiveAccountId } from './accounts'

export const selectTags = createSelector(
  [getTags, getActiveAccountId],
  (tags, activeAccountId) => tags[activeAccountId] || []
)
