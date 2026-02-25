import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, Box } from '@mui/material'
import { State, Dispatch, store } from '../store'
import { selectScript } from '../selectors/scripting'
import { getDevices, getAllDevices } from '../selectors/devices'
import { selectRole } from '../selectors/organizations'
import { initialForm } from '../models/files'
import { ScriptRunForm } from '../components/ScriptRunForm'
import { Container } from '../components/Container'
import { IconButton } from '../buttons/IconButton'

type Props = {
  isNew?: boolean
}

export const ScriptRunPage: React.FC<Props> = ({ isNew }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { fileID, jobID } = useParams<{ fileID?: string; jobID?: string }>()

  const role = useSelector(selectRole)
  const script = useSelector((state: State) => (fileID ? selectScript(state, undefined, fileID, jobID) : undefined))
  const selectedIds = useSelector((state: State) => state.ui.selected)
  const scriptFormFromState = useSelector((state: State) => state.ui.scriptForm)
  const scriptRunForms = useSelector((state: State) => state.ui.scriptRunForms)
  const devices = useSelector(getDevices)
  const allDevices = useSelector(getAllDevices)
  const fetching = useSelector((state: State) => state.files.fetching)

  const [running, setRunning] = useState(false)
  const [unauthorized, setUnauthorized] = useState<IDevice[]>()
  const [runForm, setRunForm] = useState<IFileForm>({
    ...role,
    ...initialForm,
    fileId: fileID || '',
    access: isNew && selectedIds.length ? 'SELECTED' : 'NONE',
  })

  // Snapshot of the edit form passed from ScriptEditPage (new script flow only)
  const editFormSnapshotRef = useRef<IFileForm | undefined>(undefined)

  const hasConsumedScriptForm = useRef(false)
  const runFormRef = useRef(runForm)
  runFormRef.current = runForm
  const prevJobIDRef = useRef(jobID)
  const jobIDRef = useRef(jobID)
  jobIDRef.current = jobID

  // Helper to save current "new run" form to per-script persistent storage
  const saveRunForm = () => {
    const id = fileID || 'new'
    const current = store.getState().ui.scriptRunForms
    dispatch.ui.set({ scriptRunForms: { ...current, [id]: { ...runFormRef.current, fileId: id } } })
  }

  // When jobID changes, save the current "new run" form before switching
  useEffect(() => {
    if (!prevJobIDRef.current && !isNew) saveRunForm()
    prevJobIDRef.current = jobID
    hasConsumedScriptForm.current = false
  }, [jobID])

  // Save working run form to per-script storage on unmount
  useEffect(() => {
    return () => {
      if (!isNew && !jobIDRef.current) {
        const id = fileID || 'new'
        dispatch.ui.set({
          scriptRunForms: { ...store.getState().ui.scriptRunForms, [id]: { ...runFormRef.current, fileId: id } },
        })
      }
    }
  }, [fileID])

  // Ensure files are loaded (needed for FileSelect arguments)
  useEffect(() => {
    dispatch.files.fetchIfEmpty()
  }, [])

  // Initialize run form from scriptFormFromState or prepared job (existing only)
  useEffect(() => {
    if (isNew || !script) return

    const defaultDeviceIds = script?.job?.jobDevices.map(d => d.device.id) || []
    const tagValues = script?.job?.tag?.values || []

    if (!jobID && scriptFormFromState && scriptFormFromState.fileId === script.id && !hasConsumedScriptForm.current) {
      hasConsumedScriptForm.current = true
      setRunForm(prev => ({ ...prev, ...scriptFormFromState }))
      dispatch.ui.set({ scriptForm: undefined })
    } else if (jobID && !hasConsumedScriptForm.current) {
      hasConsumedScriptForm.current = true
      const access = tagValues.length ? 'TAG' : defaultDeviceIds.length ? 'CUSTOM' : selectedIds.length ? 'SELECTED' : 'NONE'
      const argumentValues: IArgumentValue[] = script.job?.arguments?.map(arg => ({ name: arg.name, value: arg.value || '' })) || []
      setRunForm({
        ...role,
        ...initialForm,
        fileId: script.id,
        jobId: script.job?.status === 'READY' ? script.job?.id : undefined,
        deviceIds: defaultDeviceIds,
        tag: script.job?.tag ?? initialForm.tag,
        access,
        argumentValues,
      })
    } else if (!jobID && !hasConsumedScriptForm.current && scriptRunForms[script.id]) {
      hasConsumedScriptForm.current = true
      setRunForm({ ...role, ...initialForm, ...scriptRunForms[script.id] })
    } else if (!hasConsumedScriptForm.current) {
      hasConsumedScriptForm.current = true
      setRunForm({ ...role, ...initialForm, fileId: script.id, access: selectedIds.length ? 'SELECTED' : 'NONE' })
    }
  }, [fileID, script?.id, jobID])

  // Initialize run form from scriptFormFromState (new script only)
  useEffect(() => {
    if (!isNew) return
    if (scriptFormFromState && !hasConsumedScriptForm.current) {
      hasConsumedScriptForm.current = true
      editFormSnapshotRef.current = scriptFormFromState
      dispatch.ui.set({ scriptForm: undefined })
    }
  }, [isNew])

  // Update access when selectedIds change
  useEffect(() => {
    if (selectedIds.length) setRunForm(prev => ({ ...prev, access: 'SELECTED' }))
  }, [selectedIds])

  // Check authorization for selected devices
  useEffect(() => {
    if (!selectedIds.length && runForm.access !== 'CUSTOM') return
    const deviceIds = runForm.access === 'SELECTED' ? selectedIds : runForm.deviceIds
    dispatch.jobs.unauthorized(deviceIds).then(result => setUnauthorized(result.length ? result : undefined))
  }, [selectedIds, runForm.deviceIds, runForm.access])

  // Get arguments from server (existing) or from the edit form snapshot (new)
  const serverArguments = script?.versions?.[0]?.arguments || []
  const scriptArguments: IFileArgument[] = isNew
    ? (editFormSnapshotRef.current?.argumentDefinitions ?? []).map((def, i) => ({
        name: def.name,
        desc: def.desc || '',
        argumentType: def.type,
        options: def.options || [],
        order: i,
      }))
    : serverArguments

  // Build a lookup of job device names
  const jobDeviceNames: Record<string, string> = useMemo(() => {
    const lookup: Record<string, string> = {}
    script?.job?.jobDevices.forEach(jd => { lookup[jd.device.id] = jd.device.name })
    return lookup
  }, [script?.job?.jobDevices])

  // Resolve device names for the current run form
  const resolvedDevices: { id: string; name: string }[] = useMemo(() => {
    const ids = runForm.access === 'SELECTED' ? selectedIds : runForm.access === 'CUSTOM' ? runForm.deviceIds : []
    return ids.map(id => {
      if (jobDeviceNames[id]) return { id, name: jobDeviceNames[id] }
      const device = devices.find(d => d.id === id) || allDevices.find(d => d.id === id)
      return { id, name: device?.name || id.slice(0, 8) + '…' }
    })
  }, [runForm.access, runForm.deviceIds, selectedIds, jobDeviceNames, devices, allDevices])

  const uploadScript = async (): Promise<string | undefined> => {
    const snapshot = editFormSnapshotRef.current
    if (!snapshot) return undefined
    snapshot.file = new File([snapshot.script ?? ''], snapshot.name, { type: snapshot.file?.type ?? 'text/plain' })
    return await dispatch.files.upload(snapshot)
  }

  const handleRun = async () => {
    setRunning(true)
    const form = { ...runForm }
    if (runForm.access === 'SELECTED') form.deviceIds = selectedIds
    if (isNew) {
      const newFileId = await uploadScript()
      if (newFileId) { form.fileId = newFileId; await dispatch.jobs.saveRun(form) }
      dispatch.ui.set({ selected: [], scriptForm: undefined })
    } else {
      await dispatch.jobs.saveRun(form)
      dispatch.ui.set({ selected: [] })
    }
    setRunning(false)
  }

  const handlePrepare = async () => {
    setRunning(true)
    const form = { ...runForm }
    if (runForm.access === 'SELECTED') form.deviceIds = selectedIds
    if (isNew) {
      const newFileId = await uploadScript()
      if (newFileId) { form.fileId = newFileId; await dispatch.jobs.save(form) }
      dispatch.ui.set({ selected: [], scriptForm: undefined })
    } else {
      await dispatch.jobs.save(form)
      dispatch.ui.set({ selected: [] })
    }
    setRunning(false)
  }

  const handleSelectDevices = () => {
    dispatch.ui.set({
      scriptForm: {
        ...(isNew ? editFormSnapshotRef.current ?? {} : {}),
        ...runForm,
        deviceIds: runForm.deviceIds,
        tag: runForm.tag,
        access: runForm.access,
        argumentValues: runForm.argumentValues,
        jobId: runForm.jobId,
      },
    })
    history.push('/devices/select/scripts')
  }

  const handleBack = () => {
    if (isNew && editFormSnapshotRef.current) dispatch.ui.set({ scriptForm: editFormSnapshotRef.current })
    history.push(isNew ? '/scripts/add' : `/script/${fileID}/edit`)
  }

  const hasValidEditSnapshot = !isNew || !!(editFormSnapshotRef.current?.name && editFormSnapshotRef.current?.script)

  const canRun =
    !unauthorized &&
    ((runForm.access === 'SELECTED' && selectedIds.length > 0) ||
      (runForm.access === 'TAG' && (runForm.tag?.values.length ?? 0) > 0) ||
      (runForm.access === 'CUSTOM' && runForm.deviceIds.length > 0))

  const requiredArgsFilled =
    scriptArguments.length === 0 ||
    scriptArguments.every(arg => runForm.argumentValues?.find(v => v.name === arg.name)?.value)

  if (!isNew && !script) return null

  return (
    <Container
      integrated
      bodyProps={{ inset: true, verticalOverflow: true, gutterBottom: true }}
      header={
        <Typography variant="h1">
          {!isNew && !!jobID && <IconButton name="chevron-left" onClick={handleBack} size="md" title="Back" />}
          <Box sx={{ flex: 1, ml: !isNew && !!jobID ? 1 : 0 }}>{isNew ? 'Run Script' : script?.name || 'Run'}</Box>
        </Typography>
      }
    >
      <ScriptRunForm
        runForm={runForm}
        scriptArguments={scriptArguments}
        selectedIds={selectedIds}
        resolvedDevices={resolvedDevices}
        unauthorized={unauthorized}
        running={running}
        fetching={fetching}
        canRun={canRun}
        requiredArgsFilled={requiredArgsFilled}
        hasValidEditSnapshot={hasValidEditSnapshot}
        onFormChange={setRunForm}
        onSelectDevices={handleSelectDevices}
        onClearUnauthorized={() => dispatch.ui.set({ selected: selectedIds.filter(id => !unauthorized?.find(u => u.id === id)) })}
        onRun={handleRun}
        onPrepare={handlePrepare}
      />
    </Container>
  )
}
