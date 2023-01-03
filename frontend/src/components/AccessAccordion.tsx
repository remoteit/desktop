import React, { useContext } from 'react'
import { useSelector } from 'react-redux'
import { DeviceContext } from '../services/Context'
import { Chip, Box, Typography } from '@mui/material'
import { selectSessionUsers } from '../models/sessions'
import { selectMembersWithAccess } from '../models/organization'
import { ApplicationState } from '../store'
import { AccordionMenuItem } from './AccordionMenuItem'
import { ListItemLocation } from './ListItemLocation'
import { AddUserButton } from '../buttons/AddUserButton'
import { Icon } from './Icon'

type Props = {
  expanded: boolean
  onClick: () => void
}

export const AccessAccordion: React.FC<Props> = ({ expanded, onClick }) => {
  const { service, instance } = useContext(DeviceContext)
  const { connected, access } = useSelector((state: ApplicationState) => ({
    connected: selectSessionUsers(state, service ? service.id : instance?.id).length,
    access: instance?.permissions.includes('MANAGE') ? selectMembersWithAccess(state, instance).map(m => m.user) : [],
  }))
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
          {!!connected && <Chip size="small" color="primary" label={connected} />} &nbsp;
          {!!total && !expanded && <Chip size="small" label={total} />}
          <AddUserButton to="share" icon="plus" size="base" buttonBaseSize="small" fixedWidth />
        </Box>
      }
    >
      {!!guests.length && (
        <ListItemLocation icon="user-circle" title="Guests" pathname="users" dense>
          <Chip size="small" label={guests.length} />
          <Icon name="angle-right" inlineLeft inline fixedWidth />
        </ListItemLocation>
      )}
      {!!members.length && (
        <ListItemLocation icon="users" title="Organization members" pathname="users" dense>
          <Chip size="small" label={members.length} />
          <Icon name="angle-right" inlineLeft inline fixedWidth />
        </ListItemLocation>
      )}
    </AccordionMenuItem>
  )
}
