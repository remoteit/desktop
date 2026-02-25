import React from 'react'
import { List, ListItem, TextField, Typography } from '@mui/material'
import { FileUpload } from './FileUpload'

type Props = {
  form: { name: string; description: string }
  disabled?: boolean
  requiredName?: boolean
  showUpload?: boolean
  uploadLabel?: string
  uploadedFile?: File | null
  onFormChange: (changes: { name?: string; description?: string }) => void
  onUploadedFileChange?: (file: File | undefined) => void
}

export const FileMetadataForm: React.FC<Props> = ({
  form,
  disabled,
  requiredName = true,
  showUpload = true,
  uploadLabel = 'Upload File',
  uploadedFile = null,
  onFormChange,
  onUploadedFileChange,
}) => {
  return (
    <List disablePadding>
      <ListItem disableGutters>
        <TextField
          required={requiredName}
          fullWidth
          label="Name"
          disabled={disabled}
          value={form.name}
          variant="filled"
          onChange={event => onFormChange({ name: event.target.value })}
        />
      </ListItem>
      <ListItem disableGutters>
        <TextField
          fullWidth
          multiline
          label="Description"
          disabled={disabled}
          value={form.description}
          variant="filled"
          onChange={event => onFormChange({ description: event.target.value })}
        />
      </ListItem>
      {showUpload && (
        <ListItem disableGutters sx={{ mt: 2, display: 'block' }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            {uploadLabel}
          </Typography>
          <FileUpload mode="file" label={uploadLabel} value={uploadedFile} onChange={onUploadedFileChange || (() => {})} />
        </ListItem>
      )}
    </List>
  )
}
