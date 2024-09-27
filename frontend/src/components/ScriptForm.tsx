import React, { useState, useEffect } from 'react'
import isEqual from 'lodash.isequal'
import { Dispatch } from '../store'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { List, ListItem, TextField, Button, Stack, Box } from '@mui/material'
import { LoadingMessage } from './LoadingMessage'
import { FileUpload } from './FileUpload'
import { TagFilter } from './TagFilter'

type Props = {
  form: IFileForm
  defaultForm: IFileForm
  defaultScript?: string
  deviceIds: string[]
  loading?: boolean
  onChange: (form: IFileForm) => void
}

export const ScriptForm: React.FC<Props> = ({ form, defaultForm, defaultScript, deviceIds, loading, onChange }) => {
  const [saving, setSaving] = useState(false)
  const [script, setScript] = useState<string>(defaultScript || '')
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const changed = !isEqual(form, defaultForm)

  useEffect(() => {
    setScript(defaultScript || '')
  }, [defaultScript])

  return (
    <form
      onSubmit={async event => {
        event.preventDefault()
        setSaving(true)
        form.file = new File([script || form.file || ''], form.name, { type: form.file?.type || 'text/plain' })
        const fileId = await dispatch.files.upload(form)
        await dispatch.jobs.save({ ...form, fileId })
        await dispatch.files.fetch()
        history.push('/scripting/scripts')
        setSaving(false)
      }}
    >
      <List>
        <ListItem disableGutters>
          {loading ? (
            <Stack
              bgcolor="grayLightest.main"
              justifyContent="center"
              alignContent="center"
              paddingTop={7}
              borderRadius={2}
              minWidth={200}
              width="100%"
            >
              <LoadingMessage />
            </Stack>
          ) : (
            <FileUpload
              script={script}
              onChange={script => setScript(script)}
              onUpload={file => {
                onChange({ ...form, name: file.name, file })
                console.log('upload', file.name, file)
              }}
            />
          )}
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
