import i18n from '../i18n'

// What a job runs as people read it: an upgrade job (no file; it says what it installs) is "Device upgrade", any other its
// script's name — undefined where the script was deleted.
export function jobName(job?: { file?: { name: string }; upgrade?: object }): string | undefined {
  if (job?.upgrade) return i18n.t('jobAttributes.upgrade', 'Device upgrade')
  return job?.file?.name
}
