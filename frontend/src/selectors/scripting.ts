import { getFiles, getJobs } from './state'
import { createSelector } from 'reselect'
import { selectActiveAccountId } from './accounts'

export const selectScripts = createSelector([getFiles, selectActiveAccountId], (files, accountId) => {
  if (!files[accountId]) return []
  return files[accountId].filter(f => f.executable)
})

export const selectFiles = createSelector([getFiles, selectActiveAccountId], (files, accountId) => {
  if (!files[accountId]) return []
  return files[accountId].filter(f => !f.executable)
})

export const selectJobs = createSelector([getJobs, selectActiveAccountId], (jobs, accountId) => {
  return jobs[accountId] || []
})
