import React, { useState, useEffect } from 'react'
import sleep from '../helpers/sleep'
import { useParams, useHistory, Redirect, Link as RouterLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, List, ListItem, TextField, Button, Stack, Box, useMediaQuery } from '@mui/material'
import { State, Dispatch } from '../store'
import { HIDE_SIDEBAR_WIDTH } from '../constants'
import { selectScript } from '../selectors/scripting'
import { selectRole } from '../selectors/organizations'
import { initialForm } from '../models/files'
import { ArgumentDefinitionForm } from '../components/ArgumentDefinitionForm'
import { FileUpload } from '../components/FileUpload'
import { Container } from '../components/Container'
import { IconButton } from '../buttons/IconButton'
import { Gutters } from '../components/Gutters'

type Props = {
  showBack?: boolean
}

export const ScriptDetailPage: React.FC<Props> = ({ showBack }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { fileID, jobID } = useParams<{ fileID: string; jobID?: string }>()
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)

  const role = useSelector(selectRole)
  const manager = role.permissions.includes('MANAGE')
  const script = useSelector((state: State) => selectScript(state, undefined, fileID))
  const fetching = useSelector((state: State) => state.files.fetching)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<IFileForm | undefined>()
  const [defaultForm, setDefaultForm] = useState<IFileForm | undefined>()

  // Get existing arguments from the script's latest file version
  const scriptArguments = script?.versions?.[0]?.arguments || []
  const existingDefinitions: IArgumentDefinition[] = scriptArguments.map(arg => ({
    name: arg.name,
    type: arg.argumentType,
    desc: arg.desc || '',
    options: arg.options?.length ? arg.options : undefined,
  }))

  // Initialize form
  useEffect(() => {
    if (!script) return
    const setupForm: IFileForm = {
      ...role,
      ...initialForm,
      fileId: script.id,
      name: script.name,
      description: script.shortDesc || '',
      executable: script.executable,
      argumentDefinitions: existingDefinitions.length ? existingDefinitions : [],
    }
    setDefaultForm(setupForm)
    setForm(setupForm)
  }, [fileID, script?.id])

  // Download script content
  useEffect(() => {
    if (loading || !script || !form || !defaultForm || defaultForm.script) return
    const download = async () => {
      setLoading(true)
      const fileVersionId = script.versions[0]?.id
      if (fileVersionId) {
        const result = await dispatch.files.download(fileVersionId)
        setDefaultForm(prev => prev ? { ...prev, script: result } : prev)
        setForm(prev => prev ? { ...prev, script: result } : prev)
      }
      await sleep(200)
      setLoading(false)
    }
    download()
  }, [script, form, defaultForm])

  const handleSave = async () => {
    if (!form || !script) return
    setSaving(true)

    const metadataChanged = form.name !== defaultForm?.name || form.description !== defaultForm?.description
    const contentChanged = form.script !== defaultForm?.script || 
      JSON.stringify(form.argumentDefinitions) !== JSON.stringify(defaultForm?.argumentDefinitions)

    if (manager) {
      if (contentChanged) {
        // Script content or arguments changed - upload new version (includes metadata)
        form.file = new File([form.script ?? ''], form.name, { type: 'text/plain' })
        await dispatch.files.upload(form)
      } else if (metadataChanged) {
        // Only metadata changed - use updateMetadata mutation (no new version)
        await dispatch.files.updateMetadata({
          fileId: script.id,
          name: form.name,
          shortDesc: form.description,
        })
      }
    }

    setSaving(false)
    // Update default form to reflect saved state
    setDefaultForm(form)
  }

  const hasChanges = form && defaultForm && (
    form.script !== defaultForm.script ||
    form.description !== defaultForm.description ||
    form.name !== defaultForm.name ||
    JSON.stringify(form.argumentDefinitions) !== JSON.stringify(defaultForm.argumentDefinitions)
  )

  if (!script) {
    return <Redirect to={`/script/${fileID}`} />
  }

  if (!form) return null

  return (
    <Container
      bodyProps={{ verticalOverflow: true, gutterBottom: true }}
      header={
        <Gutters top="sm" bottom="sm">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {sidebarHidden && (
              <IconButton
                name="bars"
                size="md"
                color="grayDarker"
                onClick={() => dispatch.ui.set({ sidebarMenu: true })}
              />
            )}
            <IconButton
              name="chevron-left"
              onClick={() => history.push(`/script/${fileID}`)}
              size="md"
              title="Back"
            />
            <Typography variant="h2" sx={{ flex: 1 }}>
              {script.name}
            </Typography>
            {manager && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                disabled={!hasChanges || saving || loading}
                onClick={handleSave}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </Box>
        </Gutters>
      }
    >
      <Box sx={{ p: 2 }}>
        <List disablePadding>
          <ListItem disableGutters>
            <TextField
              required
              fullWidth
              label="Name"
              disabled={!manager}
              value={form.name}
              variant="filled"
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </ListItem>
          <ListItem disableGutters>
            <TextField
              multiline
              fullWidth
              disabled={!manager}
              label="Description"
              value={form.description}
              variant="filled"
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </ListItem>
          {manager && (
            <ListItem disableGutters sx={{ display: 'block', mt: 2 }}>
              <ArgumentDefinitionForm
                definitions={form.argumentDefinitions ?? []}
                onChange={argumentDefinitions => setForm({ ...form, argumentDefinitions })}
                disabled={loading || saving}
              />
            </ListItem>
          )}
          <ListItem disableGutters sx={{ mt: 2 }}>
            <FileUpload
              disabled={!manager}
              script={form.script}
              loading={loading}
              onChange={(script, file) => setForm({ ...form, script, ...(file && { name: file.name, file }) })}
            />
          </ListItem>
        </List>
      </Box>
    </Container>
  )
}
