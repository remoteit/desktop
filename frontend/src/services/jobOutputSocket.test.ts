import { describe, it, expect, vi } from 'vitest'

vi.mock('./cloudController', () => ({ wsAuthorization: vi.fn().mockResolvedValue('Bearer t') }))
vi.mock('../helpers/apiHelper', () => ({ getWebSocketURL: () => undefined, getTestHeader: () => ({}) }))
vi.mock('../helpers/versionHelper', () => ({ version: 'test' }))
vi.mock('./browser', () => ({ agent: () => 'test' }))

import { handleFrame } from './jobOutputSocket'

describe('the run\'s socket', () => {
  const watch = () => ({ jobId: 'J', jobDeviceId: 'r1', onOutput: vi.fn(), onJob: vi.fn() })
  const frame = (event: any) => JSON.stringify({ data: { event } })

  it('the run\'s output to the page; another run\'s passed over; a job\'s event wakes it', () => {
    const w = watch()
    handleFrame(frame({ type: 'JOB_OUTPUT', jobDeviceId: 'R1', skipped: 5, chunks: [{ seq: 3, stream: 1, text: 'tick\n' }] }), w)
    handleFrame(frame({ type: 'JOB_OUTPUT', jobDeviceId: 'R2', chunks: [{ seq: 1, stream: 1, text: 'other\n' }] }), w)
    handleFrame(frame({ type: 'DEVICE_JOB', action: 'running' }), w)
    handleFrame(JSON.stringify({ events: [{ data: { event: { type: 'JOB', action: 'progress' } } }] }), w)
    expect(w.onOutput).toHaveBeenCalledTimes(1)
    expect(w.onOutput).toHaveBeenCalledWith([{ seq: 3, stream: 1, text: 'tick\n' }], 5)
    expect(w.onJob).toHaveBeenCalledTimes(2)
  })

  it('the socket\'s words (OK, pong, not JSON) are nothing', () => {
    const w = watch()
    for (const data of ['OK', 'pong', 'Unauthorized', '{"data":{}}']) handleFrame(data, w)
    expect(w.onOutput).not.toHaveBeenCalled()
    expect(w.onJob).not.toHaveBeenCalled()
  })
})
