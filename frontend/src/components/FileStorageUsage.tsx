import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, BoxProps, LinearProgress, List, ListItem, ListItemIcon, Typography } from '@mui/material'
import { useFileStorage } from '../hooks/useFileStorage'
import { FileStorage, storageLevel } from '../services/fileStorage'
import { formatBytes } from '../helpers/usageHelper'
import { spacing } from '../styling'

/* The account's file storage against its quota (graphql Account.fileStorage): "1.2 GB of 2 GB used", a bar, and near
   or at the quota a warning of what to do. Every stored version counts, old ones included. Nothing where the API has
   no storage to show. */
export const FileStorageUsage: React.FC<{ accountId?: string; label?: boolean; sx?: BoxProps['sx'] }> = ({
  accountId,
  ...props
}) => {
  const storage = useFileStorage(accountId)
  return storage ? <FileStorageBar storage={storage} {...props} /> : null
}

// The account's plan and usage (the License pages): a "File storage" line with the limits above it.
export const FileStorageLimit: React.FC<{ accountId?: string }> = ({ accountId }) => {
  const storage = useFileStorage(accountId)
  if (!storage) return null
  return (
    <List sx={{ maxWidth: 500 }} disablePadding>
      <ListItem>
        <ListItemIcon />
        <FileStorageBar storage={storage} label sx={{ marginBottom: 3 }} />
      </ListItem>
    </List>
  )
}

export const FileStorageBar: React.FC<{ storage: FileStorage; label?: boolean; sx?: BoxProps['sx'] }> = ({
  storage,
  label,
  sx,
}) => {
  const { t } = useTranslation()

  const level = storageLevel(storage)
  const percent = storage.quota ? Math.min(100, (storage.used / storage.quota) * 100) : 0
  const color = level === 'full' ? 'error' : level === 'near' ? 'warning' : 'primary'

  return (
    <Box data-testid="file-storage-usage" width="100%" maxWidth={500} sx={sx}>
      <Typography variant="caption" component="p">
        {label && <b>{t('fileStorage.label', 'File storage')}: </b>}
        {t('fileStorage.used', '{{used}} of {{quota}} used', {
          used: formatBytes(storage.used),
          quota: formatBytes(storage.quota),
        })}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={percent}
        color={color}
        sx={theme => ({
          height: `${spacing.xs}px`,
          borderRadius: `${spacing.xxs}px`,
          marginTop: `${spacing.xxs}px`,
          backgroundColor: theme.palette.grayLighter.main,
        })}
      />
      {level !== 'ok' && (
        <Typography variant="caption" component="p" color={`${color}.main`} marginTop={0.5}>
          {level === 'full'
            ? t('fileStorage.full', 'Storage is full. Delete files or old versions of files to upload more.')
            : t('fileStorage.near', 'Storage is nearly full. Delete files or old versions of files you no longer need.')}
        </Typography>
      )}
    </Box>
  )
}
