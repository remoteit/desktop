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
  let host: string = connection.targetHost || service.host || IP_PRIVATE

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
      icon="bullseye"
      label="Remote Host Address"
      disabled={disabled}
      resetValue={service.host || IP_PRIVATE}
      onSave={value => save(value.toString())}
    />
  )
}
