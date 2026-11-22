import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { fetchJobRuns, fetchRunOutput } = vi.hoisted(() => ({ fetchJobRuns: vi.fn(), fetchRunOutput: vi.fn() }))
vi.mock('../services/jobRuns', () => ({
  ENDED_PHASES: ['succeeded', 'failed', 'cancelled'],
  UNSUPPORTED: 'UNSUPPORTED',
  fetchJobRuns,
  fetchRunOutput,
}))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'A1' }))
vi.mock('./JobRunPanel', () => ({ JobRunStatus: ({ run }: any) => <span data-run-status>{run.phase}</span> }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string'
          ? fill(a, b)
          : fill(a.count === 1 ? a.defaultValue_one ?? a.defaultValue : a.defaultValue_other ?? a.defaultValue, a),
    }),
  }
})

import { JobFailureNote, JobRunResult } from './JobRunResult'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const FAILED = {
  phase: 'failed',
  failureReason: 'exit-code',
  exitCode: -1,
  ranAs: 'r3s-jamie',
  detail: 'the script could not be started: permission denied',
  startedAt: '2026-11-20T22:44:57.000Z',
  artifacts: [],
}

let root: Root
let container: HTMLElement
async function render(element: React.ReactElement) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(element))
  return container
}
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})
beforeEach(() => {
  fetchJobRuns.mockReset()
  fetchRunOutput.mockReset().mockResolvedValue({
    chunks: [{ seq: 1, stream: 2, text: 'sh: 1: ./script: Permission denied\n' }],
    complete: true,
    cut: false,
  })
})

const text = (page: HTMLElement, name: string) => page.querySelector(`[data-${name}]`)?.textContent

describe('a device’s run, on the run’s page', () => {
  it('failed: what failed, the device’s reason, the account and exit code, its first lines, and the way to the rest', async () => {
    const page = await render(<JobRunResult accountId="A1" jobId="J1" jobDeviceId="JD1" run={FAILED as any} preview />)
    expect(text(page, 'run-headline')).toBe('Couldn’t start the script')
    expect(text(page, 'run-reason')).toBe('The script could not be started: permission denied')
    expect(text(page, 'run-facts')).toBe('Ran as r3s-jamie · Exit code -1')
    expect(text(page, 'run-output')).toBe('sh: 1: ./script: Permission denied')
    expect(text(page, 'run-full-output')).toBe('Full output')
    expect(fetchRunOutput).toHaveBeenCalledWith('A1', 'J1', 'JD1', 4096)
  })

  it('succeeded: its output summed up the same way, with no reason', async () => {
    fetchRunOutput.mockResolvedValue({
      chunks: [{ seq: 1, stream: 1, text: 'a\nb\nc\nd\ne\n' }],
      complete: true,
      cut: false,
    })
    const page = await render(
      <JobRunResult
        accountId="A1"
        jobId="J1"
        jobDeviceId="JD1"
        run={{ phase: 'succeeded', exitCode: 0, artifacts: [] } as any}
        preview
      />
    )
    expect(text(page, 'run-headline')).toBe('Succeeded')
    expect(page.querySelector('[data-run-reason]')).toBeNull()
    expect(text(page, 'run-output')).toBe('a\nb\nc\nd')
  })

  it('only the end read: its last lines, marked; no output: said', async () => {
    fetchRunOutput.mockResolvedValue({ chunks: [{ seq: 0, stream: 1, text: 'x\ny\n' }], complete: true, cut: true })
    let page = await render(<JobRunResult accountId="A1" jobId="J1" jobDeviceId="JD1" run={FAILED as any} preview />)
    expect(text(page, 'run-output')).toBe('…\nx\ny')
    act(() => root.unmount())
    container.remove()
    fetchRunOutput.mockResolvedValue({ chunks: [], complete: true, cut: false })
    page = await render(<JobRunResult accountId="A1" jobId="J1" jobDeviceId="JD1" run={FAILED as any} preview />)
    expect(text(page, 'run-output')).toBe('No output')
    act(() => root.unmount())
    container.remove()
    // Refused before it started: no output box at all.
    const refused = { phase: 'failed', failureReason: 'refused', detail: 'The run could not be queued', artifacts: [] }
    page = await render(<JobRunResult accountId="A1" jobId="J1" jobDeviceId="JD1" run={refused as any} preview />)
    expect(text(page, 'run-headline')).toBe('The device refused the run')
    expect(page.querySelector('[data-run-output]')).toBeNull()
  })

  it('without preview, no output read; still going, its phase', async () => {
    let page = await render(<JobRunResult accountId="A1" jobId="J1" jobDeviceId="JD1" run={FAILED as any} />)
    expect(fetchRunOutput).not.toHaveBeenCalled()
    expect(page.querySelector('[data-run-output]')).toBeNull()
    expect(text(page, 'run-headline')).toBe('Couldn’t start the script')
    act(() => root.unmount())
    container.remove()
    page = await render(
      <JobRunResult
        accountId="A1"
        jobId="J1"
        jobDeviceId="JD1"
        run={{ phase: 'running', artifacts: [] } as any}
        preview
      />
    )
    expect(text(page, 'run-status')).toBe('running')
    expect(fetchRunOutput).not.toHaveBeenCalled()
  })
})

describe('a failed run in a list', () => {
  const job = (more: any = {}) =>
    ({
      id: 'J1',
      status: 'FAILED',
      updated: '2026-11-20T22:45:00.000Z',
      jobDevices: [{ id: 'JD1', device: { id: 'D1', name: 'ux-pi' } }],
      ...more,
    } as unknown as IJob)

  it('says what failed and where, from its runs', async () => {
    fetchJobRuns.mockResolvedValue({ JD1: { run: FAILED, status: 'FAILED', attributes: [] } })
    const page = await render(<JobFailureNote job={job()} />)
    expect(text(page, 'job-failure')).toBe('Couldn’t start the script on ux-pi')
    expect(fetchJobRuns).toHaveBeenCalledWith('A1', 'J1', 10)
  })

  it('nothing for a job that did not fail, or an API without the job runner', async () => {
    let page = await render(<JobFailureNote job={job({ id: 'J2', status: 'SUCCESS' })} />)
    expect(page.querySelector('[data-job-failure]')).toBeNull()
    expect(fetchJobRuns).not.toHaveBeenCalled()
    act(() => root.unmount())
    container.remove()
    fetchJobRuns.mockResolvedValue('UNSUPPORTED')
    page = await render(<JobFailureNote job={job({ id: 'J3' })} />)
    expect(page.querySelector('[data-job-failure]')).toBeNull()
  })
})
