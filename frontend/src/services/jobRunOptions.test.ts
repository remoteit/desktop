import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import { jobRunOptionFields, parseJobRunOptions, resetJobRunOptionFields } from './jobRunOptions'
import { graphQLStartJob } from './graphQLMutation'

const t = ((_key: string, text: string, values?: any) =>
  text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any
const ALL = ['fileTimeoutSeconds', 'fileStallSeconds', 'artifactLimit'] as const

beforeEach(() => {
  request.mockReset()
  resetJobRunOptionFields()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('a run’s options (Advanced)', () => {
  it('offers the options the API’s JobRunOptions has; none from an older API', async () => {
    request.mockResolvedValueOnce({
      data: { data: { __type: { inputFields: [{ name: 'artifactLimit' }, { name: 'fileTimeoutSeconds' }, { name: 'later' }] } } },
    })
    expect(await jobRunOptionFields()).toEqual(['fileTimeoutSeconds', 'artifactLimit'])
    expect(await jobRunOptionFields()).toEqual(['fileTimeoutSeconds', 'artifactLimit'])
    expect(request).toHaveBeenCalledTimes(1)
    resetJobRunOptionFields()
    request.mockResolvedValueOnce({ data: { data: { __type: null } } })
    expect(await jobRunOptionFields()).toEqual([])
  })

  it('empty is the default; within graphql’s bounds; the artifacts limit in MB', () => {
    expect(parseJobRunOptions(t, {}, [...ALL])).toEqual({ options: {}, errors: {} })
    expect(parseJobRunOptions(t, { fileTimeoutSeconds: '900', fileStallSeconds: ' 30 ', artifactLimitMB: '2.5' }, [...ALL])).toEqual({
      options: { fileTimeoutSeconds: 900, fileStallSeconds: 30, artifactLimit: 2.5 * 1024 ** 2 },
      errors: {},
    })
    expect(parseJobRunOptions(t, { artifactLimitMB: '0' }, [...ALL]).options).toEqual({ artifactLimit: 0 })
    expect(parseJobRunOptions(t, { fileTimeoutSeconds: '0', fileStallSeconds: '1.5', artifactLimitMB: '101' }, [...ALL]).errors).toEqual({
      fileTimeoutSeconds: 'Whole seconds, 1 to 86400',
      fileStallSeconds: 'Whole seconds, 1 to 86400',
      artifactLimitMB: '0 to 100 MB',
    })
  })

  it('an option the API does not take is left out', () => {
    expect(parseJobRunOptions(t, { fileTimeoutSeconds: '900', artifactLimitMB: '1' }, ['artifactLimit']).options).toEqual({
      artifactLimit: 1024 ** 2,
    })
  })

  it('startJob carries options only where there are any', async () => {
    request.mockResolvedValue({ data: { data: { startJob: 'J' } }, headers: {} })
    await graphQLStartJob('J')
    await graphQLStartJob('J', {})
    await graphQLStartJob('J', { artifactLimit: 5 })
    const bodies = request.mock.calls.map(([r]) => r.data)
    expect(bodies[0].query).not.toMatch(/options/)
    expect(bodies[1].query).not.toMatch(/options/)
    expect(bodies[2].query).toMatch(/startJob\(jobId: \$jobId, options: \$options\)/)
    expect(bodies[2].variables).toEqual({ jobId: 'J', options: { artifactLimit: 5 } })
  })
})
