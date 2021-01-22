import React from 'react'
import { ListItemSetting } from './ListItemSetting'
import { newConnection, setConnection } from '../helpers/connectionHelper'
import { emit } from '../services/Controller'

export const ConnectionLogSetting: React.FC<{ service: IService; connection?: IConnection }> = ({
  service,
  connection,
}) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)
  const disabled = connection?.active || connection?.connecting || service.state !== 'active'

  return (
    <ListItemSetting
      label="Connection Logging"
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
