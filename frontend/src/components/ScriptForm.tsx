import React, { useState } from 'react'
import isEqual from 'lodash.isequal'
import { Dispatch } from '../store'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { List, ListItem, TextField, Button, Stack } from '@mui/material'
import { DynamicButton } from '../buttons/DynamicButton'
import { FileUpload } from './FileUpload'
import { TagFilter } from './TagFilter'
// import { Pre } from './Pre'

type Props = {
  form: IFileForm
  defaultForm: IFileForm
  selectedIds: string[]
  loading?: boolean
  onChange: (form: IFileForm) => void
}

export const ScriptForm: React.FC<Props> = ({ form, defaultForm, selectedIds, loading, onChange }) => {
  const [running, setRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const changed = !isEqual(form, defaultForm)
  const disabled =
    form.access === 'NONE' || (form.access === 'SELECTED' && !selectedIds.length) || !form.script || !form.name

  const save = async (run?: boolean) => {
    if (run) setRunning(true)
    setSaving(true)

    form.file = new File([form.script || form.file || ''], form.name, { type: form.file?.type ?? 'text/plain' })
    const fileId = await dispatch.files.upload(form)

    if (form.access === 'SELECTED') form.deviceIds = selectedIds

    if (run) await dispatch.jobs.saveAndRun({ ...form, fileId })
    else await dispatch.jobs.save({ ...form, fileId })

    await dispatch.files.fetch()
    await dispatch.jobs.fetch()
    await dispatch.ui.set({ selected: [], scriptForm: undefined })
    history.push('/scripting/scripts')

    setSaving(false)
    if (run) setRunning(false)
  }

  return (
    <form onSubmit={event => (event.preventDefault(), save())}>
      <List disablePadding>
        <ListItem disableGutters>
          <TextField
            required
            fullWidth
            label="Name"
            value={form.name}
            variant="filled"
            InputLabelProps={{ shrink: true }}
            onChange={event => onChange({ ...form, name: event.target.value })}
          />
        </ListItem>
        <ListItem disableGutters>
          <FileUpload
            script={form.script}
            loading={loading}
            onChange={script => onChange({ ...form, script })}
            onUpload={file => onChange({ ...form, name: file.name, file })}
          />
        </ListItem>
        <ListItem disableGutters>
          <TextField
            multiline
            fullWidth
            label="Description"
            value={form.description}
            variant="filled"
            InputLabelProps={{ shrink: true }}
            onChange={event => onChange({ ...form, description: event.target.value })}
          />
        </ListItem>
        <TagFilter
          form={form}
          name="Devices"
          countsSx={{ marginRight: 3 }}
          onChange={f => onChange({ ...form, ...structuredClone(f) })}
          disableGutters
          selectedIds={selectedIds}
          onSelectIds={() => {
            dispatch.ui.set({ scriptForm: form })
            history.push('/devices/select')
          }}
          disableAll
        />
      </List>
      <Stack flexDirection="row" gap={1} mt={2} sx={{ button: { paddingX: 4 } }}>
        <DynamicButton
          fullWidth
          color="primary"
          title={running ? 'Running' : changed ? 'Save and Run' : 'Run'}
          size="medium"
          disabled={loading || running || saving || disabled}
          onClick={() => save(true)}
        />
        <DynamicButton
          type="submit"
          variant="contained"
          color="primary"
          disabled={!changed || saving || disabled}
          size="medium"
          title={saving ? 'Saving' : 'Save'}
        />
        <Button
          onClick={async () => {
            await dispatch.ui.set({ scriptForm: undefined, selected: [] })
            history.push('/scripting/scripts')
          }}
        >
          Cancel
        </Button>
      </Stack>
    </form>
  )
}
