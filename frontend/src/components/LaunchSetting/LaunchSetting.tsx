import React from 'react'
import { useSelector } from 'react-redux'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { ApplicationState } from '../../store'
import { useApplication } from '../../shared/applications'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { Tooltip } from '@material-ui/core'
import { Icon } from '../Icon'

const SSH_TYPE = 28

export const LaunchSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const freePort = useSelector((state: ApplicationState) => state.backend.freePort)
  const app = useApplication(service.typeID)
  let tokens = '[host] [port] [id]'
  if (service.typeID === SSH_TYPE) tokens += ' [username]'
  if (!connection) connection = newConnection(service)
  let currentLaunchUrl = connection?.launchTemplate || app.launchTemplate

  return (
    <InlineTextFieldSetting
      value={currentLaunchUrl}
      displayValue={app.parse(currentLaunchUrl, { ...connection, port: connection.port || freePort })}
      label={
        <>
          Launch URL
          <Tooltip title={`Replacement Tokens ${tokens}`} placement="top" arrow>
            <Icon name="question-circle" size="sm" type="regular" inline />
          </Tooltip>
        </>
      }
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
