import React, { useState, useEffect } from 'react'
import structuredClone from '@ungap/structured-clone'
import isEqual from 'lodash.isequal'
import { Dispatch } from '../store'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { List, ListItem, TextField, Button, Stack, Divider } from '@mui/material'
import { DynamicButton } from '../buttons/DynamicButton'
import { ArgumentDefinitionForm } from './ArgumentDefinitionForm'
import { ArgumentsValueForm } from './ArgumentsValueForm'
import { FileUpload } from './FileUpload'
import { TagFilter } from './TagFilter'
import { Notice } from './Notice'

type Props = {
  form: IFileForm
  defaultForm: IFileForm
  selectedIds: string[]
  loading?: boolean
  manager?: boolean
  scriptArguments?: IFileArgument[]  // Existing argument definitions from file version
  onChange: (form: IFileForm) => void
}

export const ScriptForm: React.FC<Props> = ({ form, defaultForm, selectedIds, loading, manager, scriptArguments = [], onChange }) => {
  const [unauthorized, setUnauthorized] = useState<IDevice[]>()
  const [running, setRunning] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const changed = !isEqual(form, defaultForm)
  const canSave = !unauthorized && !!form.script && !!form.name
  const scriptChanged =
    form.script !== defaultForm.script || 
    form.description !== defaultForm.description || 
    form.name !== defaultForm.name ||
    !isEqual(form.argumentDefinitions, defaultForm.argumentDefinitions)
  const canRun =
    (form.access === 'SELECTED' && selectedIds.length) ||
    (form.access === 'TAG' && form.tag?.values.length) ||
    (form.access === 'CUSTOM' && form.deviceIds.length)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    save()
  }

  const save = async (run?: boolean) => {
    if (run) setRunning(true)
    if (changed) setSaving(true)

    if (manager && scriptChanged) {
      form.file = new File([form.script ?? form.file ?? ''], form.name, { type: form.file?.type ?? 'text/plain' })
      form.fileId = await dispatch.files.upload(form)
    }

    if (form.access === 'SELECTED') form.deviceIds = selectedIds

    if (run) await dispatch.jobs.saveRun({ ...form })
    else if (changed) await dispatch.jobs.save({ ...form })

    dispatch.ui.set({ selected: [], scriptForm: undefined })

    if (changed) setSaving(false)
    if (run) setRunning(false)
  }

  const clearUnauthorized = () => {
    unauthorized && dispatch.ui.set({ selected: selectedIds.filter(id => !unauthorized.find(u => u.id === id)) })
  }

  useEffect(() => {
    if (!selectedIds.length) return

    async function checkSelected() {
      const unauthorized = await dispatch.jobs.unauthorized(selectedIds)
      if (unauthorized.length) {
        setUnauthorized(unauthorized)
      } else {
        setUnauthorized(undefined)
      }
    }

    checkSelected()
  }, [selectedIds])

  return (
    <form onSubmit={handleSubmit}>
      <List disablePadding>
        <ListItem disableGutters>
          <TextField
            required
            fullWidth
            label="Name"
            disabled={!manager}
            value={form.name}
            variant="filled"
            InputLabelProps={{ shrink: true }}
            onChange={event => onChange({ ...form, name: event.target.value })}
          />
        </ListItem>
        <ListItem disableGutters>
          <FileUpload
            disabled={!manager}
            script={form.script}
            loading={loading}
            onChange={(script, file) => onChange({ ...form, script, ...(file && { name: file.name, file }) })}
          />
        </ListItem>
        <ListItem disableGutters>
          <TextField
            multiline
            fullWidth
            disabled={!manager}
            label="Description"
            value={form.description}
            variant="filled"
            InputLabelProps={{ shrink: true }}
            onChange={event => onChange({ ...form, description: event.target.value })}
          />
        </ListItem>
        {manager && (
          <ListItem disableGutters sx={{ display: 'block', mt: 2 }}>
            <ArgumentDefinitionForm
              definitions={form.argumentDefinitions ?? []}
              onChange={argumentDefinitions => onChange({ ...form, argumentDefinitions })}
              disabled={loading || saving}
            />
          </ListItem>
        )}
        <Divider sx={{ my: 2 }} />
        <TagFilter
          form={form}
          name="Devices"
          selectDevices
          disableGutters
          countsSx={{ marginRight: 3 }}
          onChange={f => onChange({ ...form, ...structuredClone(f) })}
          selectedIds={selectedIds}
          onSelectIds={() => {
            dispatch.ui.set({ scriptForm: form })
            history.push('/devices/select/scripts')
          }}
        />
      </List>
      {unauthorized && (
        <Notice severity="error" solid fullWidth>
          You are not allow to run scripts on
          <List disablePadding>
            {unauthorized.map(d => (
              <ListItem key={d.id}>
                <b>{d.name}</b>
              </ListItem>
            ))}
          </List>
          <Button size="small" onClick={clearUnauthorized} sx={{ color: 'alwaysWhite.main', bgcolor: 'screen.main' }}>
            Remove Device{unauthorized.length > 1 ? 's' : ''}
          </Button>
        </Notice>
      )}
      {scriptArguments.length > 0 && (
        <ArgumentsValueForm
          arguments={scriptArguments}
          values={form.argumentValues ?? []}
          onChange={argumentValues => onChange({ ...form, argumentValues })}
          disabled={loading || saving || running}
        />
      )}
      <Stack flexDirection="row" gap={1} mt={2} sx={{ button: { paddingX: 4 } }}>
        <DynamicButton
          fullWidth
          color="primary"
          title={running ? 'Running' : scriptChanged ? 'Save and Run' : 'Run'}
          size="medium"
          disabled={loading || running || saving || !canSave || !canRun}
          onClick={() => save(true)}
        />
        <DynamicButton
          type="submit"
          variant="contained"
          color="primary"
          disabled={!changed || saving || !canSave}
          size="medium"
          title={saving ? 'Saving' : 'Save'}
        />
        <Button
          onClick={() => {
            dispatch.ui.set({ scriptForm: undefined, selected: [] })
            history.push('/scripts')
          }}
        >
          Cancel
        </Button>
      </Stack>
    </form>
  )
}
