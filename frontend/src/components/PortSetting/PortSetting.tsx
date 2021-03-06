import React from 'react'
import { useSelector } from 'react-redux'
import { newConnection, setConnection, connectionState } from '../../helpers/connectionHelper'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { ApplicationState } from '../../store'
import { REGEX_PORT_SAFE } from '../../shared/constants'

export const PortSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const state = connectionState(service, connection)
  const defaultPort = useSelector(
    (state: ApplicationState) => service.attributes?.defaultPort || state.backend.freePort
  )

  if (!service) return null
  if (!connection) connection = newConnection(service)

  const disabled = state === 'connected' || state === 'connecting'
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
