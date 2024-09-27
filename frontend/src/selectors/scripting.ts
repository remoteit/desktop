import { getFiles, getJobs, optionalSecondParam, optionalThirdParam } from './state'
import { createSelector } from 'reselect'
import { selectActiveAccountId } from './accounts'

export const selectScripts = createSelector([getFiles, selectActiveAccountId], (files, accountId) => {
  return files[accountId]?.filter(f => f.executable) || []
})

export const selectFiles = createSelector([getFiles, selectActiveAccountId], (files, accountId) => {
  return files[accountId]?.filter(f => !f.executable) || []
})

export const selectJobs = createSelector([getJobs, selectActiveAccountId], (jobs, accountId) => {
  return jobs[accountId] || []
})

export const selectFile = createSelector(
  [getFiles, selectActiveAccountId, optionalSecondParam],
  (files, accountId, fileId) => {
    return files[accountId]?.find(f => f.id === fileId)
  }
)

export const selectScript = createSelector(
  [getFiles, getJobs, selectActiveAccountId, optionalSecondParam, optionalThirdParam],
  (files, jobs, accountId, fileId, jobId) => {
    jobId = jobId === '-' ? undefined : jobId
    const file = files[accountId]?.find(f => f.id === fileId)
    const job = jobs[accountId]?.find(j => (jobId ? j.id === jobId : j.file?.id === fileId))
    return file ? { ...file, job } : undefined
  }
)
