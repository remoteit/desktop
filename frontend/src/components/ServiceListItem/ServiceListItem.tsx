import React from 'react'
import { IService } from 'remote.it'
import { hostName } from '../../helpers/nameHelper'
import { useHistory, useLocation } from 'react-router-dom'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { newConnection } from '../../helpers/connectionHelper'
import { ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'
import { DisconnectButton } from '../DisconnectButton'
import { ConnectButton } from '../ConnectButton'
import { CopyButton } from '../CopyButton'
import { NextButton } from '../NextButton'
import { makeStyles } from '@material-ui/styles'

export interface ServiceListItemProps {
  connection?: IConnection
  service?: IService
}

export function ServiceListItem({ connection, service }: ServiceListItemProps) {
  const history = useHistory()
  const location = useLocation()
  const css = useStyles()

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
          <ConnectButton connection={connection} service={service} />
        </ListItemSecondaryAction>
      </ListItem>
      {connection && error && <ConnectionErrorMessage connection={connection} />}
    </>
  )
}

const useStyles = makeStyles({
  actions: { right: 70, display: 'none' },
})
