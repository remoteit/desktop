import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { IService } from 'remote.it'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { DisconnectButtonController } from '../../controllers/DisconnectButtonController'
import { ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import { ConnectButtonController } from '../../controllers/ConnectButtonController'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'
import { RestartButton } from '../RestartButton'
import { ForgetButton } from '../ForgetButton'
import { CopyButton } from '../CopyButton'
import { Icon } from '../Icon'

export interface ConnectedServiceItemProps {
  connection?: ConnectionInfo
  service?: IService
}

export function ConnectedServiceItem({ connection, service }: ConnectedServiceItemProps) {
  const history = useHistory()
  const location = useLocation()

  let state: ConnectionState = 'inactive'
  let connected: boolean = false
  let connecting: boolean = false
  let name: string = ''
  let port: number | undefined
  let error: boolean = false
  let path: string = location.pathname

  if (connection) {
    connected = !!connection.pid
    connecting = !!connection.connecting
    error = !!connection.error
    port = connection.port
    name = connection.name
  }

  if (service) {
    connecting = connecting || !!service.connecting
    name = service.name
    state = service.state
    path += `/${service.id}`
  }

  // console.log('NAME', name)
  // console.log('SERVICE', service)
  // console.log('CONNECTION', connection)

  if (connected) state = 'connected'
  if (connecting) state = 'connecting'

  return (
    <>
      <ListItem onClick={() => history.push(path)}>
        <ListItemIcon>
          <ConnectionStateIcon state={state} size="lg" />
        </ListItemIcon>
        <ListItemText primary={name} secondary={port && `localhost:${port}`} />
        <ListItemSecondaryAction>
          {port && <CopyButton title="Copy connection URL" text={`localhost:${port}`} />}
          {connection ? (
            <>
              {connecting || connected ? (
                <DisconnectButtonController id={connection.id} />
              ) : (
                <ForgetButton id={connection.id} />
              )}
              {!connected && !connecting && <RestartButton id={connection.id} />}
            </>
          ) : (
            state === 'active' && service && <ConnectButtonController service={service} />
          )}
          <Icon name="chevron-right" fixedWidth />
        </ListItemSecondaryAction>
      </ListItem>
      {connection && error && <ConnectionErrorMessage connection={connection} />}
    </>
  )
}
