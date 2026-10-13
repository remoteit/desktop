import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Collapse, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import {
  DEFAULT_ARTIFACT_MB,
  DEFAULT_FILE_STALL_SECONDS,
  jobRunOptionFields,
  JobRunOptionName,
  MAX_ARTIFACT_MB,
  MAX_FILE_SECONDS,
} from '../services/jobRunOptions'
import { Icon } from './Icon'

// The options this API's startJob takes (services/jobRunOptions): none until read, and none from an older API.
export function useJobRunOptionFields(): JobRunOptionName[] {
  const [fields, setFields] = useState<JobRunOptionName[]>([])
  useEffect(() => {
    let current = true
    jobRunOptionFields().then(names => current && setFields(names))
    return () => {
      current = false
    }
  }, [])
  return fields
}

type Props = {
  fields: JobRunOptionName[]
  value?: IJobRunOptionsForm
  errors: Partial<Record<keyof IJobRunOptionsForm, string>>
  disabled?: boolean
  onChange: (value: IJobRunOptionsForm) => void
}

/* "Advanced" on the run form: startJob's options, each empty for its default (shown), checked as typed. They apply to
   devices that run the script on the job runner; others run it as before. Nothing where the API takes none. */
export const ScriptRunAdvanced: React.FC<Props> = ({ fields, value = {}, errors, disabled, onChange }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(() => Object.values(value).some(v => !!v?.trim()))
  if (!fields.length) return null

  const field = (
    name: keyof IJobRunOptionsForm,
    label: string,
    unit: string,
    help: string,
    max: number
  ) => (
    <TextField
      key={name}
      label={label}
      value={value[name] ?? ''}
      placeholder={t('jobRunOptions.default', 'Default')}
      type="number"
      variant="filled"
      fullWidth
      disabled={disabled}
      error={!!errors[name]}
      helperText={errors[name] || help}
      inputProps={{ min: 0, max, 'data-testid': `run-option-${name}` }}
      InputProps={{ endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }}
      onChange={event => onChange({ ...value, [name]: event.target.value })}
    />
  )

  return (
    <Box marginTop={2}>
      <Button
        size="small"
        color="inherit"
        onClick={() => setOpen(!open)}
        data-testid="run-advanced"
        endIcon={<Icon name={open ? 'chevron-up' : 'chevron-down'} size="sm" />}
      >
        {t('jobRunOptions.advanced', 'Advanced')}
      </Button>
      <Collapse in={open}>
        <Stack spacing={2} marginTop={1}>
          <Typography variant="caption" color="grayDark.main">
            {t(
              'jobRunOptions.hint',
              'For devices that run the script on the job runner. Leave a field empty for its default. Used when the script runs now.'
            )}
          </Typography>
          {fields.includes('fileTimeoutSeconds') &&
            field(
              'fileTimeoutSeconds',
              t('jobRunOptions.fileTimeout', 'File download time limit'),
              t('jobRunOptions.seconds', 'seconds'),
              t('jobRunOptions.fileTimeoutHint', 'Each file argument’s download, all its tries. Default: 10 minutes, or a minute per 50 MB if longer.'),
              MAX_FILE_SECONDS
            )}
          {fields.includes('fileStallSeconds') &&
            field(
              'fileStallSeconds',
              t('jobRunOptions.fileStall', 'File download stall limit'),
              t('jobRunOptions.seconds', 'seconds'),
              t('jobRunOptions.fileStallHint', 'How long a download may go with no data arriving. Default: {{seconds}} seconds.', {
                seconds: DEFAULT_FILE_STALL_SECONDS,
              }),
              MAX_FILE_SECONDS
            )}
          {fields.includes('artifactLimit') &&
            field(
              'artifactLimitMB',
              t('jobRunOptions.artifactLimit', 'Artifacts limit'),
              'MB',
              t('jobRunOptions.artifactLimitHint', 'What the files the script writes to $R3_ARTIFACTS may come to, at most {{max}} MB; 0 keeps none. Default: {{default}} MB.', {
                max: MAX_ARTIFACT_MB,
                default: DEFAULT_ARTIFACT_MB,
              }),
              MAX_ARTIFACT_MB
            )}
        </Stack>
      </Collapse>
    </Box>
  )
}
