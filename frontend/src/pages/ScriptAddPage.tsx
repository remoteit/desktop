import React, { useState } from 'react'
import { State } from '../store'
import { initialForm } from '../models/files'
import { selectRole } from '../selectors/organizations'
import { ScriptForm } from '../components/ScriptForm'
import { useSelector } from 'react-redux'
import { Typography } from '@mui/material'
import { Body } from '../components/Body'

export const ScriptAddPage: React.FC = () => {
  const role = useSelector(selectRole)
  const selectedIds = useSelector((state: State) => state.ui.selected)
  const defaultForm: IFileForm = {
    ...role,
    ...initialForm,
    access: selectedIds.length ? 'SELECTED' : 'ALL',
  }
  const [form, setForm] = useState<IFileForm>(defaultForm)

  return (
    <Body inset gutterTop gutterBottom>
      <Typography variant="h1">New Script</Typography>
      <ScriptForm form={form} onChange={setForm} selectedIds={selectedIds} defaultForm={defaultForm} />
    </Body>
  )
}
