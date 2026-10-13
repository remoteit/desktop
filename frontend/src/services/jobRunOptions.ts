import type { TFunction } from 'i18next'
import { post } from './post'

/* A run's options on the job runner (graphql startJob's `options`, JobRunOptions; device-package docs/scripting-plan.md,
   "Files"): each FileSelect file's download limits on the device — overall, and with no byte coming — and what the
   files the script writes to $R3_ARTIFACTS may come to. Offered only for the options the API takes: which it takes is
   read from its schema (JobRunOptions' fields), so an older API — none of them — is asked startJob as before. */

export type JobRunOptionName = 'fileTimeoutSeconds' | 'fileStallSeconds' | 'artifactLimit'

export type JobRunOptions = Partial<Record<JobRunOptionName, number>>

const MB = 1024 ** 2
export const MAX_FILE_SECONDS = 24 * 60 * 60 // graphql's bound on both file limits
export const MAX_ARTIFACT_MB = 100 // graphql's MAX_ARTIFACT_LIMIT, 100 MiB
export const DEFAULT_ARTIFACT_MB = 10 // graphql's ARTIFACT_LIMIT
export const DEFAULT_FILE_STALL_SECONDS = 60 // the device's own

let fields: Promise<JobRunOptionName[]> | undefined

// The options this API's startJob takes; none where it has no JobRunOptions (or could not say). Read once.
export function jobRunOptionFields(): Promise<JobRunOptionName[]> {
  if (!fields)
    fields = post({ query: `query JobRunOptionFields { __type(name: "JobRunOptions") { inputFields { name } } }` }).then(
      response => {
        const names: string[] =
          response === 'ERROR' ? [] : response.data?.data?.__type?.inputFields?.map((f: { name: string }) => f.name) ?? []
        if (response === 'ERROR') fields = undefined // to ask again
        return (['fileTimeoutSeconds', 'fileStallSeconds', 'artifactLimit'] as const).filter(name => names.includes(name))
      }
    )
  return fields
}

export function resetJobRunOptionFields() {
  fields = undefined
}

type Parsed = { options: JobRunOptions; errors: Partial<Record<keyof IJobRunOptionsForm, string>> }

const whole = (text?: string) => (text ?? '').trim()

// The options as typed, within graphql's bounds: an empty field is the default (left out); one out of bounds is an
// error to show, and the run waits for it.
export function parseJobRunOptions(t: TFunction, form: IJobRunOptionsForm | undefined, offered: JobRunOptionName[]): Parsed {
  const parsed: Parsed = { options: {}, errors: {} }
  for (const name of ['fileTimeoutSeconds', 'fileStallSeconds'] as const) {
    const text = whole(form?.[name])
    if (!text || !offered.includes(name)) continue
    const value = Number(text)
    if (!Number.isInteger(value) || value < 1 || value > MAX_FILE_SECONDS)
      parsed.errors[name] = t('jobRunOptions.secondsRange', 'Whole seconds, 1 to {{max}}', { max: MAX_FILE_SECONDS })
    else parsed.options[name] = value
  }
  const text = whole(form?.artifactLimitMB)
  if (text && offered.includes('artifactLimit')) {
    const value = Number(text)
    if (!Number.isFinite(value) || value < 0 || value > MAX_ARTIFACT_MB)
      parsed.errors.artifactLimitMB = t('jobRunOptions.artifactRange', '0 to {{max}} MB', { max: MAX_ARTIFACT_MB })
    else parsed.options.artifactLimit = Math.round(value * MB)
  }
  return parsed
}
