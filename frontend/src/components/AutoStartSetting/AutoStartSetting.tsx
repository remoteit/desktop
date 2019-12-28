import React from 'react'
import { IService } from 'remote.it'
import { SettingsListItem } from '../SettingsListItem'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

export const AutoStartSetting: React.FC<{ service: IService; connection?: IConnection }> = ({
  service,
  connection,
}) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)

  return (
    <SettingsListItem
      label="Restart on disconnect"
      icon="power-off"
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
