import { getTags } from './state'
import { createSelector } from 'reselect'
import { selectRow } from './accounts'
import { byName } from '../helpers/utilHelper'

// The tags of the row an account is looked at through: the selected row's where none is named.
export const selectTags = createSelector([getTags, selectRow], (tags, row) => [...(tags[row] || [])].sort(byName))
