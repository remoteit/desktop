import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useHistory, Redirect } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, List, ListItem, TextField, Box, Divider, Button, ButtonBase, useMediaQuery } from '@mui/material'
import { useDropzone } from 'react-dropzone'
import { State, Dispatch } from '../store'
import { HIDE_SIDEBAR_WIDTH } from '../constants'
import { selectFile } from '../selectors/scripting'
import { selectRole } from '../selectors/organizations'
import { initialForm } from '../models/files'
import { FileDeleteButton } from '../components/FileDeleteButton'
import { Container } from '../components/Container'
import { IconButton } from '../buttons/IconButton'
import { Gutters } from '../components/Gutters'
import { Icon } from '../components/Icon'
import { radius } from '../styling'

export const FileDetailPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { fileID } = useParams<{ fileID: string }>()
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)

  const role = useSelector(selectRole)
  const manager = role.permissions.includes('MANAGE')
  const file = useSelector((state: State) => selectFile(state, undefined, fileID))
  const fetching = useSelector((state: State) => state.files.fetching)

  const [form, setForm] = useState<IFileForm | undefined>()
  const [defaultForm, setDefaultForm] = useState<IFileForm | undefined>()
  const [saving, setSaving] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | undefined>()

  // Initialize form
  useEffect(() => {
    if (!file) return
    const setupForm: IFileForm = {
      ...role,
      ...initialForm,
      fileId: file.id,
      name: file.name,
      description: file.shortDesc || '',
      executable: false, // Non-executable files
    }
    setDefaultForm(setupForm)
    setForm(setupForm)
    setUploadedFile(undefined)
  }, [fileID, file?.id])

  const onDrop = useCallback((files: File[]) => {
    if (files.length > 0) {
      const droppedFile = files[0]
      setUploadedFile(droppedFile)
      // Update form name to match new file if name hasn't been changed
      if (form && form.name === defaultForm?.name) {
        setForm(prev => prev ? { ...prev, name: droppedFile.name } : prev)
      }
    }
  }, [form, defaultForm])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const handleSave = async () => {
    if (!form || !file) return
    setSaving(true)

    const metadataChanged = form.name !== defaultForm?.name || form.description !== defaultForm?.description

    if (uploadedFile) {
      // New file uploaded - upload new version (includes metadata)
      const uploadForm: IFileForm = {
        ...form,
        executable: false,
        file: uploadedFile,
      }
      await dispatch.files.upload(uploadForm)
      setUploadedFile(undefined)
    } else if (metadataChanged) {
      // Only metadata changed - use updateMetadata mutation (no new version)
      await dispatch.files.updateMetadata({
        fileId: file.id,
        name: form.name,
        shortDesc: form.description,
      })
    }

    setSaving(false)
    setDefaultForm(form)
  }

  // Can save when there's a new file or metadata has changed
  const metadataChanged = form && defaultForm && (form.name !== defaultForm.name || form.description !== defaultForm.description)
  const canSave = form && (!!uploadedFile || metadataChanged)

  if (!file) {
    return <Redirect to="/files" />
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
              onClick={() => history.push('/files')}
              size="md"
              title="Back to Files"
            />
            <Typography variant="h2" sx={{ flex: 1 }}>
              {file.name}
            </Typography>
            {manager && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                disabled={!canSave || saving || fetching}
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
              fullWidth
              label="Description"
              disabled={!manager}
              value={form.description}
              variant="filled"
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </ListItem>
        </List>

        {manager && (
          <>
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Upload New Version
            </Typography>
            
            <ButtonBase
              {...getRootProps()}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dotted',
                borderColor: isDragActive ? 'primary.main' : 'grayLightest.main',
                backgroundColor: 'grayLightest.main',
                padding: 2,
                borderRadius: `${radius.sm}px`,
                width: '100%',
                minHeight: 80,
                '&:hover': { backgroundColor: 'primaryHighlight.main', borderColor: 'primaryHighlight.main' },
              }}
            >
              <input {...getInputProps()} />
              {uploadedFile ? (
                <>
                  <Icon name="file" size="md" color="primary" />
                  <Typography variant="body2" sx={{ mt: 1 }}>{uploadedFile.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {(uploadedFile.size / 1024).toFixed(1)} KB - Click or drag to replace
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="body2">Upload</Typography>
                  <Typography variant="caption" color="textSecondary">Drag and drop or click</Typography>
                </>
              )}
            </ButtonBase>
          </>
        )}

        <Divider sx={{ my: 3 }} />

        <FileDeleteButton />
      </Box>
    </Container>
  )
}
