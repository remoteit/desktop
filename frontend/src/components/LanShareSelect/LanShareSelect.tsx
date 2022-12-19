import React from 'react'
import { ListItemIcon, ListItemText } from '@mui/material'
import { lanShareRestriction, lanShared } from '../../helpers/lanSharing'
import { ListItemLocation } from '../ListItemLocation'
import { Icon } from '../Icon'

type Props = {
  connection?: IConnection
}

export const LanShareSelect: React.FC<Props> = ({ connection }) => {
  const shared = lanShared(connection)
  const disabled = connection?.connected || connection?.public

  return (
    <ListItemLocation disabled={disabled} pathname={'lan'} showDisabled dense>
      <ListItemIcon>
        <Icon name="network-wired" size="md" modified={shared} fixedWidth />
      </ListItemIcon>
      <ListItemText
        primary="Local Network Sharing"
        secondary={(shared ? 'On - ' : '') + lanShareRestriction(connection)}
      />
      <Icon name="angle-right" inlineLeft fixedWidth />
    </ListItemLocation>
  )
}
