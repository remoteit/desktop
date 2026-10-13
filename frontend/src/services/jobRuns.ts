import { post } from './post'
import { graphQLGetErrors } from './graphQL'
import { withoutDeviceSessions, UNSUPPORTED } from './graphQLDaemon'

/* Runs on the job runner (graphql JobDevice.run; device-package docs/scripting-plan.md, "As built (phase 4)"): a run's
   phase, why it failed, the account it ran as, its progress, its artifacts and its output. Not in the jobs list's own
   query: that query runs on every API, and only one with the job runner's portal fields has these — so they are read on
   their own, silently, and an API without them answers UNSUPPORTED, the page then showing a job as it always has. An
   API with them but JOB_PORTAL off answers each run null: the same. */

export { UNSUPPORTED }

export type JobRunArtifact = { name: string; size: number; sha256: string; url?: string | null }

export type JobRun = {
  phase: string
  failureReason?: string | null
  detail?: string | null
  ranAs?: string | null
  exitCode?: number | null
  signal?: string | null
  startedAt?: string | null
  endedAt?: string | null
  outputBytes?: number | null
  truncated?: boolean | null
  progressPercent?: number | null
  progressMessage?: string | null
  artifacts: JobRunArtifact[]
}

export type JobRunDetails = { run: JobRun | null; attributes: IJobDeviceAttribute[]; status: IJobStatus }

export type OutputChunk = { seq: number; stream: number; text: string }

export type RunOutput = { chunks: OutputChunk[]; complete: boolean; cut: boolean }

export const ENDED_PHASES = ['succeeded', 'failed', 'cancelled']

const RUN_FIELDS = `phase failureReason detail ranAs exitCode signal startedAt endedAt outputBytes truncated progressPercent progressMessage
  artifacts { name size sha256 url }`

async function read(query: string, variables: ILookup<any>): Promise<any | 'ERROR' | typeof UNSUPPORTED> {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, 'run') || withoutDeviceSessions(errors, 'jobDevice')) return UNSUPPORTED
  if (errors) return 'ERROR'
  return response.data?.data?.login?.account?.jobs?.items?.[0] ?? null
}

// Each of a job's runs, by its job device id.
export async function fetchJobRuns(
  accountId: string,
  jobId: string
): Promise<ILookup<JobRunDetails> | 'ERROR' | typeof UNSUPPORTED> {
  const job = await read(
    `query JobRuns($accountId: String, $ids: [ID!]) { login { account(id: $accountId) { jobs(ids: $ids) { items { id
      jobDevices { id status attributes { key value } run { ${RUN_FIELDS} } } } } } } }`,
    { accountId, ids: [jobId] }
  )
  if (job === 'ERROR' || job === UNSUPPORTED) return job
  const out: ILookup<JobRunDetails> = {}
  for (const jd of job?.jobDevices || [])
    out[jd.id] = {
      run: jd.run ? { ...jd.run, artifacts: jd.run.artifacts || [] } : null,
      status: jd.status,
      attributes: (jd.attributes || []).map((a: IJobDeviceAttribute) => ({ key: a.key.replace('$remoteit.', ''), value: a.value })),
    }
  return out
}

// What one run has said: live while it runs, its output.log once it has ended (the last maxBytes).
export async function fetchRunOutput(
  accountId: string,
  jobId: string,
  jobDeviceId: string,
  maxBytes = 256 * 1024
): Promise<RunOutput | null | 'ERROR' | typeof UNSUPPORTED> {
  const job = await read(
    `query JobRunOutput($accountId: String, $ids: [ID!], $jobDeviceId: ID!, $maxBytes: Int) { login { account(id: $accountId) {
      jobs(ids: $ids) { items { id jobDevice(id: $jobDeviceId) { id run { phase output(maxBytes: $maxBytes) { chunks { seq stream text } complete cut } } } } } } } }`,
    { accountId, ids: [jobId], jobDeviceId, maxBytes }
  )
  if (job === 'ERROR' || job === UNSUPPORTED) return job
  return job?.jobDevice?.run?.output ?? null
}

// Chunks merged in order: one with a sequence number already held is dropped (a re-attached run, the live tail read
// after events came); a chunk read from output.log (seq 0) is taken as it is.
export function mergeChunks(have: OutputChunk[], incoming: OutputChunk[]): OutputChunk[] {
  const last = have.reduce((n, c) => Math.max(n, c.seq), 0)
  const fresh = incoming.filter(c => c.seq === 0 || c.seq > last).sort((a, b) => a.seq - b.seq)
  return fresh.length ? [...have, ...fresh] : have
}

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`
