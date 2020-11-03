import React from 'react'
import { useSelector } from 'react-redux'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { ApplicationState } from '../../store'
import { useApplication } from '../../shared/applications'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { Tooltip } from '@material-ui/core'
import { Icon } from '../Icon'

const SSH_TYPE = 28

type Props = { service: IService; connection?: IConnection; template: 'copyTemplate' | 'launchTemplate' }

export const TemplateSetting: React.FC<Props> = ({ service, connection, template }) => {
  const freePort = useSelector((state: ApplicationState) => state.backend.freePort)
  const app = useApplication(service.typeID)
  let tokens = '[host] [port] [id]'
  if (service.typeID === SSH_TYPE) tokens += ' [username]'
  if (!connection) connection = newConnection(service)
  let templateString = connection[template] || app[template] || connection.launchTemplate || app.launchTemplate || ''

  return (
    <InlineTextFieldSetting
      value={templateString}
      displayValue={app.parse(templateString, { ...connection, port: connection.port || freePort })}
      label={
        <>
          {template === 'copyTemplate' ? 'Copy Command' : 'Launch URL'}
          <Tooltip title={`Replacement Tokens ${tokens}`} placement="top" arrow>
            <Icon name="question-circle" size="sm" type="regular" inline />
          </Tooltip>
        </>
      }
      resetValue={app[template]}
      onSave={templateString =>
        connection &&
        setConnection({
          ...connection,
          [template]: templateString.toString(),
        })
      }
    />
  )
}
