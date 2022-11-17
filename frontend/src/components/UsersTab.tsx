import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { selectSessionUsers } from '../models/sessions'
import { selectMembersWithAccess } from '../models/organization'
import { ListItemIcon, ListItemText, Typography } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { GuideBubble } from './GuideBubble'
import { makeStyles } from '@mui/styles'
import { Icon } from './Icon'

type Props = {
  instance?: IInstance
  service?: IService
  to: string
}

export const UsersTab: React.FC<Props> = ({ instance, service, to }) => {
  const css = useStyles()
  const { connected, access } = useSelector((state: ApplicationState) => ({
    connected: selectSessionUsers(state, service ? service.id : instance?.id).length,
    access: instance?.permissions.includes('MANAGE') ? selectMembersWithAccess(state, instance).map(m => m.user) : [],
  }))
  const users = (service ? service.access : instance?.access) || []
  const usersLinked = access.filter(user => !users.find(_u => _u.email === user.email))
  const total = users.length + usersLinked.length

  if (!instance?.permissions.includes('MANAGE')) return null

  return (
    <GuideBubble
      highlight
      guide="users"
      enterDelay={400}
      placement="bottom"
      startDate={new Date('2022-09-20')}
      queueAfter="addService"
      instructions={
        <>
          <Typography variant="h3" gutterBottom>
            <b>The power of sharing</b>
          </Typography>
          <Typography variant="body2" gutterBottom>
            Sharing can be done directly to a guest user from here, or by adding members to your
            <cite>Organization</cite>.
          </Typography>
        </>
      }
    >
      <ListItemLocation pathname={to} menuItem dense>
        <ListItemIcon>
          <Icon name="user-group" color="grayDarker" size="md" />
        </ListItemIcon>
        <ListItemText
          primary="Users"
          secondary={
            !!total && (
              <>
                {total ? total + ' total' : ''}
                <br />
                {!!connected && <span className={css.text}>{connected} connected</span>}
              </>
            )
          }
        />
      </ListItemLocation>
    </GuideBubble>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  text: { color: palette.primary.main },
}))
