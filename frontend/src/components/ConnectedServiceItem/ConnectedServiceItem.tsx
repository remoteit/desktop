import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { DisconnectButtonController } from '../../controllers/DisconnectButtonController'
import { ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import { RestartButton } from '../RestartButton'
import { ConnectButtonController } from '../../controllers/ConnectButtonController'
import { ForgetButton } from '../ForgetButton'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'
import { CopyButton } from '../CopyButton'
import { IService } from 'remote.it'

export interface ConnectedServiceItemProps {
  connection?: ConnectionInfo
  service?: IService
}

export function ConnectedServiceItem({ connection, service }: ConnectedServiceItemProps) {
  let state: ConnectionState = 'disconnected'
  let connected: boolean = false
  let connecting: boolean = false
  let name: string = ''
  let port: number | undefined
  let error: boolean = false

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
  }

  if (connected) state = 'connected'
  if (connecting) state = 'connecting'

  return (
    <>
      <ListItem>
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
            service && <ConnectButtonController service={service} />
          )}
        </ListItemSecondaryAction>
      </ListItem>
      {connection && error && <ConnectionErrorMessage connection={connection} />}
    </>
  )
}
