import React, { useState } from 'react'
import { State } from '../store'
import { Typography, Box, List, ListItem, TextField, Button } from '@mui/material'
import { selectRole } from '../selectors/organizations'
import { initialForm } from '../models/files'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Body } from '../components/Body'
import { Dispatch } from '../store'
import { FileUpload } from '../components/FileUpload'

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
              <FileUpload
                mode="file"
                label="Upload File"
                value={uploadedFile}
                onChange={file => {
                  if (!file) {
                    clearFile()
                    return
                  }
                  setUploadedFile(file)
                  setForm(prev => ({ ...prev, name: file.name, file }))
                }}
              />
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
