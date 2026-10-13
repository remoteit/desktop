import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { List, ListItem, ListItemText, Typography } from '@mui/material'
import { Dispatch } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { deleteFileVersion, fetchFileVersions, FileVersionEntry } from '../services/fileStorage'
import { formatBytes } from '../helpers/usageHelper'
import { DeleteButton } from '../buttons/DeleteButton'
import { Timestamp } from './Timestamp'
import { Notice } from './Notice'

/* A file's versions, newest first, each with what it stores — every one counts against the account's storage — and,
   for one who may, a delete for each old version, freeing its bytes at once (graphql deleteFileVersion). The newest
   is the file itself: deleting the file deletes it. Nothing where the API does not say what versions store. */
export const FileVersions: React.FC<{ fileId: string; canDelete?: boolean }> = ({ fileId, canDelete }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const accountId = useSelector(selectActiveAccountId)
  const [versions, setVersions] = useState<FileVersionEntry[] | null>()

  const load = useCallback(async () => {
    const result = await fetchFileVersions(accountId, fileId)
    setVersions(Array.isArray(result) ? result : null)
  }, [accountId, fileId])

  useEffect(() => {
    load()
  }, [load])

  if (!versions?.length || versions.every(version => version.size === null)) return null

  const total = versions.reduce((sum, version) => sum + (version.size ?? 0), 0)

  return (
    <List data-testid="file-versions" sx={{ maxWidth: 600, marginTop: 3 }} disablePadding>
      <Typography variant="subtitle1">
        {t('fileVersions.title', 'Versions')}
        <Typography variant="caption" color="grayDark.main" marginLeft={1}>
          {t('fileVersions.total', '{{size}} stored in all', { size: formatBytes(total) })}
        </Typography>
      </Typography>
      {versions.length > 1 && (
        <Notice gutterBottom fullWidth>
          {t('fileVersions.hint', 'Every version counts against your storage. Delete old versions you no longer need to free space.')}
        </Notice>
      )}
      {versions.map((version, index) => (
        <ListItem
          key={version.id}
          data-testid="file-version"
          disableGutters
          secondaryAction={
            canDelete &&
            index > 0 && (
              <DeleteButton
                title={t('fileVersions.delete', 'Delete version {{version}}', { version: version.version })}
                warning={
                  <Notice severity="error" fullWidth>
                    {t('fileVersions.deleteWarning', 'Deletes version {{version}}, freeing {{size}}. This can not be undone.', {
                      version: version.version,
                      size: formatBytes(version.size ?? 0),
                    })}
                  </Notice>
                }
                onDelete={async () => {
                  if (await deleteFileVersion(version.id)) {
                    await load()
                    await dispatch.files.fetchSingle({ fileId })
                  }
                }}
              />
            )
          }
        >
          <ListItemText
            primary={
              index === 0
                ? t('fileVersions.latest', 'Version {{version}} (latest)', { version: version.version })
                : t('fileVersions.version', 'Version {{version}}', { version: version.version })
            }
            secondary={
              <>
                {version.size !== null && `${formatBytes(version.size)} · `}
                <Timestamp date={new Date(version.created)} />
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  )
}
