import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import type { ProxyGroup } from '../services/graphQLProxyGroups'
import { deletingLine, groupUse, keepingLines } from '../helpers/proxyGroupHelper'

type Props = {
  open: boolean
  group: ProxyGroup
  device: string // the device's name
  action: 'proxy' | 'exit' // what is being turned off: its being a proxy, or its offering itself as an exit
  busy?: boolean
  onKeep: () => void
  onDelete: () => void
  onCancel: () => void
}

/* Taking away the last device in its group (graphql-api docs/PROXY-GROUPS.md §11, "Who may use an own group, and empty
   groups"): the group stays by default — its endpoints and the devices using it as their exit with it — for another
   device to be added to it; or it is deleted too. Names the group, and says what each choice does to what it has. */
export const LastInGroupDialog: React.FC<Props> = ({
  open,
  group,
  device,
  action,
  busy,
  onKeep,
  onDelete,
  onCancel,
}) => {
  const { t } = useTranslation()
  return (
    <Dialog open={open} maxWidth="sm" fullWidth onClose={onCancel}>
      <DialogTitle>
        {action === 'proxy'
          ? t('lastInGroup.titleProxy', 'Stop using {{device}} as a proxy?', { device })
          : t('lastInGroup.titleExit', 'Stop offering {{device}} as an exit node?', { device })}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          {t('lastInGroup.last', 'It is the last device in its group, {{group}}.', { group: group.name })}{' '}
          {groupUse(t, group)}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {keepingLines(t, group).join(' ')}
        </Typography>
        <Typography variant="body2">{deletingLine(t, group)}</Typography>
      </DialogContent>
      <DialogActions>
        <Button color="primary" disabled={busy} onClick={onCancel}>
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button color="error" disabled={busy} onClick={onDelete}>
          {t('lastInGroup.delete', 'Delete the group too')}
        </Button>
        <Button autoFocus variant="contained" color="primary" disabled={busy} onClick={onKeep}>
          {t('lastInGroup.keep', 'Keep the group')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
