import React from 'react'
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
}) => (
  <Stack gap={1}>
    <TextField
      fullWidth
      variant="filled"
      label="Variable Name"
      placeholder="e.g., fileName, url, action"
      value={form.name}
      onChange={e => onFormChange({ ...form, name: e.target.value.replace(/\s/g, '_') })}
      helperText="Name used in script (no spaces)"
      error={form.name.trim().length === 0}
      InputLabelProps={{ shrink: true }}
    />
    <FormControl fullWidth variant="filled">
      <InputLabel shrink>Type</InputLabel>
      <Select
        value={form.type}
        label="Type"
        onChange={e => onFormChange({ ...form, type: e.target.value as IFileArgumentType })}
      >
        {argumentTypes.map(t => (
          <MenuItem key={t.value} value={t.value}>
            {t.label}
            <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
              - {t.description}
            </Typography>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    <TextField
      fullWidth
      variant="filled"
      label="Description"
      placeholder="Description shown to user"
      value={form.desc}
      onChange={e => onFormChange({ ...form, desc: e.target.value })}
      helperText="Help text displayed to user when filling in the value"
      InputLabelProps={{ shrink: true }}
    />
    {showOptions && (
      <TextField
        fullWidth
        variant="filled"
        label={form.type === 'FileSelect' ? 'File Extensions' : 'Options'}
        placeholder={form.type === 'FileSelect' ? '.txt, .log, .csv' : 'Option1, Option2, Option3'}
        value={optionsText}
        onChange={e => onOptionsChange(e.target.value)}
        helperText={
          form.type === 'FileSelect'
            ? 'Comma-separated file extensions to filter by (optional)'
            : 'Comma-separated list of options for dropdown'
        }
        InputLabelProps={{ shrink: true }}
      />
    )}
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="contained" onClick={onSave} disabled={!canSave}>
          Save
        </Button>
        <Button size="small" onClick={onCancel}>
          Cancel
        </Button>
      </Stack>
      {onDelete && (
        <Button size="small" startIcon={<Icon name="trash" size="sm" />} onClick={onDelete}>
          Delete
        </Button>
      )}
    </Stack>
  </Stack>
)
