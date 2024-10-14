import structuredClone from '@ungap/structured-clone'
import { selectJobs } from '../selectors/scripting'
import { getDevices } from '../selectors/devices'
import { selectActiveAccountId } from '../selectors/accounts'
import { graphQLSetJob, graphQLStartJob, graphQLCancelJob } from '../services/graphQLMutation'
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
      accountId = accountId || selectActiveAccountId(state)
      const result = await graphQLJobs(accountId, [jobId])
      if (result === 'ERROR') return
      const jobs = await dispatch.jobs.parse(result)
      console.log('LOADED JOB', accountId, jobs)
      dispatch.jobs.setJob({ accountId, job: jobs[0] })
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
    async saveRun(form: IFileForm) {
      console.log('SAVE AND RUN JOB', form)
      const jobId = await dispatch.jobs.save(form)
      await dispatch.jobs.run(jobId)
    },
    async save(form: IFileForm, state) {
      const job = selectJobs(state).find(j => j.id === form.jobId)
      if (job?.status !== 'READY') delete form.jobId
      const data = formAdaptor(form)
      const result = await graphQLSetJob(data)
      if (result === 'ERROR') return
      console.log('SAVED JOB', result?.data)
      return result?.data.data.setJob // jobId
    },
    async run(jobId: string | undefined) {
      if (!jobId) return console.error('NO JOB ID TO RUN')
      const result = await graphQLStartJob(jobId)
      if (result === 'ERROR') return
      console.log('STARTED JOB', { result, jobId })
    },
    async runAgain(script: IScript) {
      const deviceIds = script?.job?.jobDevices.map(d => d.device.id) || []
      const tagValues = script?.job?.tag?.values || []
      dispatch.jobs.saveRun({
        deviceIds,
        jobId: script.job?.id || '',
        fileId: script.id,
        name: script.name || '',
        description: script.shortDesc || '',
        executable: script.executable,
        tag: script.job?.tag,
        access: tagValues.length ? 'TAG' : deviceIds.length ? 'CUSTOM' : 'NONE',
      })
    },
    async cancel(jobId: string | undefined) {
      const result = await graphQLCancelJob(jobId)
      if (result === 'ERROR') return
      console.log('CANCELED JOB', { result, jobId })
    },
    async unauthorized(deviceIds: string[], state) {
      return getDevices(state).filter(d => deviceIds.includes(d.id) && !d.permissions.includes('SCRIPTING'))
    },
    async setJob({ accountId, job }: { accountId: string; job: IJob }, state) {
      const jobs = structuredClone(state.jobs.all[accountId] || [])
      const index = jobs.findIndex(j => j.id === job.id)
      if (index === -1) jobs.push(job)
      else jobs[index] = job
      dispatch.jobs.setAccount({ accountId, jobs })
    },
    async setAccount(params: { jobs: IJob[]; accountId: string }, state) {
      let all = structuredClone(state.jobs.all)
      all[params.accountId] = params.jobs
      dispatch.jobs.set({ all })
    },
  }),
  reducers: {
    reset(state) {
      state = { ...defaultState }
      return state
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
    arguments: undefined, // form.arguments to be implemented
    tagFilter: form.access === 'TAG' ? form.tag : undefined,
    deviceIds: form.access === 'SELECTED' || form.access === 'CUSTOM' ? form.deviceIds : undefined,
    // all: form.access === 'ALL',
  }
}