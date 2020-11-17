import React from 'react'
import { useSelector } from 'react-redux'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { ApplicationState } from '../../store'
import { useApplication } from '../../shared/applications'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { Tooltip } from '@material-ui/core'
import { Icon } from '../Icon'

type Props = { service: IService; connection?: IConnection; template: 'commandTemplate' | 'launchTemplate' }

export const InlineTemplateSetting: React.FC<Props> = ({ service, connection, template }) => {
  const freePort = useSelector((state: ApplicationState) => state.backend.freePort)
  const app = useApplication(service.typeID)

  if (!connection) connection = newConnection(service)

  const instance = { ...service.attributes, ...connection }
  let templateString = instance[template] || app[template] || ''

  return (
    <InlineTextFieldSetting
      value={templateString}
      displayValue={app.parse(templateString, { ...instance, port: instance.port || freePort })}
      label={
        <>
          {template === 'commandTemplate' ? 'Copy Command' : 'Launch URL'}
          <Tooltip title={`Replacement Tokens ${app.tokens}`} placement="top" arrow>
            <Icon name="question-circle" size="sm" type="regular" inline />
          </Tooltip>
        </>
      }
      resetValue={app[template]}
      onSave={templateString =>
        instance &&
        setConnection({
          ...instance,
          [template]: templateString.toString(),
        })
      }
    />
  )
}
