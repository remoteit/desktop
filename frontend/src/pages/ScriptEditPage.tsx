import sleep from '../helpers/sleep'
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { useParams } from 'react-router-dom'
import { selectRole } from '../selectors/organizations'
import { selectScript } from '../selectors/scripting'
import { ScriptForm } from '../components/ScriptForm'
import { Typography } from '@mui/material'
import { Body } from '../components/Body'
import { Pre } from '../components/Pre'

const initialForm: IFileForm = {
  name: '',
  description: '',
  executable: true,
  tag: { operator: 'ALL', values: [] },
  deviceIds: [],
  access: 'ALL',
}

export const ScriptEditPage: React.FC = () => {
  const [defaultScript, setDefaultScript] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const { fileID, jobID } = useParams<{ fileID?: string; jobID?: string }>()
  const script = useSelector((state: State) => selectScript(state, undefined, fileID, jobID))
  const dispatch = useDispatch<Dispatch>()
  const role = useSelector(selectRole)

  if (!script)
    return (
      <Body center>
        <Typography>Script not found</Typography>
      </Body>
    )

  const deviceIds = script.job?.jobDevices.map(d => d.id) || []
  const defaultForm: IFileForm = {
    deviceIds,
    name: script.name,
    description: script.shortDesc || '',
    executable: script.executable,
    tag: script.job?.tag,
    access: deviceIds.length ? 'SELECTED' : script.job?.tag.values.length ? 'TAG' : 'ALL',
  }

  const [form, setForm] = useState<IFileForm>(defaultForm)

  useEffect(() => {
    if (defaultScript) return
    else {
      ;(async () => {
        setLoading(true)
        const download = await dispatch.files.download(script.versions[0].id)
        setDefaultScript(download)
        setLoading(false)
      })()
    }
  }, [script])

  return (
    <Body inset gutterTop gutterBottom>
      <Typography variant="h1">Script Configuration</Typography>
      <ScriptForm
        form={form}
        onChange={setForm}
        defaultForm={defaultForm}
        defaultScript={defaultScript}
        deviceIds={deviceIds}
        loading={loading}
      />
    </Body>
  )
}
