import { describe, it, expect, vi } from 'vitest'

// An upgrade job has no file (graphql-api Job.upgrade): it reads as "Device upgrade"; any other job as its script.
vi.mock('../i18n', () => ({ default: { t: (_key: string, text: string) => text } }))

import { jobName } from './jobHelper'

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
