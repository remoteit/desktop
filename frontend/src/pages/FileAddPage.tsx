import React, { useState, useCallback } from 'react'
import { State } from '../store'
import { Typography, Box, List, ListItem, TextField, Button, ButtonBase, Stack } from '@mui/material'
import { selectRole } from '../selectors/organizations'
import { initialForm } from '../models/files'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Body } from '../components/Body'
import { Dispatch } from '../store'
import { Icon } from '../components/Icon'
import { radius } from '../styling'

type Props = { center?: boolean }

export const FileAddPage: React.FC<Props> = ({ center }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const role = useSelector(selectRole)
  const manager = role.permissions.includes('MANAGE')
  
  const [form, setForm] = useState<IFileForm>({
    name: '',
    description: '',
    executable: false,
    tag: { operator: 'ALL', values: [] },
    deviceIds: [],
    access: 'NONE',
    fileId: '',
    script: '',
    argumentDefinitions: [],
    argumentValues: [],
  })
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = useCallback((files: File[]) => {
    if (files.length > 0) {
      const file = files[0]
      setUploadedFile(file)
      setForm(prev => ({ ...prev, name: file.name, file }))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!uploadedFile || !form.name) return

    const uploadForm = { ...form, executable: false }
    setLoading(true)
    const fileId = await dispatch.files.upload(uploadForm)
    setLoading(false)

    if (fileId) {
      history.push('/files')
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setForm(prev => ({ ...prev, name: '', file: undefined }))
  }

  if (!manager) {
    return (
      <Body center={center} inset gutterTop gutterBottom>
        <Typography variant="body2" color="error">
          You do not have permission to upload files
        </Typography>
      </Body>
    )
  }

  return (
    <Body center={center} inset gutterTop gutterBottom>
      <Box width="100%" maxWidth={600}>
        <Typography variant="h1" gutterBottom>
          Upload File
        </Typography>
        <form onSubmit={handleSubmit}>
          <List disablePadding>
            <ListItem disableGutters>
              <TextField
                required
                fullWidth
                label="Name"
                value={form.name}
                variant="filled"
                onChange={event => setForm({ ...form, name: event.target.value })}
              />
            </ListItem>
            <ListItem disableGutters>
              <TextField
                fullWidth
                multiline
                label="Description"
                value={form.description}
                variant="filled"
                onChange={event => setForm({ ...form, description: event.target.value })}
              />
            </ListItem>
            <ListItem disableGutters sx={{ mt: 2 }}>
              <Stack width="100%">
                {!uploadedFile ? (
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
                      padding: 4,
                      borderRadius: `${radius.sm}px`,
                      minHeight: 120,
                      '&:hover': { backgroundColor: 'primaryHighlight.main', borderColor: 'primaryHighlight.main' },
                    }}
                  >
                    <input {...getInputProps()} />
                    <Icon name="cloud-upload" size="xl" color="grayDark" />
                    <Typography variant="body2" sx={{ mt: 1 }}>Upload File</Typography>
                    <Typography variant="caption">Drag and drop or click</Typography>
                  </ButtonBase>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid',
                      borderColor: 'grayLighter.main',
                      backgroundColor: 'grayLightest.main',
                      padding: 2,
                      borderRadius: `${radius.sm}px`,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Icon name="file" size="md" color="grayDark" />
                      <Box>
                        <Typography variant="body2">{uploadedFile.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                    </Stack>
                    <Button size="small" onClick={clearFile}>
                      Change
                    </Button>
                  </Box>
                )}
              </Stack>
            </ListItem>
          </List>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!uploadedFile || !form.name || loading}
            fullWidth
            sx={{ mt: 2 }}
          >
            {loading ? 'Uploading...' : 'Upload File'}
          </Button>
        </form>
      </Box>
    </Body>
  )
}
