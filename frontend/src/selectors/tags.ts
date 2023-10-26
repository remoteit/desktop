import { getTags } from './state'
import { createSelector } from 'reselect'
import { selectActiveAccountId } from './accounts'

export const selectTags = createSelector([getTags, selectActiveAccountId], (tags, accountId) => tags[accountId] || [])
