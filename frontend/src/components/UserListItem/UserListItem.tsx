import React from 'react'
import { ListItemText, ListItemIcon, makeStyles } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { InitiatorPlatform } from '../InitiatorPlatform'
import { Duration } from '../Duration'
import { useLocation } from 'react-router-dom'

interface Props {
  user: IUser
  isConnected?: boolean
  isUserLinked?: boolean
}

export const UserListItem: React.FC<Props> = ({ user, isConnected, isUserLinked = false, children }) => {
  const location = useLocation()
  const redirectTo = isUserLinked ? '/settings/access' : location.pathname + '/' + user.email
  return (
    <ListItemLocation pathname={redirectTo} dense>
      <ListItemIcon>
        <InitiatorPlatform id={user.platform} connected={isConnected} />
      </ListItemIcon>
      {isConnected ? (
        <ListItemText
          primaryTypographyProps={{ color: 'primary' }}
          primary={user.email}
          secondary={<Duration startTime={user.timestamp?.getTime()} ago />}
        />
      ) : isUserLinked ? (
        <ListItemText primary={user.email} />
      ) : (
        <ListItemText primary={user.email} />
      )}
      {!isUserLinked && children}
    </ListItemLocation>
  )
}
