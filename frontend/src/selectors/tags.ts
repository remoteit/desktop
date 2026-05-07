import { getTags } from './state'
import { createSelector } from 'reselect'
import { selectActiveAccountId } from './accounts'

export const selectTags = createSelector([getTags, selectActiveAccountId], (tags, accountId) =>
  [...(tags[accountId] || [])].sort((a, b) => a.name.localeCompare(b.name))
)
