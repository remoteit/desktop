import { getTags } from './state'
import { createSelector } from 'reselect'
import { selectActiveAccountId } from './accounts'
import { byName } from '../helpers/utilHelper'

export const selectTags = createSelector([getTags, selectActiveAccountId], (tags, accountId) =>
  [...(tags[accountId] || [])].sort(byName)
)
