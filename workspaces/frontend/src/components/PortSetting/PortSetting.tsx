import React from 'react'
import { useSelector } from 'react-redux'
import { setConnection } from '../../helpers/connectionHelper'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { ApplicationState } from '../../store'
import { REGEX_PORT_SAFE } from '../../shared/constants'

export const PortSetting: React.FC<{ service: IService; connection: IConnection }> = ({ service, connection }) => {
  const defaultPort = useSelector(
    (state: ApplicationState) => service.attributes?.defaultPort || state.backend.freePort
  )

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
      value={connection.port}
      label="Local Port"
      disabled={disabled}
      filter={REGEX_PORT_SAFE}
      resetValue={defaultPort}
      onSave={port => save(+port)}
    />
  )
}
