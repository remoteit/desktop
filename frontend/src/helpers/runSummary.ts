import type { TFunction } from 'i18next'
import type { JobRun, OutputChunk } from '../services/jobRuns'

// The job runner's words for a script it could not execute at all (connectd's "the script could not be started: …").
const NOT_STARTED = /could not be started/i

// How a run ended, in a few words: what failed where it failed, else none (it succeeded, or has not ended).
export function runFailureWords(t: TFunction, run: Pick<JobRun, 'phase' | 'failureReason' | 'detail' | 'exitCode'>) {
  if (run.phase === 'cancelled') return t('runSummary.cancelled', 'Cancelled')
  if (run.phase !== 'failed') return
  switch (run.failureReason) {
    case 'exit-code':
      if (NOT_STARTED.test(run.detail ?? '')) return t('runSummary.notStarted', 'Couldn’t start the script')
      return run.exitCode != null
        ? t('runSummary.exitedWith', 'Script exited with code {{code}}', { code: run.exitCode })
        : t('runSummary.scriptFailed', 'Script failed')
    case 'timeout':
      return t('runSummary.timedOut', 'Timed out')
    case 'file-transfer':
      return t('runSummary.filesNotSent', 'Couldn’t send files to the device')
    case 'refused':
      return t('runSummary.refused', 'The device refused the run')
    case 'lost':
      return t('runSummary.lost', 'Lost contact with the device')
    default:
      return t('runSummary.failed', 'Failed')
  }
}

// The run's own reason, as the device gave it, starting with a capital.
export function runReason(run: Pick<JobRun, 'detail'>): string | undefined {
  const detail = run.detail?.trim()
  return detail ? detail[0].toUpperCase() + detail.slice(1) : undefined
}

// The account it ran as, its exit code and how long it took.
export function runFacts(t: TFunction, run: JobRun): string[] {
  const seconds =
    run.startedAt && run.endedAt
      ? Math.max(0, Math.round((Date.parse(run.endedAt) - Date.parse(run.startedAt)) / 1000))
      : undefined
  return [
    run.ranAs && t('runSummary.ranAs', 'Ran as {{account}}', { account: run.ranAs }),
    run.exitCode != null &&
      (run.signal
        ? t('runSummary.exitCodeSignal', 'Exit code {{code}} ({{signal}})', { code: run.exitCode, signal: run.signal })
        : t('runSummary.exitCode', 'Exit code {{code}}', { code: run.exitCode })),
    seconds !== undefined && t('jobRun.seconds', { count: seconds, defaultValue: '{{count}} s' }),
  ].filter((fact): fact is string => !!fact)
}

/* A few lines of a run's output: its first, or where only its end was read (`cut`), its last. more: whether there is
   more than these. */
export function outputLines(chunks: OutputChunk[], cut: boolean, count = 4): { lines: string[]; more: boolean } {
  const all = chunks
    .map(chunk => chunk.text)
    .join('')
    .replace(/\r\n/g, '\n')
    .split('\n')
  while (all.length && !all[all.length - 1].trim()) all.pop()
  const lines = cut ? all.slice(-count) : all.slice(0, count)
  return { lines, more: cut || all.length > count }
}

/* A failed job's runs in a few words, for its row in a list: what failed and on which device, or on how many. runs:
   the job's runs read, with their device's name. None where none failed. */
export function jobFailureLine(t: TFunction, runs: { run: JobRun | null; name?: string }[]): string | undefined {
  const failed = runs.flatMap(({ run, name }) => {
    const words = run && runFailureWords(t, run)
    return words ? [{ words, name }] : []
  })
  if (!failed.length) return
  const words = failed[0].words
  if (failed.length === 1)
    return failed[0].name
      ? t('runSummary.onDevice', '{{words}} on {{device}}', { words, device: failed[0].name })
      : words
  if (failed.every(f => f.words === words))
    return t('runSummary.onDevices', {
      words,
      count: failed.length,
      defaultValue_one: '{{words}} on {{count}} device',
      defaultValue_other: '{{words}} on {{count}} devices',
    })
  return t('runSummary.failedOnDevices', {
    count: failed.length,
    defaultValue_one: 'Failed on {{count}} device',
    defaultValue_other: 'Failed on {{count}} devices',
  })
}
