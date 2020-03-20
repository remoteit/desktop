import React from 'react'
import { IService } from 'remote.it'
import { InlineSetting } from '../InlineSetting'
import { useApplication } from '../../services/applications'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

export const LaunchSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const app = useApplication(service.typeID)
  if (!connection) connection = newConnection(service)
  let currentLaunchUrl = (connection && connection.launchUrl) || app.launchUrl

  return (
    <InlineSetting
      icon="question-circle"
      iconTooltip="Replacement Tokens [host] [port] [username] [id]"
      value={currentLaunchUrl}
      displayValue={app.parse(currentLaunchUrl, connection)}
      label="Launch URL"
      onSave={launchUrl =>
        connection &&
        setConnection({
          ...connection,
          launchUrl: launchUrl.toString(),
        })
      }
    />
  )
}
