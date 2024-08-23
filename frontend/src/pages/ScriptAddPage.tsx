import React, { useState, useEffect } from 'react'
import isEqual from 'lodash.isequal'
import { selectRole } from '../selectors/organizations'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { List, ListItem, Typography, TextField, Button, Stack } from '@mui/material'
import { FileUpload } from '../components/FileUpload'
import { TagFilter } from '../components/TagFilter'
import { Body } from '../components/Body'

const initialForm: IFileForm = {
  name: '',
  description: '',
  tag: { operator: 'ALL', values: [] },
  access: 'ALL',
}

export const ScriptAddPage: React.FC = () => {
  const role = useSelector(selectRole)
  const selectedIds = useSelector((state: State) => state.ui.selected)
  const defaultForm: IFileForm = {
    ...role,
    ...initialForm,
    access: selectedIds.length ? 'SELECTED' : 'ALL',
  }
  const [form, setForm] = useState<IFileForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const changed = !isEqual(form, defaultForm)

  useEffect(() => {
    // dispatch.applicationTypes.fetchAll()
  }, [])

  return (
    <Body inset gutterTop gutterBottom>
      <form
        onSubmit={async event => {
          event.preventDefault()
          if (!form.file) return dispatch.ui.set({ errorMessage: 'No file selected' })
          form.file = new File([form.file], form.name, { type: form.file.type })
          setSaving(true)
          await dispatch.files.save(form)
          setSaving(false)
        }}
      >
        <Typography variant="h1">New Script</Typography>
        <List>
          <ListItem disableGutters>
            <FileUpload
              onUpload={file => {
                setForm({ ...form, name: file.name, file })
                console.log('upload', file.name, file)
              }}
            />
          </ListItem>
          <ListItem disableGutters>
            <TextField
              required
              fullWidth
              label="Name"
              value={form.name}
              variant="filled"
              InputLabelProps={{ shrink: true }}
              onChange={event => setForm({ ...form, name: event.target.value })}
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
              onChange={event => setForm({ ...form, description: event.target.value })}
            />
          </ListItem>
          <TagFilter
            form={form}
            countsSx={{ marginRight: 3 }}
            onChange={f => setForm({ ...form, ...structuredClone(f) })}
            disableGutters
            selectedIds={selectedIds}
            selected
          />
        </List>
        <Stack flexDirection="row" gap={1}>
          <Button type="submit" variant="contained" color="primary" disabled={!changed || saving}>
            {saving ? 'Saving' : 'Save'}
          </Button>
          <Button onClick={() => history.goBack()}>Cancel</Button>
        </Stack>
      </form>
    </Body>
  )
}
