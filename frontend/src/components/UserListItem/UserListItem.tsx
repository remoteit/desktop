import React from 'react'
import { ListItemText, ListItemIcon } from '@mui/material'
import { ListItemLocation } from '../ListItemLocation'
import { Avatar } from '../Avatar'
import { Duration } from '../Duration'
import { useLocation } from 'react-router-dom'
import { spacing } from '../../styling'

interface Props {
  user: IUser
  isConnected?: boolean
  member?: boolean
  children?: React.ReactNode
}

export const UserListItem: React.FC<Props> = ({ user, isConnected, member, children }) => {
  const location = useLocation()
  return (
    <ListItemLocation pathname={member ? `/organization/members/${user.id}` : `${location.pathname}/${user.id}`} dense>
      <ListItemIcon>
        <Avatar email={user.email} size={spacing.lg} />
      </ListItemIcon>
      {isConnected ? (
        <ListItemText
          primaryTypographyProps={{ color: 'primary' }}
          primary={user.email || user.id}
          secondary={<Duration startTime={user.timestamp?.getTime()} ago />}
        />
      ) : (
        <ListItemText primary={user.email} />
      )}
      {!member && children}
    </ListItemLocation>
  )
}
