import { getFiles } from './state'
import { createSelector } from 'reselect'
import { selectActiveAccountId } from './accounts'

export const selectScripts = createSelector([getFiles, selectActiveAccountId], (files, accountId) => {
  if (!files[accountId]) return []
  return files[accountId].filter(f => f.executable)
})
