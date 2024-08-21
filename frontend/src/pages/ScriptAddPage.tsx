import React, { useState, useEffect } from 'react'
import isEqual from 'lodash.isequal'
import { selectRole } from '../selectors/organizations'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { List, ListItem, Typography, TextField, Button, Stack } from '@mui/material'
import { LocalhostScanForm } from '../components/LocalhostScanForm'
import { selectActiveUser } from '../selectors/accounts'
import { spacing, radius } from '../styling'
import { getDevices } from '../selectors/devices'
import { Container } from '../components/Container'
import { TagFilter } from '../components/TagFilter'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { emit } from '../services/Controller'
import { Body } from '../components/Body'
import { Link } from '../components/Link'

type FormProps = {
  name: string
  description: string
  tag: ITagFilter
  access: IRoleAccess
  script?: File
}

const initialForm: FormProps = {
  name: '',
  description: '',
  tag: { operator: 'ALL', values: [] },
  access: 'ALL',
}

export const ScriptAddPage: React.FC = () => {
  const role = useSelector(selectRole)
  const selectedIds = useSelector((state: State) => state.ui.selected)
  const defaultForm: FormProps = {
    ...role,
    ...initialForm,
    access: selectedIds.length ? 'SELECTED' : 'ALL',
  }
  const [form, setForm] = useState<FormProps>(defaultForm)
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const history = useHistory()
  const changed = !isEqual(form, defaultForm)

  useEffect(() => {
    // dispatch.applicationTypes.fetchAll()
  }, [])

  return (
    <Body inset gutterTop gutterBottom>
      <Typography variant="h1">New Script</Typography>
      <List>
        <ListItem disableGutters>
          <TextField
            required
            fullWidth
            label="Script Name"
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
            label="Script Description"
            value={form.description}
            variant="filled"
            InputLabelProps={{ shrink: true }}
            onChange={event => setForm({ ...form, description: event.target.value })}
          />
        </ListItem>
        <TagFilter
          form={form}
          countsSx={{ marginRight: 3 }}
          onChange={f => setForm({ ...form, ...f })}
          disableGutters
          selectedIds={selectedIds}
          selected
        />
        <ListItem disableGutters>File</ListItem>
      </List>
      <Stack flexDirection="row" gap={1}>
        <Button type="submit" variant="contained" color="primary" disabled={!changed}>
          Save
        </Button>
        <Button onClick={() => history.goBack()}>Cancel</Button>
        {/* <Pre form={form} /> */}
      </Stack>
    </Body>
  )
}
