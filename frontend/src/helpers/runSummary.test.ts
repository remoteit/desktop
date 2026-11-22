import { describe, it, expect } from 'vitest'
import type { TFunction } from 'i18next'
import { jobFailureLine, outputLines, runFacts, runFailureWords, runReason } from './runSummary'
import type { JobRun } from '../services/jobRuns'

const t = ((_key: string, a: any, b?: any) => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  if (typeof a === 'string') return fill(a, b)
  return fill(a.count === 1 ? a.defaultValue_one ?? a.defaultValue : a.defaultValue_other ?? a.defaultValue, a)
}) as unknown as TFunction

const run = (more: Partial<JobRun> = {}): JobRun => ({ phase: 'succeeded', artifacts: [], ...more })
const NOT_STARTED = run({
  phase: 'failed',
  failureReason: 'exit-code',
  exitCode: -1,
  ranAs: 'r3s-jamie',
  detail: 'the script could not be started: fork/exec /var/lib/remoteit-device/x/inputs/script: permission denied',
  startedAt: '2026-11-20T22:44:57.000Z',
  endedAt: '2026-11-20T22:44:59.000Z',
})

describe('a run, summed up', () => {
  it('what failed, in a few words: a script that could not start, an exit code, the other reasons', () => {
    expect(runFailureWords(t, NOT_STARTED)).toBe('Couldn’t start the script')
    expect(runFailureWords(t, run({ phase: 'failed', failureReason: 'exit-code', exitCode: 2 }))).toBe(
      'Script exited with code 2'
    )
    expect(runFailureWords(t, run({ phase: 'failed', failureReason: 'timeout' }))).toBe('Timed out')
    expect(runFailureWords(t, run({ phase: 'failed', failureReason: 'file-transfer' }))).toBe(
      'Couldn’t send files to the device'
    )
    expect(runFailureWords(t, run({ phase: 'failed', failureReason: 'lost' }))).toBe('Lost contact with the device')
    expect(runFailureWords(t, run({ phase: 'cancelled' }))).toBe('Cancelled')
    expect(runFailureWords(t, run())).toBeUndefined()
    expect(runFailureWords(t, run({ phase: 'running' }))).toBeUndefined()
  })

  it('the device’s reason as it gave it, capitalized; the account, exit code and time', () => {
    expect(runReason(NOT_STARTED)).toBe(
      'The script could not be started: fork/exec /var/lib/remoteit-device/x/inputs/script: permission denied'
    )
    expect(runReason(run())).toBeUndefined()
    expect(runFacts(t, NOT_STARTED)).toEqual(['Ran as r3s-jamie', 'Exit code -1', '2 s'])
    expect(runFacts(t, run({ exitCode: 137, signal: 'SIGKILL' }))).toEqual(['Exit code 137 (SIGKILL)'])
  })

  it('the first lines of its output, or the last where only its end was read', () => {
    const chunks = [
      { seq: 1, stream: 1, text: 'one\ntwo\n' },
      { seq: 2, stream: 2, text: 'three\nfour\nfive\n\n' },
    ]
    expect(outputLines(chunks, false)).toEqual({ lines: ['one', 'two', 'three', 'four'], more: true })
    expect(outputLines(chunks, true)).toEqual({ lines: ['two', 'three', 'four', 'five'], more: true })
    expect(outputLines([{ seq: 1, stream: 1, text: 'hello\n' }], false)).toEqual({ lines: ['hello'], more: false })
    expect(outputLines([], false)).toEqual({ lines: [], more: false })
  })

  it('a failed job in a list: what failed, on which device or how many', () => {
    expect(
      jobFailureLine(t, [
        { run: NOT_STARTED, name: 'ux-pi' },
        { run: run(), name: 'nas' },
      ])
    ).toBe('Couldn’t start the script on ux-pi')
    expect(
      jobFailureLine(t, [
        { run: NOT_STARTED, name: 'ux-pi' },
        { run: NOT_STARTED, name: 'nas' },
      ])
    ).toBe('Couldn’t start the script on 2 devices')
    expect(
      jobFailureLine(t, [
        { run: NOT_STARTED, name: 'ux-pi' },
        { run: run({ phase: 'failed', failureReason: 'timeout' }) },
      ])
    ).toBe('Failed on 2 devices')
    expect(jobFailureLine(t, [{ run: run() }, { run: null }])).toBeUndefined()
  })
})
