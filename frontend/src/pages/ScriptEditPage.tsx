import sleep from '../helpers/sleep'
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { Typography } from '@mui/material'
import { TargetPlatform } from '../components/TargetPlatform'
import { selectDevice } from '../selectors/devices'
import { selectScript } from '../selectors/scripting'
import { initialForm } from '../models/files'
import { selectRole } from '../selectors/organizations'
import { ScriptForm } from '../components/ScriptForm'
import { Container } from '../components/Container'

export const ScriptEditPage: React.FC = () => {
  const [defaultForm, setDefaultForm] = useState<IFileForm | undefined>()
  const [loading, setLoading] = useState<boolean>(false)
  const [form, setForm] = useState<IFileForm | undefined>()
  const { fileID, jobID } = useParams<{ fileID?: string; jobID?: string }>()
  const role = useSelector(selectRole)
  const script = useSelector((state: State) => selectScript(state, undefined, fileID, jobID))
  const savedForm = useSelector((state: State) => state.ui.scriptForm)
  const selectedIds = useSelector((state: State) => state.ui.selected)
  const dispatch = useDispatch<Dispatch>()

  const device = useSelector((state: State) =>
    selectedIds.length === 1 ? selectDevice(state, undefined, selectedIds[0]) : undefined
  )
  const defaultDeviceIds = script?.job?.jobDevices.map(d => d.id) || []
  const tagValues = script?.job?.tag?.values || []
  const access = () => (defaultDeviceIds.length ? 'CUSTOM' : tagValues.length ? 'TAG' : 'ALL')

  useEffect(() => {
    if (!script || !form || !defaultForm || defaultForm.script || savedForm?.script) return
    const download = async () => {
      setLoading(true)
      const fileId = script.versions[0].id
      const result = await dispatch.files.download(fileId)
      setDefaultForm({ ...defaultForm, fileId, script: result })
      setForm({ ...form, fileId, script: result })
      await sleep(200)
      setLoading(false)
    }
    download()
  }, [script, form, defaultForm])

  useEffect(() => {
    if (!form) return
    setForm({ ...form, access: selectedIds.length ? 'SELECTED' : access() })
  }, [selectedIds])

  useEffect(() => {
    const setupForm: IFileForm = {
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
    }
    setDefaultForm(setupForm)
    setForm({ ...setupForm, ...savedForm, access: selectedIds.length ? 'SELECTED' : access() })
  }, [fileID])

  if (!form || !defaultForm) return null

  return (
    <Container
      integrated
      bodyProps={{ inset: true, gutterBottom: true }}
      header={
        device && form.access === 'SELECTED' ? (
          <>
            <Typography variant="caption" marginLeft={10}>
              Scripting
            </Typography>
            <Typography variant="h1">
              <TargetPlatform id={device?.targetPlatform} size="xl" inlineLeft />
              {device.name}
            </Typography>
          </>
        ) : (
          <Typography variant="h1">Script</Typography>
        )
      }
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
