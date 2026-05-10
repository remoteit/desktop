// import sleep from '../helpers/sleep'
import structuredClone from '@ungap/structured-clone'
import { selectJobs } from '../selectors/scripting'
import { getDevices } from '../selectors/devices'
import { selectActiveAccountId } from '../selectors/accounts'
import { graphQLSetJob, graphQLStartJob, graphQLCancelJob, graphQLDeleteJob } from '../services/graphQLMutation'
import { AxiosResponse } from 'axios'
import { createModel } from '@rematch/core'
import { graphQLJobs } from '../services/graphQLRequest'
import { getJobLogs, triggerBrowserDownload } from '../services/jobLogs'
import { RootModel } from '.'

type ScriptsState = {
  initialized: boolean
  fetching: boolean
  size: number
  from: number
  total: number
  all: {
    [accountId: string]: IJob[]
  }
}

const defaultState: ScriptsState = {
  initialized: false,
  fetching: true,
  size: 50,
  from: 0,
  total: 0,
  all: {},
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch(args: { accountId?: string; fileID?: string; from?: number } | void, state) {
      const accountId = args?.accountId || selectActiveAccountId(state)
      const fileID = args?.fileID
      const from = args?.from ?? 0
      const { size } = state.jobs
      dispatch.jobs.set({ fetching: true, from })
      const fileIds = fileID ? [fileID] : undefined
      const result = await graphQLJobs({ accountId, fileIds, from, size })
      if (result === 'ERROR') {
        dispatch.jobs.set({ fetching: false })
        return
      }
      const total = result?.data?.data?.login?.account?.jobs?.total ?? 0
      const jobs = await dispatch.jobs.parse(result)
      console.log('LOADED JOBS', accountId, jobs)
      const merge = from > 0 || !!fileID
      if (merge) dispatch.jobs.appendJobs({ accountId, jobs })
      else dispatch.jobs.setAccount({ accountId, jobs })
      dispatch.jobs.set({ fetching: false, initialized: true, total })
    },
    async loadMore(args: { fileID?: string } | void, state) {
      if (state.jobs.fetching) return
      const { from, size } = state.jobs
      await dispatch.jobs.fetch({ fileID: args?.fileID, from: from + size })
    },
    async fetchSingle({ accountId, jobId }: { accountId?: string; jobId: string }, state) {
      dispatch.jobs.set({ fetching: true })

      // // Find latest job by fileId if jobId is not valid
      // if (jobId.length < VALID_JOB_ID_LENGTH) {
      //   alert('Invalid job ID: ' + jobId)
      //   jobId = selectJobs(state).find(j => j.file?.id === fileId)?.id || jobId
      // }

      accountId = accountId || selectActiveAccountId(state)
      const result = await graphQLJobs({ accountId, ids: [jobId] })
      if (result === 'ERROR') return
      const jobs = await dispatch.jobs.parse(result)
      console.log('LOADED JOB', accountId, jobs)
      dispatch.jobs.setJobs({ accountId, jobs })
      dispatch.jobs.set({ fetching: false })
    },
    async fetchByFileIds({ accountId, fileIds }: { accountId?: string; fileIds: string[] }, state) {
      dispatch.jobs.set({ fetching: true })
      accountId = accountId || selectActiveAccountId(state)

      const result = await graphQLJobs({ accountId, fileIds })
      if (result === 'ERROR') return

      const jobs = await dispatch.jobs.parse(result)
      console.log('LOADED FILE JOBS', accountId, jobs)

      dispatch.jobs.appendJobs({ accountId, jobs })
      dispatch.jobs.set({ fetching: false })
    },
    async fetchIfEmpty(accountId: string | void, state) {
      accountId = accountId || selectActiveAccountId(state)
      if (!state.jobs.all[accountId]) dispatch.jobs.fetch({ accountId })
    },
    async parse(result: AxiosResponse<any> | undefined): Promise<IJob[]> {
      const data = result?.data?.data?.login?.account
      return (
        data?.jobs.items.map(j => ({
          ...j,
          jobDevices: j.jobDevices.map(jd => ({
            ...jd,
            attributes: jd.attributes.map(a => ({
              key: a.key.replace('$remoteit.', ''),
              value: a.value,
            })),
          })),
        })) || []
      )
    },
    async saveRun(form: IFileForm): Promise<string> {
      console.log('SAVE AND RUN JOB', form)
      const jobId = await dispatch.jobs.save(form)
      await dispatch.jobs.run({ jobId, fileId: form.fileId })
      return jobId
    },
    async save(form: IFileForm, state): Promise<string> {
      const job = selectJobs(state).find(j => j.id === form.jobId)
      if (job?.status !== 'READY') delete form.jobId
      const data = formAdaptor(form)
      const result = await graphQLSetJob(data)
      if (result === 'ERROR') return '-'
      console.log('SAVED JOB', form, result?.data)
      const jobId: string = result?.data.data.setJob
      await dispatch.jobs.fetchSingle({ jobId })
      dispatch.ui.set({ redirect: `/script/${form.fileId}/latest` })
      return jobId
    },
    async run({ jobId, fileId }: { jobId?: string; fileId: string }) {
      if (!jobId) return console.error('NO JOB ID TO RUN')
      const result = await graphQLStartJob(jobId)
      if (result === 'ERROR') return
      console.log('STARTED JOB', { result, jobId })
      dispatch.ui.set({ redirect: `/script/${fileId}/latest` })
    },
    async runAgain(script: IScript) {
      const deviceIds = script?.job?.jobDevices.map(d => d.device.id) || []
      const tagValues = script?.job?.tag?.values || []
      // Convert job arguments to argument values format
      const argumentValues: IArgumentValue[] = script?.job?.arguments?.map(arg => ({
        name: arg.name,
        value: arg.value || '',
      })) || []
      await dispatch.jobs.saveRun({
        deviceIds,
        jobId: script.job?.id || '',
        fileId: script.id,
        name: script.name || '',
        description: script.shortDesc || '',
        executable: script.executable,
        tag: script.job?.tag,
        access: tagValues.length ? 'TAG' : deviceIds.length ? 'CUSTOM' : 'NONE',
        argumentValues,
      })
    },
    async downloadLogs({ jobId, jobDeviceId }: { jobId: string; jobDeviceId: string }) {
      const result = await getJobLogs(jobId)
      if (result.kind === 'error') {
        dispatch.ui.set({ errorMessage: `Couldn’t load logs: ${result.message}` })
        return false
      }
      if (result.kind === 'missing') {
        dispatch.ui.set({ errorMessage: 'No logs available yet.' })
        return false
      }
      const entry = result.data.devices.find(d => d.jobDeviceId === jobDeviceId)
      if (!entry?.downloadUrl) {
        dispatch.ui.set({ errorMessage: 'No logs available for this device yet.' })
        return false
      }
      triggerBrowserDownload(entry.downloadUrl, entry.filename || 'logs.tar.gz')
      return true
    },
    async downloadAllLogs({ jobId }: { jobId: string }) {
      const result = await getJobLogs(jobId)
      if (result.kind === 'error') {
        dispatch.ui.set({ errorMessage: `Couldn’t load logs: ${result.message}` })
        return false
      }
      if (result.kind === 'missing' || !result.data.downloadUrl) {
        dispatch.ui.set({ errorMessage: 'No logs are available for this run yet.' })
        return false
      }
      triggerBrowserDownload(result.data.downloadUrl, result.data.filename || 'all-logs.zip')
      return true
    },
    async cancel(jobId: string | undefined) {
      const result = await graphQLCancelJob(jobId)
      if (result === 'ERROR') return
      console.log('CANCELED JOB', { result, jobId })
    },
    async delete({ jobId, fileId }: { jobId: string; fileId: string }, state) {
      const result = await graphQLDeleteJob(jobId)
      if (result === 'ERROR') {
        dispatch.ui.set({ errorMessage: 'Error deleting job' })
        return false
      }
      console.log('DELETED JOB', { result, jobId })
      // Remove from local state
      const accountId = selectActiveAccountId(state)
      const jobs = state.jobs.all[accountId]?.filter(j => j.id !== jobId) || []
      dispatch.jobs.setAccount({ accountId, jobs })
      // Redirect to script page
      dispatch.ui.set({ redirect: `/script/${fileId}` })
      return true
    },
    async unauthorized(deviceIds: string[], state) {
      return getDevices(state).filter(
        d => deviceIds.includes(d.id) && (!d.permissions.includes('SCRIPTING') || !d.scriptable)
      )
    },
    async setJobs({ accountId, jobs }: { accountId: string; jobs: IJob[] }, state) {
      // Prepends new entries — fetchSingle uses this so freshly-saved jobs appear at the top.
      dispatch.jobs.setAccount({ accountId, jobs: upsertJobs(state.jobs.all[accountId], jobs, 'start') })
    },
    async appendJobs({ accountId, jobs }: { accountId: string; jobs: IJob[] }, state) {
      // Appends new entries — preserves server order for paginated and filtered fetches.
      dispatch.jobs.setAccount({ accountId, jobs: upsertJobs(state.jobs.all[accountId], jobs, 'end') })
    },
    async setAccount(params: { jobs: IJob[]; accountId: string }, state) {
      let all = structuredClone(state.jobs.all)
      all[params.accountId] = params.jobs
      dispatch.jobs.set({ all })
    },
  }),
  reducers: {
    reset() {
      return { ...defaultState }
    },
    set(state, params: Partial<ScriptsState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

function upsertJobs(cache: IJob[] | undefined, incoming: IJob[], position: 'start' | 'end'): IJob[] {
  const updated = structuredClone(cache || [])
  incoming.forEach(job => {
    const index = updated.findIndex(j => j.id === job.id)
    if (index !== -1) updated[index] = job
    else if (position === 'end') updated.push(job)
    else updated.unshift(job)
  })
  return updated
}

function formAdaptor(form: IFileForm) {
  return {
    fileId: form.fileId,
    jobId: form.jobId,
    arguments: form.argumentValues?.length ? form.argumentValues : undefined,
    tagFilter: form.access === 'TAG' ? form.tag : undefined,
    deviceIds: form.access === 'SELECTED' || form.access === 'CUSTOM' ? form.deviceIds : undefined,
    // all: form.access === 'ALL',
  }
}
