import React from 'react'
import { IService } from 'remote.it'
import { hostName } from '../../helpers/nameHelper'
import { useHistory, useLocation } from 'react-router-dom'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { newConnection } from '../../helpers/connectionHelper'
import { ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, IconButton } from '@material-ui/core'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'
import { DisconnectButton } from '../DisconnectButton'
// import { RestartButton } from '../RestartButton'
import { ConnectButton } from '../ConnectButton'
// import { ForgetButton } from '../ForgetButton'
import { CopyButton } from '../CopyButton'
import { NextButton } from '../NextButton'
import { makeStyles } from '@material-ui/styles'

export interface ConnectedServiceItemProps {
  connection?: IConnection
  service?: IService
}

export function ConnectedServiceItem({ connection, service }: ConnectedServiceItemProps) {
  const history = useHistory()
  const location = useLocation()
  const css = useStyles()

  let connected: boolean = false
  let connecting: boolean = false
  let name: string = ''
  let error: boolean = false
  let path = location.pathname
  let id = ''

  if (service) {
    connecting = connecting || !!service.connecting
    name = service.name
    id = service.id
  }

  if (connection) {
    connected = !!connection.pid
    connecting = !!connection.connecting
    error = !!connection.error
    name = connection.name || name
    id = connection.id
  } else if (service) {
    connection = newConnection(service)
  }

  return (
    <>
      <ListItem onClick={() => history.push(`${path}/${id}`)} button>
        <ListItemIcon>
          <ConnectionStateIcon connection={connection} service={service} size="lg" />
        </ListItemIcon>
        <ListItemText primary={name} secondary={connection && hostName(connection)} />
        <NextButton />
        <ListItemSecondaryAction className={css.actions}>
          <CopyButton connection={connection} />
          <DisconnectButton connection={connection} />
          <ConnectButton connection={connection} />
        </ListItemSecondaryAction>
      </ListItem>
      {connection && error && <ConnectionErrorMessage connection={connection} />}
    </>
  )
}

const useStyles = makeStyles({ actions: { right: 70 } })
