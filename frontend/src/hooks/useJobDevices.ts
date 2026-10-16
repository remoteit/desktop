import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchJobDevice, fetchJobDevices, JOB_DEVICE_PAGE } from '../services/jobDevices'
import { jobRunCounts, jobRunTotal } from '../helpers/jobHelper'

// What says a job changed: its status, its time, and its runs counted (each run's own status is not held).
export const jobChangeKey = (job?: IJob) =>
  job
    ? `${job.id}:${job.status}:${job.updated}:${jobRunCounts(job)
        .map(c => `${c.status}=${c.count}`)
        .sort()
        .join(',')}`
    : ''

/* A job's runs as its page lists them: a page at a time (JOB_DEVICE_PAGE, in the order they were made), more as asked
   for, those held read again whenever the job changes — at most once a second. Until the first page is read, the few
   the jobs list read with it. And the run shown (jobDeviceId): from those held, else read on its own. */
export function useJobDevices(accountId: string, job: IJob | undefined, jobDeviceId?: string) {
  const [loaded, setLoaded] = useState<IJobDevice[]>()
  const [fetching, setFetching] = useState(false)
  const [selected, setSelected] = useState<IJobDevice>()
  const size = useRef(JOB_DEVICE_PAGE)
  const request = useRef(0)
  const last = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const jobId = job?.id
  const key = jobChangeKey(job)

  useEffect(() => {
    setLoaded(undefined)
    setSelected(undefined)
    size.current = JOB_DEVICE_PAGE
  }, [jobId, accountId])

  useEffect(() => {
    if (!jobId) return
    const load = async () => {
      const mine = ++request.current
      last.current = Date.now()
      setFetching(true)
      const result = await fetchJobDevices(accountId, jobId, 0, size.current)
      if (mine !== request.current) return
      setFetching(false)
      if (result !== 'ERROR') setLoaded(result)
    }
    const wait = 1000 - (Date.now() - last.current)
    if (timer.current) clearTimeout(timer.current)
    if (wait <= 0) void load()
    else timer.current = setTimeout(load, wait)
    return () => timer.current && clearTimeout(timer.current)
  }, [key, accountId])

  // The next page, after those held. Whichever read is asked last wins (request); a re-read reads this page too.
  const loadMore = useCallback(async () => {
    if (!jobId || !loaded) return
    const mine = ++request.current
    const from = loaded.length
    size.current = from + JOB_DEVICE_PAGE
    setFetching(true)
    const result = await fetchJobDevices(accountId, jobId, from, JOB_DEVICE_PAGE)
    if (mine !== request.current) return
    setFetching(false)
    if (result !== 'ERROR') setLoaded([...loaded, ...result])
  }, [accountId, jobId, loaded])

  const runs = loaded || job?.jobDevices || []
  const shown = runs.find(jd => jd.id === jobDeviceId)

  useEffect(() => {
    if (!jobId || !jobDeviceId || !loaded || shown) return
    let current = true
    fetchJobDevice(accountId, jobId, jobDeviceId).then(result => {
      if (current && result && result !== 'ERROR') setSelected(result)
    })
    return () => {
      current = false
    }
  }, [jobDeviceId, key, !!loaded, !!shown])

  return {
    runs,
    total: Math.max(jobRunTotal(job), runs.length),
    count: loaded?.length ?? 0,
    fetching,
    loadMore,
    jobDevice: shown || (selected?.id === jobDeviceId ? selected : undefined),
  }
}
