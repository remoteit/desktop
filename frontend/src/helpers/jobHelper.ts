import i18n from '../i18n'

// What a job runs as people read it: an upgrade job (no file; it says what it installs) is "Device upgrade", any other its
// script's name — undefined where the script was deleted.
export function jobName(job?: { file?: { name: string }; upgrade?: object }): string | undefined {
  if (job?.upgrade) return i18n.t('jobAttributes.upgrade', 'Device upgrade')
  return job?.file?.name
}

// How many of a job's runs the jobs list reads with it: enough for the names a row shows. Its other runs are counted
// (runCounts), and read a page at a time where they are listed (useJobDevices) — a job may have tens of thousands.
export const JOB_PREVIEW_RUNS = 10

type CountedJob = { jobDevices?: { status: IJobStatus }[]; runCounts?: IJobRunCount[] }

// A job's runs counted by status: the API's count, or (an API without runCounts, or a job cached by an older build) its
// runs counted here, where it has all of them.
export function jobRunCounts(job?: CountedJob): IJobRunCount[] {
  if (job?.runCounts) return job.runCounts
  const counts: ILookup<number> = {}
  job?.jobDevices?.forEach(jd => (counts[jd.status] = (counts[jd.status] || 0) + 1))
  return Object.keys(counts).map(status => ({ status: status as IJobStatus, count: counts[status] }))
}

// How many of its runs have one of these statuses (every run, without any).
export function jobRunCount(job: CountedJob | undefined, ...statuses: IJobStatus[]): number {
  return jobRunCounts(job)
    .filter(c => !statuses.length || statuses.includes(c.status))
    .reduce((sum, c) => sum + c.count, 0)
}

export const jobRunTotal = (job?: CountedJob) => jobRunCount(job)

// Whether the runs a job holds are every one of them: nothing more to read.
export const jobRunsComplete = (job?: CountedJob) => (job?.jobDevices?.length ?? 0) >= jobRunTotal(job)
