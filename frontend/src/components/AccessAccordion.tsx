import React, { useContext } from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { DeviceContext } from '../services/Context'
import { selectSessionUsers } from '../selectors/sessions'
import { Chip, Box, Typography } from '@mui/material'
import { selectMembersWithAccess } from '../selectors/organizations'
import { AccordionMenuItem } from './AccordionMenuItem'
import { ListItemLocation } from './ListItemLocation'
import { ShareButton } from '../buttons/ShareButton'
import { Icon } from './Icon'

type Props = {
  expanded: boolean
  onClick: () => void
}

export const AccessAccordion: React.FC<Props> = ({ expanded, onClick }) => {
  const { service, instance } = useContext(DeviceContext)
  const connected = useSelector((state: State) =>
    selectSessionUsers(state, undefined, service ? service.id : instance?.id)
  ).length
  const access = useSelector((state: State) => selectMembersWithAccess(state, undefined, instance)).map(m => m.user)
  const guests = (service ? service.access : instance?.access) || []
  const members = access.filter(user => !guests.find(_u => _u.email === user.email))
  const total = guests.length + members.length

  if (!instance?.permissions.includes('MANAGE')) return null

  return (
    <AccordionMenuItem
      gutters
      subtitle="Access"
      expanded={expanded}
      onClick={onClick}
      disabled={!total}
      elevation={0}
      action={
        <Box display="flex" alignItems="center">
          {!total && <Typography variant="caption">No&nbsp;users</Typography>}
          {!!connected && <Chip size="small" color="primary" label={connected} sx={{ marginLeft: 2 }} />} &nbsp;
          {!!total && !expanded && <Chip size="small" label={total} />}
          <ShareButton to="share" icon="plus" size="base" title="Add access" buttonBaseSize="small" inline fixedWidth />
        </Box>
      }
    >
      {!!guests.length && (
        <ListItemLocation icon="user-circle" title="Guests" to="users" dense>
          <Chip size="small" label={guests.length} />
          <Icon name="angle-right" inlineLeft inline fixedWidth />
        </ListItemLocation>
      )}
      {!!members.length && (
        <ListItemLocation icon="users" title="Organization members" to="users" dense>
          <Chip size="small" label={members.length} />
          <Icon name="angle-right" inlineLeft inline fixedWidth />
        </ListItemLocation>
      )}
    </AccordionMenuItem>
  )
}
