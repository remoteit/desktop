import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { CopyableText } from '../CopyableText'
import { DisconnectButtonController } from '../../controllers/DisconnectButtonController/DisconnectButtonController'
import { RestartButton } from '../RestartButton'
import { ForgetButton } from '../ForgetButton'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'

export interface ConnectedServiceItemProps {
  connection: ConnectionInfo
}

export function ConnectedServiceItem({
  connection,
}: ConnectedServiceItemProps) {
  if (!connection) return <p>No connection...</p>

  let state: ConnectionState = 'disconnected'
  if (connection.pid) state = 'connected'
  // TODO: show loading state when connection is establishing
  if (connection.connecting) state = 'connecting'

  return (
    <>
      <div className="df ai-center bb bc-gray-lighter p-sm bg-white">
        <div className="mr-sm">
          <ConnectionStateIcon state={state} size="lg" />
        </div>
        <div>
          <div className="txt-md gray-darkest">{connection.name}</div>
          {connection.type &&
            connection.name.toLowerCase() !== connection.type.toLowerCase() && (
              <span className="txt-sm gray-light mr-md">{connection.type}</span>
            )}
          {connection.pid && (
            <span className="gray-light txt-sm">PID# {connection.pid}</span>
          )}
        </div>
        <div className="ml-auto df ai-center ws-nowrap">
          {connection.port && (
            <CopyableText
              value={`localhost:${connection.port}`}
              className="txt-md"
            />
          )}
          <RestartButton
            connected={Boolean(connection.pid)}
            id={connection.id}
            disabled={connection.connecting}
          />
          {connection.connecting ? (
            <DisconnectButtonController id={connection.id} />
          ) : (
            <>
              {connection.pid ? (
                <DisconnectButtonController id={connection.id} />
              ) : (
                <ForgetButton id={connection.id} />
              )}
            </>
          )}
        </div>
      </div>
      {connection.error && <ConnectionErrorMessage connection={connection} />}
    </>
  )
}
