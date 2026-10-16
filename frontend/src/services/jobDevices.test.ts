import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('../i18n', () => ({ default: { t: (_key: string, text: string) => text } }))
vi.mock('axios', () => ({ default: { request } }))

import { fetchJobDevice, fetchJobDevices, fetchJobTargets, jobRunsPaged, setJobRunsPaged } from './jobDevices'
import { fetchJobRuns } from './jobRuns'
import { graphQLJobs } from './graphQLRequest'

const answer = (data: any, errors?: any[]) => ({ data: { data, ...(errors ? { errors } : {}) }, headers: {} })
const job = (fields: any) => answer({ login: { account: { jobs: { total: 1, items: [{ id: 'J', ...fields }] } } } })
const sent = (call = 0) => request.mock.calls[call][0].data

beforeEach(() => {
  request.mockReset()
  setJobRunsPaged(true)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe("the jobs list reads a job's runs counted, not read", () => {
  it('asks for runCounts and the first few runs, not every run', async () => {
    request.mockResolvedValue(job({ runCounts: [{ status: 'SUCCESS', count: 20000 }], jobDevices: [] }))
    await graphQLJobs({ accountId: 'A', ids: ['J'] })
    expect(sent().query).toContain('runCounts')
    expect(sent().query).toContain('jobDevices(from: 0, size: $preview)')
    expect(sent().query).not.toContain('attributes {\n                    key')
    expect(sent().variables.preview).toBe(10)
  })

  it('an API without runCounts: asked again for every run, as it always was, and its runs read whole after', async () => {
    request
      .mockResolvedValueOnce(answer(null, [{ message: 'Cannot query field "runCounts" on type "Job".' }]))
      .mockResolvedValueOnce(job({ jobDevices: [] }))
    const result = await graphQLJobs({ accountId: 'A', ids: ['J'] })
    expect(result).not.toBe('ERROR')
    expect(jobRunsPaged()).toBe(false)
    expect(sent(1).query).not.toContain('runCounts')
    expect(sent(1).query).toMatch(/jobDevices \{/)
    expect(sent(1).variables.preview).toBeUndefined()

    request.mockResolvedValue(job({ jobDevices: [] }))
    await fetchJobDevices('A', 'J', 0, 200)
    expect(sent(2).query).toMatch(/jobDevices \{/)
    expect(sent(2).variables).toEqual({ accountId: 'A', ids: ['J'] })
  })
})

describe("a job's runs read apart", () => {
  it('a page: `size` from `from`, attributes without their prefix', async () => {
    request.mockResolvedValue(
      job({
        jobDevices: [
          {
            id: 'R201',
            status: 'SUCCESS',
            attributes: [{ key: '$remoteit.version', value: '2' }],
            device: { id: 'D', name: 'pi' },
          },
        ],
      })
    )
    const runs = await fetchJobDevices('A', 'J', 200, 200)
    expect(sent().query).toContain('jobDevices(from: $from, size: $size)')
    expect(sent().variables).toEqual({ accountId: 'A', ids: ['J'], from: 200, size: 200 })
    expect(runs).toEqual([
      { id: 'R201', status: 'SUCCESS', attributes: [{ key: 'version', value: '2' }], device: { id: 'D', name: 'pi' } },
    ])
  })

  it('one, by its id', async () => {
    request.mockResolvedValue(
      job({ jobDevice: { id: 'R7', status: 'FAILED', attributes: [], device: { id: 'D', name: 'pi' } } })
    )
    expect(await fetchJobDevice('A', 'J', 'R7')).toMatchObject({ id: 'R7', status: 'FAILED' })
    expect(sent().variables).toEqual({ accountId: 'A', ids: ['J'], jobDeviceId: 'R7' })
    request.mockResolvedValue(job({ jobDevice: null }))
    expect(await fetchJobDevice('A', 'J', 'gone')).toBeNull()
  })

  it("every one's device, for a new run", async () => {
    request.mockResolvedValue(
      job({ jobDevices: [{ device: { id: 'D1', name: 'a' } }, { device: { id: 'D2', name: 'b' } }] })
    )
    expect(await fetchJobTargets('A', 'J')).toEqual([
      { id: 'D1', name: 'a' },
      { id: 'D2', name: 'b' },
    ])
  })

  it("the job runner's runs: the first `size`, and the one shown where it is not among them", async () => {
    request.mockResolvedValue(
      job({
        jobDevices: [{ id: 'R1', status: 'SUCCESS', attributes: [], run: null }],
        jobDevice: { id: 'R900', status: 'RUNNING', attributes: [], run: { phase: 'running', artifacts: null } },
      })
    )
    const runs = await fetchJobRuns('A', 'J', 400, 'R900')
    expect(sent().query).toContain('jobDevices(from: 0, size: $size)')
    expect(sent().query).toContain('jobDevice(id: $jobDeviceId)')
    expect(sent().variables).toEqual({ accountId: 'A', ids: ['J'], size: 400, jobDeviceId: 'R900' })
    expect(Object.keys(runs as object)).toEqual(['R1', 'R900'])
  })
})
