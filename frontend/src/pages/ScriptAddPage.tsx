import React, { useState } from 'react'
import { State } from '../store'
import { selectRole } from '../selectors/organizations'
import { ScriptForm } from '../components/ScriptForm'
import { useSelector } from 'react-redux'
import { Typography } from '@mui/material'
import { Body } from '../components/Body'

const initialForm: IFileForm = {
  name: '',
  description: '',
  executable: true,
  tag: { operator: 'ALL', values: [] },
  deviceIds: [],
  access: 'ALL',
}

export const ScriptAddPage: React.FC = () => {
  const role = useSelector(selectRole)
  const deviceIds = useSelector((state: State) => state.ui.selected)
  const defaultForm: IFileForm = {
    ...role,
    ...initialForm,
    deviceIds,
    access: deviceIds.length ? 'SELECTED' : 'ALL',
  }
  const [form, setForm] = useState<IFileForm>(defaultForm)

  return (
    <Body inset gutterTop gutterBottom>
      <Typography variant="h1">New Script</Typography>
      <ScriptForm form={form} onChange={setForm} defaultForm={defaultForm} deviceIds={deviceIds} />
    </Body>
  )
}
