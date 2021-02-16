import React from 'react'
import { useLocation } from 'react-router-dom'
import { ListItemIcon, ListItemText } from '@material-ui/core'
import { lanShareRestriction, lanShared } from '../../helpers/lanSharing'
import { ListItemLocation } from '../ListItemLocation'
import { Icon } from '../Icon'

type Props = {
  service: IService
  connection?: IConnection
}

export const LanShareSelect: React.FC<Props> = ({ connection, service }) => {
  const location = useLocation()
  const shared = lanShared(connection)
  const disabled = connection?.connected || connection?.connecting || service.state !== 'active'
  const color = shared ? 'primary' : undefined
  return (
    <ListItemLocation disabled={disabled} pathname={location.pathname + '/lan'} dense>
      <ListItemIcon>
        <Icon name="network-wired" color={color} size="md" type="light" />
      </ListItemIcon>
      <ListItemText
        primary="Local Network Sharing"
        secondaryTypographyProps={{ color }}
        secondary={(shared ? 'On - ' : '') + lanShareRestriction(connection)}
      />
    </ListItemLocation>
  )
}
