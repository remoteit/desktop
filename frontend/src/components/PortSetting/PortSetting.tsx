import React, { useEffect } from 'react'
import { emit } from '../../services/Controller'
import { useSelector } from 'react-redux'
import { InlineSetting } from '../InlineSetting'
import { REGEX_PORT_SAFE } from '../../shared/constants'
import { ApplicationState } from '../../store'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

export const PortSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const currentPort = connection && connection.port
  const freePort = useSelector((state: ApplicationState) => state.backend.freePort)

  useEffect(() => {
    if (!connection || freePort !== connection.port) emit('freePort', connection)
  }, [freePort, connection])

  if (!service) return null
  if (!connection) connection = newConnection(service, { port: freePort })

  const disabled = connection.active || connection.connecting
  const save = (port?: number) =>
    connection &&
    setConnection({
      ...connection,
      port: port || connection.port,
    })

  return (
    <InlineSetting
      value={currentPort}
      label="Port"
      disabled={disabled}
      filter={REGEX_PORT_SAFE}
      resetValue={freePort}
      // onReset={() => emit('freePort', connection)}
      onSave={port => save(+port)}
    />
  )
}
