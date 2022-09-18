import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { selectSessionUsers } from '../models/sessions'
import { selectMembersWithAccess } from '../models/organization'
import { ListItemIcon, ListItemText } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { makeStyles } from '@mui/styles'
import { Icon } from './Icon'

type Props = {
  instance?: IDevice | INetwork
  service?: IService
  to: string
}

export const UsersTab: React.FC<Props> = ({ instance, service, to }) => {
  const css = useStyles()
  const { connected, access } = useSelector((state: ApplicationState) => ({
    connected: selectSessionUsers(state, service ? service.id : instance?.id).length,
    access: instance?.owner.id === state.auth.user?.id ? selectMembersWithAccess(state, instance).map(m => m.user) : [],
  }))
  const users = (service ? service.access : instance?.access) || []
  const usersLinked = access.filter(user => !users.find(_u => _u.email === user.email))
  const total = users.length + usersLinked.length

  if (!instance?.permissions.includes('MANAGE')) return null

  return (
    <ListItemLocation pathname={to} dense>
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
  )
}

const useStyles = makeStyles(({ palette }) => ({
  text: { color: palette.primary.main },
}))
