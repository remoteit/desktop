import React from 'react'
import { Tooltip } from '@mui/material'
import { newConnection, setConnection } from '../helpers/connectionHelper'
import { DEFAULT_CONNECTION } from '../shared/constants'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { Icon } from './Icon'

export const TargetHostSetting: React.FC<{ service: IService; connection?: IConnection }> = ({
  service,
  connection,
}) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)
  if (connection.timeout === undefined) connection.timeout = DEFAULT_CONNECTION.timeout

  const disabled = connection.connected || connection.public
  const resetValue = service?.attributes.targetHost

  const save = (targetHost: string) =>
    connection &&
    setConnection({
      ...connection,
      targetHost,
    })

  return (
    <InlineTextFieldSetting
      value={connection.targetHost}
      displayValue={connection.targetHost}
      modified={!connection.targetHost !== !resetValue}
      icon="bullseye"
      label={
        <>
          Target Host name
          <Tooltip
            title="If a website expects a specific host name, enter it here. (Example: https://google.com)"
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
      resetValue={resetValue}
      onSave={value => save(value.toString())}
    />
  )
}
