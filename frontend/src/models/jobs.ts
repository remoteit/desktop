// import sleep from '../helpers/sleep'
import structuredClone from '@ungap/structured-clone'
import { selectJobs } from '../selectors/scripting'
import { getDevices } from '../selectors/devices'
import { RowSaid, rowSaid, selectActiveAccountId } from '../selectors/accounts'
import { asRow, rowGone, selectRowOf } from '../selectors/signIns'
import { RowKey, rowKey, withoutAccounts, withoutRows, rekeyed } from '../helpers/rowKey'
import { findElsewhere } from '../services/elsewhere'
import { graphQLSetJob, graphQLStartJob, graphQLCancelJob, graphQLDeleteJob } from '../services/graphQLMutation'
import { jobRunOptionFields, JobRunOptions, parseJobRunOptions } from '../services/jobRunOptions'
import { AxiosResponse } from 'axios'
import { createModel } from '@rematch/core'
import { graphQLJobs } from '../services/graphQLRequest'
import { getJobLogs, triggerBrowserDownload } from '../services/jobLogs'
import { fetchJobTargets, parseJobDevice } from '../services/jobDevices'
import { jobRunsComplete } from '../helpers/jobHelper'
import { RootModel } from '.'
import i18n from '../i18n'

type ScriptsState = {
  initialized: boolean
  fetching: boolean
  size: number
  from: number
  total: number
  all: {
    [row: string]: IJob[] // by ROW (helpers/rowKey): an account's jobs as each sign-in that belongs to it is given them
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

const REFRESH_MS = 2000
const refreshing: ILookup<ReturnType<typeof setTimeout>> = {}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    // Each read is made for a row (selectors/accounts rowSaid), and its answer is kept under that row.
    async fetch(args: (RowSaid & { fileID?: string; from?: number }) | void, state) {
      const { accountId, row } = rowSaid(state, args)
      const fileID = args?.fileID
      const from = args?.from ?? 0
      const size = state.jobs.size || defaultState.size
      dispatch.jobs.set({ fetching: true })
      const fileIds = fileID ? [fileID] : undefined
      const result = await graphQLJobs({ accountId, fileIds, from, size, requestFor: asRow(row) })
      if (result === 'ERROR') {
        dispatch.jobs.set({ fetching: false })
        return
      }
      const total = result?.data?.data?.login?.account?.jobs?.total ?? 0
      const jobs = await dispatch.jobs.parse(result)
      console.log('LOADED JOBS', accountId, jobs)
      const merge = from > 0 || !!fileID
      if (merge) dispatch.jobs.appendJobs({ accountId, row, jobs })
      else dispatch.jobs.setAccount({ accountId, row, jobs })
      dispatch.jobs.set({ fetching: false, initialized: true, total, from })
    },
    async loadMore(args: { fileID?: string } | void, state) {
      if (state.jobs.fetching) return
      const from = state.jobs.from ?? 0
      const size = state.jobs.size || defaultState.size
      await dispatch.jobs.fetch({ fileID: args?.fileID, from: from + size })
    },
    async fetchSingle({ jobId, ...of }: RowSaid & { jobId: string }, state) {
      dispatch.jobs.set({ fetching: true })

      // // Find latest job by fileId if jobId is not valid
      // if (jobId.length < VALID_JOB_ID_LENGTH) {
      //   alert('Invalid job ID: ' + jobId)
      //   jobId = selectJobs(state).find(j => j.file?.id === fileId)?.id || jobId
      // }

      const { accountId, row } = rowSaid(state, of)
      const result = await graphQLJobs({ accountId, ids: [jobId], requestFor: asRow(row) })
      if (result === 'ERROR') {
        dispatch.jobs.set({ fetching: false })
        return
      }
      const jobs = await dispatch.jobs.parse(result)
      console.log('LOADED JOB', accountId, jobs)
      // Opened at its address, the caller naming no row, and not this row's: another sign-in's here to see, maybe —
      // whose row is then selected, and the job put in it (services/elsewhere).
      if (!jobs.length && !of.accountId && !of.row && of.sub === undefined) {
        const found = await findElsewhere<IJob[]>({
          ids: [jobId],
          asked: row,
          byAccount: true,
          read: async (id, requestFor) => {
            const answer = await graphQLJobs({ accountId: id, ids: [jobId], requestFor })
            const theirs: IJob[] = answer === 'ERROR' ? [] : await dispatch.jobs.parse(answer)
            return theirs.length ? theirs : undefined
          },
        })
        if (found)
          dispatch.jobs.setJobs({
            accountId: found.accountId,
            row: rowKey(found.accountId, found.sub),
            jobs: found.answer,
          })
        dispatch.jobs.set({ fetching: false })
        return
      }
      dispatch.jobs.setJobs({ accountId, row, jobs })
      dispatch.jobs.set({ fetching: false })
    },
    async fetchByFileIds({ fileIds, ...of }: RowSaid & { fileIds: string[] }, state) {
      dispatch.jobs.set({ fetching: true })
      const { accountId, row } = rowSaid(state, of)

      const result = await graphQLJobs({ accountId, fileIds, requestFor: asRow(row) })
      if (result === 'ERROR') {
        dispatch.jobs.set({ fetching: false })
        return
      }

      const jobs = await dispatch.jobs.parse(result)
      console.log('LOADED FILE JOBS', accountId, jobs)

      dispatch.jobs.appendJobs({ accountId, row, jobs })
      dispatch.jobs.set({ fetching: false })
    },
    async fetchIfEmpty(accountId: string | void, state) {
      accountId = accountId || selectActiveAccountId(state)
      if (!state.jobs.all[selectRowOf(state, accountId)]) dispatch.jobs.fetch({ accountId })
    },
    async parse(result: AxiosResponse<any>): Promise<IJob[]> {
      const data = result.data?.data?.login?.account
      return data?.jobs.items.map(j => ({ ...j, jobDevices: (j.jobDevices || []).map(parseJobDevice) })) || []
    },
    // A job read again soon, quietly, at most once in REFRESH_MS: its runs' events (one a run) come by the thousand from
    // a large job, and each changes only its counts.
    async refreshSoon({ jobId, ...of }: RowSaid & { accountId: string; jobId: string }, state) {
      // A job in two rows is read again for each: once per row in REFRESH_MS.
      const { accountId, row } = rowSaid(state, of)
      const timer = `${row} ${jobId}`
      if (refreshing[timer]) return
      refreshing[timer] = setTimeout(async () => {
        delete refreshing[timer]
        const result = await graphQLJobs({ accountId, ids: [jobId], requestFor: asRow(row) })
        if (result !== 'ERROR') dispatch.jobs.setJobs({ accountId, row, jobs: await dispatch.jobs.parse(result) })
      }, REFRESH_MS)
    },
    // Every device a job ran on, for a new run made from it: those it holds where they are all of them, else read.
    // None where they cannot be read: a new run of only the first few would be a different run.
    async fetchTargets(job: IJob, state): Promise<IJobDevice['device'][] | undefined> {
      if (jobRunsComplete(job)) return job.jobDevices.map(jd => jd.device)
      const targets = await fetchJobTargets(selectActiveAccountId(state), job.id)
      if (targets !== 'ERROR') return targets
      dispatch.ui.set({
        errorMessage: i18n.t('notices:job.loadTargetsError', { defaultValue: 'Couldn’t load the devices of this run' }),
      })
    },
    async saveRun(form: IFileForm): Promise<string> {
      console.log('SAVE AND RUN JOB', form)
      // The run's options (Advanced), only those this API takes: none, and startJob is asked as before.
      const { options } = parseJobRunOptions(i18n.t, form.runOptions, await jobRunOptionFields())
      const jobId = await dispatch.jobs.save(form)
      await dispatch.jobs.run({ jobId, fileId: form.fileId, options })
      return jobId
    },
    async save(form: IFileForm, state): Promise<string> {
      const job = selectJobs(state).find(j => j.id === form.jobId)
      if (job?.status !== 'READY') delete form.jobId
      const data = formAdaptor(form)
      // The row it is saved from: where the saved job is put, whichever row is looked at by then.
      const at = rowSaid(state)
      const result = await graphQLSetJob(data)
      if (result === 'ERROR') return '-'
      console.log('SAVED JOB', form, result?.data)
      const jobId: string = result?.data.data.setJob
      await dispatch.jobs.fetchSingle({ jobId, ...at })
      dispatch.ui.set({ redirect: `/script/${form.fileId}/latest` })
      return jobId
    },
    async run({ jobId, fileId, options }: { jobId?: string; fileId: string; options?: JobRunOptions }) {
      if (!jobId) return console.error('NO JOB ID TO RUN')
      const result = await graphQLStartJob(jobId, options)
      if (result === 'ERROR') return
      console.log('STARTED JOB', { result, jobId })
      dispatch.ui.set({ redirect: `/script/${fileId}/latest` })
    },
    async downloadLogs({ jobId, jobDeviceId }: { jobId: string; jobDeviceId: string }) {
      const result = await getJobLogs(jobId, jobDeviceId)
      if (result.kind === 'error') {
        dispatch.ui.set({
          errorMessage: i18n.t('notices:job.loadLogsError', {
            message: result.message,
            defaultValue: 'Couldn’t load logs: {{message}}',
          }),
        })
        return false
      }
      if (result.kind === 'missing') {
        dispatch.ui.set({
          errorMessage: i18n.t('notices:job.noLogs', { defaultValue: 'No logs available yet.' }),
        })
        return false
      }
      const entry = result.data.devices.find(d => d.jobDeviceId === jobDeviceId)
      if (!entry?.downloadUrl) {
        dispatch.ui.set({
          errorMessage: i18n.t('notices:job.noDeviceLogs', {
            defaultValue: 'No logs available for this device yet.',
          }),
        })
        return false
      }
      triggerBrowserDownload(entry.downloadUrl, entry.filename || 'logs.tar.gz')
      return true
    },
    async downloadAllLogs({ jobId }: { jobId: string }) {
      const result = await getJobLogs(jobId, undefined, true)
      if (result.kind === 'error') {
        dispatch.ui.set({
          errorMessage: i18n.t('notices:job.loadLogsError', {
            message: result.message,
            defaultValue: 'Couldn’t load logs: {{message}}',
          }),
        })
        return false
      }
      if (result.kind === 'ok' && result.data.zipTooBig) {
        dispatch.ui.set({
          errorMessage: i18n.t('notices:job.zipTooBig', {
            defaultValue: 'This run has too many devices for one download. Download each device’s log from its own page.',
          }),
        })
        return false
      }
      if (result.kind === 'missing' || !result.data.downloadUrl) {
        dispatch.ui.set({
          errorMessage: i18n.t('notices:job.noRunLogs', {
            defaultValue: 'No logs are available for this run yet.',
          }),
        })
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
      const { row } = rowSaid(state)
      const result = await graphQLDeleteJob(jobId)
      if (result === 'ERROR') {
        dispatch.ui.set({ errorMessage: i18n.t('notices:job.deleteError', { defaultValue: 'Error deleting job' }) })
        return false
      }
      console.log('DELETED JOB', { result, jobId })
      // Remove from local state
      dispatch.jobs.removeJob({ row, jobId })
      // Redirect to script page
      dispatch.ui.set({ redirect: `/script/${fileId}` })
      return true
    },
    async unauthorized(deviceIds: string[], state) {
      return getDevices(state).filter(
        d => deviceIds.includes(d.id) && (!d.permissions.includes('SCRIPTING') || !d.scriptable)
      )
    },
    async setJobs({ accountId, row: said, jobs }: { accountId: string; row?: RowKey; jobs: IJob[] }, state) {
      const row = said ?? selectRowOf(state, accountId)
      // Prepends new entries — fetchSingle uses this so freshly-saved jobs appear at the top.
      dispatch.jobs.setAccount({ accountId, row, jobs: upsertJobs(state.jobs.all[row], jobs, 'start') })
    },
    async appendJobs({ accountId, row: said, jobs }: { accountId: string; row?: RowKey; jobs: IJob[] }, state) {
      const row = said ?? selectRowOf(state, accountId)
      // Appends new entries — preserves server order for paginated and filtered fetches.
      dispatch.jobs.setAccount({ accountId, row, jobs: upsertJobs(state.jobs.all[row], jobs, 'end') })
    },
    /* The one write of a row's jobs. `row` is the key (helpers/rowKey): the row said — the one a read was made for —
       else the one the account is looked at through. */
    async setAccount(params: { jobs: IJob[]; accountId: string; row?: RowKey }, state) {
      // An answer for a row whose sign-in has left since it was asked: the row is gone, and is not put back.
      if (params.row && rowGone(state, params.row)) return
      dispatch.jobs.setRow({ row: params.row ?? selectRowOf(state, params.accountId), jobs: params.jobs })
    },
  }),
  reducers: {
    reset() {
      return { ...defaultState }
    },
    /** An account's data dropped: its sign-in signed out, so it is no longer a row (models/accounts forgetData). */
    forget(state, accountIds: string[]) {
      state.all = withoutAccounts(state.all, accountIds)
      return state
    },
    forgetRows(state, rows: string[]) {
      state.all = withoutRows(state.all, rows)
      return state
    },
    rekey(state, rows: ILookup<RowKey>) {
      state.all = rekeyed(state.all, rows)
      return state
    },
    removeJob(state, { row, jobId }: { row: RowKey; jobId: string }) {
      if (state.all[row]) state.all = { ...state.all, [row]: state.all[row].filter(job => job.id !== jobId) }
      return state
    },
    setRow(state, { row, jobs }: { row: RowKey; jobs: IJob[] }) {
      state.all = { ...state.all, [row]: jobs }
      return state
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
