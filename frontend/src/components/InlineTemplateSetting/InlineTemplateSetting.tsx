import React from 'react'
import { Application } from '../../shared/applications'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { Tooltip } from '@mui/material'
import { Icon } from '../Icon'

type Props = {
  app: Application
  service: IService
  connection?: IConnection
  actionIcon?: React.ReactNode
  disabled?: boolean
  disableGutters?: boolean
}

export const InlineTemplateSetting: React.FC<Props> = ({
  app,
  service,
  connection,
  actionIcon,
  disabled,
  disableGutters,
}) => {
  if (!connection) connection = newConnection(service)

  return (
    <InlineTextFieldSetting
      hideIcon
      disableGutters={disableGutters}
      disabled={disabled}
      value={app.template}
      displayValue={app.string}
      actionIcon={actionIcon}
      label={
        <>
          {app.contextTitle}
          <Tooltip title="Default tokens: [host] [port] [id] [path]" placement="top" arrow>
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
