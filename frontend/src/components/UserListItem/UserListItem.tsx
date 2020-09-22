import React, { Fragment } from 'react'
import { ListItemText, ListItemIcon } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { InitiatorPlatform } from '../InitiatorPlatform'
import { ShareDetails } from '../ShareDetails'
import { Duration } from '../Duration'
import { useLocation } from 'react-router-dom'

export interface UserListItemProps {
  user: IUser
  index?: string
  service?: IService
  activeConnections?: IConnection
  isConnected?: boolean
  permission?: any
  showDetails?: boolean
}

export const UserListItem = ({
  index,
  user,
  isConnected,
  permission,
  service,
  activeConnections,
  showDetails,
}: UserListItemProps) => {
  const location = useLocation()

  return (
    <Fragment key={index}>
      <ListItemLocation pathname={`${location.pathname}/${user.email}`} dense>
        <ListItemIcon>
          <InitiatorPlatform id={user.platform} connected={isConnected} />
        </ListItemIcon>
        {isConnected ? (
          <ListItemText
            primaryTypographyProps={{ color: 'primary' }}
            primary={user.email}
            secondary={<Duration startTime={user.timestamp?.getTime()} ago />}
          />
        ) : (
          <ListItemText primary={`${user.email}`} />
        )}
        {showDetails && (
          <ShareDetails
            scripting={permission.scripting}
            shared={permission.numberServices}
            services={permission.services}
            service={service}
            connections={activeConnections}
          />
        )}
      </ListItemLocation>
    </Fragment>
  )
}
