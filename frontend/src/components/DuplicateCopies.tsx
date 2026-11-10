import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Link, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import { Dispatch, State } from '../store'
import { DuplicateCopy, requestDuplicateCopies } from '../services/deviceIdentity'
import { useDeviceIdentity } from '../hooks/useDeviceIdentity'
import { disabledWhen, useDecommissionRule } from '../hooks/useDeviceDisable'
import { DecommissionDialog } from './DecommissionDialog'
import { Confirm } from './Confirm'
import { Notice } from './Notice'
import { Icon } from './Icon'

type Props = {
  original: Pick<IDevice, 'id' | 'name'>
  copies: DuplicateCopy[]
  accountId: string
  // A row under the original in the devices list, or a notice on the original's page.
  variant?: 'row' | 'notice'
}

/* "N copies of X" (graphql-api docs/PROXY-GROUPS.md §11, "Duplicate devices"): the copies split off a device's identity,
   disabled until their owner decides, grouped under the device — with Keep all, each a new device starting from X's
   setup (so cloning one image onto many machines provisions them), and Remove all, decommissioning them. Each copy
   opens to its own page, where its choices are. */
export const DuplicateCopies: React.FC<Props> = ({ original, copies, accountId, variant = 'row' }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const served = useDeviceIdentity()
  const canDecommission = useDecommissionRule()
  const destroying = useSelector((state: State) => state.ui.destroying)
  const [open, setOpen] = useState(variant === 'notice')
  const [keeping, setKeeping] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [reason, setReason] = useState<string>()

  if (!copies.length) return null

  const count = copies.length
  const keepServed = count === 1 ? served?.keepDuplicate : served?.keepDuplicates
  const keepable = !!keepServed && copies.every(copy => copy.permissions.includes('MANAGE'))
  const removable = copies.every(copy => canDecommission({ disabled: true, owner: copy.owner }))

  const keepAll = async () => {
    setKeeping(false)
    setReason(undefined)
    const refused = await dispatch.devices.keepDuplicates({ ids: copies.map(copy => copy.id) })
    if (refused !== undefined) setReason(refused || t('duplicateCopies.notKept', 'The copies could not be kept.'))
  }

  const title = t('duplicateCopies.title', {
    count,
    name: original.name,
    defaultValue_one: '{{count}} copy of {{name}}',
    defaultValue_other: '{{count}} copies of {{name}}',
  })

  const actions = (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
      {keepable && (
        <Button size="small" variant="contained" color="warning" disabled={destroying} onClick={() => setKeeping(true)}>
          {t('duplicateCopies.keepAll', 'Keep all')}
        </Button>
      )}
      {removable && (
        <Button size="small" color="error" disabled={destroying} onClick={() => setRemoving(true)}>
          {t('duplicateCopies.removeAll', 'Remove all…')}
        </Button>
      )}
    </Stack>
  )

  const list = open && (
    <List dense disablePadding data-duplicate-copies={original.id}>
      {copies.map(copy => {
        const when = disabledWhen(copy.disabledAt)
        return (
          <ListItem key={copy.id} disableGutters sx={{ paddingY: 0 }}>
            <ListItemText
              primary={
                <Link component={RouterLink} to={`/devices/${copy.id}`}>
                  {copy.name}
                </Link>
              }
              secondary={when && t('duplicateCopies.splitOff', { when, defaultValue: 'Split off {{when}}' })}
            />
          </ListItem>
        )
      })}
    </List>
  )

  const toggle = (
    <Link
      component="button"
      variant="body2"
      underline="hover"
      color="inherit"
      onClick={() => setOpen(!open)}
      sx={{ textAlign: 'left', fontWeight: 500 }}
    >
      <Icon name="clone" inlineLeft />
      {title}
      <Icon name={open ? 'angle-up' : 'angle-down'} inline />
    </Link>
  )

  const dialogs = (
    <>
      <Confirm
        open={keeping}
        title={t('duplicateCopies.keepTitle', {
          count,
          defaultValue_one: 'Keep the copy as a new device?',
          defaultValue_other: 'Keep {{count}} copies as new devices?',
        })}
        action={t('duplicateCopies.keepAction', 'Keep All')}
        maxWidth="sm"
        onConfirm={keepAll}
        onDeny={() => setKeeping(false)}
      >
        <Typography variant="body2">
          {t('duplicateCopies.keepBody', {
            name: original.name,
            defaultValue:
              'Each becomes a device of its own: enabled, starting from the setup of {{name}} — its services, tags and product — and taking a licence. {{name}} is unchanged.',
          })}
        </Typography>
      </Confirm>
      <DecommissionDialog
        open={removing}
        devices={copies}
        onClose={() => setRemoving(false)}
        onDone={() => requestDuplicateCopies(accountId, true)}
      />
    </>
  )

  if (variant === 'notice')
    return (
      <>
        <Notice severity="warning" gutterTop button={actions}>
          {toggle}
          <em>
            {t('duplicateCopies.notice', {
              name: original.name,
              defaultValue:
                'Machines that signed in as {{name}} while it was online, split off as devices of their own. They are disabled — no access, no licence — until you keep or remove them.',
            })}
          </em>
          {reason && <em data-refusal>{reason}</em>}
          {list}
        </Notice>
        {dialogs}
      </>
    )

  return (
    <ListItem
      data-duplicate-group={original.id}
      sx={{ display: 'block', paddingLeft: 7, paddingRight: 2, paddingY: 0.5, color: 'warning.main' }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ position: 'sticky', left: 0, maxWidth: '100vw' }}>
        {toggle}
        {actions}
      </Stack>
      {reason && (
        <Typography variant="caption" color="error" component="p" data-refusal>
          {reason}
        </Typography>
      )}
      <Box sx={{ paddingLeft: 3 }}>{list}</Box>
      {dialogs}
    </ListItem>
  )
}
