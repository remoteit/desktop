import { getFiles, getJobs, optionalSecondParam, optionalThirdParam } from './state'
import { createSelector } from 'reselect'
import { selectActiveAccountId } from './accounts'

/*
  Newest run first. The API is asked for this order, but the job cache is also
  written to by prepend, append and in place update, any of which can leave the
  cached order stale - so sort here rather than trusting the cache order.
*/
const byNewest = (a: IJob, b: IJob) => new Date(b.updated).getTime() - new Date(a.updated).getTime()

const sortJobs = (jobs: IJob[] = []) => [...jobs].sort(byNewest)

export const selectScripts = createSelector([getFiles, getJobs, selectActiveAccountId], (files, jobs, accountId) => {
  const sorted = sortJobs(jobs[accountId])
  const scripts: IScript[] = (files[accountId] || [])
    .filter(f => f.executable)
    .map(f => {
      const job = sorted.find(j => j.file?.id === f.id)
      return { ...f, job }
    })
  return scripts
})

export const selectFiles = createSelector([getFiles, selectActiveAccountId], (files, accountId) => {
  return files[accountId]?.filter(f => !f.executable) || []
})

export const selectJobs = createSelector(
  [getJobs, selectActiveAccountId, optionalSecondParam],
  (jobs, accountId, fileId) => {
    const sorted = sortJobs(jobs[accountId])
    return fileId ? sorted.filter(f => f.file?.id === fileId) : sorted
  }
)

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
    const jobs = sortJobs(allJobs[accountId]).filter(j => j.file?.id === fileId)
    const job = jobs.find(j => j.id === jobId) || jobs[0]
    return file ? { ...file, job, jobs } : undefined
  }
)
