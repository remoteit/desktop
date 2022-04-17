import React from 'react'
import { useSelector } from 'react-redux'
import { setConnection } from '../../helpers/connectionHelper'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { ApplicationState } from '../../store'
import { REGEX_PORT_SAFE } from '../../shared/constants'

export const PortSetting: React.FC<{ service: IService; connection: IConnection }> = ({ service, connection }) => {
  const defaultPort = useSelector((state: ApplicationState) => {
    let port = state.backend.freePort
    const usedPorts = state.connections.all.map(c => c.port).sort()
    if (service.attributes?.defaultPort && !usedPorts.includes(service.attributes.defaultPort)) {
      port = service.attributes.defaultPort
    }
    return port
  })

  if (!service) return null

  const disabled = connection.enabled || connection.public
  const save = (port?: number) =>
    connection &&
    setConnection({
      ...connection,
      port: port || connection.port,
    })

  return (
    <InlineTextFieldSetting
      icon="port"
      value={connection.port || defaultPort}
      label="Local Port"
      disabled={disabled}
      filter={REGEX_PORT_SAFE}
      resetValue={defaultPort}
      onSave={port => save(+port)}
    />
  )
}
