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
  const disabled = connection.connected || connection.public
  const log = connection.public ? false : connection.log

  return (
    <ListItemSetting
      label="Connection Logging"
      subLabel={log ? `Filename ${connection.id.replace(/:/g, '')}_<timestamp>.log` : undefined}
      disabled={disabled}
      icon="file-alt"
      toggle={!!log}
      button={log ? 'Show Log' : undefined}
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
