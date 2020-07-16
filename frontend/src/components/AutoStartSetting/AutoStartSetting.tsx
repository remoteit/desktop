import React from 'react'
import { SettingsListItem } from '../SettingsListItem'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

export const AutoStartSetting: React.FC<{ service: IService; connection?: IConnection }> = ({
  service,
  connection,
}) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)
  const disabled = connection?.active || service.state !== 'active'

  return (
    <SettingsListItem
      label="Reconnect on disconnect"
      disabled={disabled}
      icon="redo"
      toggle={!!connection.autoStart}
      onClick={() =>
        connection &&
        setConnection({
          ...connection,
          autoStart: !connection.autoStart,
        })
      }
    />
  )
}
