import React, { useState } from 'react'
import isEqual from 'lodash.isequal'
import { Dispatch } from '../store'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { List, ListItem, TextField, Button, Stack } from '@mui/material'
import { FileUpload } from './FileUpload'
import { TagFilter } from './TagFilter'

type Props = {
  form: IFileForm
  defaultForm: IFileForm
  deviceIds: string[]
  loading?: boolean
  onChange: (form: IFileForm) => void
}

export const ScriptForm: React.FC<Props> = ({ form, defaultForm, deviceIds, loading, onChange }) => {
  const [saving, setSaving] = useState(false)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const changed = !isEqual(form, defaultForm)

  return (
    <form
      onSubmit={async event => {
        event.preventDefault()
        setSaving(true)
        form.file = new File([form.script || form.file || ''], form.name, { type: form.file?.type || 'text/plain' })
        const fileId = await dispatch.files.upload(form)
        await dispatch.jobs.save({ ...form, fileId })
        await dispatch.files.fetch()
        await dispatch.jobs.fetch()
        history.push('/scripting/scripts')
        setSaving(false)
      }}
    >
      <List disablePadding>
        <ListItem disableGutters>
          <FileUpload
            script={form.script}
            loading={loading}
            onChange={script => onChange({ ...form, script })}
            onUpload={file => {
              onChange({ ...form, name: file.name, file })
              console.log('upload', file.name, file)
            }}
          />
        </ListItem>
        {form.file?.name}
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
          selectedIds={deviceIds}
          selected
        />
      </List>
      <Stack flexDirection="row" gap={1}>
        <Button type="submit" variant="contained" color="primary" disabled={!changed || saving}>
          {saving ? 'Saving' : 'Save'}
        </Button>
        <Button onClick={() => history.push('/scripting/scripts')}>Cancel</Button>
      </Stack>
    </form>
  )
}
