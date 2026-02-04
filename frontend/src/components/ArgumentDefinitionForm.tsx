import React, { useState } from 'react'
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton as MuiIconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Collapse,
  Typography,
  Box,
} from '@mui/material'
import { Icon } from './Icon'

type Props = {
  definitions: IArgumentDefinition[]
  onChange: (definitions: IArgumentDefinition[]) => void
  disabled?: boolean
}

const ARGUMENT_TYPES: { value: IFileArgumentType; label: string; description: string }[] = [
  { value: 'StringEntry', label: 'Text Input', description: 'Free text entry field' },
  { value: 'StringSelect', label: 'Dropdown', description: 'Select from predefined options' },
  { value: 'FileSelect', label: 'File Select', description: 'Select a file (optionally filter by extension)' },
]

const emptyDefinition: IArgumentDefinition = {
  name: '',
  type: 'StringEntry',
  desc: '',
  options: [],
}

export const ArgumentDefinitionForm: React.FC<Props> = ({ definitions, onChange, disabled }) => {
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [editForm, setEditForm] = useState<IArgumentDefinition>(emptyDefinition)
  const [optionsText, setOptionsText] = useState('')

  const startEdit = (index: number) => {
    const def = definitions[index]
    setEditing(index)
    setEditForm(def)
    setOptionsText(def.options?.join(', ') || '')
  }

  const startNew = () => {
    setEditing('new')
    setEditForm(emptyDefinition)
    setOptionsText('')
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditForm(emptyDefinition)
    setOptionsText('')
  }

  const saveEdit = () => {
    const options = optionsText
      .split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0)

    const updated: IArgumentDefinition = {
      ...editForm,
      options: options.length > 0 ? options : undefined,
    }

    if (editing === 'new') {
      onChange([...definitions, updated])
    } else if (typeof editing === 'number') {
      const newDefs = [...definitions]
      newDefs[editing] = updated
      onChange(newDefs)
    }
    cancelEdit()
  }

  const deleteDefinition = (index: number) => {
    onChange(definitions.filter((_, i) => i !== index))
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newDefs = [...definitions]
    ;[newDefs[index - 1], newDefs[index]] = [newDefs[index], newDefs[index - 1]]
    onChange(newDefs)
  }

  const moveDown = (index: number) => {
    if (index === definitions.length - 1) return
    const newDefs = [...definitions]
    ;[newDefs[index], newDefs[index + 1]] = [newDefs[index + 1], newDefs[index]]
    onChange(newDefs)
  }

  const canSave = editForm.name.trim().length > 0

  const showOptions = editForm.type === 'StringSelect' || editForm.type === 'FileSelect'

  return (
    <Box>
      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
        Script Arguments
      </Typography>
      <List disablePadding dense>
        {definitions.map((def, index) => (
          <React.Fragment key={index}>
            <ListItem
              disableGutters
              sx={{
                bgcolor: editing === index ? 'action.selected' : 'transparent',
                borderRadius: 1,
                mb: 0.5,
              }}
            >
              <ListItemText
                primary={def.name}
                secondary={
                  <>
                    {ARGUMENT_TYPES.find(t => t.value === def.type)?.label || def.type}
                    {def.desc && ` - ${def.desc}`}
                    {def.options?.length ? ` (${def.options.length} options)` : ''}
                  </>
                }
              />
              {!disabled && editing !== index && (
                <ListItemSecondaryAction>
                  <MuiIconButton size="small" onClick={() => moveUp(index)} disabled={index === 0}>
                    <Icon name="chevron-up" size="sm" />
                  </MuiIconButton>
                  <MuiIconButton size="small" onClick={() => moveDown(index)} disabled={index === definitions.length - 1}>
                    <Icon name="chevron-down" size="sm" />
                  </MuiIconButton>
                  <MuiIconButton size="small" onClick={() => startEdit(index)}>
                    <Icon name="pencil" size="sm" />
                  </MuiIconButton>
                  <MuiIconButton size="small" onClick={() => deleteDefinition(index)}>
                    <Icon name="trash" size="sm" />
                  </MuiIconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
            <Collapse in={editing === index} unmountOnExit>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, mb: 1 }}>
                <ArgumentEditForm
                  form={editForm}
                  optionsText={optionsText}
                  showOptions={showOptions}
                  canSave={canSave}
                  onFormChange={setEditForm}
                  onOptionsChange={setOptionsText}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                />
              </Box>
            </Collapse>
          </React.Fragment>
        ))}
      </List>

      {!disabled && editing !== 'new' && (
        <Button
          size="small"
          startIcon={<Icon name="plus" size="sm" />}
          onClick={startNew}
          sx={{ mt: 1 }}
        >
          Add Argument
        </Button>
      )}

      <Collapse in={editing === 'new'} unmountOnExit>
        <Box sx={{ mt: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            New Argument
          </Typography>
          <ArgumentEditForm
            form={editForm}
            optionsText={optionsText}
            showOptions={showOptions}
            canSave={canSave}
            onFormChange={setEditForm}
            onOptionsChange={setOptionsText}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
        </Box>
      </Collapse>

      {definitions.length === 0 && editing !== 'new' && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          No arguments defined. Arguments allow users to provide input values when running the script.
        </Typography>
      )}
    </Box>
  )
}

// Extracted edit form component to avoid duplication
type EditFormProps = {
  form: IArgumentDefinition
  optionsText: string
  showOptions: boolean
  canSave: boolean
  onFormChange: (form: IArgumentDefinition) => void
  onOptionsChange: (text: string) => void
  onSave: () => void
  onCancel: () => void
}

const ArgumentEditForm: React.FC<EditFormProps> = ({
  form,
  optionsText,
  showOptions,
  canSave,
  onFormChange,
  onOptionsChange,
  onSave,
  onCancel,
}) => (
  <Stack spacing={2}>
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
        {ARGUMENT_TYPES.map(t => (
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
    <Stack direction="row" spacing={1}>
      <Button size="small" variant="contained" onClick={onSave} disabled={!canSave}>
        Save
      </Button>
      <Button size="small" onClick={onCancel}>
        Cancel
      </Button>
    </Stack>
  </Stack>
)
