import React from 'react'
import { Application } from '../../shared/applications'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { newConnection, setConnection, isSecureReverseProxy } from '../../helpers/connectionHelper'
import { ConfirmButton } from '../../buttons/ConfirmButton'
import { Tooltip } from '@mui/material'
import { Icon } from '../Icon'

type Props = {
  app: Application
  service: IService
  connection?: IConnection
  disabled?: boolean
  disableGutters?: boolean
}

export const InlineTemplateSetting: React.FC<Props> = ({ app, service, connection, disabled, disableGutters }) => {
  if (!connection) connection = newConnection(service)
  const secureReverseProxy = isSecureReverseProxy(app.template)

  const update = (template: string) =>
    connection &&
    setConnection({
      ...connection,
      [app.templateKey]: template,
      disableSecurity: isSecureReverseProxy(template) === false,
    })

  return (
    <InlineTextFieldSetting
      hideIcon={secureReverseProxy === null}
      actionIcon={
        secureReverseProxy === null ? undefined : (
          <ConfirmButton
            type="solid"
            confirm={secureReverseProxy}
            confirmProps={{
              title: 'Disable Web Security',
              children:
                'Are you sure you want to disable secure connections? Your local connection traffic will be sent in the clear, unencrypted.',
            }}
            disabled={disabled}
            size={secureReverseProxy ? undefined : 'md'}
            name={secureReverseProxy ? 'lock' : 'triangle-exclamation'}
            color={secureReverseProxy ? undefined : 'danger'}
            onClick={() => update(app.getReverseProxyTemplate(!secureReverseProxy))}
          />
        )
      }
      disableGutters={disableGutters}
      disabled={disabled}
      value={app.template}
      label={
        <>
          {app.contextTitle} Template
          <Tooltip
            title={
              <>
                {app.helpMessage && (
                  <>
                    {app.helpMessage}
                    <br />
                  </>
                )}
                Default tokens - <b>{app.defaultTokens.join(', ')}</b>
              </>
            }
            placement="top"
            arrow
          >
            <span style={{ zIndex: 10 }}>
              <Icon name="question-circle" size="sm" type="regular" inline />
            </span>
          </Tooltip>
        </>
      }
      resetValue={app.defaultTemplate}
      onSave={template => update(template.toString())}
    />
  )
}
