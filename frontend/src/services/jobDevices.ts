import { post } from './post'
import { graphQLGetErrors } from './graphQL'

/* A job's runs (graphql Job.jobDevices / Job.jobDevice), read apart from the job: a page of them where they are listed,
   one where one is shown, and every one's device only where a new run is made from them. The jobs list reads a job's
   runs counted (runCounts) and its first few — a job may have tens of thousands of runs. An API without the paged
   read (it refuses runCounts: graphQLJobs) reads every run with the job, as it always did; these then read them all. */

export const JOB_DEVICE_PAGE = 200

let paged = true

// Whether the API reads a job's runs in pages; graphQLJobs learns when it does not.
export const jobRunsPaged = () => paged
export const setJobRunsPaged = (value: boolean) => (paged = value)

const JOB_DEVICE_FIELDS = 'id status created updated attributes { key value } device { id name }'

async function read(query: string, variables: ILookup<any>): Promise<any | 'ERROR'> {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  if (graphQLGetErrors(response, false, { query, variables })) return 'ERROR'
  return response.data?.data?.login?.account?.jobs?.items?.[0] ?? null
}

export const parseJobDevice = (jd: any): IJobDevice => ({
  ...jd,
  attributes: (jd.attributes || []).map((a: IJobDeviceAttribute) => ({
    key: a.key.replace('$remoteit.', ''),
    value: a.value,
  })),
})

// `size` of a job's runs from `from`, in the order they were made (on an API without paging, every one).
export async function fetchJobDevices(
  accountId: string,
  jobId: string,
  from: number,
  size: number
): Promise<IJobDevice[] | 'ERROR'> {
  const [params, args] = paged ? [', $from: Int, $size: Int', '(from: $from, size: $size)'] : ['', '']
  const job = await read(
    `query JobDevices($accountId: String, $ids: [ID!]${params}) { login { account(id: $accountId) {
      jobs(ids: $ids) { items { id jobDevices${args} { ${JOB_DEVICE_FIELDS} } } } } } }`,
    { accountId, ids: [jobId], ...(paged ? { from, size } : {}) }
  )
  if (job === 'ERROR') return job
  return (job?.jobDevices || []).map(parseJobDevice)
}

// One of a job's runs, by its id.
export async function fetchJobDevice(
  accountId: string,
  jobId: string,
  jobDeviceId: string
): Promise<IJobDevice | null | 'ERROR'> {
  const job = await read(
    `query JobDevice($accountId: String, $ids: [ID!], $jobDeviceId: ID!) { login { account(id: $accountId) {
      jobs(ids: $ids) { items { id jobDevice(id: $jobDeviceId) { ${JOB_DEVICE_FIELDS} } } } } } }`,
    { accountId, ids: [jobId], jobDeviceId }
  )
  if (job === 'ERROR') return job
  return job?.jobDevice ? parseJobDevice(job.jobDevice) : null
}

// Every device a job ran on: what a new run made from it targets.
export async function fetchJobTargets(accountId: string, jobId: string): Promise<IJobDevice['device'][] | 'ERROR'> {
  const job = await read(
    `query JobTargets($accountId: String, $ids: [ID!]) { login { account(id: $accountId) {
      jobs(ids: $ids) { items { id jobDevices { device { id name } } } } } } }`,
    { accountId, ids: [jobId] }
  )
  if (job === 'ERROR') return job
  return (job?.jobDevices || []).map((jd: IJobDevice) => jd.device)
}
