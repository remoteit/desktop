import React from 'react'
import { useSelector } from 'react-redux'
import { setConnection } from '../../helpers/connectionHelper'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { ApplicationState } from '../../store'
import { REGEX_PORT_SAFE } from '../../shared/constants'

export const PortSetting: React.FC<{ service: IService; connection: IConnection }> = ({ service, connection }) => {
  const freePort = useSelector((state: ApplicationState) => state.backend.freePort)

  if (!service) return null

  const save = (port?: number) =>
    connection &&
    setConnection({
      ...connection,
      port: port || connection.port,
    })

  return (
    <InlineTextFieldSetting
      icon="port"
      value={connection.port || freePort}
      label="Local Port"
      disabled={connection.connected || connection.public}
      filter={REGEX_PORT_SAFE}
      resetValue={freePort}
      onSave={port => save(+port)}
    />
  )
}
