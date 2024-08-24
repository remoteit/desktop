import { getFiles, getJobs, optionalSecondParam } from './state'
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

export const selectFile = createSelector(
  [getFiles, selectActiveAccountId, optionalSecondParam],
  (files, accountId, fileId) => {
    if (!files[accountId]) return
    return files[accountId].find(f => f.id === fileId)
  }
)

export const selectScript = createSelector(
  [getFiles, getJobs, selectActiveAccountId, optionalSecondParam],
  (files, jobs, accountId, fileId) => {
    if (!files[accountId]) return
    const file = files[accountId].find(f => f.id === fileId)
    const job = jobs[accountId].find(j => j.file?.id === fileId)
    return { ...file, job }
  }
)
