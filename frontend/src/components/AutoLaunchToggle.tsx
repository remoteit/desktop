import React from 'react'
import { ListItemSetting } from './ListItemSetting'
import { newConnection, setConnection, launchDisabled } from '../helpers/connectionHelper'

export const AutoLaunchToggle: React.FC<{ service: IService; connection?: IConnection }> = ({
  service,
  connection,
}) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)
  if (launchDisabled(connection)) return null

  return (
    <ListItemSetting
      icon="launch"
      label="Auto Launch"
      subLabel="Launch when the connection is started"
      toggle={!!connection.autoLaunch}
      onClick={() =>
        connection &&
        setConnection({
          ...connection,
          autoLaunch: !connection.autoLaunch,
        })
      }
    />
  )
}
