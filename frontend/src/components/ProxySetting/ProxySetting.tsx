import React from 'react'
import { ROUTES } from '../../shared/constants'
import { ListItem, ListItemText, ListItemIcon } from '@material-ui/core'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { ListItemSetting } from '../ListItemSetting'
import { Icon } from '../Icon'

export const ProxySetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)

  const disabled = connection?.active || connection?.connecting || service.state !== 'active'
  const route = ROUTES.find(r => r.key === service.attributes.route)

  switch (service.attributes.route) {
    case 'p2p':
    case 'proxy':
      return (
        <ListItem dense>
          <ListItemIcon>
            <Icon name={route?.icon} size="md" type="light" />
          </ListItemIcon>
          <ListItemText primary={route?.name} secondary={route?.description} />
        </ListItem>
      )
    case 'failover':
    default:
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
}
