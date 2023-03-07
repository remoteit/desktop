import React from 'react'
import { ListItemText, ListItemIcon, ListItemSecondaryAction } from '@mui/material'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { ListItemLocation } from '../ListItemLocation'
import { Avatar } from '../Avatar'
import { Duration } from '../Duration'
import { ClearButton } from '../../buttons/ClearButton'
import { useLocation } from 'react-router-dom'
import { spacing } from '../../styling'

interface Props {
  user: IUser
  remove?: string
  isConnected?: boolean
  member?: boolean
  children?: React.ReactNode
}

export const UserListItem: React.FC<Props> = ({ user, remove, isConnected, member, children }) => {
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  return (
    <ListItemLocation
      pathname={remove ? undefined : member ? `/organization/members/${user.id}` : `${location.pathname}/${user.id}`}
      dense
    >
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
      {remove && (
        <ListItemSecondaryAction>
          <ClearButton
            id={user.id}
            onClick={() => dispatch.networks.unshareNetwork({ networkId: remove, email: user.email })}
          />
        </ListItemSecondaryAction>
      )}
    </ListItemLocation>
  )
}
