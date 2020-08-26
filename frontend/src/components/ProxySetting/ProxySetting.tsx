import React from 'react'
import { ListItemSetting } from '../ListItemSetting'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

export const ProxySetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)

  const disabled = connection?.active || connection?.connecting || service.state !== 'active'

  return (
    <ListItemSetting
      label="Proxy failover"
      subLabel="If a peer-to-peer connection cannot be established, connect through proxy servers."
      disabled={disabled}
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
