import React from 'react'
import { ListItemSetting } from './ListItemSetting'
import { newConnection, setConnection } from '../helpers/connectionHelper'
import { LAUNCH_TYPE } from '../shared/applications'
import { isPortal } from '../services/Browser'

export const AutoLaunchToggle: React.FC<{ service: IService; connection?: IConnection }> = ({
  service,
  connection,
}) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)
  if (connection.launchType === LAUNCH_TYPE.COMMAND && isPortal()) return null

  return (
    <ListItemSetting
      hideIcon
      label="Auto Launch"
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
