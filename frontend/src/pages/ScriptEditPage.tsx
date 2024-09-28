import sleep from '../helpers/sleep'
import isEqual from 'lodash.isequal'
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { selectRole } from '../selectors/organizations'
import { initialForm } from '../models/files'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, Box } from '@mui/material'
import { State, Dispatch } from '../store'
import { DynamicButton } from '../buttons/DynamicButton'
import { selectScript } from '../selectors/scripting'
import { ScriptForm } from '../components/ScriptForm'
import { Container } from '../components/Container'

export const ScriptEditPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [running, setRunning] = useState<boolean>(false)
  const { fileID, jobID } = useParams<{ fileID?: string; jobID?: string }>()
  const role = useSelector(selectRole)
  const script = useSelector((state: State) => selectScript(state, undefined, fileID, jobID))
  const deviceIds = useSelector((state: State) => state.ui.selected)
  const dispatch = useDispatch<Dispatch>()

  const defaultDeviceIds = script?.job?.jobDevices.map(d => d.id) || []
  const tagValues = script?.job?.tag?.values || []
  const [defaultForm, setDefaultForm] = useState<IFileForm>({
    ...role,
    ...initialForm,
    deviceIds: defaultDeviceIds,
    jobId: script?.job?.id ?? initialForm.jobId,
    fileId: script?.versions[0].id ?? initialForm.fileId,
    name: script?.name ?? initialForm.name,
    description: script?.shortDesc ?? initialForm.description,
    executable: script?.executable ?? initialForm.executable,
    tag: script?.job?.tag ?? initialForm.tag,
    access: defaultDeviceIds.length ? 'SELECTED' : tagValues.length ? 'TAG' : 'ALL',
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
      await sleep(400)
      setLoading(false)
    }
    download()
  }, [script])

  const changed = !isEqual(form, defaultForm)

  return (
    <Container
      integrated
      bodyProps={{ inset: true, gutterBottom: true }}
      header={
        <>
          <Typography variant="h1">Script Configuration</Typography>
          <Box mx={6} my={2}>
            <DynamicButton
              color="primary"
              title={running ? 'Running' : 'Run'}
              size="large"
              disabled={changed || loading || running}
              fullWidth
              onClick={async () => {
                setRunning(true)
                await dispatch.jobs.run(form)
                setRunning(false)
              }}
            />
          </Box>
        </>
      }
    >
      <ScriptForm form={form} onChange={setForm} defaultForm={defaultForm} deviceIds={deviceIds} loading={loading} />
    </Container>
  )
}