import { getFiles, getJobs, optionalSecondParam, optionalThirdParam } from './state'
import { createSelector } from 'reselect'
import { selectActiveAccountId } from './accounts'

export const selectScripts = createSelector([getFiles, getJobs, selectActiveAccountId], (files, jobs, accountId) => {
  const scripts: IScript[] = (files[accountId] || [])
    .filter(f => f.executable)
    .map(f => {
      const job = (jobs[accountId] || []).find(j => j.file?.id === f.id)
      return { ...f, job }
    })
  return scripts
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

export const selectJob = createSelector(
  [getJobs, selectActiveAccountId, optionalSecondParam],
  (jobs, accountId, jobId) => {
    return jobs[accountId]?.find(j => j.id === jobId)
  }
)

export const selectScript = createSelector(
  [getFiles, getJobs, selectActiveAccountId, optionalSecondParam, optionalThirdParam],
  (files, allJobs, accountId, fileId, jobId) => {
    const file = files[accountId]?.find(f => f.id === fileId)
    const jobs = allJobs[accountId]?.filter(j => j.file?.id === fileId)
    const job = jobs.find(j => j.id === jobId) || jobs[0]
    return file ? { ...file, job, jobs } : undefined
  }
)
