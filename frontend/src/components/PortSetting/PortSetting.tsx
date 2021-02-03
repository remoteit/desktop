import React, { useEffect } from 'react'
import { emit } from '../../services/Controller'
import { useSelector } from 'react-redux'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { REGEX_PORT_SAFE } from '../../shared/constants'
import { ApplicationState } from '../../store'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

export const PortSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const defaultPort = useSelector(
    (state: ApplicationState) => service.attributes?.defaultPort || state.backend.freePort
  )

  if (!service) return null
  if (!connection) connection = newConnection(service)

  const disabled = connection.active || connection.connecting
  const save = (port?: number) =>
    connection &&
    setConnection({
      ...connection,
      port: port || connection.port,
    })

  return (
    <InlineTextFieldSetting
      value={connection.port}
      label="Port"
      disabled={disabled}
      filter={REGEX_PORT_SAFE}
      resetValue={defaultPort}
      onSave={port => save(+port)}
    />
  )
}
