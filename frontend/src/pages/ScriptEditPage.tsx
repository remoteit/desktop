import sleep from '../helpers/sleep'
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { useParams } from 'react-router-dom'
import { selectRole } from '../selectors/organizations'
import { Typography } from '@mui/material'
import { initialForm } from '../models/files'
import { selectScript } from '../selectors/scripting'
import { ScriptForm } from '../components/ScriptForm'
import { Container } from '../components/Container'

export const ScriptEditPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const { fileID, jobID } = useParams<{ fileID?: string; jobID?: string }>()
  const role = useSelector(selectRole)
  const script = useSelector((state: State) => selectScript(state, undefined, fileID, jobID))
  const selectedIds = useSelector((state: State) => state.ui.selected)
  const dispatch = useDispatch<Dispatch>()

  const defaultDeviceIds = script?.job?.jobDevices.map(d => d.id) || []
  const tagValues = script?.job?.tag?.values || []

  const access = () =>
    selectedIds.length ? 'SELECTED' : defaultDeviceIds.length ? 'CUSTOM' : tagValues.length ? 'TAG' : 'ALL'

  const [defaultForm, setDefaultForm] = useState<IFileForm>({
    ...role,
    ...initialForm,
    deviceIds: defaultDeviceIds,
    jobId: script?.job?.status === 'READY' ? script?.job?.id : initialForm.jobId,
    fileId: script?.versions[0].id ?? initialForm.fileId,
    name: script?.name ?? initialForm.name,
    description: script?.shortDesc ?? initialForm.description,
    executable: script?.executable ?? initialForm.executable,
    tag: script?.job?.tag ?? initialForm.tag,
    access: access(),
  })

  const [form, setForm] = useState<IFileForm>(defaultForm)

  useEffect(() => {
    if (!script || defaultForm.script) return
    const download = async () => {
      setLoading(true)
      const fileId = script.versions[0].id
      const result = await dispatch.files.download(fileId)
      setDefaultForm({ ...defaultForm, fileId, script: result })
      setForm({ ...form, fileId, script: result })
      console.log('FORM DEFAULT', { script, form: { ...defaultForm, fileId, script: result } })
      await sleep(200)
      setLoading(false)
    }
    download()
  }, [script])

  useEffect(() => {
    setForm({ ...form, access: access() })
    setDefaultForm({ ...form, access: access() })
  }, [selectedIds])

  return (
    <Container
      integrated
      bodyProps={{ inset: true, gutterBottom: true }}
      header={<Typography variant="h1">Script Configuration</Typography>}
    >
      <ScriptForm
        form={form}
        onChange={setForm}
        defaultForm={defaultForm}
        selectedIds={selectedIds}
        loading={loading}
      />
    </Container>
  )
}
