import React from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { selectSessionUsers } from '../selectors/sessions'
import { selectMembersWithAccess } from '../selectors/organizations'
import { ListItemIcon, ListItemText, Typography } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { GuideBubble } from './GuideBubble'
import { makeStyles } from '@mui/styles'
import { Icon } from './Icon'

type Props = {
  instance?: IInstance
  service?: IService
  menuItem?: boolean
  to: string
  size?: 'large' | 'small'
}

export const UsersTab: React.FC<Props> = ({ instance, service, menuItem, to, size = 'large' }) => {
  const css = useStyles()
  const connected = useSelector((state: State) =>
    selectSessionUsers(state, undefined, service ? service.id : instance?.id)
  ).length
  const access = useSelector((state: State) => selectMembersWithAccess(state, undefined, instance)).map(m => m.user)
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
      <ListItemLocation to={to} menuItem={menuItem} dense>
        <ListItemIcon>
          <Icon name="user-group" color={connected ? 'primary' : 'grayDarker'} size="md" />
        </ListItemIcon>
        <ListItemText
          sx={{ color: connected ? 'primary.main' : undefined }}
          primary="Access"
          secondary={
            !!total &&
            size === 'large' && (
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
