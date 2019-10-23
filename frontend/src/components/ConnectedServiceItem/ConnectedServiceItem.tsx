import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { DisconnectButtonController } from '../../controllers/DisconnectButtonController'
import { ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import { RestartButton } from '../RestartButton'
import { ForgetButton } from '../ForgetButton'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'
import { CopyButton } from '../CopyButton'

export interface ConnectedServiceItemProps {
  connection: ConnectionInfo
}

export function ConnectedServiceItem({ connection }: ConnectedServiceItemProps) {
  if (!connection) return <p>No connection...</p>

  let state: ConnectionState = 'disconnected'
  // TODO: show loading state when connection is establishing
  if (connection.pid) state = 'connected'
  if (connection.connecting) state = 'connecting'

  return (
    <ListItem>
      <ListItemIcon>
        <ConnectionStateIcon state={state} size="lg" />
      </ListItemIcon>
      <ListItemText primary={connection.name} secondary={`localhost:${connection.port}`} />
      <ListItemSecondaryAction>
        {connection.port && <CopyButton title="Copy connection URL" text={`localhost:${connection.port}`} />}
        {connection.connecting || connection.pid ? (
          <DisconnectButtonController id={connection.id} />
        ) : (
          <ForgetButton id={connection.id} />
        )}
        {!connection.pid && !connection.connecting && <RestartButton id={connection.id} />}
      </ListItemSecondaryAction>
      {connection.error && <ConnectionErrorMessage connection={connection} />}
    </ListItem>
  )
}
