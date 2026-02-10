import React, { useState, useEffect, useRef, useMemo } from 'react'
import sleep from '../helpers/sleep'
import structuredClone from '@ungap/structured-clone'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  Typography,
  List,
  ListItem,
  TextField,
  Button,
  Chip,
  Stack,
  Box,
  Collapse,
  Divider,
  useMediaQuery,
} from '@mui/material'
import { State, Dispatch, store } from '../store'
import { HIDE_SIDEBAR_WIDTH } from '../constants'
import { selectScript } from '../selectors/scripting'
import { getDevices, getAllDevices } from '../selectors/devices'
import { selectRole } from '../selectors/organizations'
import { initialForm } from '../models/files'
import { ArgumentDefinitionForm } from '../components/ArgumentDefinitionForm'
import { ArgumentsValueForm } from '../components/ArgumentsValueForm'
import { FileUpload } from '../components/FileUpload'
import { IconButton } from '../buttons/IconButton'
import { TagFilter } from '../components/TagFilter'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

type Props = {
  isNew?: boolean
  showBack?: boolean
  showMenu?: boolean
}

export const ScriptConfigPage: React.FC<Props> = ({ isNew, showBack, showMenu }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { fileID, jobID } = useParams<{ fileID?: string; jobID?: string }>()
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)

  const role = useSelector(selectRole)
  const manager = role.permissions.includes('MANAGE')
  const script = useSelector((state: State) => (fileID ? selectScript(state, undefined, fileID, jobID) : undefined))
  const selectedIds = useSelector((state: State) => state.ui.selected)
  const scriptFormFromState = useSelector((state: State) => state.ui.scriptForm)
  const scriptRunForms = useSelector((state: State) => state.ui.scriptRunForms)
  const devices = useSelector(getDevices)
  const allDevices = useSelector(getAllDevices)
  const fetching = useSelector((state: State) => state.files.fetching)

  // Edit state
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<IFileForm | undefined>()
  const [defaultEditForm, setDefaultEditForm] = useState<IFileForm | undefined>()

  // Run state — per-script (and per-job) open/closed persisted in accordion state
  const accordionKey = `scriptRun-${fileID || 'new'}${jobID ? `-${jobID}` : ''}`
  const accordion = useSelector((state: State) => state.ui.accordion)
  const runOpenPersisted = accordion[accordionKey]
  // Default to open if we have a jobID or returning from device selection, otherwise use persisted value
  const runOpen = runOpenPersisted ?? (!!jobID || !!scriptFormFromState)
  const setRunOpen = (open: boolean) => dispatch.ui.accordion({ [accordionKey]: open })
  const [running, setRunning] = useState(false)
  const [unauthorized, setUnauthorized] = useState<IDevice[]>()
  const [runForm, setRunForm] = useState<IFileForm>({
    ...role,
    ...initialForm,
    fileId: fileID || '',
    access: isNew && selectedIds.length ? 'SELECTED' : 'NONE',
  })
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
  // and reset consumed flag so form reinitializes
  useEffect(() => {
    // Save the current form if we were on "new run" (no previous jobID)
    if (!prevJobIDRef.current && !isNew) {
      saveRunForm()
    }
    prevJobIDRef.current = jobID
    hasConsumedScriptForm.current = false
    if (!scriptFormFromState && jobID) {
      setRunOpen(true)
    }
  }, [jobID])

  // Save working run form to per-script storage on unmount or script change
  // Only save for "new run" (no jobID) — prepared runs load from job data
  useEffect(() => {
    return () => {
      if (!isNew && !jobIDRef.current) {
        const id = fileID || 'new'
        // Use dispatch directly since refs have the latest values
        dispatch.ui.set({
          scriptRunForms: { ...store.getState().ui.scriptRunForms, [id]: { ...runFormRef.current, fileId: id } },
        })
      }
    }
  }, [fileID])

  // Get arguments from the script's latest file version (edit mode)
  // or from the edit form's argument definitions (new mode)
  const serverArguments = script?.versions?.[0]?.arguments || []
  const scriptArguments: IFileArgument[] = isNew
    ? (editForm?.argumentDefinitions ?? []).map((def, i) => ({
      name: def.name,
      desc: def.desc || '',
      argumentType: def.type,
      options: def.options || [],
      order: i,
    }))
    : serverArguments

  // Get existing argument definitions for edit form
  const existingDefinitions: IArgumentDefinition[] = serverArguments.map(arg => ({
    name: arg.name,
    type: arg.argumentType,
    desc: arg.desc || '',
    options: arg.options?.length ? arg.options : undefined,
  }))

  // Get previous job's device selection
  const defaultDeviceIds = script?.job?.jobDevices.map(d => d.device.id) || []
  const tagValues = script?.job?.tag?.values || []

  // Build a lookup of job device names from the job data
  const jobDeviceNames: Record<string, string> = useMemo(() => {
    const lookup: Record<string, string> = {}
    script?.job?.jobDevices.forEach(jd => {
      lookup[jd.device.id] = jd.device.name
    })
    return lookup
  }, [script?.job?.jobDevices])

  // Resolve device names for the current run form
  const resolvedDevices: { id: string; name: string }[] = useMemo(() => {
    const ids =
      runForm.access === 'SELECTED'
        ? selectedIds
        : runForm.access === 'CUSTOM'
          ? runForm.deviceIds
          : []
    return ids.map(id => {
      // First check job device names (prepared runs)
      if (jobDeviceNames[id]) return { id, name: jobDeviceNames[id] }
      // Then check Redux device store
      const device = devices.find(d => d.id === id) || allDevices.find(d => d.id === id)
      return { id, name: device?.name || id.slice(0, 8) + '…' }
    })
  }, [runForm.access, runForm.deviceIds, selectedIds, jobDeviceNames, devices, allDevices])

  // Initialize edit form — new script
  useEffect(() => {
    if (!isNew || editForm) return
    const setupForm: IFileForm = {
      ...role,
      ...initialForm,
      ...scriptFormFromState,
      access: selectedIds.length ? 'SELECTED' : initialForm.access,
    }
    setDefaultEditForm(setupForm)
    setEditForm(setupForm)
  }, [isNew])

  // Initialize edit form — existing script
  useEffect(() => {
    if (isNew || !script) return
    const setupForm: IFileForm = {
      ...role,
      ...initialForm,
      fileId: script.id,
      name: script.name,
      description: script.shortDesc || '',
      executable: script.executable,
      argumentDefinitions: existingDefinitions.length ? existingDefinitions : [],
    }
    setDefaultEditForm(setupForm)
    setEditForm(setupForm)
  }, [fileID, script?.id])

  // Download script content for edit (existing only)
  useEffect(() => {
    if (isNew || loading || !script || !editForm || !defaultEditForm || defaultEditForm.script) return
    const download = async () => {
      setLoading(true)
      const fileVersionId = script.versions[0]?.id
      if (fileVersionId) {
        const result = await dispatch.files.download(fileVersionId)
        setDefaultEditForm(prev => (prev ? { ...prev, script: result } : prev))
        setEditForm(prev => (prev ? { ...prev, script: result } : prev))
      }
      await sleep(200)
      setLoading(false)
    }
    download()
  }, [script, editForm, defaultEditForm])

  // Ensure files are loaded (needed for FileSelect arguments)
  useEffect(() => {
    dispatch.files.fetchIfEmpty()
  }, [])

  // Initialize run form from scriptFormFromState or prepared job (existing only)
  useEffect(() => {
    if (isNew || !script) return

    if (!jobID && scriptFormFromState && scriptFormFromState.fileId === script.id && !hasConsumedScriptForm.current) {
      // Restore from one-off navigation (device selection round-trip, "Prepare with Updated Selections")
      hasConsumedScriptForm.current = true
      setRunForm(prev => ({
        ...prev,
        ...scriptFormFromState,
      }))
      dispatch.ui.set({ scriptForm: undefined })
    } else if (jobID && !hasConsumedScriptForm.current) {
      // Pre-populate from a specific prepared job (opened via jobID in URL)
      hasConsumedScriptForm.current = true
      const access = tagValues.length
        ? 'TAG'
        : defaultDeviceIds.length
          ? 'CUSTOM'
          : selectedIds.length
            ? 'SELECTED'
            : 'NONE'
      const argumentValues: IArgumentValue[] =
        script.job?.arguments?.map(arg => ({ name: arg.name, value: arg.value || '' })) || []
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
      // Restore from per-script persistent storage (switching between scripts)
      hasConsumedScriptForm.current = true
      setRunForm({
        ...role,
        ...initialForm,
        ...scriptRunForms[script.id],
      })
    } else if (!hasConsumedScriptForm.current) {
      // Fresh form — no saved state exists
      hasConsumedScriptForm.current = true
      setRunForm({
        ...role,
        ...initialForm,
        fileId: script.id,
        access: selectedIds.length ? 'SELECTED' : 'NONE',
      })
    }
  }, [fileID, script?.id, jobID])

  // Initialize run form from saved state (new only)
  useEffect(() => {
    if (!isNew) return
    if (scriptFormFromState && !hasConsumedScriptForm.current) {
      hasConsumedScriptForm.current = true
      setRunForm(prev => ({ ...prev, ...scriptFormFromState }))
      dispatch.ui.set({ scriptForm: undefined })
    }
  }, [isNew])

  // Update access when selectedIds change
  useEffect(() => {
    if (selectedIds.length) {
      setRunForm(prev => ({ ...prev, access: 'SELECTED' }))
    }
  }, [selectedIds])

  // Check authorization for selected devices
  useEffect(() => {
    if (!selectedIds.length && runForm.access !== 'CUSTOM') return
    const deviceIds = runForm.access === 'SELECTED' ? selectedIds : runForm.deviceIds

    async function checkSelected() {
      const result = await dispatch.jobs.unauthorized(deviceIds)
      setUnauthorized(result.length ? result : undefined)
    }
    checkSelected()
  }, [selectedIds, runForm.deviceIds, runForm.access])

  // ── Save helpers ──

  const uploadScript = async (): Promise<string | undefined> => {
    if (!editForm) return undefined
    editForm.file = new File([editForm.script ?? ''], editForm.name, { type: editForm.file?.type ?? 'text/plain' })
    return await dispatch.files.upload(editForm)
  }

  const handleSave = async () => {
    if (!editForm) return
    setSaving(true)

    if (isNew) {
      // New script — just upload
      await uploadScript()
      dispatch.ui.set({ selected: [], scriptForm: undefined })
    } else if (script) {
      // Existing script — update
      const metadataChanged =
        editForm.name !== defaultEditForm?.name || editForm.description !== defaultEditForm?.description
      const contentChanged =
        editForm.script !== defaultEditForm?.script ||
        JSON.stringify(editForm.argumentDefinitions) !== JSON.stringify(defaultEditForm?.argumentDefinitions)

      if (manager) {
        if (contentChanged) {
          editForm.file = new File([editForm.script ?? ''], editForm.name, { type: 'text/plain' })
          await dispatch.files.upload(editForm)
        } else if (metadataChanged) {
          await dispatch.files.updateMetadata({
            fileId: script.id,
            name: editForm.name,
            shortDesc: editForm.description,
          })
        }
      }
      setDefaultEditForm(editForm)
    }

    setSaving(false)
  }

  const handleRun = async () => {
    setRunning(true)
    const form = { ...runForm }
    if (runForm.access === 'SELECTED') form.deviceIds = selectedIds

    if (isNew) {
      const newFileId = await uploadScript()
      if (newFileId) {
        form.fileId = newFileId
        await dispatch.jobs.saveRun(form)
      }
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
      if (newFileId) {
        form.fileId = newFileId
        await dispatch.jobs.save(form)
      }
      dispatch.ui.set({ selected: [], scriptForm: undefined })
    } else {
      await dispatch.jobs.save(form)
      dispatch.ui.set({ selected: [] })
    }
    setRunning(false)
  }

  const clearUnauthorized = () => {
    if (unauthorized) {
      dispatch.ui.set({ selected: selectedIds.filter(id => !unauthorized.find(u => u.id === id)) })
    }
  }

  // ── Derived state ──

  const hasEditChanges = isNew
    ? !!(editForm?.name && editForm?.script)
    : editForm &&
    defaultEditForm &&
    (editForm.script !== defaultEditForm.script ||
      editForm.description !== defaultEditForm.description ||
      editForm.name !== defaultEditForm.name ||
      JSON.stringify(editForm.argumentDefinitions) !== JSON.stringify(defaultEditForm.argumentDefinitions))

  const canRun =
    !unauthorized &&
    ((runForm.access === 'SELECTED' && selectedIds.length > 0) ||
      (runForm.access === 'TAG' && (runForm.tag?.values.length ?? 0) > 0) ||
      (runForm.access === 'CUSTOM' && runForm.deviceIds.length > 0))

  const canSaveScript = isNew ? !!(editForm?.name && editForm?.script) : true

  const requiredArgsFilled =
    scriptArguments.length === 0 ||
    scriptArguments.every(arg => runForm.argumentValues?.find(v => v.name === arg.name)?.value)

  // For existing scripts, wait until script loads
  if (!isNew && !script) return null

  return (
    <Container
      bodyProps={{ verticalOverflow: true, gutterBottom: true }}
      header={
        <Gutters top="sm" bottom="sm">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showMenu && sidebarHidden && (
              <IconButton
                name="bars"
                size="md"
                color="grayDarker"
                onClick={() => dispatch.ui.set({ sidebarMenu: true })}
              />
            )}
            {showBack && (
              <IconButton
                name="chevron-left"
                onClick={() => history.push(isNew ? '/scripts' : `/script/${fileID}`)}
                size="md"
                title="Back"
              />
            )}
            <Typography variant="h2" sx={{ flex: 1 }}>
              {isNew ? 'Add Script' : script?.name}
            </Typography>
          </Box>
        </Gutters>
      }
    >
      {/* ── Prepare & Run ── */}
      <Box sx={{ px: 2, py: 1 }}>
        {!runOpen && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => setRunOpen(true)}
          >
            Prepare & Run
          </Button>
        )}
        <Collapse in={runOpen}>
          <Box sx={{ pb: 1 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Target Devices
            </Typography>
            <List disablePadding>
              <TagFilter
                form={runForm}
                name="Devices"
                selectDevices
                disableGutters
                onChange={f => setRunForm({ ...runForm, ...structuredClone(f) })}
                selectedIds={selectedIds}
                onSelectIds={() => {
                  // Merge edit fields (name, desc, script, argDefs) with run fields (devices, tag, argValues)
                  // editForm spreads last so its name/description/script aren't overwritten by runForm's empty defaults
                  const savedForm: IFileForm = {
                    ...runForm,
                    ...editForm,
                    deviceIds: runForm.deviceIds,
                    tag: runForm.tag,
                    access: runForm.access,
                    argumentValues: runForm.argumentValues,
                    jobId: runForm.jobId,
                  }
                  dispatch.ui.set({ scriptForm: savedForm })
                  history.push('/devices/select/scripts')
                }}
              />
            </List>

            {resolvedDevices.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, mb: 0.5 }}>
                {resolvedDevices.slice(0, 3).map(d => (
                  <Chip key={d.id} label={d.name} size="small" variant="outlined" />
                ))}
                {resolvedDevices.length > 3 && (
                  <Chip
                    label={`+${resolvedDevices.length - 3} more`}
                    size="small"
                    color="primary"
                    onClick={() => {
                      const savedForm: IFileForm = {
                        ...runForm,
                        ...editForm,
                        deviceIds: runForm.deviceIds,
                        tag: runForm.tag,
                        access: runForm.access,
                        argumentValues: runForm.argumentValues,
                        jobId: runForm.jobId,
                      }
                      dispatch.ui.set({ scriptForm: savedForm })
                      history.push('/devices/select/scripts')
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                )}
              </Box>
            )}

            {runForm.access === 'TAG' && runForm.tag?.values && runForm.tag.values.length > 0 && resolvedDevices.length === 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, mb: 0.5 }}>
                <Typography variant="caption" color="textSecondary" sx={{ mr: 0.5, alignSelf: 'center' }}>
                  Tag:
                </Typography>
                {runForm.tag.values.map(tag => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            )}

            {unauthorized && (
              <Notice severity="error" solid fullWidth sx={{ mt: 2 }}>
                You are not allowed to run scripts on
                <List disablePadding>
                  {unauthorized.map(d => (
                    <ListItem key={d.id}>
                      <b>{d.name}</b>
                    </ListItem>
                  ))}
                </List>
                <Button
                  size="small"
                  onClick={clearUnauthorized}
                  sx={{ color: 'alwaysWhite.main', bgcolor: 'screen.main' }}
                >
                  Remove Device{unauthorized.length > 1 ? 's' : ''}
                </Button>
              </Notice>
            )}

            {/* Script Arguments */}
            {scriptArguments.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <ArgumentsValueForm
                  arguments={scriptArguments}
                  values={runForm.argumentValues ?? []}
                  onChange={argumentValues => setRunForm({ ...runForm, argumentValues })}
                  disabled={running}
                />
              </>
            )}

            {/* Run Buttons */}
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled={!canRun || !canSaveScript || !requiredArgsFilled || running || fetching}
                onClick={handleRun}
              >
                {running ? 'Running...' : 'Run Now'}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                disabled={!canRun || !canSaveScript || !requiredArgsFilled || running || fetching}
                onClick={handlePrepare}
              >
                Save Run
              </Button>
              <Button
                variant="text"
                color="grayDark"
                fullWidth
                onClick={() => {
                  setRunOpen(false)
                  setRunForm({
                    ...role,
                    ...initialForm,
                    fileId: fileID || '',
                    access: 'NONE',
                  })
                  dispatch.ui.set({ selected: [] })
                }}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        </Collapse>
      </Box>

      <Divider />

      {/* ── Edit Script ── */}
      <Box sx={{ px: 2, pt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1">
            <Title>Edit Script</Title>
          </Typography>
          {manager && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={!hasEditChanges || saving || loading}
              onClick={handleSave}
              sx={{ ml: 'auto' }}
            >
              {saving ? 'Saving...' : 'Save Script'}
            </Button>
          )}
        </Box>
        {editForm && (
          <Box sx={{ pt: 1 }}>
            <List disablePadding>
              <ListItem disableGutters>
                <TextField
                  required
                  fullWidth
                  label="Name"
                  disabled={!manager}
                  value={editForm.name}
                  variant="filled"
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </ListItem>
              <ListItem disableGutters>
                <TextField
                  multiline
                  fullWidth
                  disabled={!manager}
                  label="Description"
                  value={editForm.description}
                  variant="filled"
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                />
              </ListItem>
              {manager && (
                <ListItem disableGutters sx={{ display: 'block', mt: 2 }}>
                  <ArgumentDefinitionForm
                    definitions={editForm.argumentDefinitions ?? []}
                    onChange={argumentDefinitions => setEditForm({ ...editForm, argumentDefinitions })}
                    disabled={loading || saving}
                  />
                </ListItem>
              )}
              <ListItem disableGutters sx={{ mt: 2 }}>
                <FileUpload
                  disabled={!manager}
                  script={editForm.script}
                  loading={loading}
                  onChange={(script, file) =>
                    setEditForm({ ...editForm, script, ...(file && { name: file.name, file }) })
                  }
                />
              </ListItem>
            </List>
          </Box>
        )}
      </Box>
    </Container>
  )
}
