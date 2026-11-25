import { getFiles, getJobs, optionalSecondParam, optionalThirdParam } from './state'
import { createSelector } from 'reselect'
import { selectRow } from './accounts'
import { byNewest } from '../helpers/utilHelper'

/*
  Newest run first. The API is asked for this order, but the job cache is also
  written to by prepend, append and in place update, any of which can leave the
  cached order stale - so sort here rather than trusting the cache order.
*/
// Files and jobs are kept by row (helpers/rowKey): these read the row an account is looked at through.
const sortJobs = (jobs: IJob[] = []) => [...jobs].sort(byNewest)

export const selectScripts = createSelector([getFiles, getJobs, selectRow], (files, jobs, row) => {
  const sorted = sortJobs(jobs[row])
  const scripts: IScript[] = (files[row] || [])
    .filter(f => f.executable)
    .map(f => {
      const job = sorted.find(j => j.file?.id === f.id)
      return { ...f, job }
    })
  return scripts
})

export const selectFiles = createSelector([getFiles, selectRow], (files, row) => {
  return files[row]?.filter(f => !f.executable) || []
})

export const selectJobs = createSelector([getJobs, selectRow, optionalSecondParam], (jobs, row, fileId) => {
  const sorted = sortJobs(jobs[row])
  return fileId ? sorted.filter(f => f.file?.id === fileId) : sorted
})

export const selectFile = createSelector([getFiles, selectRow, optionalSecondParam], (files, row, fileId) => {
  return files[row]?.find(f => f.id === fileId)
})

export const selectJob = createSelector([getJobs, selectRow, optionalSecondParam], (jobs, row, jobId) => {
  return jobs[row]?.find(j => j.id === jobId)
})

export const selectScript = createSelector(
  [getFiles, getJobs, selectRow, optionalSecondParam, optionalThirdParam],
  (files, allJobs, row, fileId, jobId) => {
    const file = files[row]?.find(f => f.id === fileId)
    const jobs = sortJobs(allJobs[row]).filter(j => j.file?.id === fileId)
    const job = jobs.find(j => j.id === jobId) || jobs[0]
    return file ? { ...file, job, jobs } : undefined
  }
)
