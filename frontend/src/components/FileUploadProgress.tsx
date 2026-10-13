import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, LinearProgress, Typography } from '@mui/material'
import { Dispatch, State } from '../store'
import { radius } from '../styling'

// The file upload in progress, if any: hashing then sending, with a way to stop it.
export const FileUploadProgress: React.FC<{ gutterTop?: boolean }> = ({ gutterTop }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const upload = useSelector((state: State) => state.ui.fileUpload)

  if (!upload) return null

  const measured = upload.percent !== undefined
  const label =
    upload.phase === 'hashing'
      ? t('fileUploadProgress.hashing', 'Checking file')
      : t('fileUploadProgress.uploading', 'Uploading')

  return (
    <Box sx={{ marginTop: gutterTop ? 2 : 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="grayDarkest.main">
          {measured ? `${label} ${upload.percent}%` : label}
        </Typography>
        {measured && (
          <Button size="small" onClick={() => dispatch.files.cancelUpload()}>
            {t('common.cancel', 'Cancel')}
          </Button>
        )}
      </Box>
      <LinearProgress
        variant={measured ? 'determinate' : 'indeterminate'}
        value={upload.percent}
        sx={{ borderRadius: `${radius.sm}px`, height: 6, marginY: 0.5 }}
      />
    </Box>
  )
}
