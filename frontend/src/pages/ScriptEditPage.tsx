import React, { useState, useEffect } from 'react'
import sleep from '../helpers/sleep'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, List, ListItem, TextField, Button, Stack, Box } from '@mui/material'
import { State, Dispatch } from '../store'
import { selectScript } from '../selectors/scripting'
import { selectRole } from '../selectors/organizations'
import { initialForm } from '../models/files'
import { ArgumentDefinitionForm } from '../components/ArgumentDefinitionForm'
import { FileUpload } from '../components/FileUpload'
import { ScriptDeleteButton } from '../components/ScriptDeleteButton'
import { Container } from '../components/Container'
import { Title } from '../components/Title'

type Props = {
  isNew?: boolean
}

export const ScriptEditPage: React.FC<Props> = ({ isNew }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { fileID } = useParams<{ fileID?: string }>()

  const role = useSelector(selectRole)
  const manager = role.permissions.includes('MANAGE')
  const script = useSelector((state: State) => (fileID ? selectScript(state, undefined, fileID) : undefined))
  const scriptFormFromState = useSelector((state: State) => state.ui.scriptForm)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<IFileForm | undefined>()
  const [defaultEditForm, setDefaultEditForm] = useState<IFileForm | undefined>()

  // Initialize edit form — new script
  useEffect(() => {
    if (!isNew || editForm) return
    const setupForm: IFileForm = {
      ...role,
      ...initialForm,
      ...scriptFormFromState,
    }
    setDefaultEditForm(setupForm)
    setEditForm(setupForm)
  }, [isNew])

  // Initialize edit form — existing script
  useEffect(() => {
    if (isNew || !script) return
    const serverArguments = script?.versions?.[0]?.arguments || []
    const existingDefinitions: IArgumentDefinition[] = serverArguments.map(arg => ({
      name: arg.name,
      type: arg.argumentType,
      desc: arg.desc || '',
      options: arg.options?.length ? arg.options : undefined,
    }))
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

  const uploadScript = async (): Promise<string | undefined> => {
    if (!editForm) return undefined
    editForm.file = new File([editForm.script ?? ''], editForm.name, { type: editForm.file?.type ?? 'text/plain' })
    return await dispatch.files.upload(editForm)
  }

  const handleSave = async () => {
    if (!editForm) return
    setSaving(true)

    if (isNew) {
      const fileId = await uploadScript()
      dispatch.ui.set({ selected: [], scriptForm: undefined })
      if (fileId) history.push(`/script/${fileId}/edit`)
    } else if (script) {
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

  const handleSaveAndRun = async () => {
    if (!isNew || !editForm) return
    setSaving(true)
    const fileId = await uploadScript()
    dispatch.ui.set({ selected: [], scriptForm: undefined })
    setSaving(false)
    if (fileId) history.push(`/script/${fileId}/run`)
  }

  const handleNext = () => {
    if (!editForm) return
    dispatch.ui.set({ scriptForm: { ...editForm } })
    if (isNew) {
      history.push('/scripts/add/run')
    } else {
      history.push(`/script/${fileID}/run`)
    }
  }

  // Derived state
  const hasEditChanges = isNew
    ? !!(editForm?.name && editForm?.script)
    : editForm &&
      defaultEditForm &&
      (editForm.script !== defaultEditForm.script ||
        editForm.description !== defaultEditForm.description ||
        editForm.name !== defaultEditForm.name ||
        JSON.stringify(editForm.argumentDefinitions) !== JSON.stringify(defaultEditForm.argumentDefinitions))

  const canNext = isNew ? !!(editForm?.name && editForm?.script) : true

  if (!isNew && !script) return null

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ inset: true, verticalOverflow: true, gutterBottom: true }}
      header={
        <Typography variant="h1">
          <Box sx={{ flex: 1 }}>{isNew ? 'Add Script' : script?.name}</Box>
          {!isNew && <ScriptDeleteButton />}
        </Typography>
      }
    >
      <Stack direction="row" alignItems="center" gap={1} mt={2} mb={1}>
        <Typography variant="subtitle2">
          <Title>Edit Script</Title>
        </Typography>
      </Stack>

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
            <ListItem disableGutters sx={{ marginBottom: 3 }}>
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

      <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
        {manager && (
          <>
            <Button color="primary" disabled={!hasEditChanges || saving || loading} onClick={handleSave}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            {isNew && (
              <Button
                variant="contained"
                color="primary"
                disabled={!canNext || saving || loading}
                onClick={handleSaveAndRun}
                sx={{ ml: 'auto' }}
              >
                {saving ? 'Saving...' : 'Save and Run'}
              </Button>
            )}
          </>
        )}
        {!isNew && (
          <Button
            variant="contained"
            color="primary"
            disabled={!canNext || loading}
            onClick={handleNext}
            sx={{ ml: 'auto' }}
          >
            New Run
          </Button>
        )}
      </Stack>

      {!isNew && hasEditChanges && (
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
          Unsaved changes won't affect the run — it uses the last saved version.
        </Typography>
      )}
    </Container>
  )
}
