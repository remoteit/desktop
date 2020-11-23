import React from 'react'
import { useSelector } from 'react-redux'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { ApplicationState } from '../../store'
import { useApplicationService, Application } from '../../shared/applications'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { Tooltip } from '@material-ui/core'
import { Icon } from '../Icon'

type Props = { service: IService; connection?: IConnection; context: Application['context'] }

export const InlineTemplateSetting: React.FC<Props> = ({ service, connection, context }) => {
  const freePort = useSelector((state: ApplicationState) => state.backend.freePort)
  if (!connection) connection = newConnection(service)
  const app = useApplicationService(context, service, { ...connection, port: connection.port || freePort })

  return (
    <InlineTextFieldSetting
      value={app.template}
      displayValue={app.command}
      label={
        <>
          {app.contextTitle}
          <Tooltip title={`Replacement Tokens ${app.tokens}`} placement="top" arrow>
            <Icon name="question-circle" size="sm" type="regular" inline />
          </Tooltip>
        </>
      }
      resetValue={app.template}
      onSave={template =>
        connection &&
        setConnection({
          ...connection,
          [app.templateKey]: template.toString(),
        })
      }
    />
  )
}
