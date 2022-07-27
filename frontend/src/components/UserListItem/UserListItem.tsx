import React from 'react'
import { ListItemText, ListItemIcon } from '@mui/material'
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
      {/* 
      
      TODO ADD REMOVE USER OPTION TO SUPPORT NETWORKS AND DON'T LINK TO USER PAGE

      make hover icon same as in the network list item
      
      */}
      {!member && children}
      {remove && (
        <ClearButton id={user.id} onClick={() => dispatch.networks.unshareNetwork({ id: remove, email: user.email })} />
      )}
    </ListItemLocation>
  )
}
