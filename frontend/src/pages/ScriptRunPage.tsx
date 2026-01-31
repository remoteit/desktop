import React, { useState, useEffect, useRef } from 'react'
import structuredClone from '@ungap/structured-clone'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, List, ListItem, Button, Stack, Box, Divider, useMediaQuery } from '@mui/material'
import { State, Dispatch } from '../store'
import { HIDE_SIDEBAR_WIDTH } from '../constants'
import { selectScript } from '../selectors/scripting'
import { selectRole } from '../selectors/organizations'
import { initialForm } from '../models/files'
import { ArgumentsValueForm } from '../components/ArgumentsValueForm'
import { IconButton } from '../buttons/IconButton'
import { TagFilter } from '../components/TagFilter'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'

type Props = {
  showClose?: boolean
}

export const ScriptRunPage: React.FC<Props> = ({ showClose }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { fileID, jobID } = useParams<{ fileID: string; jobID?: string }>()
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)

  const role = useSelector(selectRole)
  const script = useSelector((state: State) => selectScript(state, undefined, fileID, jobID))
  const selectedIds = useSelector((state: State) => state.ui.selected)
  const scriptFormFromState = useSelector((state: State) => state.ui.scriptForm)
  const fetching = useSelector((state: State) => state.files.fetching)

  const [running, setRunning] = useState(false)
  const [unauthorized, setUnauthorized] = useState<IDevice[]>()
  const [form, setForm] = useState<IFileForm>({
    ...role,
    ...initialForm,
    fileId: fileID,
    access: 'NONE',
  })
  const hasConsumedScriptForm = useRef(false)

  // Get arguments from the script's latest file version
  const scriptArguments = script?.versions?.[0]?.arguments || []

  // Get previous job's device selection
  const defaultDeviceIds = script?.job?.jobDevices.map(d => d.device.id) || []
  const tagValues = script?.job?.tag?.values || []

  // Ensure files are loaded (needed for FileSelect arguments)
  useEffect(() => {
    dispatch.files.fetchIfEmpty()
  }, [])

  // Initialize form from scriptFormFromState (if coming from "Run with Updated Selections") or previous job
  useEffect(() => {
    if (!script) return

    // Check if we have a scriptForm in state (from "Run with Updated Selections")
    if (scriptFormFromState && scriptFormFromState.fileId === script.id && !hasConsumedScriptForm.current) {
      hasConsumedScriptForm.current = true
      setForm(prev => ({
        ...prev,
        ...scriptFormFromState,
      }))
      // Clear the scriptForm from state after using it
      dispatch.ui.set({ scriptForm: undefined })
    } else if (!hasConsumedScriptForm.current) {
      // Otherwise use default from last job
      const access = tagValues.length ? 'TAG' : defaultDeviceIds.length ? 'CUSTOM' : selectedIds.length ? 'SELECTED' : 'NONE'
      setForm(prev => ({
        ...prev,
        fileId: script.id,
        jobId: script.job?.status === 'READY' ? script.job?.id : undefined,
        deviceIds: defaultDeviceIds,
        tag: script.job?.tag ?? initialForm.tag,
        access,
        argumentValues: [],
      }))
    }
  }, [fileID, script?.id])

  // Update access when selectedIds change
  useEffect(() => {
    if (selectedIds.length) {
      setForm(prev => ({ ...prev, access: 'SELECTED' }))
    }
  }, [selectedIds])

  // Check authorization for selected devices
  useEffect(() => {
    if (!selectedIds.length && form.access !== 'CUSTOM') return
    const deviceIds = form.access === 'SELECTED' ? selectedIds : form.deviceIds

    async function checkSelected() {
      const unauthorized = await dispatch.jobs.unauthorized(deviceIds)
      setUnauthorized(unauthorized.length ? unauthorized : undefined)
    }
    checkSelected()
  }, [selectedIds, form.deviceIds, form.access])

  const handleRun = async () => {
    setRunning(true)
    
    const runForm = { ...form }
    if (form.access === 'SELECTED') runForm.deviceIds = selectedIds

    await dispatch.jobs.saveRun(runForm)
    dispatch.ui.set({ selected: [] })
    
    setRunning(false)
  }

  const handlePrepare = async () => {
    setRunning(true)
    
    const prepareForm = { ...form }
    if (form.access === 'SELECTED') prepareForm.deviceIds = selectedIds

    await dispatch.jobs.save(prepareForm)
    dispatch.ui.set({ selected: [] })
    
    setRunning(false)
  }

  const clearUnauthorized = () => {
    if (unauthorized) {
      dispatch.ui.set({ selected: selectedIds.filter(id => !unauthorized.find(u => u.id === id)) })
    }
  }

  const canRun =
    !unauthorized &&
    ((form.access === 'SELECTED' && selectedIds.length > 0) ||
      (form.access === 'TAG' && (form.tag?.values.length ?? 0) > 0) ||
      (form.access === 'CUSTOM' && form.deviceIds.length > 0))

  // Check if all required arguments have values
  const requiredArgsFilled = scriptArguments.length === 0 || 
    scriptArguments.every(arg => form.argumentValues?.find(v => v.name === arg.name)?.value)

  if (!script) return null

  return (
    <Container
      bodyProps={{ verticalOverflow: true, gutterBottom: true }}
      header={
        <Gutters top="sm" bottom="sm">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {sidebarHidden && (
              <IconButton
                name="bars"
                size="md"
                color="grayDarker"
                onClick={() => dispatch.ui.set({ sidebarMenu: true })}
              />
            )}
            {showClose && (
              <IconButton
                name="chevron-left"
                onClick={() => history.push(`/script/${fileID}`)}
                size="md"
                title="Close"
              />
            )}
            <Typography variant="h3">
              Run Script
            </Typography>
          </Box>
        </Gutters>
      }
    >
      <Box sx={{ p: 2 }}>
        {/* Device Selection */}
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Target Devices
        </Typography>
        <List disablePadding>
          <TagFilter
            form={form}
            name="Devices"
            selectDevices
            disableGutters
            onChange={f => setForm({ ...form, ...structuredClone(f) })}
            selectedIds={selectedIds}
            onSelectIds={() => {
              dispatch.ui.set({ scriptForm: form })
              history.push('/devices/select/scripts')
            }}
          />
        </List>

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
            <Divider sx={{ my: 3 }} />
            <ArgumentsValueForm
              arguments={scriptArguments}
              values={form.argumentValues ?? []}
              onChange={argumentValues => setForm({ ...form, argumentValues })}
              disabled={running}
            />
          </>
        )}

        {/* Run Buttons */}
        <Stack spacing={1} sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            disabled={!canRun || !requiredArgsFilled || running || fetching}
            onClick={handleRun}
          >
            {running ? 'Running...' : 'Run Script'}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            disabled={!canRun || !requiredArgsFilled || running || fetching}
            onClick={handlePrepare}
          >
            Prepare Run
          </Button>
        </Stack>
      </Box>
    </Container>
  )
}
