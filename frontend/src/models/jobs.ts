import structuredClone from '@ungap/structured-clone'
import { createModel } from '@rematch/core'
import { graphQLJobs } from '../services/graphQLRequest'
import { AxiosResponse } from 'axios'
import { selectActiveAccountId } from '../selectors/accounts'
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
      console.log('FETCH IF EMPTY JOBS', accountId, state.jobs.all[accountId])
      if (!state.jobs.all[accountId]) dispatch.jobs.fetch(accountId)
    },
    async parse(result: AxiosResponse<any> | undefined): Promise<IJob[]> {
      const data = result?.data?.data?.login?.account
      return data?.jobs.items || []
      // let parsed = data?.jobs.items.map(job => ({
      //   ...job,
      //   created: new Date(job.created).getTime(),
      //   updated: new Date(job.updated).getTime(),
      //   jobDevices: job.jobDevices.map(jd => ({
      //     ...jd,
      //     created: new Date(jd.created).getTime(),
      //     updated: new Date(jd.updated).getTime(),
      //   })),
      // }))
      // return parsed
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
