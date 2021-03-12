import React from 'react'
import { Tooltip } from '@material-ui/core'
import { newConnection, setConnection, connectionState, DEFAULT_CONNECTION } from '../helpers/connectionHelper'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { Icon } from './Icon'

export const TimeoutSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const state = connectionState(service, connection)

  if (!service) return null
  if (!connection) connection = newConnection(service)
  if (connection.timeout === undefined) connection.timeout = DEFAULT_CONNECTION.timeout

  const disabled = state === 'connected' || state === 'connecting'
  const save = (timeout?: number) =>
    connection &&
    setConnection({
      ...connection,
      timeout,
    })

  return (
    <InlineTextFieldSetting
      value={connection.timeout}
      displayValue={connection.timeout === 0 ? 'Never' : `${connection.timeout} minutes`}
      icon={<Icon name="hourglass" size="md" />}
      label={
        <>
          Idle Timeout
          <Tooltip
            title={
              <>
                Time until connection is closed and returns to waiting state.
                <br />
                Enter zero (0) for persistent connections.
              </>
            }
            placement="top"
            arrow
          >
            <span style={{ zIndex: 10 }}>
              <Icon name="question-circle" size="sm" inline />
            </span>
          </Tooltip>
        </>
      }
      disabled={disabled}
      resetValue={DEFAULT_CONNECTION.timeout}
      onSave={timeout => save(+timeout)}
    />
  )
}
