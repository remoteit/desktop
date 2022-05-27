import React from 'react'
import { Tooltip } from '@material-ui/core'
import { newConnection, setConnection } from '../helpers/connectionHelper'
import { DEFAULT_CONNECTION, PUBLIC_CONNECTION, REGEX_CHARACTERS } from '../shared/constants'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { Icon } from './Icon'

export const TimeoutSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)
  if (connection.timeout === undefined) connection.timeout = DEFAULT_CONNECTION.timeout

  const disabled = connection.connected || connection.public
  const timeout = connection.public ? PUBLIC_CONNECTION.timeout : connection.timeout
  let display = timeout === 0 ? 'Never' : `${timeout} minutes`

  const save = (newTimeout?: number) =>
    connection &&
    setConnection({
      ...connection,
      timeout: newTimeout,
    })

  return (
    <InlineTextFieldSetting
      value={timeout}
      modified={timeout !== DEFAULT_CONNECTION.timeout}
      filter={REGEX_CHARACTERS}
      displayValue={display}
      icon="hourglass"
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
