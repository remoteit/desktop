import { describe, it, expect, vi } from 'vitest'

// An upgrade job has no file (graphql-api Job.upgrade): it reads as "Device upgrade"; any other job as its script.
vi.mock('../i18n', () => ({ default: { t: (_key: string, text: string) => text } }))

import { jobName, jobRunCount, jobRunCounts, jobRunTotal, jobRunsComplete } from './jobHelper'

describe('jobName', () => {
  it('names an upgrade job "Device upgrade", whatever file it has', () => {
    expect(jobName({ upgrade: { package: 'DEVICE', version: '5.1.4' } })).toBe('Device upgrade')
  })
  it('names any other job by its script, and a deleted one not at all', () => {
    expect(jobName({ file: { name: 'hello.sh' } })).toBe('hello.sh')
    expect(jobName({})).toBeUndefined()
    expect(jobName(undefined)).toBeUndefined()
  })
})

describe("a job's runs counted", () => {
  const run = (status: IJobStatus) => ({ status })

  it('from runCounts, where the job holds only its first runs', () => {
    const job = {
      jobDevices: [run('SUCCESS')],
      runCounts: [
        { status: 'SUCCESS' as IJobStatus, count: 19000 },
        { status: 'FAILED' as IJobStatus, count: 900 },
        { status: 'CANCELLED' as IJobStatus, count: 100 },
      ],
    }
    expect(jobRunTotal(job)).toBe(20000)
    expect(jobRunCount(job, 'SUCCESS')).toBe(19000)
    expect(jobRunCount(job, 'FAILED', 'CANCELLED')).toBe(1000)
    expect(jobRunCount(job, 'RUNNING')).toBe(0)
    expect(jobRunsComplete(job)).toBe(false)
  })

  it('from its runs, where there is no runCounts (an older API, or a job cached by an older build)', () => {
    const job = { jobDevices: [run('SUCCESS'), run('FAILED'), run('SUCCESS')] }
    expect(jobRunCounts(job)).toEqual([
      { status: 'SUCCESS', count: 2 },
      { status: 'FAILED', count: 1 },
    ])
    expect(jobRunTotal(job)).toBe(3)
    expect(jobRunsComplete(job)).toBe(true)
    expect(jobRunTotal(undefined)).toBe(0)
  })
})
