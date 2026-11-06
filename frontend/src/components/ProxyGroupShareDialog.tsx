import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import { State } from '../store'
import { selectContacts } from '../selectors/contacts'
import { selectOrganization } from '../selectors/organizations'
import { ProxyGroup, graphQLShareProxyGroup, graphQLUnshareProxyGroup, refusalOf } from '../services/graphQLProxyGroups'
import { IconButton } from '../buttons/IconButton'
import { ContactSelector } from './ContactSelector'
import { Avatar } from './Avatar'
import { Notice } from './Notice'

type Props = {
  group: ProxyGroup
  open: boolean
  onClose: () => void
  onChanged: () => void
}

/* Sharing one of the account's groups (graphql-api docs/PROXY-GROUPS.md §11, "Sharing an own group"): people, by email
   as a device is shared, may then send a device of theirs out through the group, whichever of its devices takes the
   traffic — nothing on those devices themselves. Those it is shared with now, each removable; the organization's members
   are not offered, as for a network: what they may use is their role's. A refusal is said in graphql's words. */
export const ProxyGroupShareDialog: React.FC<Props> = ({ group, open, onClose, onChanged }) => {
  const { t } = useTranslation()
  const contacts = useSelector((state: State) => {
    const organization = selectOrganization(state)
    return selectContacts(state).filter(c => !organization.members.some(m => m.user.id === c.id))
  })
  const [emails, setEmails] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const shares = group.access ?? []

  const done = async (result: Awaited<ReturnType<typeof graphQLShareProxyGroup>>) => {
    setBusy(false)
    const refused = refusalOf(result)
    if (refused !== undefined) return setRefusal(refused || t('proxyGroupShare.failed', 'It could not be changed.'))
    setRefusal(undefined)
    setEmails([])
    onChanged()
  }

  const share = async () => {
    setBusy(true)
    await done(await graphQLShareProxyGroup(group.label, emails))
  }

  const remove = async (email: string) => {
    setBusy(true)
    await done(await graphQLUnshareProxyGroup(group.label, [email]))
  }

  return (
    <Dialog open={open} maxWidth="sm" fullWidth onClose={onClose}>
      <DialogTitle>{t('proxyGroupShare.title', 'Share {{group}}', { group: group.name })}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {t(
            'proxyGroupShare.description',
            'Those you share it with can send a device of theirs out through it as its exit, whichever device in it takes the traffic. They get nothing on its devices themselves.'
          )}
        </Typography>
        <ContactSelector contacts={contacts} selected={emails} onSelect={setEmails} />
        {refusal && (
          <Notice severity="error" fullWidth>
            {refusal}
          </Notice>
        )}
        <List data-shares>
          {shares.map(({ user }) => (
            <ListItem
              key={user.id}
              data-share={user.email || user.id}
              secondaryAction={
                <IconButton
                  icon="trash"
                  title={t('proxyGroupShare.remove', 'Stop sharing with {{email}}', { email: user.email || user.id })}
                  disabled={busy || !user.email}
                  onClick={() => user.email && remove(user.email)}
                />
              }
            >
              <ListItemIcon>
                <Avatar email={user.email || ''} size={28} />
              </ListItemIcon>
              <ListItemText primary={user.email || user.id} />
            </ListItem>
          ))}
        </List>
        {!shares.length && (
          <Typography variant="body2" color="textSecondary">
            {t('proxyGroupShare.none', 'Shared with no one yet.')}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="primary" disabled={busy} onClick={onClose}>
          {t('common.close', 'Close')}
        </Button>
        <Button variant="contained" color="primary" disabled={busy || !emails.length} onClick={share}>
          {busy ? t('proxyGroupShare.sharing', 'Sharing...') : t('proxyGroupShare.share', 'Share')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
