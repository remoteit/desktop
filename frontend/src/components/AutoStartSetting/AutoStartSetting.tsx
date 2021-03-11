import React from 'react'
import { ListItemSetting } from '../ListItemSetting'
import { newConnection, setConnection, connectionState } from '../../helpers/connectionHelper'

export const AutoStartSetting: React.FC<{ service: IService; connection?: IConnection }> = ({
  service,
  connection,
}) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)
  const state = connectionState(service, connection)
  const disabled = state === 'connected' || state === 'connecting' || state === 'offline'

  return (
    <ListItemSetting
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
