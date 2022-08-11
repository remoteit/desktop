import React from 'react'
import { Application } from '../shared/applications'
import { ListItemSetting } from './ListItemSetting'
import { newConnection, setConnection, launchDisabled } from '../helpers/connectionHelper'

export const AutoLaunchToggle: React.FC<{ app: Application; service: IService; connection?: IConnection }> = ({
  app,
  service,
  connection,
}) => {
  if (!service || !app) return null
  if (!connection) connection = newConnection(service)
  if (launchDisabled(connection)) return null

  return (
    <ListItemSetting
      hideIcon
      label="Auto Launch"
      subLabel={
        app.launchType === 'URL'
          ? 'Open this URL when the connection is started'
          : 'Run this command when the connection is started'
      }
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
