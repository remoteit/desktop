import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { DisconnectButtonController } from '../../controllers/DisconnectButtonController/DisconnectButtonController'
import { RestartButton } from '../RestartButton'
import { ForgetButton } from '../ForgetButton'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'
import { CopyButton } from '../CopyButton'

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
    <div className="p-sm bg-white bb bc-gray-lighter">
      <div className="df ai-center">
        <div className="mr-sm">
          <ConnectionStateIcon state={state} size="lg" />
        </div>
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <div className="txt-md gray-darkest">{connection.name}</div>
          {connection.type &&
            connection.name.toLowerCase() !== connection.type.toLowerCase() && (
              <span className="txt-sm gray-light mr-md">{connection.type}</span>
            )}
          {connection.port && (
            <span className="txt-sm italic gray">
              localhost:{connection.port}
            </span>
          )}
        </div>
        <div className="ml-auto df ai-center">
          {connection.port && (
            <CopyButton
              title="Copy connection URL"
              text={`localhost:${connection.port}`}
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
    </div>
  )
}
