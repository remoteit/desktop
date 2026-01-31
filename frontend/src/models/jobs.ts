// import sleep from '../helpers/sleep'
import structuredClone from '@ungap/structured-clone'
import { VALID_JOB_ID_LENGTH } from '../constants'
import { selectJobs } from '../selectors/scripting'
import { getDevices } from '../selectors/devices'
import { selectActiveAccountId } from '../selectors/accounts'
import { graphQLSetJob, graphQLStartJob, graphQLCancelJob, graphQLDeleteJob } from '../services/graphQLMutation'
import { AxiosResponse } from 'axios'
import { createModel } from '@rematch/core'
import { graphQLJobs } from '../services/graphQLRequest'
import { RootModel } from '.'

type ScriptsState = {
  initialized: boolean
  fetching: boolean
  all: {
    [accountId: string]: IJob[]
  }
}

const defaultState: ScriptsState = {
  initialized: false,
  fetching: true,
  all: {},
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch(accountId: string | void, state) {
      dispatch.jobs.set({ fetching: true })
      accountId = accountId || selectActiveAccountId(state)
      const result = await graphQLJobs(accountId)
      if (result === 'ERROR') return
      const jobs = await dispatch.jobs.parse(result)
      console.log('LOADED JOBS', accountId, jobs)
      dispatch.jobs.setAccount({ accountId, jobs })
      dispatch.jobs.set({ fetching: false, initialized: true })
    },
    async fetchSingle({ accountId, jobId }: { accountId?: string; jobId: string }, state) {
      dispatch.jobs.set({ fetching: true })

      // // Find latest job by fileId if jobId is not valid
      // if (jobId.length < VALID_JOB_ID_LENGTH) {
      //   alert('Invalid job ID: ' + jobId)
      //   jobId = selectJobs(state).find(j => j.file?.id === fileId)?.id || jobId
      // }

      accountId = accountId || selectActiveAccountId(state)
      const result = await graphQLJobs(accountId, undefined, [jobId])
      if (result === 'ERROR') return
      const jobs = await dispatch.jobs.parse(result)
      console.log('LOADED JOB', accountId, jobs)
      dispatch.jobs.setJobs({ accountId, jobs })
      dispatch.jobs.set({ fetching: false })
    },
    async fetchByFileIds({ accountId, fileIds }: { accountId?: string; fileIds: string[] }, state) {
      dispatch.jobs.set({ fetching: true })
      accountId = accountId || selectActiveAccountId(state)

      const result = await graphQLJobs(accountId, fileIds, undefined)
      if (result === 'ERROR') return

      const jobs = await dispatch.jobs.parse(result)
      console.log('LOADED FILE JOBS', accountId, jobs)

      dispatch.jobs.setJobs({ accountId, jobs })
      dispatch.jobs.set({ fetching: false })
    },
    async fetchIfEmpty(accountId: string | void, state) {
      accountId = accountId || selectActiveAccountId(state)
      if (!state.jobs.all[accountId]) dispatch.jobs.fetch(accountId)
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
    async run({ jobId, fileId }: { jobId?: string; fileId: string }, state) {
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
      const updated = structuredClone(state.jobs.all[accountId] || [])

      jobs.forEach(job => {
        const index = updated.findIndex(j => j.id === job.id)
        if (index === -1) updated.unshift(job)
        else updated[index] = job
      })

      dispatch.jobs.setAccount({ accountId, jobs: updated })
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
