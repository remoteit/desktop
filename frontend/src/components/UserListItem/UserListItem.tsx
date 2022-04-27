import React from 'react'
import { ListItemText, ListItemIcon } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { Avatar } from '../Avatar'
import { Duration } from '../Duration'
import { useLocation } from 'react-router-dom'
import { spacing } from '../../styling'

interface Props {
  user: IUser
  isConnected?: boolean
  isUserLinked?: boolean
}

export const UserListItem: React.FC<Props> = ({ user, isConnected, isUserLinked = false, children }) => {
  const location = useLocation()
  const redirectTo = isUserLinked ? '/organization' : location.pathname + '/' + user.email
  return (
    <ListItemLocation pathname={redirectTo} dense>
      <ListItemIcon>
        <Avatar email={user.email} size={spacing.lg} />
      </ListItemIcon>
      {isConnected ? (
        <ListItemText
          primaryTypographyProps={{ color: 'primary' }}
          primary={user.email}
          secondary={<Duration startTime={user.timestamp?.getTime()} ago />}
        />
      ) : (
        <ListItemText primary={user.email} />
      )}
      {!isUserLinked && children}
    </ListItemLocation>
  )
}
