import React, { useEffect } from 'react'
import { emit } from '../../services/Controller'
import { useSelector } from 'react-redux'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { REGEX_PORT_SAFE } from '../../shared/constants'
import { ApplicationState } from '../../store'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

export const PortSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const currentPort = connection && connection.port
  const freePort = useSelector((state: ApplicationState) => state.backend.freePort)

  useEffect(() => {
    if (!connection || !freePort || freePort !== connection.port) emit('freePort', connection)
  }, [freePort, connection])

  if (!service) return null
  if (!connection) connection = newConnection(service, freePort)

  const disabled = connection.active || connection.connecting
  const save = (port?: number) =>
    connection &&
    setConnection({
      ...connection,
      port: port || connection.port,
    })

  return (
    <InlineTextFieldSetting
      value={currentPort || freePort}
      label="Port"
      disabled={disabled}
      filter={REGEX_PORT_SAFE}
      resetValue={freePort}
      onSave={port => save(+port)}
    />
  )
}
