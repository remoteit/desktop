import React, { useState } from 'react'
import { State } from '../store'
import { useParams } from 'react-router-dom'
import { selectRole } from '../selectors/organizations'
import { selectScript } from '../selectors/scripting'
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

export const ScriptEditPage: React.FC = () => {
  const { fileID, jobID } = useParams<{ fileID?: string; jobID?: string }>()
  const script = useSelector((state: State) => selectScript(state, undefined, fileID, jobID))
  const role = useSelector(selectRole)

  if (!script)
    return (
      <Body center>
        <Typography>Script not found</Typography>
      </Body>
    )

  // form.file = new File([script || form.file || ''], form.name, { type: form.file?.type || 'text/plain' })
  const deviceIds = script.job?.jobDevices.map(d => d.id) || []
  const defaultForm: IFileForm = {
    deviceIds,
    name: script.name,
    description: script.shortDesc || '',
    executable: script.executable,
    tag: script.job?.tag,
    access: deviceIds.length ? 'SELECTED' : script.job?.tag.values.length ? 'TAG' : 'ALL',
    file: undefined, //script.versions[0].id, // TODO ask @evan how to get the file
  }

  const [form, setForm] = useState<IFileForm>(defaultForm)

  return (
    <Body inset gutterTop gutterBottom>
      <Typography variant="h1">Script Configuration</Typography>
      <ScriptForm form={form} onChange={setForm} defaultForm={defaultForm} deviceIds={deviceIds} />
    </Body>
  )
}
