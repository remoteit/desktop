import structuredClone from '@ungap/structured-clone'
import { selectJobs } from '../selectors/scripting'
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
    async save(form: IFileForm) {
      const data = formAdaptor(form)
      const result = await graphQLSetJob(data)
      if (result === 'ERROR') return
      console.log('SAVED JOB', result?.data)
      return result?.data.data.setJob
    },
    async saveAndRun(form: IFileForm) {
      const data = formAdaptor(form)
      const result = await graphQLStartJob(data)
      if (result === 'ERROR') return
      console.log('STARTED JOB', { result, data })
    },
    async run(jobId: string | undefined, state) {
      let result
      const job = selectJobs(state).find(j => j.id === jobId)
      if (!job) return

      const params = {
        fileId: job.file?.id,
        tagFilter: job.tag.values.length ? job.tag : undefined,
        deviceIds: job.jobDevices.map(jd => jd.id),
      }

      console.log('RUNNING JOB', jobId, params)

      // start existing job
      if (job.status === 'READY') result = await graphQLStartJob({ jobId, ...params })
      // duplicate for new job
      else if (job) result = await graphQLStartJob(params)

      if (result === 'ERROR') return
      console.log('STARTED JOB', { result, jobId })
    },
    async cancel(jobId: string | undefined) {
      const result = await graphQLCancelJob(jobId)
      if (result === 'ERROR') return
      console.log('CANCELED JOB', { result, jobId })
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
    deviceIds: form.access === 'SELECTED' ? form.deviceIds : undefined,
    // all: form.access === 'ALL',
  }
}