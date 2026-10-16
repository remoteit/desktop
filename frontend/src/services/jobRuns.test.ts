import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import { fetchJobRuns, fetchRunOutput, formatBytes, mergeChunks, UNSUPPORTED } from './jobRuns'

const answer = (data: any, errors?: any[]) => ({ data: { data, ...(errors ? { errors } : {}) }, headers: {} })

beforeEach(() => {
  request.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('a job\'s runs on the job runner', () => {
  it('reads each run by its job device: the run (null where it was not the runner\'s) and its attributes', async () => {
    request.mockResolvedValue(
      answer({
        login: {
          account: {
            jobs: {
              items: [
                {
                  id: 'J',
                  jobDevices: [
                    {
                      id: 'R1',
                      status: 'RUNNING',
                      attributes: [{ key: '$remoteit.version', value: '2' }],
                      run: { phase: 'running', ranAs: 'r3-evan', progressPercent: 40, artifacts: null },
                    },
                    { id: 'R2', status: 'SUCCESS', attributes: [], run: null },
                  ],
                },
              ],
            },
          },
        },
      })
    )
    const runs = await fetchJobRuns('A', 'J')
    expect(runs).toEqual({
      R1: { status: 'RUNNING', attributes: [{ key: 'version', value: '2' }], run: { phase: 'running', ranAs: 'r3-evan', progressPercent: 40, artifacts: [] } },
      R2: { status: 'SUCCESS', attributes: [], run: null },
    })
    expect(request.mock.calls[0][0].data.variables).toEqual({ accountId: 'A', ids: ['J'], size: 200 })
  })

  it('an API without the fields is UNSUPPORTED, quietly (no error banner)', async () => {
    request.mockResolvedValue(answer(null, [{ message: 'Cannot query field "run" on type "JobDevice".' }]))
    expect(await fetchJobRuns('A', 'J')).toBe(UNSUPPORTED)
    request.mockResolvedValue(answer(null, [{ message: 'Cannot query field "jobDevice" on type "Job".' }]))
    expect(await fetchRunOutput('A', 'J', 'R1')).toBe(UNSUPPORTED)
    request.mockResolvedValue(answer(null, [{ message: 'database away' }]))
    expect(await fetchJobRuns('A', 'J')).toBe('ERROR')
  })

  it('reads one run\'s output through Job.jobDevice', async () => {
    const output = { chunks: [{ seq: 1, stream: 1, text: 'tick\n' }], complete: false, cut: false }
    request.mockResolvedValue(answer({ login: { account: { jobs: { items: [{ id: 'J', jobDevice: { id: 'R1', run: { phase: 'running', output } } }] } } } }))
    expect(await fetchRunOutput('A', 'J', 'R1', 1024)).toEqual(output)
    expect(request.mock.calls[0][0].data.variables).toEqual({ accountId: 'A', ids: ['J'], jobDeviceId: 'R1', maxBytes: 1024 })
  })
})

describe('chunks merged', () => {
  it('in order, a sequence number held dropped; output.log\'s (seq 0) taken as they are', () => {
    const have = [{ seq: 1, stream: 1, text: 'a' }, { seq: 2, stream: 2, text: 'b' }]
    expect(mergeChunks(have, [{ seq: 2, stream: 2, text: 'b' }, { seq: 4, stream: 1, text: 'd' }, { seq: 3, stream: 1, text: 'c' }]).map(c => c.text).join('')).toBe('abcd')
    expect(mergeChunks(have, [{ seq: 1, stream: 1, text: 'a' }])).toBe(have)
    expect(mergeChunks([], [{ seq: 0, stream: 1, text: 'x' }, { seq: 0, stream: 2, text: 'y' }]).length).toBe(2)
  })
  it('bytes for people', () => {
    expect([formatBytes(10), formatBytes(2048), formatBytes(3 * 1024 ** 2)]).toEqual(['10 B', '2.0 KB', '3.0 MB'])
  })
})
