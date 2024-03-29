import React from 'react'
import { ListItemSetting } from './ListItemSetting'
import { newConnection, setConnection, launchSettingHidden } from '../helpers/connectionHelper'

export const AutoLaunchToggle: React.FC<{ service: IService; connection?: IConnection; disabled?: boolean }> = ({
  service,
  connection,
  disabled,
}) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)
  if (launchSettingHidden(connection)) return null

  return (
    <ListItemSetting
      icon="launch"
      label="Auto Launch"
      subLabel="Launch when the connection is started"
      toggle={!!connection.autoLaunch}
      disabled={disabled}
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
