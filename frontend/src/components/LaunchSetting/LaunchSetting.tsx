import React from 'react'
import { InlineSetting } from '../InlineSetting'
import { useApplication } from '../../shared/applications'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

const SSH_TYPE = 28

export const LaunchSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const app = useApplication(service.typeID)
  let tokens = '[host] [port] [id]'
  if (service.typeID === SSH_TYPE) tokens += ' [username]'
  if (!connection) connection = newConnection(service)
  let currentLaunchUrl = (connection && connection.launchTemplate) || app.launchTemplate
  return (
    <InlineSetting
      icon="question-circle"
      iconTooltip={`Replacement Tokens ${tokens}`}
      value={currentLaunchUrl}
      displayValue={app.parse(currentLaunchUrl, connection)}
      label="Launch URL"
      resetValue={app.launchTemplate}
      onSave={launchTemplate =>
        connection &&
        setConnection({
          ...connection,
          launchTemplate: launchTemplate.toString(),
        })
      }
    />
  )
}
