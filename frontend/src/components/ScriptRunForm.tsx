import React from 'react'
import structuredClone from '@ungap/structured-clone'
import { useTranslation } from 'react-i18next'
import { Typography, List, ListItem, Button, Chip, Stack } from '@mui/material'
import { ArgumentsValueForm } from './ArgumentsValueForm'
import { TagFilter } from './TagFilter'
import { Notice } from './Notice'

type Props = {
  runForm: IFileForm
  scriptArguments: IFileArgument[]
  selectedIds: string[]
  resolvedDevices: { id: string; name: string }[]
  unauthorized: IDevice[] | undefined
  running: boolean
  fetching: boolean
  disabled?: boolean
  canRun: boolean
  requiredArgsFilled: boolean
  hasValidEditSnapshot?: boolean
  onFormChange: (form: IFileForm) => void
  onSelectDevices: () => void
  onClearUnauthorized: () => void
  onRun: () => void
  onPrepare: () => void
}

export const ScriptRunForm: React.FC<Props> = ({
  runForm,
  scriptArguments,
  selectedIds,
  resolvedDevices,
  unauthorized,
  running,
  fetching,
  disabled,
  canRun,
  requiredArgsFilled,
  hasValidEditSnapshot = true,
  onFormChange,
  onSelectDevices,
  onClearUnauthorized,
  onRun,
  onPrepare,
}) => {
  const { t } = useTranslation()
  return (
    <>
      {!hasValidEditSnapshot && (
        <Notice severity="warning" gutterBottom>
          {t(
            'scriptRunForm.noScriptData',
            'No script data found. Please go back and complete the script form first.'
          )}
        </Notice>
      )}

      <Typography variant="subtitle2">{t('scriptRunForm.targetDevices', 'Target Devices')}</Typography>
      <List disablePadding>
        <TagFilter
          form={runForm}
          name={t('scriptRunForm.devices', 'Devices')}
          selectDevices
          disableGutters
          disabled={disabled}
          onChange={f => onFormChange({ ...runForm, ...structuredClone(f) })}
          selectedIds={selectedIds}
          onSelectIds={onSelectDevices}
        />
      </List>

      {resolvedDevices.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.5} mt={1} mb={0.5}>
          {resolvedDevices.slice(0, 3).map(d => (
            <Chip key={d.id} label={d.name} size="small" variant="outlined" />
          ))}
          {resolvedDevices.length > 3 && (
            <Chip
              label={t('scriptRunForm.moreCount', {
                count: resolvedDevices.length - 3,
                defaultValue: '+{{count}} more',
              })}
              size="small"
              color="primary"
              onClick={onSelectDevices}
              sx={{ cursor: 'pointer' }}
            />
          )}
        </Stack>
      )}

      {unauthorized && (
        <Notice severity="error" solid fullWidth gutterTop>
          {t('scriptRunForm.notAllowedOn', 'You are not allowed to run scripts on')}
          <List disablePadding>
            {unauthorized.map(d => (
              <ListItem key={d.id} disableGutters>
                <b>{d.name}</b>
              </ListItem>
            ))}
          </List>
          <Button size="small" onClick={onClearUnauthorized} sx={{ color: 'alwaysWhite.main', bgcolor: 'shadow.main' }}>
            {t('scriptRunForm.removeDeviceCount', {
              count: unauthorized.length,
              defaultValue_one: 'Remove Device',
              defaultValue_other: 'Remove Devices',
            })}
          </Button>
        </Notice>
      )}

      {scriptArguments.length > 0 && (
        <ArgumentsValueForm
          arguments={scriptArguments}
          values={runForm.argumentValues ?? []}
          onChange={argumentValues => onFormChange({ ...runForm, argumentValues })}
          disabled={disabled || running}
        />
      )}

      {!disabled && (
        <>
          <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              disabled={!canRun || !hasValidEditSnapshot || !requiredArgsFilled || running || fetching}
              onClick={onRun}
              sx={{ flexGrow: 1 }}
            >
              {running ? t('scriptRunForm.running', 'Running...') : t('scriptRunForm.runNow', 'Run Now')}
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={!canRun || !hasValidEditSnapshot || !requiredArgsFilled || running || fetching}
              onClick={onPrepare}
            >
              {t('common.save', 'Save')}
            </Button>
          </Stack>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
            {t(
              'scriptRunForm.saveHint',
              'Save creates a prepared run with the selected devices, tag, and argument values.'
            )}
          </Typography>
        </>
      )}
    </>
  )
}
