import React, { useContext } from 'react'
import { DeviceContext } from '../services/Context'
import { Chip, Box, Typography, Tooltip } from '@mui/material'
import { selectSessionUsers } from '../models/sessions'
import { selectMembersWithAccess } from '../models/organization'
import { useSelector } from 'react-redux'
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
  const users = (service ? service.access : instance?.access) || []
  const usersLinked = access.filter(user => !users.find(_u => _u.email === user.email))
  const total = users.length + usersLinked.length

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
          {!!total && <Chip size="small" label={total} />}
          <AddUserButton to="share" icon="plus" size="base" fixedWidth />
        </Box>
      }
    >
      {!!total && (
        <ListItemLocation icon="user-group" title="Users" pathname="users" dense>
          <Icon name="angle-right" inlineLeft fixedWidth />
        </ListItemLocation>
      )}
    </AccordionMenuItem>
  )
}
