import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { CopyableText } from '../CopyableText'
import { DisconnectButtonController } from '../../controllers/DisconnectButtonController/DisconnectButtonController'
import { RestartButton } from '../RestartButton'
import { ForgetButton } from '../ForgetButton'

export interface ConnectedServiceItemProps {
  connection: ConnectionInfo
}

export function ConnectedServiceItem({
  connection,
}: ConnectedServiceItemProps) {
  if (!connection) return <p>No connection...</p>

  return (
    <div className="df ai-center bb bc-gray-lighter px-md py-xs">
      <div className="mr-md">
        <ConnectionStateIcon
          state={connection.pid ? 'connected' : 'disconnected'}
          size="lg"
        />
      </div>
      <div>
        <div className="txt-md gray-darkest">{connection.serviceName}</div>
        {connection.type &&
          connection.serviceName.toLowerCase() !==
            connection.type.toLowerCase() && (
            <span className="txt-sm gray-light mr-md">{connection.type}</span>
          )}
        {connection.pid && (
          <span className="gray-light txt-sm">PID# {connection.pid}</span>
        )}
      </div>
      <div className="ml-auto df ai-center">
        {connection.port && (
          <CopyableText
            value={`localhost:${connection.port}`}
            className="txt-md"
          />
        )}
        <RestartButton serviceID={connection.serviceID} />
        {connection.pid ? (
          <DisconnectButtonController serviceID={connection.serviceID} />
        ) : (
          <ForgetButton serviceID={connection.serviceID} />
        )}
      </div>
    </div>
  )
}
