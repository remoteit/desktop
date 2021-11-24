import React from 'react'
import { newConnection, setConnection } from '../helpers/connectionHelper'
import { DEFAULT_CONNECTION, IP_PRIVATE } from '../shared/constants'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'

export const TargetHostSetting: React.FC<{ service: IService; connection?: IConnection }> = ({
  service,
  connection,
}) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)
  if (connection.timeout === undefined) connection.timeout = DEFAULT_CONNECTION.timeout

  const disabled = connection.enabled || connection.public
  const resetValue = service.host || IP_PRIVATE
  let host: string = connection.targetHost || resetValue

  const save = (targetHost: string) =>
    connection &&
    setConnection({
      ...connection,
      targetHost,
    })

  return (
    <InlineTextFieldSetting
      value={host}
      displayValue={host}
      modified={host !== resetValue}
      icon="bullseye"
      label="Remote Host Address"
      disabled={disabled}
      resetValue={resetValue}
      onSave={value => save(value.toString())}
    />
  )
}
