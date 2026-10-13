import React from 'react'
import { Box, Button, Typography } from '@mui/material'
import { FileMetadataForm } from './FileMetadataForm'
import { FileUploadProgress } from './FileUploadProgress'
import { Notice } from './Notice'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { selectActiveAccountId } from '../selectors/accounts'
import { useFileStorage } from '../hooks/useFileStorage'
import { uploadRefusal } from '../services/fileStorage'

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
  const { t } = useTranslation()
  // The file chosen is checked against the account's storage before anything is sent: past the largest file, or past
  // what the quota has left, it is refused here as the API would refuse it.
  const storage = useFileStorage(useSelector(selectActiveAccountId))
  const refusal = uploadedFile ? uploadRefusal(t, storage, uploadedFile.size) : undefined
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
        {refusal && (
          <Notice severity="error" fullWidth gutterTop>
            <span data-testid="upload-refusal">{refusal}</span>
          </Notice>
        )}
        {showAction && (
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={actionDisabled || !!refusal}
            fullWidth
            sx={{ mt: 3 }}
          >
            {actionLoading ? actionLoadingLabel || `${actionLabel}...` : actionLabel}
          </Button>
        )}
        {showAction && actionLoading && <FileUploadProgress gutterTop />}
      </form>
    </Box>
  )
}
