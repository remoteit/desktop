import React from 'react'
import { useTranslation } from 'react-i18next'
import { TextField, Select, MenuItem, FormControl, InputLabel, Button, Stack, Typography } from '@mui/material'
import { Icon } from './Icon'

type ArgumentTypeOption = {
  value: IFileArgumentType
  label: string
  description: string
}

type Props = {
  form: IArgumentDefinition
  optionsText: string
  showOptions: boolean
  canSave: boolean
  argumentTypes: ArgumentTypeOption[]
  onFormChange: (form: IArgumentDefinition) => void
  onOptionsChange: (text: string) => void
  onSave: () => void
  onCancel: () => void
  onDelete?: () => void
}

export const ArgumentDefinitionEditForm: React.FC<Props> = ({
  form,
  optionsText,
  showOptions,
  canSave,
  argumentTypes,
  onFormChange,
  onOptionsChange,
  onSave,
  onCancel,
  onDelete,
}) => {
  const { t } = useTranslation()
  return (
    <Stack gap={1}>
      <TextField
        fullWidth
        variant="filled"
        label={t('argumentDefinitionEditForm.variableName', 'Variable Name')}
        placeholder={t('argumentDefinitionEditForm.variableNamePlaceholder', 'e.g., fileName, url, action')}
        value={form.name}
        onChange={e => onFormChange({ ...form, name: e.target.value.replace(/\s/g, '_') })}
        helperText={t('argumentDefinitionEditForm.variableNameHelper', 'Name used in script (no spaces)')}
        error={form.name.trim().length === 0}
        InputLabelProps={{ shrink: true }}
      />
      <FormControl fullWidth variant="filled">
        <InputLabel shrink>{t('argumentDefinitionEditForm.type', 'Type')}</InputLabel>
        <Select
          value={form.type}
          label={t('argumentDefinitionEditForm.type', 'Type')}
          onChange={e => onFormChange({ ...form, type: e.target.value as IFileArgumentType })}
        >
          {argumentTypes.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
              <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                - {option.description}
              </Typography>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        fullWidth
        variant="filled"
        label={t('argumentDefinitionEditForm.description', 'Description')}
        placeholder={t('argumentDefinitionEditForm.descriptionPlaceholder', 'Description shown to user')}
        value={form.desc}
        onChange={e => onFormChange({ ...form, desc: e.target.value })}
        helperText={t(
          'argumentDefinitionEditForm.descriptionHelper',
          'Help text displayed to user when filling in the value'
        )}
        InputLabelProps={{ shrink: true }}
      />
      {showOptions && (
        <TextField
          fullWidth
          variant="filled"
          label={
            form.type === 'FileSelect'
              ? t('argumentDefinitionEditForm.fileExtensions', 'File Extensions')
              : t('argumentDefinitionEditForm.options', 'Options')
          }
          placeholder={
            form.type === 'FileSelect'
              ? t('argumentDefinitionEditForm.fileExtensionsPlaceholder', '.txt, .log, .csv')
              : t('argumentDefinitionEditForm.optionsPlaceholder', 'Option1, Option2, Option3')
          }
          value={optionsText}
          onChange={e => onOptionsChange(e.target.value)}
          helperText={
            form.type === 'FileSelect'
              ? t(
                  'argumentDefinitionEditForm.fileExtensionsHelper',
                  'Comma-separated file extensions to filter by (optional)'
                )
              : t('argumentDefinitionEditForm.optionsHelper', 'Comma-separated list of options for dropdown')
          }
          InputLabelProps={{ shrink: true }}
        />
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row">
          <Button size="small" variant="contained" onClick={onSave} disabled={!canSave}>
            {t('argumentDefinitionEditForm.save', 'Save')}
          </Button>
          <Button size="small" onClick={onCancel}>
            {t('argumentDefinitionEditForm.cancel', 'Cancel')}
          </Button>
        </Stack>
        {onDelete && (
          <Button size="small" startIcon={<Icon name="trash" size="sm" />} onClick={onDelete}>
            {t('argumentDefinitionEditForm.delete', 'Delete')}
          </Button>
        )}
      </Stack>
    </Stack>
  )
}
