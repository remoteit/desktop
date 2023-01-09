import React from 'react'
import { Tooltip } from '@mui/material'
import { useSelector } from 'react-redux'
import { isReverseProxy } from '../models/applicationTypes'
import { ApplicationState } from '../store'
import { newConnection, setConnection } from '../helpers/connectionHelper'
import { DEFAULT_CONNECTION } from '../shared/constants'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { Icon } from './Icon'

export const HeaderOverrideSetting: React.FC<{ service: IService; connection?: IConnection }> = ({
  service,
  connection,
}) => {
  const reverseProxy = useSelector((state: ApplicationState) => isReverseProxy(state, service.typeID))
  if (!reverseProxy) return null
  if (!connection) connection = newConnection(service)
  if (connection.timeout === undefined) connection.timeout = DEFAULT_CONNECTION.timeout

  const disabled = connection.connected || connection.public
  const resetValue = service?.attributes.targetHost

  const save = (targetHost: string) =>
    connection &&
    setConnection({
      ...connection,
      targetHost,
    })

  return (
    <InlineTextFieldSetting
      value={connection.targetHost}
      displayValue={connection.targetHost}
      modified={!connection.targetHost !== !resetValue}
      icon="bullseye"
      label={
        <>
          Host header override
          <Tooltip
            title="A way to specify a different hostname in the host header of an HTTP request. Can be used in load balancing scenarios to route requests to the appropriate server."
            placement="top"
            arrow
          >
            <span style={{ zIndex: 10 }}>
              <Icon name="question-circle" size="sm" inline />
            </span>
          </Tooltip>
        </>
      }
      disabled={disabled}
      resetValue={resetValue}
      onSave={value => save(value.toString())}
    />
  )
}
