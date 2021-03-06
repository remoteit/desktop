import React from 'react'
import { ListItemSetting } from './ListItemSetting'
import { newConnection, setConnection, connectionState } from '../helpers/connectionHelper'
import { emit } from '../services/Controller'

export const ConnectionLogSetting: React.FC<{ service: IService; connection?: IConnection }> = ({
  service,
  connection,
}) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)
  const state = connectionState(service, connection)
  const disabled = state === 'connected' || state === 'connecting' || state === 'offline'

  return (
    <ListItemSetting
      label="Connection Logging"
      subLabel={connection.log ? `Filename ${connection.id.replace(/:/g, '')}_<timestamp>.log` : undefined}
      disabled={disabled}
      icon="file-alt"
      toggle={!!connection.log}
      button={connection.log ? 'Show Log' : undefined}
      onButtonClick={() => emit('showFolder', 'connections')}
      onClick={() =>
        connection &&
        setConnection({
          ...connection,
          log: !connection.log,
        })
      }
    />
  )
}
