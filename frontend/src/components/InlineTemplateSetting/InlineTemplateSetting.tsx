import React from 'react'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { Application } from '../../shared/applications'
import { useApplication } from '../../hooks/useApplication'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { Tooltip } from '@material-ui/core'
import { Icon } from '../Icon'

type Props = {
  service: IService
  connection?: IConnection
  context: Application['context']
  actionIcon?: React.ReactElement
  disabled?: boolean
}

export const InlineTemplateSetting: React.FC<Props> = ({ service, connection, context, actionIcon, disabled }) => {
  if (!connection) connection = newConnection(service)
  const app = useApplication(context, service, connection)
  const icon = context === 'launch' ? <Icon rotate={-45} name="arrow-right" size="md" /> : 'copy'

  return (
    <InlineTextFieldSetting
      icon={icon}
      disabled={disabled}
      value={app.template}
      displayValue={app.command}
      actionIcon={actionIcon}
      label={
        <>
          {app.contextTitle}
          <Tooltip title={`Replacement tokens: ${app.allTokens.join(', ')}`} placement="top" arrow>
            <span style={{ zIndex: 10 }}>
              <Icon name="question-circle" size="sm" type="regular" inline />
            </span>
          </Tooltip>
        </>
      }
      resetValue={app.defaultTemplate}
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
