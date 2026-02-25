import React from 'react'
import { Box, Button, Typography } from '@mui/material'
import { FileMetadataForm } from './FileMetadataForm'

type Props = {
  title: string
  titleAction?: React.ReactNode
  form: { name: string; description: string }
  disabled?: boolean
  showUpload?: boolean
  uploadLabel?: string
  uploadedFile?: File | null
  onFormChange: (changes: { name?: string; description?: string }) => void
  onUploadedFileChange?: (file: File | undefined) => void
  actionLabel: string
  actionLoadingLabel?: string
  showAction?: boolean
  actionDisabled?: boolean
  actionLoading?: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export const FileEditorForm: React.FC<Props> = ({
  title,
  titleAction,
  form,
  disabled,
  showUpload = true,
  uploadLabel = 'Upload File',
  uploadedFile = null,
  onFormChange,
  onUploadedFileChange,
  actionLabel,
  actionLoadingLabel,
  showAction = true,
  actionDisabled,
  actionLoading,
  onSubmit,
}) => {
  return (
    <Box width="100%" maxWidth={600}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h1">{title}</Typography>
        {titleAction}
      </Box>
      <form onSubmit={onSubmit}>
        <FileMetadataForm
          form={form}
          disabled={disabled}
          showUpload={showUpload}
          uploadLabel={uploadLabel}
          uploadedFile={uploadedFile}
          onFormChange={onFormChange}
          onUploadedFileChange={onUploadedFileChange}
        />
        {showAction && (
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={actionDisabled}
            fullWidth
            sx={{ mt: 3 }}
          >
            {actionLoading ? actionLoadingLabel || `${actionLabel}...` : actionLabel}
          </Button>
        )}
      </form>
    </Box>
  )
}
