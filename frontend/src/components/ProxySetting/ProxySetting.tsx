import React from 'react'
import { SettingsListItem } from '../SettingsListItem'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

export const ProxySetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)

  return (
    <SettingsListItem
      label="Proxy failover"
      subLabel="If a peer-to-peer connection cannot be established, connect through proxy servers."
      icon="cloud"
      toggle={!!connection.failover}
      onClick={() =>
        connection &&
        setConnection({
          ...connection,
          failover: !connection.failover,
        })
      }
    />
  )
}
