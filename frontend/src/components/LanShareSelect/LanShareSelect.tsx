import React from 'react'
import { useLocation } from 'react-router-dom'
import { ListItemIcon, ListItemText } from '@material-ui/core'
import { lanShareRestriction, lanShared } from '../../helpers/lanSharing'
import { ListItemLocation } from '../ListItemLocation'
import { Icon } from '../Icon'

type Props = {
  connection?: IConnection
}

export const LanShareSelect: React.FC<Props> = ({ connection }) => {
  const location = useLocation()
  const shared = lanShared(connection)
  const disabled = connection?.connected || connection?.public

  return (
    <ListItemLocation disabled={disabled} pathname={location.pathname + '/lan'} showDisabled dense>
      <ListItemIcon>
        <Icon name="network-wired" size="md" modified={shared} fixedWidth />
      </ListItemIcon>
      <ListItemText
        primary="Local Network Sharing"
        secondary={(shared ? 'On - ' : '') + lanShareRestriction(connection)}
      />
    </ListItemLocation>
  )
}
