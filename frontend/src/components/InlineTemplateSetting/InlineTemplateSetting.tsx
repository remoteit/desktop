import React from 'react'
import { Application } from '../../shared/applications'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { Tooltip } from '@material-ui/core'
import { Icon } from '../Icon'

type Props = {
  app: Application
  service: IService
  connection?: IConnection
  actionIcon?: React.ReactElement
  disabled?: boolean
}

export const InlineTemplateSetting: React.FC<Props> = ({ app, service, connection, actionIcon, disabled }) => {
  if (!connection) connection = newConnection(service)

  return (
    <InlineTextFieldSetting
      hideIcon
      disabled={disabled}
      value={app.template}
      displayValue={app.string}
      actionIcon={actionIcon}
      label={
        <>
          {app.contextTitle}
          <Tooltip title={`Replacement tokens: ${app.tokens.join(', ')}`} placement="top" arrow>
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
